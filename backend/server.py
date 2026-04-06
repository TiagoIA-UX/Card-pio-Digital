"""
backend/server.py
Zairyx Dev Agent — serviço Python de monitoramento e notificação.

Responsabilidades:
  1. Receber webhooks de alerta direto do Next.js (/api/webhook/alert)
  2. Notificar via Telegram (gratuito, instantâneo, sem API Business)
  3. Notificar via WhatsApp via Evolution API (opcional, auto-hospedado)
  4. Pollar a tabela system_alerts do Supabase em background e disparar
     notificações para alertas ainda não enviados (notified_python = false)

Variáveis de ambiente necessárias: ver backend/.env.example
"""

import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from sentinel import sentinel_loop, run_full_scan
from fiscal import EmissaoNFCeRequest, emitir_nfce

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Configuração ─────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")

# Evolution API — WhatsApp self-hosted (opcional)
EVOLUTION_API_URL: str = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_API_KEY: str = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE: str = os.getenv("EVOLUTION_INSTANCE", "zairyx")

ADMIN_WHATSAPP: str = os.getenv("ADMIN_WHATSAPP", "5512996887993")
INTERNAL_API_SECRET: str = os.getenv("INTERNAL_API_SECRET", "")
POLL_INTERVAL: int = int(os.getenv("ALERT_POLL_INTERVAL_SECONDS", "30"))

# ── Modelos ───────────────────────────────────────────────────────────────────
class AlertPayload(BaseModel):
    restaurant_id: Optional[str] = None
    restaurant_slug: Optional[str] = None
    source: str = Field(..., min_length=1, max_length=80)
    error: str = Field(..., min_length=1, max_length=2000)
    context: Optional[dict[str, Any]] = None
    severity: str = Field(default="warning", pattern="^(info|warning|critical)$")
    title: str = Field(default="Alerta do sistema", min_length=1, max_length=200)


# ── Canais de notificação ─────────────────────────────────────────────────────
async def send_telegram(text: str) -> bool:
    """Envia mensagem para o chat/grupo do Telegram configurado."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                url,
                json={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML"},
            )
            ok = resp.status_code == 200
            if not ok:
                print(f"[Telegram] HTTP {resp.status_code}: {resp.text[:200]}")
            return ok
        except Exception as exc:
            print(f"[Telegram] Erro ao enviar: {exc}")
            return False


async def send_whatsapp_evolution(number: str, text: str) -> bool:
    """Envia mensagem via Evolution API (WhatsApp self-hosted)."""
    if not EVOLUTION_API_URL or not EVOLUTION_API_KEY:
        return False
    url = f"{EVOLUTION_API_URL.rstrip('/')}/message/sendText/{EVOLUTION_INSTANCE}"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                url,
                headers={"apikey": EVOLUTION_API_KEY, "Content-Type": "application/json"},
                json={"number": number, "text": text},
            )
            ok = resp.status_code in (200, 201)
            if not ok:
                print(f"[WhatsApp] HTTP {resp.status_code}: {resp.text[:200]}")
            return ok
        except Exception as exc:
            print(f"[WhatsApp] Erro ao enviar: {exc}")
            return False


def _severity_icon(severity: str) -> str:
    return {"critical": "🔴", "warning": "🟡", "info": "ℹ️"}.get(severity, "🔔")


async def dispatch_notifications(title: str, body: str, severity: str = "warning") -> dict[str, bool]:
    """Dispara todos os canais de notificação configurados em paralelo."""
    icon = _severity_icon(severity)
    ts = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")

    tg_text = (
        f"{icon} <b>[{severity.upper()}] {title}</b>\n\n"
        f"{body}\n\n"
        f"<i>🕐 {ts} · Zairyx Dev Agent</i>"
    )
    wa_text = f"{icon} [{severity.upper()}] {title}\n\n{body}\n\n🕐 {ts}"

    tg_task = asyncio.create_task(send_telegram(tg_text))
    wa_task = asyncio.create_task(send_whatsapp_evolution(ADMIN_WHATSAPP, wa_text))

    tg_ok, wa_ok = await asyncio.gather(tg_task, wa_task)

    result = {"telegram": bool(tg_ok), "whatsapp_evolution": bool(wa_ok)}
    print(f"[dispatch] title={title!r} {result}")
    return result


# ── Polling Supabase (background) ─────────────────────────────────────────────
def _supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def poll_supabase_alerts() -> None:
    """
    A cada POLL_INTERVAL segundos, busca alertas (warning/critical) ainda não
    notificados pelo Python e dispara notificações.
    Requer a coluna notified_python na tabela system_alerts (migration 040).
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("[poller] Supabase não configurado — polling desativado.")
        return

    print(f"[poller] Iniciado. Intervalo: {POLL_INTERVAL}s")

    while True:
        await asyncio.sleep(POLL_INTERVAL)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                # Busca até 10 alertas pendentes
                resp = await client.get(
                    f"{SUPABASE_URL}/rest/v1/system_alerts",
                    params={
                        "notified_python": "eq.false",
                        "severity": "in.(warning,critical)",
                        "select": "id,severity,title,body,created_at",
                        "order": "created_at.asc",
                        "limit": "10",
                    },
                    headers=_supabase_headers(),
                )

                if resp.status_code != 200:
                    print(f"[poller] Supabase HTTP {resp.status_code}: {resp.text[:200]}")
                    continue

                alerts: list[dict[str, Any]] = resp.json()
                if not alerts:
                    continue

                print(f"[poller] {len(alerts)} alertas pendentes encontrados.")

                for alert in alerts:
                    await dispatch_notifications(
                        title=alert.get("title", "Alerta"),
                        body=alert.get("body", ""),
                        severity=alert.get("severity", "warning"),
                    )

                    # Marca como notificado no banco
                    await client.patch(
                        f"{SUPABASE_URL}/rest/v1/system_alerts",
                        params={"id": f"eq.{alert['id']}"},
                        headers=_supabase_headers(),
                        json={"notified_python": True},
                    )

        except asyncio.CancelledError:
            print("[poller] Encerrado.")
            return
        except Exception as exc:
            print(f"[poller] Erro inesperado: {exc}")


