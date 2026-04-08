"""
backend/sentinel.py
Zai Sentinel — Motor de monitoramento inteligente com IA (Groq).

Responsabilidades:
  1. Rodar todas as verificações da plataforma periodicamente
  2. Analisar resultados com IA (Groq LLM) para gerar insight acionável
  3. Enviar relatório formatado via Telegram + link WhatsApp clicável
  4. Aprender com resoluções anteriores (knowledge base em Supabase)
  5. Escalar automaticamente — adapta frequência conforme severidade

Integração:
  - Chamado pelo server.py via lifespan (background task)
  - Pode ser acionado via POST /api/sentinel/run
"""

import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote as url_quote

import httpx

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv("SUPABASE_SECRET_KEY", ""),
)
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
ADMIN_WHATSAPP: str = os.getenv("ADMIN_WHATSAPP", "5512996887993")
TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
SITE_URL: str = os.getenv("NEXT_PUBLIC_SITE_URL", "https://zairyx.com.br")

# Intervalo base em segundos (15 min) — aumenta se tudo OK, diminui se crítico
BASE_INTERVAL = int(os.getenv("SENTINEL_INTERVAL_SECONDS", "900"))
MIN_INTERVAL = 120   # 2 min em emergência
MAX_INTERVAL = 3600  # 1h se tudo tranquilo

# ── Supabase helpers ──────────────────────────────────────────────────────────
def _sb_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def _sb_rpc(client: httpx.AsyncClient, fn: str, params: dict | None = None) -> Any:
    """Chama uma function RPC do Supabase."""
    resp = await client.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{fn}",
        headers=_sb_headers(),
        json=params or {},
        timeout=15,
    )
    if resp.status_code != 200:
        return None
    return resp.json()


async def _sb_query(
    client: httpx.AsyncClient, table: str, params: dict[str, str]
) -> list[dict[str, Any]]:
    """Query REST do Supabase."""
    resp = await client.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params=params,
        headers=_sb_headers(),
        timeout=10,
    )
    if resp.status_code != 200:
        return []
    data = resp.json()
    return data if isinstance(data, list) else []


async def _sb_insert(client: httpx.AsyncClient, table: str, row: dict) -> bool:
    """Insere row no Supabase."""
    resp = await client.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_sb_headers(),
        json=row,
        timeout=10,
    )
    return resp.status_code in (200, 201)


# ── Coleta de dados ──────────────────────────────────────────────────────────

class PlatformReport:
    """Resultado da análise completa da plataforma."""

    def __init__(self) -> None:
        self.issues: list[dict[str, Any]] = []
        self.metrics: dict[str, Any] = {}
        self.raw_health: dict[str, Any] = {}
        self.timestamp = datetime.now(timezone.utc)

    @property
    def critical_count(self) -> int:
        return sum(1 for i in self.issues if i["level"] == "critical")

    @property
    def warning_count(self) -> int:
        return sum(1 for i in self.issues if i["level"] == "warning")

    @property
    def severity(self) -> str:
        if self.critical_count > 0:
            return "critical"
        if self.warning_count > 0:
            return "warning"
        return "ok"


async def collect_platform_data(client: httpx.AsyncClient) -> PlatformReport:
    """Coleta todos os dados da plataforma em paralelo."""
    report = PlatformReport()

    # 1. RPC platform_health_check (security + limits)
    try:
        health = await _sb_rpc(client, "platform_health_check")
        if health:
            report.raw_health = health
            _process_health(report, health)
    except Exception as e:
        report.issues.append({
            "source": "rpc-error",
            "level": "warning",
            "title": "RPC indisponível",
            "detail": str(e)[:200],
        })

    # 2-5: Queries REST em paralelo
    tasks = {
        "domain_errors": _check_domain_errors(client),
        "unread_alerts": _check_unread_alerts(client),
        "recent_health": _check_recent_health(client),
        "agent_failures": _check_agent_failures(client),
        "mergeforge_health": _check_mergeforge_health(),
    }

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    for name, result in zip(tasks.keys(), results):
        if isinstance(result, list):
            report.issues.extend(result)
        elif isinstance(result, Exception):
            print(f"[sentinel] Erro em {name}: {result}")

    return report


