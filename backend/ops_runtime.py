from __future__ import annotations

import asyncio
import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable, Literal

import httpx

SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv("SUPABASE_SECRET_KEY", ""),
)

ROOT_DIR = Path(__file__).resolve().parent.parent

AUTO_HOUSEKEEPING_ENABLED = os.getenv("AUTO_HOUSEKEEPING_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
    "on",
}
AUTO_HOUSEKEEPING_INTERVAL_SECONDS = int(os.getenv("AUTO_HOUSEKEEPING_INTERVAL_SECONDS", "21600"))


@dataclass(frozen=True)
class CleanupTarget:
    label: str
    relative_path: str
    strategy: Literal["remove_path", "remove_old_children"]
    max_age_days: int | None = None


SAFE_CLEANUP_TARGETS: tuple[CleanupTarget, ...] = (
    CleanupTarget("Cache Next.js", ".next/cache", "remove_path"),
    CleanupTarget("Cache Python", "backend/__pycache__", "remove_path"),
    CleanupTarget("Cache Pytest backend", "backend/.pytest_cache", "remove_path"),
    CleanupTarget("Cache Pytest raiz", ".pytest_cache", "remove_path"),
    CleanupTarget("Relatórios Playwright antigos", "playwright-report", "remove_old_children", 2),
    CleanupTarget("Resultados de teste antigos", "test-results", "remove_old_children", 2),
    CleanupTarget(
        "Relatórios antigos do pipeline de imagens",
        "private/image-pipeline-reports",
        "remove_old_children",
        7,
    ),
)


def _sb_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "count=exact",
    }


def _sb_write_headers(prefer: str = "return=minimal") -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def format_bytes(size: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            if unit == "B":
                return f"{int(value)}{unit}"
            return f"{value:.1f}{unit}"
        value /= 1024
    return f"{size}B"


def _resolve_path(relative_path: str) -> Path:
    return ROOT_DIR / relative_path


def _path_size(path: Path) -> int:
    if not path.exists():
        return 0
    if path.is_file():
        return path.stat().st_size

    total = 0
    for child in path.rglob("*"):
        if child.is_file():
            try:
                total += child.stat().st_size
            except OSError:
                continue
    return total


def _safe_unlink(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path, ignore_errors=True)
    else:
        path.unlink(missing_ok=True)


def _target_candidates(target: CleanupTarget) -> list[Path]:
    path = _resolve_path(target.relative_path)
    if not path.exists():
        return []

    if target.strategy == "remove_path":
        return [path]

    max_age_days = target.max_age_days or 0
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    candidates: list[Path] = []
    for child in path.iterdir():
        try:
            modified = datetime.fromtimestamp(child.stat().st_mtime, tz=timezone.utc)
        except OSError:
            continue
        if modified < cutoff:
            candidates.append(child)
    return candidates


def _summarize_cleanup(dry_run: bool) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    total_bytes = 0
    total_entries = 0

    for target in SAFE_CLEANUP_TARGETS:
        candidates = _target_candidates(target)
        if not candidates:
            continue

        bytes_size = sum(_path_size(candidate) for candidate in candidates)
        entry_count = len(candidates)
        total_bytes += bytes_size
        total_entries += entry_count

        if not dry_run:
            for candidate in candidates:
                _safe_unlink(candidate)

        items.append(
            {
                "label": target.label,
                "path": target.relative_path,
                "entries": entry_count,
                "bytes": bytes_size,
                "strategy": target.strategy,
                "max_age_days": target.max_age_days,
            }
        )

    return {
        "dry_run": dry_run,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "enabled": AUTO_HOUSEKEEPING_ENABLED,
        "total_entries": total_entries,
        "total_bytes": total_bytes,
        "total_human": format_bytes(total_bytes),
        "items": items,
    }


def audit_housekeeping() -> dict[str, Any]:
    return _summarize_cleanup(dry_run=True)


def execute_housekeeping() -> dict[str, Any]:
    return _summarize_cleanup(dry_run=False)


async def _query_rows(
    client: httpx.AsyncClient,
    table: str,
    params: dict[str, str],
) -> list[dict[str, Any]]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return []

    resp = await client.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params=params,
        headers=_sb_headers(),
        timeout=15,
    )
    if resp.status_code != 200:
        return []

    data = resp.json()
    return data if isinstance(data, list) else []


