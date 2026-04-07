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
from dataclasses import asdict
from datetime import datetime, timezone
from hashlib import sha1
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from alert_message_analyzer import analyze_alert_transcript
from incident_ops import (
    RESOLUTION_REASONS,
    IncidentState,
    build_reopen_metadata,
    build_zaea_knowledge_payload,
    build_zaea_resolution_metadata,
    build_zaea_task_input,
    find_incident_by_reference,
    incident_record,
    incident_snapshot,
    prune_incidents,
    should_dispatch_zaea_task,
    track_incident,
)
from ops_runtime import (
    AUTO_HOUSEKEEPING_ENABLED,
    audit_housekeeping,
    close_zaea_incident_task,
    dispatch_zaea_incident_task,
    execute_housekeeping,
    fetch_briefings_summary,
    fetch_incident_state,
    fetch_learning_summary,
    fetch_negocios_summary,
    fetch_pagamentos_summary,
    fetch_pending_alerts,
    fetch_persisted_incidents,
    fetch_receita_summary,
    fetch_recent_agent_failures,
    fetch_runtime_snapshot,
    housekeeping_loop,
    persist_incident_state,
    resolve_incident_state,
)
from sentinel import sentinel_loop, run_full_scan, fetch_last_ux_report, format_ux_telegram_report
from fiscal import EmissaoNFCeRequest, emitir_nfce

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Configuração ─────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv("SUPABASE_SECRET_KEY", ""),
)

TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")

# Evolution API — WhatsApp self-hosted (opcional)
EVOLUTION_API_URL: str = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_API_KEY: str = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE: str = os.getenv("EVOLUTION_INSTANCE", "zairyx")

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
ADMIN_WHATSAPP: str = os.getenv("ADMIN_WHATSAPP", "5512996887993")
INTERNAL_API_SECRET: str = os.getenv("INTERNAL_API_SECRET", "")

# IDs numéricos do Telegram autorizados a usar o bot (separados por vírgula).
# Se vazio, o bot recusa TODOS os comandos como proteção por padrão.
_raw_allowed = os.getenv("TELEGRAM_ALLOWED_USER_IDS", "")
TELEGRAM_ALLOWED_USER_IDS: frozenset[int] = frozenset(
    int(uid.strip()) for uid in _raw_allowed.split(",") if uid.strip().lstrip("-").isdigit()
)
POLL_INTERVAL: int = int(os.getenv("ALERT_POLL_INTERVAL_SECONDS", "30"))
TELEGRAM_BOT_HANDLE: str = os.getenv("TELEGRAM_BOT_HANDLE", "@ZaiSentinelBot")
ALERT_DEDUP_WINDOW_SECONDS: int = int(os.getenv("ALERT_DEDUP_WINDOW_SECONDS", "1800"))
INCIDENT_WINDOW_SECONDS: int = int(os.getenv("ALERT_INCIDENT_WINDOW_SECONDS", "7200"))
INCIDENT_ESCALATION_THRESHOLD: int = int(os.getenv("ALERT_INCIDENT_ESCALATION_THRESHOLD", "3"))
INCIDENT_RECONCILE_INTERVAL_SECONDS: int = int(
    os.getenv("ALERT_INCIDENT_RECONCILE_INTERVAL_SECONDS", "300")
)
ZAEA_INCIDENT_AGENT: str = os.getenv("ZAEA_INCIDENT_AGENT", "sentinel")

_recent_notification_cache: dict[str, float] = {}


_active_incidents: dict[str, IncidentState] = {}


def _is_authorized(user_id: int | None) -> bool:
    """Retorna True se o user_id está na lista de autorizados.
    Retorna False se a lista estiver vazia (fail-closed).
    """
    if not TELEGRAM_ALLOWED_USER_IDS:
        return False
    return user_id in TELEGRAM_ALLOWED_USER_IDS

TELEGRAM_COMMANDS = [
    {"command": "overview", "description": "Resumo operacional da plataforma"},
    {"command": "status", "description": "Status dos canais e serviços"},
    {"command": "incidents", "description": "Incidentes ativos correlacionados"},
    {"command": "resolve", "description": "Resolve um incidente pela chave curta"},
    {"command": "agents", "description": "Falhas recentes dos agentes"},
    {"command": "alerts", "description": "Alertas pendentes"},
    {"command": "negocios", "description": "Deliverys ativos, trials e cancelamentos"},
    {"command": "receita", "description": "Faturamento hoje e últimos 7 dias"},
    {"command": "briefings", "description": "Status dos briefings Feito Pra Você"},
    {"command": "pagamentos", "description": "Cobranças PIX recentes"},
    {"command": "learn", "description": "Resumo da base de aprendizado"},
    {"command": "cleanup", "description": "Auditoria de cache e artefatos"},
    {"command": "cleanup_run", "description": "Executa limpeza segura"},
    {"command": "sentinel", "description": "Executa scan completo agora"},
    {"command": "ux", "description": "Último resultado de inspeção UX das personas"},
    {"command": "ajuda", "description": "Abrir menu do bot"},
]

# ── Modelos ───────────────────────────────────────────────────────────────────
class AlertPayload(BaseModel):
    restaurant_id: Optional[str] = None
    restaurant_slug: Optional[str] = None
    source: str = Field(..., min_length=1, max_length=80)
    error: str = Field(..., min_length=1, max_length=2000)
    context: Optional[dict[str, Any]] = None
    severity: str = Field(default="warning", pattern="^(info|warning|critical)$")
    title: str = Field(default="Alerta do sistema", min_length=1, max_length=200)


