'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Scan,
  Settings2,
  Shield,
  Stethoscope,
  XCircle,
  Zap,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface AgentTask {
  id: string
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'escalated'
  priority: 'p0' | 'p1' | 'p2'
  task_type: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  error_message: string | null
  github_pr_url: string | null
  triggered_by: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

interface AgentKnowledge {
  id: string
  pattern: string
  root_cause: string | null
  solution: string | null
  confidence: number
  outcome: string | null
  occurrences: number
  last_seen_at: string
}

interface TaskStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
  escalated: number
}

// ── Config dos agentes ────────────────────────────────────────────────────────
const AGENT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; desc: string }
> = {
  scanner: {
    label: 'Scanner',
    icon: Scan,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    desc: 'Detecta erros de tipos e lint',
  },
  surgeon: {
    label: 'Surgeon',
    icon: Stethoscope,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    desc: 'Gera e aplica correções automáticas',
  },
  validator: {
    label: 'Validator',
    icon: CheckCircle,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    desc: 'Health checks operacionais de rotas, banco e pagamentos',
  },
  zai: {
    label: 'Zai IA',
    icon: BrainCircuit,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    desc: 'Análise de intenção e diagnóstico',
  },
  sentinel: {
    label: 'Sentinel',
    icon: Shield,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    desc: 'Monitora o ecossistema e centraliza alertas no Telegram',
  },
  orchestrator: {
    label: 'Orchestrator',
    icon: Settings2,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    desc: 'Coordena todos os agentes',
  },
}

// ── Config de status ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Pendente' },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Rodando' },
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Concluído',
  },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Falhou' },
  escalated: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    label: 'Escalado',
  },
} as const