async def _count_rows(
    client: httpx.AsyncClient,
    table: str,
    params: dict[str, str],
) -> int:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return 0

    resp = await client.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params={**params, "select": "id", "limit": "1"},
        headers=_sb_headers(),
        timeout=15,
    )
    if resp.status_code != 200:
        return 0

    content_range = resp.headers.get("content-range", "")
    if "/" not in content_range:
        data = resp.json()
        return len(data) if isinstance(data, list) else 0

    try:
        return int(content_range.rsplit("/", 1)[1])
    except ValueError:
        data = resp.json()
        return len(data) if isinstance(data, list) else 0


async def fetch_recent_agent_failures(limit: int = 5) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        return await _query_rows(
            client,
            "agent_tasks",
            {
                "select": "agent_name,task_type,error_message,created_at,priority",
                "status": "eq.failed",
                "created_at": f"gte.{since}",
                "order": "created_at.desc",
                "limit": str(limit),
            },
        )


async def fetch_pending_alerts(limit: int = 5) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        return await _query_rows(
            client,
            "system_alerts",
            {
                "select": "severity,title,body,created_at",
                "read": "eq.false",
                "order": "created_at.asc",
                "limit": str(limit),
            },
        )


async def fetch_learning_summary(limit: int = 5) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        return await _query_rows(
            client,
            "agent_knowledge",
            {
                "select": "pattern,confidence,occurrences,outcome,last_seen_at",
                "order": "confidence.desc,last_seen_at.desc",
                "limit": str(limit),
            },
        )


async def fetch_negocios_summary() -> dict[str, Any]:
    """Counts de tenants e subscriptions por status."""
    async with httpx.AsyncClient(timeout=15) as client:
        total, ativos, trial, cancelados, inadimplentes = await asyncio.gather(
            _count_rows(client, "tenants", {"ativo": "eq.true"}),
            _count_rows(client, "subscriptions", {"status": "eq.active"}),
            _count_rows(client, "subscriptions", {"status": "eq.trial"}),
            _count_rows(client, "subscriptions", {"status": "eq.canceled"}),
            _count_rows(client, "subscriptions", {"status": "in.(expired,past_due)"}),
        )
    return {
        "deliverys_ativos": total,
        "assinaturas_ativas": ativos,
        "em_trial": trial,
        "canceladas": cancelados,
        "inadimplentes_vencidas": inadimplentes,
    }


async def fetch_receita_summary(days: int = 7) -> dict[str, Any]:
    """Faturamento dos últimos N dias a partir da tabela orders."""
    async with httpx.AsyncClient(timeout=15) as client:
        since_period = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

        rows_period, rows_today = await asyncio.gather(
            _query_rows(
                client,
                "orders",
                {
                    "select": "total",
                    "status": "neq.cancelado",
                    "created_at": f"gte.{since_period}",
                },
            ),
            _query_rows(
                client,
                "orders",
                {
                    "select": "total",
                    "status": "neq.cancelado",
                    "created_at": f"gte.{today_start}",
                },
            ),
        )

    faturamento_periodo = sum(float(r.get("total") or 0) for r in rows_period)
    faturamento_hoje = sum(float(r.get("total") or 0) for r in rows_today)
    ticket_medio = faturamento_periodo / len(rows_period) if rows_period else 0.0

    return {
        "hoje_total": faturamento_hoje,
        "hoje_pedidos": len(rows_today),
        "periodo_dias": days,
        "periodo_total": faturamento_periodo,
        "periodo_pedidos": len(rows_period),
        "ticket_medio": ticket_medio,
    }


async def fetch_briefings_summary() -> dict[str, Any]:
    """Contagem de onboarding_submissions por status."""
    async with httpx.AsyncClient(timeout=15) as client:
        pendentes, em_producao, concluidos = await asyncio.gather(
            _count_rows(client, "onboarding_submissions", {"status": "eq.pending"}),
            _count_rows(client, "onboarding_submissions", {"status": "eq.in_production"}),
            _count_rows(client, "onboarding_submissions", {"status": "eq.completed"}),
        )
    return {
        "pendentes": pendentes,
        "em_producao": em_producao,
        "concluidos": concluidos,
    }