class TranscriptPayload(BaseModel):
    transcript: str = Field(..., min_length=10, max_length=100000)


class ResolveIncidentPayload(BaseModel):
    incident_key: str = Field(..., min_length=4, max_length=64)
    resolution_reason: str = Field(default="manual_ack", pattern="^(manual_ack|false_positive|mitigated|deployed_fix|config_fix|provider_recovered|auto_expired)$")
    resolution_note: str | None = Field(default=None, max_length=500)


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


def _severity_rank(severity: str) -> int:
    return {"info": 1, "warning": 2, "critical": 3}.get(severity, 0)


def _status_icon(ok: bool) -> str:
    return "✅" if ok else "❌"


def _notification_signature(title: str, body: str, severity: str) -> str:
    normalized = " ".join(f"{severity}|{title}|{body}".lower().split())
    return sha1(normalized.encode("utf-8")).hexdigest()[:16]


def _prune_incidents(now_ts: float | None = None) -> list[str]:
    return prune_incidents(_active_incidents, INCIDENT_WINDOW_SECONDS, now_ts)


def _track_incident(title: str, body: str, severity: str) -> tuple[IncidentState, str]:
    now = datetime.now(timezone.utc)
    _prune_incidents(now.timestamp())
    return track_incident(_active_incidents, title, body, severity, now)

def _format_incident_update(incident: IncidentState) -> tuple[str, str]:
    title = f"{incident.title} [incidente correlacionado]"
    body = (
        f"{incident.summary}\n"
        f"Categoria: {incident.category}\n"
        f"Ocorrências correlacionadas: {incident.occurrences}\n"
        f"Duplicadas suprimidas: {incident.suppressed_duplicates}\n"
        f"Primeiro evento: {incident.first_seen}\n"
        f"Último evento: {incident.last_seen}"
    )
    return title, body


def _find_incident_by_reference(reference: str) -> IncidentState | None:
    return find_incident_by_reference(_active_incidents, reference)


async def _open_incident_zaea_task(incident: IncidentState, incident_mode: str) -> None:
    previous_record = None
    if incident_mode == "new":
        try:
            previous_record = await fetch_incident_state(incident.incident_key)
        except Exception as exc:
            print(f"[incident] erro ao consultar histórico persistido {incident.incident_key}: {exc}")

    if not should_dispatch_zaea_task(
        incident,
        incident_mode,
        INCIDENT_ESCALATION_THRESHOLD,
        previous_record=previous_record,
    ):
        return

    try:
        task_id = await dispatch_zaea_incident_task(
            agent_name=ZAEA_INCIDENT_AGENT,
            incident_key=incident.incident_key,
            payload=build_zaea_task_input(incident, previous_record=previous_record),
            priority="p0" if incident.severity == "critical" else "p1",
            triggered_by="alert",
        )
    except Exception as exc:
        print(f"[incident] erro ao abrir task ZAEA para {incident.incident_key}: {exc}")
        return

    if not task_id:
        return

    incident.zaea_task_id = task_id
    metadata = {"zaea_task_id": task_id, "zaea_agent": ZAEA_INCIDENT_AGENT}
    if previous_record and previous_record.get("status") == "resolved":
        metadata.update(build_reopen_metadata(previous_record))
    await _persist_incident_best_effort(
        incident,
        metadata=metadata,
    )


async def _resolve_incident(
    incident_reference: str,
    resolution_reason: str = "manual_ack",
    resolution_note: str | None = None,
    source: str = "manual",
) -> IncidentState | None:
    incident = _find_incident_by_reference(incident_reference)
    if incident is None:
        return None

    resolved_at = datetime.now(timezone.utc).isoformat()
    metadata = build_zaea_resolution_metadata(resolution_reason, resolution_note, source)

    try:
        await resolve_incident_state(incident.incident_key, resolved_at, metadata)
    except Exception as exc:
        print(f"[incident] erro ao resolver incidente {incident.incident_key}: {exc}")

    if incident.zaea_task_id:
        try:
            await close_zaea_incident_task(
                task_id=incident.zaea_task_id,
                output={
                    "incident_key": incident.incident_key,
                    "resolved_at": resolved_at,
                    **metadata,
                },
                knowledge=build_zaea_knowledge_payload(incident, resolution_reason),
            )
        except Exception as exc:
            print(f"[incident] erro ao fechar task ZAEA {incident.zaea_task_id}: {exc}")

    _active_incidents.pop(incident.incident_key, None)
    return incident


def _incident_snapshot(limit: int = 5) -> dict[str, Any]:
    _prune_incidents()
    return incident_snapshot(_active_incidents, limit)