def _process_health(report: PlatformReport, health: dict) -> None:
    """Processa resultado do RPC em issues."""
    # Tabelas sem RLS
    no_rls = health.get("tables_no_rls", [])
    if no_rls:
        names = ", ".join(t["table"] for t in no_rls[:10])
        report.issues.append({
            "source": "no-rls",
            "level": "critical",
            "title": f"{len(no_rls)} tabelas SEM RLS",
            "detail": names,
            "fix": "ALTER TABLE <name> ENABLE ROW LEVEL SECURITY",
        })

    # RLS sem policies
    no_policy = health.get("rls_no_policy", [])
    if no_policy:
        names = ", ".join(t["table"] for t in no_policy[:10])
        report.issues.append({
            "source": "rls-no-policy",
            "level": "warning",
            "title": f"{len(no_policy)} tabelas com RLS sem policies",
            "detail": names,
            "fix": "Criar policies ou restringir a service_role",
        })

    # Policies permissivas
    perm = health.get("permissive_policies", [])
    if perm:
        for p in perm[:5]:
            report.issues.append({
                "source": "permissive-policy",
                "level": "warning",
                "title": f"Policy permissiva: {p.get('policy', '?')}",
                "detail": f"{p.get('table')} ({p.get('command')}) USING(true)",
                "fix": "Restringir a service_role ou auth.uid()",
            })

    # SECURITY DEFINER views
    definer = health.get("definer_views", [])
    if definer:
        names = ", ".join(v["view"] for v in definer[:10])
        report.issues.append({
            "source": "security-definer",
            "level": "critical",
            "title": f"{len(definer)} views SECURITY DEFINER",
            "detail": names,
            "fix": "ALTER VIEW SET (security_invoker = true)",
        })

    # Tamanho do banco
    db_mb = health.get("db_size_mb", 0)
    limit_mb = 500
    pct = (db_mb / limit_mb * 100) if limit_mb else 0
    report.metrics["db_size_mb"] = db_mb
    report.metrics["db_usage_pct"] = round(pct, 1)

    if pct >= 90:
        report.issues.append({
            "source": "db-size",
            "level": "critical",
            "title": f"⚠️ Banco {pct:.0f}% cheio: {db_mb:.0f}MB/{limit_mb}MB",
            "detail": "Risco de atingir limite do plano",
            "fix": "Upgrade do plano ou cleanup de dados antigos",
        })
    elif pct >= 70:
        report.issues.append({
            "source": "db-size",
            "level": "warning",
            "title": f"Banco {pct:.0f}%: {db_mb:.0f}MB/{limit_mb}MB",
            "detail": "Monitorar crescimento",
            "fix": "DELETE FROM domain_logs WHERE created_at < NOW() - INTERVAL '30 days'",
        })

    # Conexões
    conns = health.get("active_connections", 0)
    report.metrics["active_connections"] = conns
    if conns > 50:
        report.issues.append({
            "source": "connections",
            "level": "critical",
            "title": f"🔌 {conns}/60 conexões ativas",
            "detail": "Risco de rejeição de novas conexões",
            "fix": "Verificar connection pooling ou queries lentas",
        })
    elif conns > 30:
        report.issues.append({
            "source": "connections",
            "level": "warning",
            "title": f"{conns}/60 conexões",
            "detail": "Uso moderado",
        })

    # Queries lentas
    slow = health.get("slow_queries", 0)
    if slow > 0:
        report.issues.append({
            "source": "slow-queries",
            "level": "warning",
            "title": f"🐢 {slow} queries lentas (>10s)",
            "detail": "Verificar pg_stat_activity",
            "fix": "Adicionar índices ou otimizar queries",
        })