# ── Telegram: polling de comandos (funciona sem webhook público) ──────────────
async def poll_telegram_commands() -> None:
    """
    Faz long-polling na API do Telegram para receber comandos (/status, /teste, /ajuda).
    Funciona em localhost — não precisa de domínio público.
    """
    if not TELEGRAM_BOT_TOKEN:
        print("[tg-poll] Token não configurado — polling desativado.")
        return

    global TELEGRAM_CHAT_ID
    offset: int = 0
    print("[tg-poll] Iniciado — aguardando comandos no @ZaiSentinelBot")

    async with httpx.AsyncClient(timeout=35) as client:
        while True:
            try:
                resp = await client.get(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
                    params={"offset": offset, "timeout": 30, "allowed_updates": ["message"]},
                )
                if resp.status_code != 200:
                    await asyncio.sleep(5)
                    continue

                updates = resp.json().get("result", [])
                for update in updates:
                    offset = update["update_id"] + 1
                    message = update.get("message", {})
                    chat_id = message.get("chat", {}).get("id")
                    text: str = message.get("text", "").strip()

                    if not chat_id or not text:
                        continue

                    # Captura chat_id automaticamente se ainda não salvo
                    if not TELEGRAM_CHAT_ID:
                        TELEGRAM_CHAT_ID = str(chat_id)
                        print(f"[tg-poll] Chat ID capturado: {chat_id}")

                    cmd = text.lower().split()[0]

                    if cmd in ("/start", "/ajuda"):
                        await _tg_reply(
                            chat_id,
                            "🛡️ <b>Zai Sentinel</b>\n\n"
                            "Monitora a plataforma Zairyx e avisa quando algo falha.\n\n"
                            "<b>Comandos:</b>\n"
                            "/status — ver status dos canais\n"
                            "/teste — enviar alerta de teste\n"
                            "/sentinel — scan completo sob demanda\n"
                            "/ajuda — esta mensagem\n\n"
                            "<i>Alertas chegam automaticamente quando a Zai falha.</i>",
                        )

                    elif cmd == "/sentinel":
                        await _tg_reply(chat_id, "🛡️ <i>Executando scan completo...</i>")
                        try:
                            result = await run_full_scan()
                            severity = result.get("severity", "?")
                            crit = result.get("critical", 0)
                            warn = result.get("warning", 0)
                            await _tg_reply(
                                chat_id,
                                f"✅ <b>Scan concluído</b>\n"
                                f"Status: <b>{severity.upper()}</b> "
                                f"({crit}🔴 {warn}🟡)\n"
                                f"Relatório enviado acima ☝️",
                            )
                        except Exception as exc:
                            await _tg_reply(chat_id, f"❌ Erro no scan: {str(exc)[:200]}")

                    elif cmd == "/status":
                        supabase_ok = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
                        tg_ok = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
                        wa_ok = bool(EVOLUTION_API_URL and EVOLUTION_API_KEY)
                        await _tg_reply(
                            chat_id,
                            "🛡️ <b>Zai Sentinel — Status</b>\n\n"
                            f"{'✅' if supabase_ok else '❌'} Supabase (polling alertas)\n"
                            f"{'✅' if tg_ok else '❌'} Telegram\n"
                            f"{'✅' if wa_ok else '❌'} WhatsApp Evolution\n\n"
                            f"🔄 Intervalo de polling: {POLL_INTERVAL}s\n"
                            f"🤖 Bot: @ZaiSentinelBot",
                        )

                    elif cmd == "/teste":
                        await _tg_reply(
                            chat_id,
                            "🟡 <b>[TESTE] Alerta simulado</b>\n\n"
                            "Origem: comando /teste\n"
                            "Erro: Este é um alerta de teste do Zai Sentinel.\n\n"
                            "✅ Notificações funcionando corretamente.",
                        )

            except asyncio.CancelledError:
                print("[tg-poll] Encerrado.")
                return
            except Exception as exc:
                print(f"[tg-poll] Erro: {exc}")
                await asyncio.sleep(5)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    task_supabase = asyncio.create_task(poll_supabase_alerts())
    task_telegram = asyncio.create_task(poll_telegram_commands())
    task_sentinel = asyncio.create_task(sentinel_loop())
    yield
    task_supabase.cancel()
    task_telegram.cancel()
    task_sentinel.cancel()
    for t in (task_supabase, task_telegram, task_sentinel):
        try:
            await t
        except asyncio.CancelledError:
            pass


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Zairyx Dev Agent", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("NEXT_PUBLIC_SITE_URL", ""),
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