def _incident_record(
    incident: IncidentState,
    status: str = "active",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return incident_record(incident, status=status, metadata=metadata)


async def _persist_incident_best_effort(
    incident: IncidentState,
    metadata: dict[str, Any] | None = None,
) -> None:
    try:
        merged_metadata = metadata or {}
        if incident.zaea_task_id and "zaea_task_id" not in merged_metadata:
            merged_metadata = {**merged_metadata, "zaea_task_id": incident.zaea_task_id}
        await persist_incident_state(_incident_record(incident, metadata=merged_metadata))
    except Exception as exc:
        print(f"[incident] erro ao persistir incidente {incident.incident_key}: {exc}")


async def _flush_expired_incidents() -> None:
    expired = _prune_incidents()
    if not expired:
        return

    resolved_at = datetime.now(timezone.utc).isoformat()
    for incident_key in expired:
        try:
            await resolve_incident_state(
                incident_key,
                resolved_at,
                build_zaea_resolution_metadata("auto_expired", None, "reconciler"),
            )
        except Exception as exc:
            print(f"[incident] erro ao resolver incidente expirado {incident_key}: {exc}")


async def _hydrate_persisted_incidents() -> int:
    try:
        rows = await fetch_persisted_incidents(limit=200)
    except Exception as exc:
        print(f"[incident] erro ao carregar incidentes persistidos: {exc}")
        return 0

    hydrated = 0
    now_ts = datetime.now(timezone.utc).timestamp()
    for row in rows:
        incident_key = row.get("incident_key")
        last_seen = row.get("last_seen")
        if not incident_key or not last_seen:
            continue

        try:
            last_seen_ts = datetime.fromisoformat(str(last_seen)).timestamp()
        except ValueError:
            continue

        if now_ts - last_seen_ts > INCIDENT_WINDOW_SECONDS:
            try:
                await resolve_incident_state(str(incident_key), datetime.now(timezone.utc).isoformat())
            except Exception as exc:
                print(f"[incident] erro ao resolver incidente persistido {incident_key}: {exc}")
            continue

        _active_incidents[str(incident_key)] = IncidentState(
            incident_key=str(incident_key),
            category=str(row.get("category") or "generic"),
            severity=str(row.get("severity") or "warning"),
            title=str(row.get("title") or "Incidente operacional"),
            summary=str(row.get("summary") or "sem resumo"),
            first_seen=str(row.get("first_seen") or last_seen),
            last_seen=str(last_seen),
            occurrences=int(row.get("occurrences") or 1),
            suppressed_duplicates=int(row.get("suppressed_duplicates") or 0),
            notification_count=int(row.get("notification_count") or 0),
            last_notification_at=(
                str(row.get("last_notification_at")) if row.get("last_notification_at") else None
            ),
            zaea_task_id=(
                str((row.get("metadata") or {}).get("zaea_task_id"))
                if isinstance(row.get("metadata"), dict) and (row.get("metadata") or {}).get("zaea_task_id")
                else None
            ),
        )
        hydrated += 1

    return hydrated


async def incident_reconciliation_loop() -> None:
    while True:
        try:
            await _flush_expired_incidents()
        except asyncio.CancelledError:
            print("[incident] reconciliação encerrada.")
            return
        except Exception as exc:
            print(f"[incident] erro na reconciliação: {exc}")

        await asyncio.sleep(INCIDENT_RECONCILE_INTERVAL_SECONDS)


def _should_suppress_notification(signature: str) -> bool:
    now = datetime.now(timezone.utc).timestamp()

    expired = [key for key, ts in _recent_notification_cache.items() if now - ts > ALERT_DEDUP_WINDOW_SECONDS]
    for key in expired:
        _recent_notification_cache.pop(key, None)

    last_sent = _recent_notification_cache.get(signature)
    if last_sent and now - last_sent <= ALERT_DEDUP_WINDOW_SECONDS:
        return True

    _recent_notification_cache[signature] = now
    return False


def _main_menu_markup() -> dict[str, Any]:
    return {
        "keyboard": [
            [{"text": "/overview"}, {"text": "/status"}],
            [{"text": "/incidents"}, {"text": "/alerts"}],
            [{"text": "/negocios"}, {"text": "/receita"}],
            [{"text": "/briefings"}, {"text": "/pagamentos"}],
            [{"text": "/agents"}, {"text": "/learn"}],
            [{"text": "/sentinel"}, {"text": "/ux"}],
            [{"text": "/cleanup"}, {"text": "/ajuda"}],
        ],
        "resize_keyboard": True,
        "is_persistent": True,
    }


def _help_text() -> str:
    return (
        "🛡️ <b>Zai Sentinel Enterprise</b>\n\n"
        "Central operacional do ecossistema Zairyx. Agora o bot cobre visão de runtime, "
        "alertas, incidentes correlacionados, agentes, aprendizado, housekeeping seguro "
        "e inteligência de negócios da plataforma.\n\n"
        "<b>Operacional:</b>\n"
        "/overview — visão executiva do runtime\n"
        "/status — canais, integrações e automações\n"
        "/incidents — incidentes ativos e ruído suprimido\n"
        "/resolve CHAVE [motivo] [nota] — fecha um incidente ativo pela chave curta\n"
        "/agents — falhas recentes dos agentes\n"
        "/alerts — backlog de alertas pendentes\n"
        "/sentinel — scan completo imediato\n"
        "/ux — última inspeção de UX das personas\n\n"
        "<b>Negócios:</b>\n"
        "/negocios — deliverys ativos, trials e cancelamentos\n"
        "/receita — faturamento hoje e últimos 7 dias\n"
        "/briefings — status dos briefings Feito Pra Você\n"
        "/pagamentos — cobranças PIX recentes\n\n"
        "<b>Sistema:</b>\n"
        "/learn — padrões aprendidos mais fortes\n"
        "/cleanup — auditoria de cache e artefatos\n"
        "/cleanup_run — limpeza segura sob demanda\n"
        "/ajuda — abre este menu\n\n"
        "<i>Fale livremente para consultar a ZAEA em linguagem natural.</i>"
    )


def _format_overview(snapshot: dict[str, Any]) -> str:
    counts = snapshot.get("counts", {})
    channels = snapshot.get("channels", {})
    housekeeping = snapshot.get("housekeeping", {})
    automation = snapshot.get("auto_housekeeping", {})
    incidents = snapshot.get("incidents", {})

    return (
        "📊 <b>Visão Operacional</b>\n\n"
        f"{_status_icon(channels.get('supabase', False))} Supabase\n"
        f"{_status_icon(channels.get('telegram', False))} Telegram\n"
        f"{_status_icon(channels.get('whatsapp_evolution', False))} WhatsApp Evolution\n"
        f"{_status_icon(channels.get('groq', False))} IA/Groq\n\n"
        f"🔔 Alertas pendentes: <b>{counts.get('pending_alerts', 0)}</b>\n"
        f"❌ Falhas de agentes 24h: <b>{counts.get('failed_tasks_24h', 0)}</b>\n"
        f"⚠️ Escaladas 24h: <b>{counts.get('escalated_tasks_24h', 0)}</b>\n"
        f"⏳ Tarefas P0/P1 pendentes: <b>{counts.get('pending_priority_tasks_24h', 0)}</b>\n"
        f"🧠 Conhecimentos catalogados: <b>{counts.get('knowledge_entries', 0)}</b>\n\n"
        f"🚨 Incidentes ativos: <b>{incidents.get('active_count', 0)}</b>\n"
        f"🔴 Críticos correlacionados: <b>{incidents.get('critical_count', 0)}</b>\n"
        f"🔇 Duplicadas suprimidas: <b>{incidents.get('suppressed_duplicates', 0)}</b>\n\n"
        f"🧹 Housekeeping automático: <b>{'ATIVO' if automation.get('enabled') else 'DESATIVADO'}</b>\n"
        f"📦 Limpeza pronta agora: <b>{housekeeping.get('total_human', '0B')}</b>"
    )


def _format_active_incidents(snapshot: dict[str, Any]) -> str:
    items = snapshot.get("items", [])
    if not items:
        return "🚨 <b>Incidentes Ativos</b>\n\nNenhum incidente correlacionado ativo no momento."

    lines = ["🚨 <b>Incidentes Ativos</b>", ""]
    lines.append(
        f"Ativos: <b>{snapshot.get('active_count', 0)}</b> · "
        f"Críticos: <b>{snapshot.get('critical_count', 0)}</b> · "
        f"Duplicadas suprimidas: <b>{snapshot.get('suppressed_duplicates', 0)}</b>"
    )
    lines.append("")

    for item in items[:5]:
        severity = item.get("severity", "warning").upper()
        lines.append(f"• <b>[{severity}] {item.get('title', 'Incidente')}</b>")
        lines.append(
            f"  Chave: <code>{str(item.get('incident_key', ''))[:8]}</code> · Categoria: {item.get('category', 'generic')} · Ocorrências: {item.get('occurrences', 0)} · "
            f"Suprimidas: {item.get('suppressed_duplicates', 0)}"
        )
        lines.append(f"  {item.get('summary', 'sem resumo')}")
    return "\n".join(lines)


def _format_agent_failures(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "🤖 <b>Agentes</b>\n\nNenhuma falha recente nas últimas 24h."

    lines = ["🤖 <b>Falhas Recentes dos Agentes</b>", ""]
    for row in rows[:5]:
        message = (row.get("error_message") or "sem detalhe")[:110]
        lines.append(
            f"• <b>{row.get('agent_name', 'desconhecido')}</b> · {row.get('task_type', 'task')}"
        )
        lines.append(f"  Prioridade: {row.get('priority', 'p2')} · {message}")
    return "\n".join(lines)


def _format_pending_alerts(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "🔔 <b>Alertas Pendentes</b>\n\nNenhum alerta pendente no momento."

    lines = ["🔔 <b>Alertas Pendentes</b>", ""]
    for row in rows[:5]:
        severity = row.get("severity", "warning").upper()
        lines.append(f"• <b>[{severity}] {row.get('title', 'Sem título')}</b>")
        body = (row.get("body") or "")[:120]
        if body:
            lines.append(f"  {body}")
    return "\n".join(lines)


def _format_learning_summary(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "🧠 <b>Aprendizado</b>\n\nAinda não há padrões consolidados na base."

    lines = ["🧠 <b>Base de Aprendizado</b>", ""]
    for row in rows[:5]:
        pattern = (row.get("pattern") or "padrão não informado")[:90]
        lines.append(
            f"• <b>{pattern}</b>\n"
            f"  Confiança: {row.get('confidence', 0)} · Ocorrências: {row.get('occurrences', 0)} · Outcome: {row.get('outcome', 'n/a')}"
        )
    return "\n".join(lines)


def _format_negocios(data: dict[str, Any]) -> str:
    total = data.get("deliverys_ativos", 0)
    ativas = data.get("assinaturas_ativas", 0)
    trial = data.get("em_trial", 0)
    canceladas = data.get("canceladas", 0)
    inadimplentes = data.get("inadimplentes_vencidas", 0)
    sem_assinatura = total - ativas - trial - canceladas

    lines = ["🏪 <b>Negócios — Visão Geral</b>", ""]
    lines.append(f"Deliverys ativos: <b>{total}</b>")
    lines.append("")
    lines.append(f"✅ Assinaturas ativas: <b>{ativas}</b>")
    lines.append(f"⏳ Em trial: <b>{trial}</b>")
    lines.append(f"❌ Canceladas: <b>{canceladas}</b>")
    lines.append(f"🔴 Inadimplentes/Vencidas: <b>{inadimplentes}</b>")
    if sem_assinatura > 0:
        lines.append(f"⚠️ Sem assinatura mapeada: <b>{sem_assinatura}</b>")
    return "\n".join(lines)


def _format_receita(data: dict[str, Any]) -> str:
    hoje = data.get("hoje_total", 0.0)
    pedidos_hoje = data.get("hoje_pedidos", 0)
    dias = data.get("periodo_dias", 7)
    periodo = data.get("periodo_total", 0.0)
    pedidos_periodo = data.get("periodo_pedidos", 0)
    ticket = data.get("ticket_medio", 0.0)

    def brl(v: float) -> str:
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    lines = ["💰 <b>Faturamento</b>", ""]
    lines.append(f"Hoje: <b>{brl(hoje)}</b> ({pedidos_hoje} pedido{'s' if pedidos_hoje != 1 else ''})")
    lines.append(f"Últimos {dias} dias: <b>{brl(periodo)}</b> ({pedidos_periodo} pedidos)")
    lines.append(f"Ticket médio {dias}d: <b>{brl(ticket)}</b>")

    if periodo == 0 and pedidos_periodo == 0:
        lines.append("\n<i>Nenhum pedido registrado no período.</i>")

    return "\n".join(lines)


def _format_briefings(data: dict[str, Any]) -> str:
    pendentes = data.get("pendentes", 0)
    em_producao = data.get("em_producao", 0)
    concluidos = data.get("concluidos", 0)
    total = pendentes + em_producao + concluidos

    lines = ["📋 <b>Briefings — Feito Pra Você</b>", ""]
    if total == 0:
        lines.append("Nenhum briefing registrado no sistema.")
        return "\n".join(lines)

    lines.append(f"⏳ Pendentes: <b>{pendentes}</b>")
    lines.append(f"🔧 Em produção: <b>{em_producao}</b>")
    lines.append(f"✅ Concluídos: <b>{concluidos}</b>")

    if pendentes > 0:
        lines.append(f"\n⚠️ Há <b>{pendentes}</b> briefing{'s' if pendentes != 1 else ''} aguardando ação.")

    return "\n".join(lines)


def _format_pagamentos(data: dict[str, Any]) -> str:
    pendentes = data.get("pendentes", 0)
    pagas_24h = data.get("pagas_24h", 0)
    falhas_24h = data.get("falhas_24h", 0)
    recentes = data.get("recentes", [])

    lines = ["💳 <b>Cobranças PIX</b>", ""]
    lines.append(f"🟡 Pendentes: <b>{pendentes}</b>")
    lines.append(f"✅ Pagas (24h): <b>{pagas_24h}</b>")
    lines.append(f"❌ Canceladas/Expiradas (24h): <b>{falhas_24h}</b>")

    if recentes:
        lines.append("\n<b>Últimas transações:</b>")
        for row in recentes[:5]:
            valor = float(row.get("valor") or 0)
            status = row.get("status", "?")
            icon = {"paga": "✅", "pendente": "⏳", "cancelada": "❌", "expirada": "⏰"}.get(status, "•")
            ts = (row.get("created_at") or "")[:16].replace("T", " ")
            lines.append(f"  {icon} R$ {valor:.2f} — {status} ({ts})")

    return "\n".join(lines)




def _format_cleanup_summary(result: dict[str, Any], executed: bool = False) -> str:
    action = "Limpeza executada" if executed else "Auditoria de housekeeping"
    lines = [f"🧹 <b>{action}</b>", ""]
    lines.append(f"Itens: <b>{result.get('total_entries', 0)}</b>")
    lines.append(f"Espaço: <b>{result.get('total_human', '0B')}</b>")
    lines.append("")

    items = result.get("items", [])
    if not items:
        lines.append("Nenhum cache ou artefato transitório para tratar agora.")
        return "\n".join(lines)

    for item in items[:6]:
        label = item.get("label", "item")
        lines.append(f"• <b>{label}</b> — {item.get('entries', 0)} item(ns), {item.get('bytes', 0)} bytes")

    return "\n".join(lines)


async def sync_telegram_commands() -> bool:
    if not TELEGRAM_BOT_TOKEN:
        return False

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setMyCommands",
                json={"commands": TELEGRAM_COMMANDS},
            )
            return resp.status_code == 200
        except Exception as exc:
            print(f"[tg-sync] Erro ao sincronizar comandos: {exc}")
            return False


async def dispatch_notifications(title: str, body: str, severity: str = "warning") -> dict[str, bool]:
    """Dispara todos os canais de notificação configurados em paralelo."""
    await _flush_expired_incidents()
    signature = _notification_signature(title, body, severity)
    incident, incident_mode = _track_incident(title, body, severity)
    if _should_suppress_notification(signature):
        incident.suppressed_duplicates += 1
        await _persist_incident_best_effort(incident)
        print(f"[dispatch] suprimido por dedupe: {signature} title={title!r}")
        return {"telegram": False, "whatsapp_evolution": False, "suppressed": True}

    await _open_incident_zaea_task(incident, incident_mode)

    message_title = title
    message_body = body
    if incident_mode == "update" and incident.occurrences >= INCIDENT_ESCALATION_THRESHOLD:
        message_title, message_body = _format_incident_update(incident)

    icon = _severity_icon(severity)
    ts = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")

    tg_text = (
        f"{icon} <b>[{severity.upper()}] {message_title}</b>\n\n"
        f"{message_body}\n\n"
        f"<i>🕐 {ts} · Zairyx Dev Agent</i>"
    )
    wa_text = f"{icon} [{severity.upper()}] {message_title}\n\n{message_body}\n\n🕐 {ts}"

    tg_task = asyncio.create_task(send_telegram(tg_text))
    wa_task = asyncio.create_task(send_whatsapp_evolution(ADMIN_WHATSAPP, wa_text))

    tg_ok, wa_ok = await asyncio.gather(tg_task, wa_task)
    incident.notification_count += 1
    incident.last_notification_at = datetime.now(timezone.utc).isoformat()
    await _persist_incident_best_effort(incident)

    result = {
        "telegram": bool(tg_ok),
        "whatsapp_evolution": bool(wa_ok),
        "suppressed": False,
    }
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
    print(f"[tg-poll] Iniciado — aguardando comandos no {TELEGRAM_BOT_HANDLE}")

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

                    user_id: int | None = message.get("from", {}).get("id")

                    if not _is_authorized(user_id):
                        print(f"[tg-poll] Acesso negado — user_id={user_id} chat_id={chat_id}")
                        if text.startswith("/"):
                            await _tg_reply(chat_id, "⛔ Acesso não autorizado.")
                        continue

                    # Captura chat_id automaticamente se ainda não salvo
                    if not TELEGRAM_CHAT_ID:
                        TELEGRAM_CHAT_ID = str(chat_id)
                        print(f"[tg-poll] Chat ID capturado: {chat_id}")

                    await handle_telegram_command(chat_id, text)

            except asyncio.CancelledError:
                print("[tg-poll] Encerrado.")
                return
            except Exception as exc:
                print(f"[tg-poll] Erro: {exc}")
                await asyncio.sleep(5)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    if TELEGRAM_BOT_TOKEN:
        synced = await sync_telegram_commands()
        print(f"[tg-sync] Comandos {'sincronizados' if synced else 'não sincronizados'}")

    hydrated_incidents = await _hydrate_persisted_incidents()
    if hydrated_incidents:
        print(f"[incident] {hydrated_incidents} incidente(s) ativo(s) reidratado(s) do Supabase")

    task_supabase = asyncio.create_task(poll_supabase_alerts())
    task_telegram = asyncio.create_task(poll_telegram_commands())
    task_sentinel = asyncio.create_task(sentinel_loop())
    task_housekeeping = asyncio.create_task(housekeeping_loop(dispatch_notifications))
    task_incidents = asyncio.create_task(incident_reconciliation_loop())
    yield
    task_supabase.cancel()
    task_telegram.cancel()
    task_sentinel.cancel()
    task_housekeeping.cancel()
    task_incidents.cancel()
    for t in (task_supabase, task_telegram, task_sentinel, task_housekeeping, task_incidents):
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
        "automation": {
            "telegram_commands": len(TELEGRAM_COMMANDS),
            "auto_housekeeping": AUTO_HOUSEKEEPING_ENABLED,
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
async def _tg_reply(
    chat_id: int | str,
    text: str,
    reply_markup: dict[str, Any] | None = None,
) -> None:
    """Envia resposta de texto para um chat do Telegram."""
    if not TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            payload: dict[str, Any] = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            }
            if reply_markup:
                payload["reply_markup"] = reply_markup
            await client.post(url, json=payload)
        except Exception as exc:
            print(f"[tg_reply] Erro: {exc}")


async def _ask_zaea(user_text: str, chat_id: int | str) -> str:
    """
    Envia mensagem livre para o Groq com persona do ZAEA e contexto da plataforma.
    Retorna resposta em HTML para o Telegram.
    Fallback simples se Groq não estiver configurado.
    """
    if not GROQ_API_KEY:
        return (
            "🤖 <b>ZAEA</b>\n\n"
            "IA não configurada (GROQ_API_KEY ausente).\n"
            "Use /ajuda para ver os comandos disponíveis."
        )

    # Coleta contexto rápido para enriquecer a resposta
    context_lines: list[str] = []
    _prune_incidents()
    snap = _incident_snapshot()
    active_incidents = snap.get("active_count", 0)
    critical_incidents = snap.get("critical_count", 0)
    context_lines.append(f"Incidentes ativos: {active_incidents} ({critical_incidents} críticos)")

    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(
                    f"{SUPABASE_URL}/rest/v1/system_alerts",
                    params={
                        "select": "id",
                        "read": "eq.false",
                        "severity": "in.(warning,critical)",
                        "limit": "1",
                    },
                    headers=_supabase_headers(),
                    # Usar head count
                )
                # approximação: apenas checa se há alertas pendentes
                pending = len(resp.json()) if resp.status_code == 200 else 0
                context_lines.append(f"Alertas não lidos recentes: {pending}+")
        except Exception:
            pass

    context_block = "\n".join(context_lines)

    system_prompt = (
        "Você é o ZAEA (Zairyx Autonomous Engineering Agent), o agente operacional "
        "da plataforma Zairyx — um SaaS de cardápio digital para deliverys. "
        "Você monitora segurança, alertas, incidentes e a saúde do sistema. "
        "Responda de forma direta, objetiva e técnica, mas com personalidade: "
        "você é confiante, pragmático e não enrola. "
        "Use no máximo 3 parágrafos curtos. "
        "Quando relevante, mencione que comandos como /status, /incidents ou /sentinel estão disponíveis. "
        "Responda sempre em português. "
        "NÃO use markdown com asteriscos — use HTML do Telegram: <b>negrito</b>, <i>itálico</i>, <code>código</code>.\n\n"
        f"Contexto atual da plataforma:\n{context_block}"
    )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_text},
                    ],
                    "max_tokens": 400,
                    "temperature": 0.6,
                },
            )

        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"].strip()
            return f"🤖 <b>ZAEA</b>\n\n{content}"

        print(f"[zaea-chat] Groq HTTP {resp.status_code}: {resp.text[:200]}")
        return "🤖 <b>ZAEA</b>\n\nNão consegui processar sua mensagem agora. Tente /status ou /ajuda."

    except Exception as exc:
        print(f"[zaea-chat] Erro Groq: {exc}")
        return "🤖 <b>ZAEA</b>\n\nErro ao contatar IA. Os comandos operacionais continuam funcionando normalmente — use /ajuda."