async def _check_domain_errors(client: httpx.AsyncClient) -> list[dict]:
    """Erros nos domain_logs nas últimas 24h."""
    issues: list[dict] = []
    since = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    # 24h atrás
    from datetime import timedelta
    since_dt = datetime.now(timezone.utc) - timedelta(hours=24)
    since = since_dt.isoformat()

    rows = await _sb_query(client, "domain_logs", {
        "select": "domain",
        "level": "eq.error",
        "created_at": f"gte.{since}",
    })
    if not rows:
        return issues

    grouped: dict[str, int] = {}
    for r in rows:
        grouped[r["domain"]] = grouped.get(r["domain"], 0) + 1

    for domain, count in grouped.items():
        issues.append({
            "source": "domain-logs",
            "level": "critical" if count >= 10 else "warning",
            "title": f"{count} erros em '{domain}' (24h)",
            "detail": f"Domínio {domain} acumulou {count} erros",
            "fix": "SELECT * FROM domain_logs WHERE domain = '{}' AND level = 'error' ORDER BY created_at DESC LIMIT 10".format(domain),
        })
    return issues


async def _check_unread_alerts(client: httpx.AsyncClient) -> list[dict]:
    """Alertas não lidos acumulados."""
    rows = await _sb_query(client, "system_alerts", {
        "select": "id",
        "read": "eq.false",
        "limit": "100",
    })
    count = len(rows)
    if count >= 20:
        return [{
            "source": "alerts-backlog",
            "level": "critical" if count >= 50 else "warning",
            "title": f"📬 {count} alertas não lidos",
            "detail": "Acumulação sem leitura no painel admin",
            "fix": "Revisar em /painel/alertas",
        }]
    return []


async def _check_recent_health(client: httpx.AsyncClient) -> list[dict]:
    """Verifica se o health check está rodando."""
    issues: list[dict] = []
    rows = await _sb_query(client, "health_checks", {
        "select": "status,created_at",
        "order": "created_at.desc",
        "limit": "1",
    })
    if rows:
        last = rows[0]
        age_h = (datetime.now(timezone.utc) - datetime.fromisoformat(
            last["created_at"].replace("Z", "+00:00")
        )).total_seconds() / 3600

        if age_h > 25:
            issues.append({
                "source": "health-stale",
                "level": "warning",
                "title": f"Health check {age_h:.0f}h atrás",
                "detail": "Cron /api/cron/health pode estar falhando",
            })
        if last["status"] in ("down", "degraded"):
            issues.append({
                "source": "health-degraded",
                "level": "critical" if last["status"] == "down" else "warning",
                "title": f"Health: {last['status'].upper()}",
                "detail": "Sistema degradado no último check",
            })
    return issues


async def _check_agent_failures(client: httpx.AsyncClient) -> list[dict]:
    """Verifica tarefas de agentes ZAEA falhadas recentes."""
    issues: list[dict] = []
    from datetime import timedelta
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    rows = await _sb_query(client, "agent_tasks", {
        "select": "agent_name,status,error_message",
        "status": "eq.failed",
        "created_at": f"gte.{since}",
        "limit": "20",
    })
    if rows:
        agents_failed: dict[str, int] = {}
        for r in rows:
            name = r.get("agent_name", "unknown")
            agents_failed[name] = agents_failed.get(name, 0) + 1

        for agent, count in agents_failed.items():
            issues.append({
                "source": "agent-failure",
                "level": "critical" if count >= 5 else "warning",
                "title": f"Agente '{agent}' falhou {count}x (24h)",
                "detail": rows[0].get("error_message", "")[:150],
            })
    return issues


async def _check_mergeforge_health() -> list[dict]:
    """Verifica saúde do backend MergeForge e taxa de falhas."""
    import os
    MERGEFORGE_URL = os.getenv("MERGEFORGE_URL", "https://mergeforge-backend.onrender.com")
    issues: list[dict] = []

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(f"{MERGEFORGE_URL}/", timeout=8)
            if resp.status_code >= 500:
                issues.append({
                    "source": "mergeforge-backend",
                    "level": "critical",
                    "title": f"MergeForge backend HTTP {resp.status_code}",
                    "detail": f"Backend respondendo com erro: {MERGEFORGE_URL}",
                    "fix": "Verificar logs no Render: https://dashboard.render.com",
                })
    except Exception as exc:
        issues.append({
            "source": "mergeforge-backend",
            "level": "critical",
            "title": "MergeForge backend OFFLINE",
            "detail": str(exc)[:150],
            "fix": "Verificar serviço em https://dashboard.render.com",
        })

    return issues



