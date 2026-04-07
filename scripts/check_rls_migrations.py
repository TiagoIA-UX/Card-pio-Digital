#!/usr/bin/env python3
"""
scripts/check_rls_migrations.py
CI Security Linter — verifica migrations por patterns inseguros de RLS.

Exit codes:
  0 = sem problemas
  1 = falhas críticas encontradas (bloqueia CI)

Executado pelo job security-lint no zaea.yml.
"""

import re
import sys
from pathlib import Path

# ── Padrões perigosos ─────────────────────────────────────────────────────────

# USING(true) ou WITH CHECK(true) sem TO role → acesso público irrestrito
# Detecta: `USING (true)` ou `USING(true)` sem uma linha `TO role` próxima
PATTERN_PERMISSIVE_NO_ROLE = re.compile(
    r"CREATE\s+POLICY\b[^;]*?\bUSING\s*\(\s*true\s*\)[^;]*?;",
    re.IGNORECASE | re.DOTALL,
)

# FOR ALL sem TO role → aplica para public (perigoso)
PATTERN_FOR_ALL_NO_ROLE = re.compile(
    r"CREATE\s+POLICY\b[^;]*?\bFOR\s+ALL\b(?!.*?\bTO\s+\w)[^;]*?;",
    re.IGNORECASE | re.DOTALL,
)

# Tabelas críticas sem ENABLE ROW LEVEL SECURITY
FINANCIAL_TABLES = {
    "cobrancas_pix",
    "subscriptions",
    "orders",
    "order_items",
    "financial_ledger",
    "payouts",
}
PATTERN_CREATE_TABLE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)",
    re.IGNORECASE,
)
PATTERN_ENABLE_RLS = re.compile(
    r"ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY",
    re.IGNORECASE,
)


def check_file(path: Path) -> list[dict]:
    issues = []
    content = path.read_text(encoding="utf-8")

    # 1. Detectar CREATE POLICY com USING(true) sem TO role
    for m in PATTERN_PERMISSIVE_NO_ROLE.finditer(content):
        policy_block = m.group(0)
        if "TO " not in policy_block.upper():
            line = content[: m.start()].count("\n") + 1
            issues.append({
                "file": str(path),
                "line": line,
                "severity": "CRITICAL",
                "rule": "permissive-no-role",
                "detail": f"USING(true) sem TO role — acesso público irrestrito",
                "snippet": policy_block.strip()[:120],
            })

    # 2. Detectar criação de tabelas financeiras sem ENABLE RLS na mesma migration
    tables_created = set(PATTERN_CREATE_TABLE.findall(content))
    tables_with_rls = set(PATTERN_ENABLE_RLS.findall(content))

    for tbl in tables_created:
        tbl_lower = tbl.lower()
        if tbl_lower in FINANCIAL_TABLES and tbl_lower not in {
            t.lower() for t in tables_with_rls
        }:
            issues.append({
                "file": str(path),
                "line": None,
                "severity": "WARNING",
                "rule": "financial-table-no-rls",
                "detail": f"Tabela financeira '{tbl}' criada sem ENABLE ROW LEVEL SECURITY na mesma migration",
                "snippet": "",
            })

    return issues


def main() -> int:
    migrations_dir = Path(__file__).parent.parent / "supabase" / "migrations"
    if not migrations_dir.exists():
        print(f"[check_rls] AVISO: diretório {migrations_dir} não encontrado. Pulando.")
        return 0

    # Pegar apenas arquivos novos se CHANGED_FILES env var estiver definida
    import os
    changed_env = os.getenv("CHANGED_SQL_FILES", "")
    if changed_env.strip():
        files = [Path(p.strip()) for p in changed_env.split("\n") if p.strip().endswith(".sql")]
    else:
        files = sorted(migrations_dir.glob("*.sql"))

    all_issues: list[dict] = []
    for f in files:
        if f.exists():
            all_issues.extend(check_file(f))

    criticals = [i for i in all_issues if i["severity"] == "CRITICAL"]
    warnings = [i for i in all_issues if i["severity"] == "WARNING"]

    if not all_issues:
        print("[check_rls] ✅ Nenhum problema de segurança RLS encontrado.")
        return 0

    print(f"\n[check_rls] {'=' * 60}")
    print(f"[check_rls] RLS Security Linter — {len(all_issues)} problema(s) encontrado(s)")
    print(f"[check_rls] {'=' * 60}\n")

    for issue in all_issues:
        icon = "🔴" if issue["severity"] == "CRITICAL" else "🟡"
        line_info = f":L{issue['line']}" if issue["line"] else ""
        print(f"{icon} [{issue['severity']}] {issue['file']}{line_info}")
        print(f"   Regra : {issue['rule']}")
        print(f"   Detalhe: {issue['detail']}")
        if issue["snippet"]:
            print(f"   Trecho : {issue['snippet']!r}")
        print()

    if criticals:
        print(f"[check_rls] ❌ {len(criticals)} problema(s) CRÍTICO(s) — CI bloqueado.")
        print("[check_rls] Corrija adicionando TO service_role (ou outra role específica) às policies.")
        print("[check_rls] Veja docs/MIGRATIONS_GOVERNANCE.md para referência.")
        return 1

    if warnings:
        print(f"[check_rls] ⚠️  {len(warnings)} aviso(s). CI não bloqueado, mas revise antes do merge.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