async def handle_telegram_command(chat_id: int | str, raw_text: str) -> None:
    cmd = raw_text.lower().split()[0]

    if cmd in ("/start", "/ajuda", "/menu"):
        await _tg_reply(chat_id, _help_text(), reply_markup=_main_menu_markup())
        return

    if cmd in ("/overview", "/ops"):
        snapshot = await fetch_runtime_snapshot()
        snapshot["incidents"] = _incident_snapshot()
        await _tg_reply(chat_id, _format_overview(snapshot), reply_markup=_main_menu_markup())
        return

    if cmd in ("/status", "/health"):
        supabase_ok = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
        tg_ok = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
        wa_ok = bool(EVOLUTION_API_URL and EVOLUTION_API_KEY)
        await _tg_reply(
            chat_id,
            "🛡️ <b>Zai Sentinel — Status</b>\n\n"
            f"{_status_icon(supabase_ok)} Supabase (polling alertas)\n"
            f"{_status_icon(tg_ok)} Telegram\n"
            f"{_status_icon(wa_ok)} WhatsApp Evolution\n"
            f"{_status_icon(bool(TELEGRAM_BOT_TOKEN))} Bot commands sincronizados\n\n"
            f"🔄 Polling de alertas: {POLL_INTERVAL}s\n"
            f"🧹 Housekeeping automático: {'ATIVO' if AUTO_HOUSEKEEPING_ENABLED else 'DESATIVADO'}\n"
            f"🤖 Bot: {TELEGRAM_BOT_HANDLE}",
            reply_markup=_main_menu_markup(),
        )
        return

    if cmd == "/incidents":
        await _tg_reply(chat_id, _format_active_incidents(_incident_snapshot()), reply_markup=_main_menu_markup())
        return

    if cmd == "/resolve":
        parts = raw_text.strip().split(maxsplit=3)
        if len(parts) < 2:
            await _tg_reply(
                chat_id,
                (
                    "Uso: <code>/resolve CHAVE [motivo] [nota]</code>\n"
                    "Motivos: <code>manual_ack</code>, <code>false_positive</code>, <code>mitigated</code>, <code>deployed_fix</code>, <code>config_fix</code>, <code>provider_recovered</code>\n"
                    "Exemplo: <code>/resolve ab12cd34 mitigated rollback aplicado</code>"
                ),
                reply_markup=_main_menu_markup(),
            )
            return

        reference = parts[1]
        possible_reason = parts[2] if len(parts) > 2 else "manual_ack"
        resolution_reason = possible_reason if possible_reason in RESOLUTION_REASONS else "manual_ack"
        note = parts[3] if len(parts) > 3 else (parts[2] if len(parts) > 2 and resolution_reason == "manual_ack" else None)
        resolved = await _resolve_incident(
            reference,
            resolution_reason=resolution_reason,
            resolution_note=note,
            source="telegram",
        )
        if resolved is None:
            await _tg_reply(
                chat_id,
                f"Nenhum incidente ativo encontrado para a chave <code>{reference}</code>.",
                reply_markup=_main_menu_markup(),
            )
            return

        await _tg_reply(
            chat_id,
            (
                "✅ <b>Incidente resolvido</b>\n"
                f"Chave: <code>{resolved.incident_key[:8]}</code>\n"
                f"Título: {resolved.title}\n"
                f"Motivo: {RESOLUTION_REASONS[resolution_reason]}\n"
                f"Ocorrências: {resolved.occurrences}"
            ),
            reply_markup=_main_menu_markup(),
        )
        return

    if cmd == "/agents":
        rows = await fetch_recent_agent_failures()
        await _tg_reply(chat_id, _format_agent_failures(rows), reply_markup=_main_menu_markup())
        return

    if cmd == "/alerts":
        rows = await fetch_pending_alerts()
        await _tg_reply(chat_id, _format_pending_alerts(rows), reply_markup=_main_menu_markup())
        return

    if cmd == "/learn":
        rows = await fetch_learning_summary()
        await _tg_reply(chat_id, _format_learning_summary(rows), reply_markup=_main_menu_markup())
        return

    if cmd == "/cleanup":
        audit = audit_housekeeping()
        await _tg_reply(chat_id, _format_cleanup_summary(audit), reply_markup=_main_menu_markup())
        return

    if cmd == "/cleanup_run":
        result = execute_housekeeping()
        await _tg_reply(
            chat_id,
            _format_cleanup_summary(result, executed=True),
            reply_markup=_main_menu_markup(),
        )
        return

    if cmd == "/sentinel":
        await _tg_reply(chat_id, "🛡️ <i>Executando scan completo...</i>")
        try:
            result = await run_full_scan()
            severity = result.get("severity", "?")
            crit = result.get("critical", 0)
            warn = result.get("warning", 0)
            await _tg_reply(
                chat_id,
                f"✅ <b>Scan concluído</b>\n"
                f"Status: <b>{severity.upper()}</b> ({crit}🔴 {warn}🟡)\n"
                f"Telegram enviado: {'sim' if result.get('telegram_sent') else 'não'}\n"
                f"Link WhatsApp: {'sim' if result.get('whatsapp_link_sent') else 'não'}",
                reply_markup=_main_menu_markup(),
            )
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro no scan: {str(exc)[:200]}", reply_markup=_main_menu_markup())
        return

    if cmd == "/ux":
        await _tg_reply(chat_id, "🔎 <i>Buscando último resultado de inspeção UX...</i>")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                ux_data = await fetch_last_ux_report(client)
            if ux_data:
                await _tg_reply(chat_id, format_ux_telegram_report(ux_data), reply_markup=_main_menu_markup())
            else:
                await _tg_reply(
                    chat_id,
                    "🔎 <b>Inspeção UX</b>\n\nNenhum resultado encontrado ainda.\n\n"
                    "Execute o job <b>UX Inspector</b> no GitHub Actions (mode=ux) para gerar o primeiro relatório.",
                    reply_markup=_main_menu_markup(),
                )
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro ao buscar resultado UX: {str(exc)[:200]}", reply_markup=_main_menu_markup())
        return

    if cmd == "/teste":
        await _tg_reply(
            chat_id,
            "🟡 <b>[TESTE] Alerta simulado</b>\n\n"
            "Origem: comando /teste\n"
            "Erro: Este é um alerta de teste do Zai Sentinel.\n\n"
            "✅ Notificações funcionando corretamente.",
            reply_markup=_main_menu_markup(),
        )
        return

    if cmd == "/negocios":
        await _tg_reply(chat_id, "🏪 <i>Buscando dados dos deliverys...</i>")
        try:
            data = await fetch_negocios_summary()
            await _tg_reply(chat_id, _format_negocios(data), reply_markup=_main_menu_markup())
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro ao buscar negócios: {str(exc)[:200]}", reply_markup=_main_menu_markup())
        return

    if cmd == "/receita":
        await _tg_reply(chat_id, "💰 <i>Calculando faturamento...</i>")
        try:
            data = await fetch_receita_summary(days=7)
            await _tg_reply(chat_id, _format_receita(data), reply_markup=_main_menu_markup())
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro ao buscar faturamento: {str(exc)[:200]}", reply_markup=_main_menu_markup())
        return

    if cmd == "/briefings":
        await _tg_reply(chat_id, "📋 <i>Consultando briefings...</i>")
        try:
            data = await fetch_briefings_summary()
            await _tg_reply(chat_id, _format_briefings(data), reply_markup=_main_menu_markup())
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro ao buscar briefings: {str(exc)[:200]}", reply_markup=_main_menu_markup())
        return

    if cmd == "/pagamentos":
        await _tg_reply(chat_id, "💳 <i>Consultando cobranças PIX...</i>")
        try:
            data = await fetch_pagamentos_summary()
            await _tg_reply(chat_id, _format_pagamentos(data), reply_markup=_main_menu_markup())
        except Exception as exc:
            await _tg_reply(chat_id, f"❌ Erro ao buscar pagamentos: {str(exc)[:200]}", reply_markup=_main_menu_markup())
        return

    # Mensagem em linguagem natural — responder com Groq
    answer = await _ask_zaea(raw_text, chat_id)
    await _tg_reply(chat_id, answer, reply_markup=_main_menu_markup())


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
    user_id: int | None = message.get("from", {}).get("id")
    text: str = message.get("text", "").strip().lower()

    if not chat_id or not text:
        return {"ok": True}

    if not _is_authorized(user_id):
        print(f"[webhook] Acesso negado — user_id={user_id} chat_id={chat_id}")
        if text.startswith("/"):
            await _tg_reply(chat_id, "⛔ Acesso não autorizado.")
        return {"ok": True}

    # Auto-salva o chat_id se ainda não configurado (primeiro /start)
    global TELEGRAM_CHAT_ID
    if not TELEGRAM_CHAT_ID and text.startswith("/start"):
        TELEGRAM_CHAT_ID = str(chat_id)
        print(f"[sentinel] Chat ID capturado automaticamente: {chat_id}")

    await handle_telegram_command(chat_id, text)

    return {"ok": True}