async def analyze_with_ai(
    client: httpx.AsyncClient,
    report: PlatformReport,
    knowledge: list[dict],
) -> str:
    """Analisa o relatório com Groq LLM e retorna insight acionável."""
    if not GROQ_API_KEY:
        return _fallback_summary(report)

    # Montar contexto compacto
    issues_text = "\n".join(
        f"- [{i['level'].upper()}] {i['title']}: {i['detail']}"
        for i in report.issues[:15]
    )
    metrics_text = json.dumps(report.metrics, indent=2, default=str)

    knowledge_text = ""
    if knowledge:
        knowledge_text = "\n\nAprendizados anteriores:\n" + "\n".join(
            f"- Padrão: {k.get('pattern', '?')} → Solução: {k.get('solution', '?')} (confiança: {k.get('confidence', 0)}%)"
            for k in knowledge[:10]
        )

    system_prompt = (
        "Você é o Zai Sentinel, o assistente de DevOps da plataforma Zairyx (SaaS de cardápio digital). "
        "Analise o relatório de monitoramento e gere um resumo CURTO (máx 400 chars) em português BR. "
        "Priorize: 1) Ações imediatas se crítico 2) Tendências se warning 3) 'Tudo OK' se limpo. "
        "Use emojis moderadamente. Não use markdown. Texto plano para WhatsApp."
    )

    user_prompt = f"""Relatório da plataforma ({report.timestamp.strftime('%d/%m %H:%M UTC')}):

Issues ({report.critical_count} críticos, {report.warning_count} avisos):
{issues_text or 'Nenhum problema encontrado.'}

Métricas:
{metrics_text}
{knowledge_text}

Gere: 1 parágrafo de análise + lista de ações (se houver). Máximo 400 caracteres."""

    try:
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
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 300,
                "temperature": 0.3,
            },
            timeout=15,
        )

        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[sentinel] Groq AI erro: {e}")

    return _fallback_summary(report)


def _fallback_summary(report: PlatformReport) -> str:
    """Resumo sem IA quando Groq está indisponível."""
    if report.critical_count == 0 and report.warning_count == 0:
        db = report.metrics.get("db_size_mb", "?")
        return f"✅ Plataforma OK. Banco: {db}MB. Sem problemas detectados."

    parts = []
    if report.critical_count:
        parts.append(f"🔴 {report.critical_count} críticos")
    if report.warning_count:
        parts.append(f"🟡 {report.warning_count} avisos")

    top = report.issues[0]
    parts.append(f"Principal: {top['title']}")
    if top.get("fix"):
        parts.append(f"💡 {top['fix']}")

    return " | ".join(parts)


# ── Formatação de mensagens ──────────────────────────────────────────────────

def build_whatsapp_link(text: str) -> str:
    """Monta link wa.me clicável com mensagem pré-preenchida."""
    numero = ADMIN_WHATSAPP.replace("+", "").replace("-", "").replace(" ", "")
    if not numero.startswith("55"):
        numero = f"55{numero}"
    return f"https://api.whatsapp.com/send?phone={numero}&text={url_quote(text)}"