# ── Rotas ─────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "channels": {
            "telegram": bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID),
            "whatsapp_evolution": bool(EVOLUTION_API_URL and EVOLUTION_API_KEY),
        },
        "polling": {
            "supabase": bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY),
            "interval_seconds": POLL_INTERVAL,
        },
    }


def _require_secret(authorization: str) -> None:
    """Valida o cabeçalho Authorization: Bearer <INTERNAL_API_SECRET>."""
    if not INTERNAL_API_SECRET:
        return  # sem segredo configurado, aceita qualquer chamada local
    if authorization != f"Bearer {INTERNAL_API_SECRET}":
        raise HTTPException(status_code=401, detail="Não autorizado.")


@app.post("/api/webhook/alert")
async def webhook_alert(
    payload: AlertPayload,
    authorization: str = Header(default=""),
):
    """
    Recebe alertas do Next.js em tempo real e dispara notificações imediatamente.
    Complementa o polling — não depende do intervalo do poller.
    """
    _require_secret(authorization)

    body_parts = [
        f"Origem: {payload.source}",
        f"Slug: {payload.restaurant_slug}" if payload.restaurant_slug else "",
        f"ID: {payload.restaurant_id}" if payload.restaurant_id else "",
        f"Erro: {payload.error}",
    ]
    body_text = "\n".join(p for p in body_parts if p)

    result = await dispatch_notifications(payload.title, body_text, payload.severity)
    return {"success": True, "dispatched": result}


@app.post("/api/notify")
async def manual_notify(
    payload: AlertPayload,
    authorization: str = Header(default=""),
):
    """Atalho manual para disparar notificação sem passar pelo Supabase."""
    _require_secret(authorization)

    body_parts = [
        f"Origem: {payload.source}",
        f"Slug: {payload.restaurant_slug}" if payload.restaurant_slug else "",
        f"ID: {payload.restaurant_id}" if payload.restaurant_id else "",
        f"Erro: {payload.error}",
    ]
    body_text = "\n".join(p for p in body_parts if p)

    result = await dispatch_notifications(payload.title, body_text, payload.severity)
    return {"success": True, "dispatched": result}


# ── Telegram: receber comandos do bot (/status, /teste, /ajuda) ──────────────
async def _tg_reply(chat_id: int | str, text: str) -> None:
    """Envia resposta de texto para um chat do Telegram."""
    if not TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
        except Exception as exc:
            print(f"[tg_reply] Erro: {exc}")