@app.get("/api/ops/overview")
async def ops_overview(authorization: str = Header(default="")):
    _require_secret(authorization)

    snapshot, failures, alerts, learning = await asyncio.gather(
        fetch_runtime_snapshot(),
        fetch_recent_agent_failures(),
        fetch_pending_alerts(),
        fetch_learning_summary(),
    )
    incident_snapshot = _incident_snapshot()
    snapshot["incidents"] = incident_snapshot

    return {
        "success": True,
        "snapshot": snapshot,
        "incidents": incident_snapshot,
        "recent_agent_failures": failures,
        "pending_alerts": alerts,
        "learning": learning,
    }


@app.get("/api/ops/incidents")
async def ops_incidents(authorization: str = Header(default="")):
    _require_secret(authorization)
    return {"success": True, "incidents": _incident_snapshot(limit=20)}


@app.post("/api/ops/incidents/resolve")
async def ops_resolve_incident(
    payload: ResolveIncidentPayload,
    authorization: str = Header(default=""),
):
    _require_secret(authorization)
    incident = await _resolve_incident(
        payload.incident_key,
        resolution_reason=payload.resolution_reason,
        resolution_note=payload.resolution_note,
        source="api",
    )
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidente não encontrado ou já resolvido.")

    return {
        "success": True,
        "resolved_incident": {
            **asdict(incident),
            "incident_key_short": incident.incident_key[:8],
        },
    }


@app.get("/api/ops/housekeeping")
async def ops_housekeeping_audit(authorization: str = Header(default="")):
    _require_secret(authorization)
    return {"success": True, "result": audit_housekeeping()}


@app.post("/api/ops/housekeeping/run")
async def ops_housekeeping_run(authorization: str = Header(default="")):
    _require_secret(authorization)
    return {"success": True, "result": execute_housekeeping()}


@app.post("/api/ops/analyze-alert-transcript")
async def ops_analyze_alert_transcript(
    payload: TranscriptPayload,
    authorization: str = Header(default=""),
):
    _require_secret(authorization)
    return {"success": True, "analysis": analyze_alert_transcript(payload.transcript)}


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