def format_whatsapp_report(report: PlatformReport, ai_summary: str) -> str:
    """Formata relatório para WhatsApp (texto plano com emojis)."""
    ts = report.timestamp.strftime("%d/%m/%Y %H:%M")

    lines = [
        f"🛡️ *Zai Sentinel — Relatório*",
        f"📅 {ts} UTC",
        "",
    ]

    # Status geral
    if report.severity == "ok":
        lines.append("✅ *Tudo limpo!*")
    elif report.severity == "critical":
        lines.append(f"🔴 *{report.critical_count} CRÍTICOS* | 🟡 {report.warning_count} avisos")
    else:
        lines.append(f"🟡 *{report.warning_count} AVISOS*")

    lines.append("")

    # Issues top 8
    for i, issue in enumerate(report.issues[:8], 1):
        icon = "🔴" if issue["level"] == "critical" else "🟡" if issue["level"] == "warning" else "ℹ️"
        lines.append(f"{icon} {issue['title']}")
        if issue.get("fix"):
            lines.append(f"   💡 {issue['fix']}")

    # Métricas
    if report.metrics:
        lines.append("")
        lines.append("📊 *Métricas*")
        db = report.metrics.get("db_size_mb", "?")
        pct = report.metrics.get("db_usage_pct", "?")
        conns = report.metrics.get("active_connections", "?")
        lines.append(f"  • Banco: {db}MB ({pct}%)")
        lines.append(f"  • Conexões: {conns}/60")

    # AI insight
    lines.append("")
    lines.append("🤖 *Análise IA*")
    lines.append(ai_summary)

    lines.append("")
    lines.append(f"_Zai Sentinel v2 · {SITE_URL}_")

    return "\n".join(lines)


def format_telegram_report(report: PlatformReport, ai_summary: str) -> str:
    """Formata relatório para Telegram (HTML)."""
    ts = report.timestamp.strftime("%d/%m/%Y %H:%M")

    lines = [
        "🛡️ <b>Zai Sentinel — Relatório</b>",
        f"<i>📅 {ts} UTC</i>",
        "",
    ]

    if report.severity == "ok":
        lines.append("✅ <b>Tudo limpo!</b>")
    elif report.severity == "critical":
        lines.append(f"🔴 <b>{report.critical_count} CRÍTICOS</b> · 🟡 {report.warning_count} avisos")
    else:
        lines.append(f"🟡 <b>{report.warning_count} AVISOS</b>")

    lines.append("")

    for issue in report.issues[:8]:
        icon = "🔴" if issue["level"] == "critical" else "🟡" if issue["level"] == "warning" else "ℹ️"
        lines.append(f"{icon} {issue['title']}")
        if issue.get("fix"):
            lines.append(f"    💡 <i>{issue['fix']}</i>")

    if report.metrics:
        lines.append("")
        db = report.metrics.get("db_size_mb", "?")
        pct = report.metrics.get("db_usage_pct", "?")
        conns = report.metrics.get("active_connections", "?")
        lines.append(f"📊 Banco: {db}MB ({pct}%) · Conexões: {conns}/60")

    lines.append("")
    lines.append(f"🤖 <b>IA:</b> {ai_summary}")

    # WhatsApp link
    wa_text = format_whatsapp_report(report, ai_summary)
    wa_link = build_whatsapp_link(wa_text)
    lines.append("")
    lines.append(f'📱 <a href="{wa_link}">Abrir no WhatsApp</a>')

    return "\n".join(lines)


# ── Knowledge base (aprendizado contínuo) ────────────────────────────────────

async def load_knowledge(client: httpx.AsyncClient) -> list[dict]:
    """Carrega padrões conhecidos da base de conhecimento."""
    return await _sb_query(client, "agent_knowledge", {
        "select": "pattern,solution,confidence,outcome",
        "confidence": "gte.50",
        "order": "confidence.desc",
        "limit": "20",
    })


async def save_learning(
    client: httpx.AsyncClient,
    report: PlatformReport,
    ai_summary: str,
) -> None:
    """Salva padrões novos descobertos nesta execução."""
    for issue in report.issues:
        if issue["level"] != "critical" or not issue.get("fix"):
            continue

        # Verificar se padrão já existe
        existing = await _sb_query(client, "agent_knowledge", {
            "select": "id,occurrences",
            "pattern": f"eq.{issue['source']}: {issue['title']}",
            "limit": "1",
        })

        if existing:
            # Incrementar ocorrências
            row_id = existing[0]["id"]
            occ = existing[0].get("occurrences", 1) + 1
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/agent_knowledge",
                params={"id": f"eq.{row_id}"},
                headers=_sb_headers(),
                json={"occurrences": occ, "last_seen_at": datetime.now(timezone.utc).isoformat()},
                timeout=10,
            )
        else:
            # Criar novo padrão
            await _sb_insert(client, "agent_knowledge", {
                "pattern": f"{issue['source']}: {issue['title']}",
                "root_cause": issue["detail"][:200],
                "solution": issue.get("fix", "Investigar manualmente"),
                "confidence": 30,
                "outcome": "partial",
                "occurrences": 1,
                "files_changed": [],
            })