const PRIORITY_LABELS = { p0: '🔴 P0', p1: '🟡 P1', p2: '🟢 P2' } as const

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminAgentesPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [knowledge, setKnowledge] = useState<AgentKnowledge[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanding, setExpanding] = useState<string | null>(null)
  const [filterAgent, setFilterAgent] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [hoursBack, setHoursBack] = useState(24)
  const [tab, setTab] = useState<'tasks' | 'knowledge'>('tasks')

  const loadData = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterAgent) params.set('agent', filterAgent)
    if (filterStatus) params.set('status', filterStatus)
    params.set('hours', String(hoursBack))
    params.set('knowledge', 'typescript error')

    const res = await fetch(`/api/admin/agents?${params}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setTasks(data.tasks ?? [])
    setKnowledge(data.knowledge ?? [])
    setStats(data.stats ?? null)
    setLoading(false)
  }, [filterAgent, filterStatus, hoursBack])

  useEffect(() => {
    const timeout = setTimeout(() => void loadData(), 0)
    const interval = setInterval(() => void loadData(), 30_000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [loadData])

  // Agrupa tarefas por agente para os cards de saúde
  const agentHealth = Object.keys(AGENT_CONFIG).map((agentName) => {
    const agentTasks = tasks.filter((t) => t.agent_name === agentName)
    const latest = agentTasks[0] ?? null
    return { name: agentName, tasks: agentTasks, latest }
  })

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Bot className="h-7 w-7 text-purple-400" />
            ZAEA — Sistema de Agentes
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Autonomous Engineering Agent · atualiza a cada 30s
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            void loadData()
          }}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {(['pending', 'running', 'completed', 'failed', 'escalated'] as const).map((s) => {
            const cfg = STATUS_CONFIG[s]
            const Icon = cfg.icon
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  filterStatus === s
                    ? 'border-zinc-500 bg-zinc-700'
                    : 'border-zinc-700/50 bg-zinc-800/60 hover:bg-zinc-800'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${cfg.color} ${s === 'running' ? 'animate-spin' : ''}`}
                />
                <div>
                  <div className="text-xl font-bold text-white">{stats[s]}</div>
                  <div className="text-xs text-zinc-500">{cfg.label}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Agent health cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {agentHealth.map(({ name, tasks: agentTasks, latest }) => {
          const cfg = AGENT_CONFIG[name]
          const Icon = cfg.icon
          const lastStatus = latest?.status
          const statusCfg = lastStatus ? STATUS_CONFIG[lastStatus] : null
          const StatusIcon = statusCfg?.icon ?? Activity

          return (
            <button
              key={name}
              onClick={() => setFilterAgent(filterAgent === name ? '' : name)}
              className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                filterAgent === name
                  ? 'border-zinc-500 bg-zinc-700'
                  : 'border-zinc-700/50 bg-zinc-800/60 hover:bg-zinc-800'
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg}`}>
                <Icon className={`h-5 w-5 ${cfg.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{cfg.label}</div>
                <div className="text-xs text-zinc-500">{agentTasks.length} tasks</div>
              </div>
              {statusCfg && (
                <div className={`flex items-center gap-1 text-xs ${statusCfg.color}`}>
                  <StatusIcon
                    className={`h-3 w-3 ${lastStatus === 'running' ? 'animate-spin' : ''}`}
                  />
                  {statusCfg.label}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-700">
        <button
          onClick={() => setTab('tasks')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            tab === 'tasks'
              ? 'border-b-2 border-purple-400 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Activity className="h-4 w-4" />
          Tarefas
          {stats && stats.total > 0 && (
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs">{stats.total}</span>
          )}
        </button>
        <button
          onClick={() => setTab('knowledge')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            tab === 'knowledge'
              ? 'border-b-2 border-purple-400 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Base de Conhecimento
          {knowledge.length > 0 && (
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs">{knowledge.length}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={hoursBack}
          onChange={(e) => setHoursBack(Number(e.target.value))}
          aria-label="Período de exibição das tarefas dos agentes"
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
        >
          <option value={1}>Última 1h</option>
          <option value={6}>Últimas 6h</option>
          <option value={24}>Últimas 24h</option>
          <option value={72}>Últimas 72h</option>
          <option value={168}>Última semana</option>
        </select>

        {filterAgent && (
          <button
            onClick={() => setFilterAgent('')}
            className="flex items-center gap-1 rounded-lg border border-purple-600/40 bg-purple-500/10 px-3 py-2 text-xs text-purple-300"
          >
            Agente: {AGENT_CONFIG[filterAgent]?.label ?? filterAgent}
            <XCircle className="h-3 w-3" />
          </button>
        )}
        {filterStatus && (
          <button
            onClick={() => setFilterStatus('')}
            className="flex items-center gap-1 rounded-lg border border-zinc-600/40 bg-zinc-500/10 px-3 py-2 text-xs text-zinc-300"
          >
            Status: {STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label}
            <XCircle className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : tab === 'tasks' ? (
        <TaskList tasks={tasks} expanding={expanding} setExpanding={setExpanding} />
      ) : (
        <KnowledgeList knowledge={knowledge} />
      )}
    </div>
  )
}

// ── TaskList ──────────────────────────────────────────────────────────────────
function TaskList({
  tasks,
  expanding,
  setExpanding,
}: {
  tasks: AgentTask[]
  expanding: string | null
  setExpanding: (id: string | null) => void
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 py-16 text-center">
        <Bot className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-zinc-500">Nenhuma tarefa encontrada no período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const agentCfg = AGENT_CONFIG[task.agent_name]
        const statusCfg = STATUS_CONFIG[task.status]
        const AgentIcon = agentCfg?.icon ?? Bot
        const StatusIcon = statusCfg.icon
        const isOpen = expanding === task.id

        return (
          <div
            key={task.id}
            className="overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-800/60"
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <button
                onClick={() => setExpanding(isOpen ? null : task.id)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                {/* Agent icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${agentCfg?.bg ?? 'bg-zinc-700'}`}
                >
                  <AgentIcon className={`h-4 w-4 ${agentCfg?.color ?? 'text-zinc-400'}`} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {agentCfg?.label ?? task.agent_name}
                    </span>
                    <span className="text-xs text-zinc-500">{task.task_type}</span>
                    <span className="text-xs text-zinc-600">{PRIORITY_LABELS[task.priority]}</span>
                    {task.triggered_by && (
                      <span className="text-xs text-zinc-600">via {task.triggered_by}</span>
                    )}
                  </div>
                  {task.error_message && (
                    <p className="mt-0.5 truncate text-xs text-red-400">{task.error_message}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className={`flex items-center gap-1 text-xs ${statusCfg.color}`}>
                    <StatusIcon
                      className={`h-3.5 w-3.5 ${task.status === 'running' ? 'animate-spin' : ''}`}
                    />
                    {statusCfg.label}
                  </div>
                  <span className="text-xs text-zinc-600">{timeAgo(task.created_at)}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {task.github_pr_url && (
                <a
                  href={task.github_pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-600/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20"
                >
                  <GitPullRequest className="h-3 w-3" />
                  PR
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="space-y-3 border-t border-zinc-700/50 px-5 py-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="mb-1 text-zinc-500">ID</p>
                    <p className="font-mono text-zinc-300">{task.id}</p>
                  </div>
                  {task.started_at && (
                    <div>
                      <p className="mb-1 text-zinc-500">Iniciado</p>
                      <p className="text-zinc-300">
                        {new Date(task.started_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {task.completed_at && (
                    <div>
                      <p className="mb-1 text-zinc-500">Concluído</p>
                      <p className="text-zinc-300">
                        {new Date(task.completed_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
                {Object.keys(task.input).length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-zinc-500">Input</p>
                    <pre className="max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs whitespace-pre-wrap text-zinc-300">
                      {JSON.stringify(task.input, null, 2)}
                    </pre>
                  </div>
                )}
                {Object.keys(task.output).length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-zinc-500">Output</p>
                    <pre className="max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs whitespace-pre-wrap text-zinc-300">
                      {JSON.stringify(task.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── KnowledgeList ─────────────────────────────────────────────────────────────
function KnowledgeList({ knowledge }: { knowledge: AgentKnowledge[] }) {
  const OUTCOME_CONFIG = {
    success: { color: 'text-emerald-400', label: '✅ Sucesso' },
    failed: { color: 'text-red-400', label: '❌ Falhou' },
    escalated: { color: 'text-yellow-400', label: '⚠️ Escalado' },
    partial: { color: 'text-blue-400', label: '⚡ Parcial' },
  }

  if (knowledge.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 py-16 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-zinc-500">Base de conhecimento vazia.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Os agentes aprenderão com cada tarefa executada.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {knowledge.map((k) => {
        const outcome = k.outcome ? OUTCOME_CONFIG[k.outcome as keyof typeof OUTCOME_CONFIG] : null

        return (
          <div
            key={k.id}
            className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Zap className="h-4 w-4 shrink-0 text-yellow-400" />
                  <span className="text-sm font-medium text-white">{k.pattern}</span>
                  {outcome && <span className={`text-xs ${outcome.color}`}>{outcome.label}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
                <span>{k.occurrences}x</span>
                <div className="flex items-center gap-1" title={`Confiança: ${k.confidence}%`}>
                  <progress
                    className="h-1.5 w-16 overflow-hidden rounded-full [&::-moz-progress-bar]:bg-purple-400 [&::-webkit-progress-bar]:bg-zinc-700 [&::-webkit-progress-value]:bg-purple-400"
                    max={100}
                    value={k.confidence}
                    aria-label={`Confiança ${k.confidence}%`}
                  />
                  <span>{k.confidence}%</span>
                </div>
                <span>{timeAgo(k.last_seen_at)}</span>
              </div>
            </div>
            {k.root_cause && (
              <div>
                <p className="mb-1 text-xs text-zinc-500">Causa raiz</p>
                <p className="text-xs text-zinc-300">{k.root_cause}</p>
              </div>
            )}
            {k.solution && (
              <div>
                <p className="mb-1 text-xs text-zinc-500">Solução</p>
                <p className="text-xs text-zinc-300">{k.solution}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