async def fetch_pagamentos_summary() -> dict[str, Any]:
    """Resumo de cobranças PIX recentes."""
    async with httpx.AsyncClient(timeout=15) as client:
        since_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

        pendentes, pagas_24h, falhas_24h, recentes = await asyncio.gather(
            _count_rows(client, "cobrancas_pix", {"status": "eq.pendente"}),
            _count_rows(client, "cobrancas_pix", {"status": "eq.paga", "confirmada_em": f"gte.{since_24h}"}),
            _count_rows(client, "cobrancas_pix", {"status": "in.(cancelada,expirada)", "created_at": f"gte.{since_24h}"}),
            _query_rows(
                client,
                "cobrancas_pix",
                {
                    "select": "valor,status,created_at",
                    "order": "created_at.desc",
                    "limit": "5",
                },
            ),
        )

    return {
        "pendentes": pendentes,
        "pagas_24h": pagas_24h,
        "falhas_24h": falhas_24h,
        "recentes": recentes,
    }


async def fetch_persisted_incidents(limit: int = 20) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        return await _query_rows(
            client,
            "ops_incidents",
            {
                "select": (
                    "incident_key,category,severity,status,title,summary,first_seen,last_seen,"
                    "occurrences,suppressed_duplicates,notification_count,last_notification_at,resolved_at,metadata"
                ),
                "status": "eq.active",
                "order": "last_seen.desc",
                "limit": str(limit),
            },
        )


async def fetch_incident_state(incident_key: str) -> dict[str, Any] | None:
    if not incident_key:
        return None

    async with httpx.AsyncClient(timeout=15) as client:
        rows = await _query_rows(
            client,
            "ops_incidents",
            {
                "select": (
                    "incident_key,category,severity,status,title,summary,first_seen,last_seen,"
                    "occurrences,suppressed_duplicates,notification_count,last_notification_at,resolved_at,metadata"
                ),
                "incident_key": f"eq.{incident_key}",
                "limit": "1",
            },
        )
    return rows[0] if rows else None


async def dispatch_zaea_incident_task(
    agent_name: str,
    incident_key: str,
    payload: dict[str, Any],
    priority: str = "p1",
    triggered_by: str = "alert",
) -> str | None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None

    task_payload = {
        "agent_name": agent_name,
        "status": "pending",
        "priority": priority,
        "task_type": "incident_response",
        "input": {"incident_key": incident_key, **payload},
        "triggered_by": triggered_by,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/agent_tasks",
            headers=_sb_write_headers("return=representation"),
            json=task_payload,
        )
        if resp.status_code not in (200, 201):
            return None

        rows = resp.json()
        if isinstance(rows, list) and rows:
            return rows[0].get("id")
        if isinstance(rows, dict):
            return rows.get("id")
        return None


