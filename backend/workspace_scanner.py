"""
backend/workspace_scanner.py
MergeForge — Scanner de Workspace

Responsabilidades:
  1. Clonar/atualizar repositório via GitHub App token
  2. Escanear arquivos por categoria (TS, Python, SQL, config)
  3. Detectar problemas: segurança, qualidade, testes, padrões
  4. Retornar relatório estruturado para o code_surgeon agir
"""

from __future__ import annotations

import os
import re
import tempfile
import asyncio
from dataclasses import dataclass, field
from typing import Any
from pathlib import Path

import httpx

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GITHUB_API = "https://api.github.com"

# Extensões analisadas
SCAN_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py", ".sql", ".json", ".mjs"}

# Padrões de risco direto (regex)
SECURITY_PATTERNS = [
    (r"console\.log\(.*(?:password|secret|token|key|auth)", "credencial exposta em console.log"),
    (r"eval\s*\(", "uso de eval() — risco de injection"),
    (r"innerHTML\s*=", "innerHTML direto — risco de XSS"),
    (r"dangerouslySetInnerHTML", "dangerouslySetInnerHTML sem sanitização"),
    (r"Math\.random\(\).*(?:token|secret|key|id)", "Math.random() para geração de tokens — não criptográfico"),
    (r"SELECT \*\s+FROM", "SELECT * — expõe todos os campos"),
    (r"(?:password|senha|secret)\s*=\s*['\"][^'\"]{3,}['\"]", "credencial hardcoded"),
    (r"http://(?!localhost|127\.0\.0\.1)", "URL HTTP sem TLS em produção"),
]

# Padrões de qualidade
QUALITY_PATTERNS = [
    (r"TODO|FIXME|HACK|XXX", "comentário pendente"),
    (r"any\b", "uso de `any` — tipo explícito recomendado"),
    (r"@ts-ignore", "@ts-ignore — supressão de erro TypeScript"),
    (r"eslint-disable", "eslint-disable — supressão de lint"),
    (r"\.catch\s*\(\s*\)", "catch vazio — erro silenciado"),
    (r"setTimeout.*0\b", "setTimeout(fn, 0) — anti-pattern de timing"),
]


@dataclass
class ScanIssue:
    file: str
    line: int
    category: str   # "security" | "quality" | "test" | "pattern"
    severity: str   # "critical" | "warning" | "info"
    message: str
    snippet: str = ""


@dataclass
class ScanReport:
    owner: str
    repo: str
    ref: str
    total_files: int = 0
    issues: list[ScanIssue] = field(default_factory=list)
    summary: str = ""

    @property
    def critical(self) -> list[ScanIssue]:
        return [i for i in self.issues if i.severity == "critical"]

    @property
    def warnings(self) -> list[ScanIssue]:
        return [i for i in self.issues if i.severity == "warning"]

    def to_markdown(self) -> str:
        lines = [
            f"## Relatório MergeForge — `{self.owner}/{self.repo}` @ `{self.ref}`\n",
            f"**Arquivos escaneados:** {self.total_files}  ",
            f"**Críticos:** {len(self.critical)}  ",
            f"**Avisos:** {len(self.warnings)}\n",
        ]
        if self.summary:
            lines += [f"\n### Análise IA\n{self.summary}\n"]
        if self.critical:
            lines.append("\n### Críticos\n")
            for i in self.critical:
                lines.append(f"- **[{i.file}:{i.line}]** {i.message}")
                if i.snippet:
                    lines.append(f"  ```\n  {i.snippet}\n  ```")
        if self.warnings:
            lines.append("\n### Avisos\n")
            for i in self.warnings[:20]:  # limita output
                lines.append(f"- [{i.file}:{i.line}] {i.message}")
        return "\n".join(lines)


# ── Funções principais ────────────────────────────────────────────────────────

async def fetch_repo_tree(owner: str, repo: str, token: str, ref: str = "main") -> list[dict]:
    """Busca árvore completa de arquivos do repositório via API."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{ref}?recursive=1"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url, headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        })
        r.raise_for_status()
        data = r.json()
    return [f for f in data.get("tree", []) if f.get("type") == "blob"]


async def fetch_file_content(owner: str, repo: str, path: str, token: str) -> str:
    """Busca conteúdo de um arquivo via API (base64 decode)."""
    import base64
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        })
        if r.status_code == 200:
            data = r.json()
            if data.get("encoding") == "base64":
                return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return ""


def scan_file_content(filepath: str, content: str) -> list[ScanIssue]:
    """Aplica todos os padrões de scan em um arquivo."""
    issues: list[ScanIssue] = []
    lines = content.splitlines()

    for lineno, line in enumerate(lines, start=1):
        # Segurança
        for pattern, message in SECURITY_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                issues.append(ScanIssue(
                    file=filepath,
                    line=lineno,
                    category="security",
                    severity="critical",
                    message=message,
                    snippet=line.strip()[:120],
                ))
        # Qualidade
        for pattern, message in QUALITY_PATTERNS:
            if re.search(pattern, line):
                issues.append(ScanIssue(
                    file=filepath,
                    line=lineno,
                    category="quality",
                    severity="warning",
                    message=message,
                    snippet=line.strip()[:120],
                ))

    return issues


async def ai_summarize(report: ScanReport) -> str:
    """Usa Groq para gerar análise em linguagem natural do relatório."""
    if not GROQ_API_KEY or not report.issues:
        return ""

    snippet = "\n".join(
        f"- [{i.severity}] {i.file}:{i.line} — {i.message}"
        for i in report.issues[:30]
    )
    prompt = (
        f"Você é um revisor sênior de código. Analise estes problemas encontrados no repositório "
        f"`{report.owner}/{report.repo}` e escreva um resumo executivo em português de 3-4 frases "
        f"destacando os riscos mais críticos e recomendações prioritárias:\n\n{snippet}"
    )

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
                "temperature": 0.3,
            },
        )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"].strip()
    return ""


async def scan_repository(
    owner: str,
    repo: str,
    token: str,
    ref: str = "main",
    max_files: int = 200,
) -> ScanReport:
    """
    Pipeline completo: busca árvore → filtra arquivos relevantes →
    escaneia conteúdo → gera relatório com resumo IA.
    """
    report = ScanReport(owner=owner, repo=repo, ref=ref)

    # 1. Busca árvore
    tree = await fetch_repo_tree(owner, repo, token, ref)

    # 2. Filtra por extensão e exclui node_modules/dist/build
    EXCLUDE = {"node_modules", ".next", "dist", "build", ".git", "__pycache__", ".venv"}
    relevant = [
        f for f in tree
        if Path(f["path"]).suffix in SCAN_EXTENSIONS
        and not any(part in EXCLUDE for part in Path(f["path"]).parts)
    ][:max_files]

    report.total_files = len(relevant)

    # 3. Busca e escaneia arquivos em paralelo (lotes de 10)
    async def scan_one(file_info: dict) -> list[ScanIssue]:
        content = await fetch_file_content(owner, repo, file_info["path"], token)
        if not content:
            return []
        return scan_file_content(file_info["path"], content)

    batch_size = 10
    for i in range(0, len(relevant), batch_size):
        batch = relevant[i:i + batch_size]
        results = await asyncio.gather(*[scan_one(f) for f in batch])
        for issues in results:
            report.issues.extend(issues)

    # 4. Resumo IA
    report.summary = await ai_summarize(report)

    return report