@app.post("/api/telegram/webhook")
async def telegram_webhook(request: dict):  # type: ignore[type-arg]
    """
    Webhook do Telegram — recebe mensagens/comandos enviados ao @ZaiSentinelBot.
    Configure com: POST /api/telegram/set-webhook para ativar.
    """
    message = request.get("message") or request.get("edited_message")
    if not message:
        return {"ok": True}

    chat_id: int = message.get("chat", {}).get("id")
    text: str = message.get("text", "").strip().lower()

    if not chat_id or not text:
        return {"ok": True}

    # Auto-salva o chat_id se ainda não configurado (primeiro /start)
    global TELEGRAM_CHAT_ID
    if not TELEGRAM_CHAT_ID and text.startswith("/start"):
        TELEGRAM_CHAT_ID = str(chat_id)
        print(f"[sentinel] Chat ID capturado automaticamente: {chat_id}")

    if text.startswith("/status"):
        supabase_ok = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
        tg_ok = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
        wa_ok = bool(EVOLUTION_API_URL and EVOLUTION_API_KEY)
        msg = (
            "🛡️ <b>Zai Sentinel — Status</b>\n\n"
            f"{'✅' if supabase_ok else '❌'} Supabase (polling)\n"
            f"{'✅' if tg_ok else '❌'} Telegram\n"
            f"{'✅' if wa_ok else '❌'} WhatsApp Evolution\n\n"
            f"🔄 Intervalo de polling: {POLL_INTERVAL}s"
        )
        await _tg_reply(chat_id, msg)

    elif text.startswith("/teste"):
        await _tg_reply(
            chat_id,
            "🟡 <b>[TESTE] Alerta simulado</b>\n\n"
            "Origem: comando /teste\n"
            "Erro: Este é um alerta de teste do Zai Sentinel.\n\n"
            "✅ Notificações funcionando corretamente.",
        )

    if text.startswith("/ajuda") or text.startswith("/start"):
        await _tg_reply(
            chat_id,
            "🛡️ <b>Zai Sentinel</b>\n\n"
            "Monitora a plataforma Zairyx e avisa quando algo falha.\n\n"
            "<b>Comandos:</b>\n"
            "/status — ver status dos canais\n"
            "/teste — enviar alerta de teste\n"
            "/sentinel — scan completo sob demanda\n"
            "/ajuda — esta mensagem\n\n"
            "<i>Alertas chegam automaticamente quando a Zai falha.</i>",
        )

    elif text.startswith("/sentinel"):
        await _tg_reply(chat_id, "🛡️ <i>Executando scan completo...</i>")
        try:
            result = await run_full_scan()
            severity = result.get("severity", "?")
            crit = result.get("critical", 0)
            warn = result.get("warning", 0)
            await _tg_reply(
                chat_id,
                f"✅ <b>Scan concluído</b>\n"
                f"Status: <b>{severity.upper()}</b> "
                f"({crit}🔴 {warn}🟡)\n"
                f"Relatório enviado acima ☝️",
            )
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro no scan: {str(exc)[:200]}")

    return {"ok": True}


@app.post("/api/sentinel/run")
async def trigger_sentinel(
    authorization: str = Header(default=""),
):
    """Dispara scan completo do Sentinel sob demanda."""
    _require_secret(authorization)
    result = await run_full_scan()
    return {"success": True, **result}


@app.post("/api/telegram/set-webhook")
async def set_telegram_webhook(
    authorization: str = Header(default=""),
    base_url: str = "http://localhost:8000",
):
    """Registra o webhook do bot no Telegram. Chame uma vez ao subir em produção."""
    _require_secret(authorization)

    webhook_url = f"{base_url.rstrip('/')}/api/telegram/webhook"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook",
            json={"url": webhook_url, "allowed_updates": ["message"]},
        )
    return resp.json()


# ── NFC-e: Emissão direta com Sefaz (R$0) ────────────────────────────────────
@app.post("/api/fiscal/emitir-nfce")
async def fiscal_emitir_nfce(
    payload: EmissaoNFCeRequest,
    authorization: str = Header(default=""),
):
    """
    Emite NFC-e direto com o Sefaz — custo R$0.
    O delivery precisa ter certificado A1 e dados fiscais configurados.
    """
    _require_secret(authorization)

    result = emitir_nfce(payload)

    if result.success:
        # Notificar sucesso
        await dispatch_notifications(
            title=f"✅ NFC-e emitida — Pedido #{payload.numero_pedido}",
            body=(
                f"Delivery: {payload.emitente.nome_fantasia}\n"
                f"Protocolo: {result.protocolo or 'N/A'}\n"
                f"Chave: {result.chave_acesso or 'N/A'}\n"
                f"Valor: R$ {payload.valor_total:.2f}"
            ),
            severity="info",
        )
    else:
        await dispatch_notifications(
            title=f"❌ Erro NFC-e — Pedido #{payload.numero_pedido}",
            body=f"Delivery: {payload.emitente.nome_fantasia}\nErro: {result.error}",
            severity="warning",
        )

    return result.model_dump()