async def close_zaea_incident_task(
    task_id: str,
    output: dict[str, Any],
    knowledge: dict[str, Any] | None = None,
    status: str = "completed",
) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return False

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.patch(
            f"{SUPABASE_URL}/rest/v1/agent_tasks",
            params={"id": f"eq.{task_id}"},
            headers=_sb_write_headers(),
            json={
                "status": status,
                "output": output,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        if resp.status_code not in (200, 204):
            return False

        if not knowledge:
            return True

        knowledge_payload = {
            "pattern": knowledge.get("pattern"),
            "root_cause": knowledge.get("rootCause"),
            "solution": knowledge.get("solution"),
            "files_changed": knowledge.get("filesChanged") or [],
            "confidence": knowledge.get("confidence", 60),
            "outcome": knowledge.get("outcome", "success"),
            "last_task_id": task_id,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
        }

        existing = await client.get(
            f"{SUPABASE_URL}/rest/v1/agent_knowledge",
            params={"pattern": f"eq.{knowledge_payload['pattern']}", "select": "id,occurrences"},
            headers=_sb_headers(),
        )
        if existing.status_code != 200:
            return True

        rows = existing.json()
        if isinstance(rows, list) and rows:
            row = rows[0]
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/agent_knowledge",
                params={"id": f"eq.{row['id']}"},
                headers=_sb_write_headers(),
                json={
                    **knowledge_payload,
                    "occurrences": int(row.get("occurrences") or 1) + 1,
                },
            )
            return True

        await client.post(
            f"{SUPABASE_URL}/rest/v1/agent_knowledge",
            headers=_sb_write_headers(),
            json={**knowledge_payload, "occurrences": 1},
        )
        return True


async def persist_incident_state(incident: dict[str, Any]) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return False

    payload = {
        "incident_key": incident["incident_key"],
        "category": incident["category"],
        "severity": incident["severity"],
        "status": incident.get("status", "active"),
        "title": incident["title"],
        "summary": incident["summary"],
        "first_seen": incident["first_seen"],
        "last_seen": incident["last_seen"],
        "occurrences": incident["occurrences"],
        "suppressed_duplicates": incident.get("suppressed_duplicates", 0),
        "notification_count": incident.get("notification_count", 0),
        "last_notification_at": incident.get("last_notification_at"),
        "resolved_at": incident.get("resolved_at"),
        "metadata": incident.get("metadata", {}),
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/ops_incidents",
            params={"on_conflict": "incident_key"},
            headers=_sb_write_headers("resolution=merge-duplicates,return=minimal"),
            json=payload,
        )
        return resp.status_code in (200, 201)


async def resolve_incident_state(
    incident_key: str,
    resolved_at: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return False

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.patch(
            f"{SUPABASE_URL}/rest/v1/ops_incidents",
            params={"incident_key": f"eq.{incident_key}"},
            headers=_sb_write_headers(),
            json={
                "status": "resolved",
                "resolved_at": resolved_at or datetime.now(timezone.utc).isoformat(),
                "metadata": metadata or {},
            },
        )
        return resp.status_code in (200, 204)


async def fetch_runtime_snapshot() -> dict[str, Any]:
    channels = {
        "supabase": bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY),
        "telegram": bool(os.getenv("TELEGRAM_BOT_TOKEN") and os.getenv("TELEGRAM_CHAT_ID")),
        "whatsapp_evolution": bool(os.getenv("EVOLUTION_API_URL") and os.getenv("EVOLUTION_API_KEY")),
        "groq": bool(os.getenv("GROQ_API_KEY")),
        "github_actions": True,
    }

    housekeeping = audit_housekeeping()

    async with httpx.AsyncClient(timeout=15) as client:
        since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        pending_alerts, failed_tasks, escalated_tasks, pending_p0_p1, knowledge_entries = await asyncio.gather(
            _count_rows(client, "system_alerts", {"read": "eq.false"}),
            _count_rows(client, "agent_tasks", {"status": "eq.failed", "created_at": f"gte.{since}"}),
            _count_rows(client, "agent_tasks", {"status": "eq.escalated", "created_at": f"gte.{since}"}),
            _count_rows(
                client,
                "agent_tasks",
                {"status": "eq.pending", "priority": "in.(p0,p1)", "created_at": f"gte.{since}"},
            ),
            _count_rows(client, "agent_knowledge", {}),
        )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "channels": channels,
        "counts": {
            "pending_alerts": pending_alerts,
            "failed_tasks_24h": failed_tasks,
            "escalated_tasks_24h": escalated_tasks,
            "pending_priority_tasks_24h": pending_p0_p1,
            "knowledge_entries": knowledge_entries,
        },
        "housekeeping": housekeeping,
        "auto_housekeeping": {
            "enabled": AUTO_HOUSEKEEPING_ENABLED,
            "interval_seconds": AUTO_HOUSEKEEPING_INTERVAL_SECONDS,
        },
    }


async def housekeeping_loop(
    notifier: Callable[[str, str, str], Awaitable[dict[str, bool]]] | None = None,
) -> None:
    if not AUTO_HOUSEKEEPING_ENABLED:
        print("[ops] Housekeeping automático desativado.")
        return

    print(
        f"[ops] Housekeeping automático iniciado — intervalo: {AUTO_HOUSEKEEPING_INTERVAL_SECONDS}s"
    )
    await asyncio.sleep(120)

    while True:
        try:
            result = execute_housekeeping()
            if result["total_bytes"] > 0:
                print(
                    f"[ops] Housekeeping removeu {result['total_entries']} item(ns) e liberou {result['total_human']}"
                )
                if notifier:
                    await notifier(
                        "Housekeeping automático executado",
                        (
                            f"Itens removidos: {result['total_entries']}\n"
                            f"Espaço liberado: {result['total_human']}\n"
                            "Origem: cache, relatórios e artefatos transitórios"
                        ),
                        "info",
                    )
        except asyncio.CancelledError:
            print("[ops] Housekeeping encerrado.")
            return
        except Exception as exc:
            print(f"[ops] Erro no housekeeping: {exc}")

        await asyncio.sleep(AUTO_HOUSEKEEPING_INTERVAL_SECONDS)