# ── Envio de notificações ────────────────────────────────────────────────────

async def send_telegram(text: str) -> bool:
    """Envia mensagem para Telegram."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML",
                       "disable_web_page_preview": True},
            )
            return resp.status_code == 200
    except Exception as e:
        print(f"[sentinel-tg] Erro: {e}")
        return False


async def send_telegram_whatsapp_link(wa_report_text: str) -> bool:
    """Envia link WhatsApp clicável via Telegram para fácil reenvio."""
    link = build_whatsapp_link(wa_report_text)
    msg = (
        "📱 <b>Link WhatsApp — Relatório Sentinel</b>\n\n"
        f'<a href="{link}">Clique aqui para abrir no WhatsApp</a>\n\n'
        "<i>Abre com a mensagem pré-preenchida pronta para enviar.</i>"
    )
    return await send_telegram(msg)


# ── Scan completo ─────────────────────────────────────────────────────────────

async def run_full_scan() -> dict[str, Any]:
    """Executa scan completo: coleta → IA → formata → envia."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("[sentinel] Supabase não configurado — scan abortado.")
        return {"error": "supabase_not_configured"}

    ts = datetime.now(timezone.utc).isoformat()
    print(f"[sentinel] ▶️ Scan iniciado — {ts}")

    async with httpx.AsyncClient(timeout=20) as client:
        # 1. Coleta de dados
        report = await collect_platform_data(client)

        # 2. Automação de resposta: spam + escalação (paralelo, não bloqueante)
        async def _run_response_automations() -> None:
            results = await asyncio.gather(
                _sb_rpc(client, "process_spam_detection"),
                _sb_rpc(client, "escalate_unacknowledged_criticals"),
                return_exceptions=True,
            )
            spam_r, esc_r = results
            if isinstance(spam_r, dict):
                n = spam_r.get("spam_sources_detected", 0)
                if n:
                    print(f"[sentinel] 🚨 Spam detectado: {n} fonte(s) com spike")
            if isinstance(esc_r, dict):
                n = esc_r.get("escalated", 0)
                if n:
                    print(f"[sentinel] 🔺 Escalação: {n} crítico(s) sem ACK há 30min+")

        await _run_response_automations()

        # 3. Carrega knowledge base para contexto
        knowledge = await load_knowledge(client)

        # 4. Análise com IA (Groq)
        ai_summary = await analyze_with_ai(client, report, knowledge)

        # 5. Formata relatórios
        tg_report = format_telegram_report(report, ai_summary)
        wa_report = format_whatsapp_report(report, ai_summary)

        # 6. Envia Telegram (relatório completo)
        tg_ok = await send_telegram(tg_report)
        print(f"[sentinel] Telegram: {'✅' if tg_ok else '❌'}")

        # 7. Envia link WhatsApp clicável via Telegram
        wa_ok = await send_telegram_whatsapp_link(wa_report)
        print(f"[sentinel] WhatsApp link: {'✅' if wa_ok else '❌'}")

        # 8. Salva aprendizado
        await save_learning(client, report, ai_summary)

        print(f"[sentinel] ✅ Scan concluído — {report.severity.upper()} "
              f"({report.critical_count}🔴 {report.warning_count}🟡)")

        return {
            "severity": report.severity,
            "critical": report.critical_count,
            "warning": report.warning_count,
            "issues": len(report.issues),
            "ai_summary": ai_summary,
            "whatsapp_link": build_whatsapp_link(wa_report),
            "telegram_sent": tg_ok,
            "whatsapp_link_sent": wa_ok,
            "timestamp": ts,
        }


# ── Intervalo adaptativo ─────────────────────────────────────────────────────

def compute_next_interval(report: PlatformReport) -> int:
    """Adapta frequência conforme severidade — mais rápido se crítico."""
    if report.critical_count > 0:
        return MIN_INTERVAL  # 2 min
    if report.warning_count > 3:
        return BASE_INTERVAL // 2  # 7.5 min
    if report.warning_count > 0:
        return BASE_INTERVAL  # 15 min
    return MAX_INTERVAL  # 1h se tudo OK


# ── Inspeção UX (leitura de resultado armazenado pelo GitHub Actions) ─────────

async def fetch_last_ux_report(client: httpx.AsyncClient) -> dict | None:
    """Busca o último resultado de inspeção UX armazenado pelo job ux-inspector."""
    rows = await _sb_query(client, "agent_knowledge", {
        "select": "value,updated_at",
        "key": "eq.ux_inspection_latest",
        "limit": "1",
    })
    return rows[0] if rows else None


def format_ux_telegram_report(ux_data: dict) -> str:
    """Formata o resultado de inspeção UX para Telegram (HTML)."""
    value = ux_data.get("value", {}) if isinstance(ux_data.get("value"), dict) else {}
    ts_raw = value.get("timestamp", "")
    try:
        from datetime import datetime as _dt
        ts = _dt.fromisoformat(ts_raw.replace("Z", "+00:00")).strftime("%d/%m/%Y %H:%M")
    except Exception:
        ts = ts_raw[:16] if ts_raw else "?"

    passed = value.get("passed", 0)
    failed = value.get("failed", 0)
    skipped = value.get("skipped", 0)
    total = value.get("total", 0)
    failed_scenarios = value.get("failed_scenarios", "")
    run_url = value.get("run_url", "")

    status_icon = "✅" if int(failed) == 0 else "⚠️"
    status_msg = "Tudo OK!" if int(failed) == 0 else f"{failed} falha(s) detectada(s)"

    lines = [
        "🔎 <b>Inspeção UX Personas — Último Resultado</b>",
        f"<i>📅 {ts} UTC</i>",
        "",
        f"{status_icon} <b>{status_msg}</b>",
        "",
        f"📊 <b>Resultado:</b> {passed}/{total} testes",
        f"✅ Passou: {passed}  ❌ Falhou: {failed}  ⏭️ Pulou: {skipped}",
    ]

    if failed_scenarios:
        lines.append("")
        lines.append(f"🚨 <b>Cenários com falha:</b>")
        lines.append(f"<code>{str(failed_scenarios)[:250]}</code>")

    if run_url:
        lines.append("")
        lines.append(f'🔗 <a href="{run_url}">Ver detalhes no GitHub Actions</a>')

    return "\n".join(lines)


# ── Background loop ──────────────────────────────────────────────────────────

_current_interval: int = BASE_INTERVAL


async def sentinel_loop() -> None:
    """Loop contínuo de monitoramento com intervalo adaptativo."""
    global _current_interval
    _current_interval = BASE_INTERVAL
    print(f"[sentinel] 🛡️ Loop iniciado — intervalo base: {BASE_INTERVAL}s")

    # Aguarda 90s após boot antes do primeiro scan
    await asyncio.sleep(90)

    while True:
        try:
            result = await run_full_scan()

            # Adapta intervalo conforme severidade
            if not result.get("error"):
                from types import SimpleNamespace
                # Recria report leve para calcular intervalo
                mock = SimpleNamespace(
                    critical_count=result.get("critical", 0),
                    warning_count=result.get("warning", 0),
                )
                _current_interval = compute_next_interval(mock)  # type: ignore[arg-type]
                print(f"[sentinel] Próximo scan em {_current_interval}s")

        except asyncio.CancelledError:
            print("[sentinel] Loop encerrado.")
            return
        except Exception as exc:
            print(f"[sentinel] ❌ Erro no scan: {exc}")
            _current_interval = BASE_INTERVAL  # reset em caso de erro

        await asyncio.sleep(_current_interval)

