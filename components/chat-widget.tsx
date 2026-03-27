'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  X,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequestContext {
  restaurantSlug?: string
}

const GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Oi! Sou o Cadu, assistente IA da Zairyx. Posso te ajudar a:\n\n• Encontrar o plano ideal para seu negócio\n• Mostrar como funciona na prática\n• Tirar dúvidas técnicas ou de preço\n\nMe conta: qual é o seu tipo de negócio? 😊',
}

interface QuickReplyCategory {
  label: string
  questions: string[]
}

const QUICK_REPLY_CATEGORIES: QuickReplyCategory[] = [
  {
    label: '💰 Preços',
    questions: ['Quanto custa?', 'Tem período de teste?', 'Tem desconto para rede?'],
  },
  {
    label: '🚀 Como funciona',
    questions: ['Como funciona?', 'Preciso de programador?', 'Como recebo pedidos?'],
  },
  {
    label: '📦 Produto',
    questions: ['Quero ver templates', 'Aceita iFood junto?', 'Quero começar'],
  },
]

const ALL_QUICK_QUESTIONS = QUICK_REPLY_CATEGORIES.flatMap((c) => c.questions)

const ESCALATION_KEYWORDS = [
  'falar com humano',
  'atendente',
  'pessoa real',
  'suporte humano',
  'não entendi',
  'não ajudou',
  'falar com alguém',
  'atendimento humano',
  'reclamação',
  'problema sério',
]

const ESCALATION_THRESHOLD = 6
const WHATSAPP_NUMBER = '5512996887993'

const CHAT_CONFIG = {
  greeting: GREETING,
  endpoint: '/api/chat',
  quickQuestions: ALL_QUICK_QUESTIONS,
  title: 'Cadu — Zairyx',
  subtitle: 'Online agora',
  Icon: Bot,
}

function buildClientRecoveryMessage() {
  return 'Opa, voltei! Me conta sobre o seu negócio que te ajudo com preço, template ideal, como funciona o painel... o que você precisar 😊'
}

function getChatRequestContext(): ChatRequestContext | null {
  if (typeof window === 'undefined') return null

  const match = window.location.pathname.match(/^\/r\/([^/]+)/i)
  if (!match?.[1]) return null

  return { restaurantSlug: decodeURIComponent(match[1]) }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([CHAT_CONFIG.greeting])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(1)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userMessageCount = useRef(0)

  useEffect(() => {
    setMessages([CHAT_CONFIG.greeting])
    setInput('')
    setLoading(false)
    setUnread(1)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setUnread(0)
      window.setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function submitMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMsg]

    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    userMessageCount.current += 1

    // Verificar se deve oferecer escalation
    const lowerText = trimmed.toLowerCase()
    const hasKeyword = ESCALATION_KEYWORDS.some((kw) => lowerText.includes(kw))
    if (hasKeyword || userMessageCount.current >= ESCALATION_THRESHOLD) {
      setShowEscalation(true)
    }

    try {
      const res = await fetch(CHAT_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.filter((message, index) => {
            return message.role !== 'assistant' || index > 0
          }),
          context: getChatRequestContext(),
        }),
      })

      let data: { reply?: string } = {}

      try {
        data = await res.json()
      } catch {
        data = {}
      }

      const reply: Message = {
        role: 'assistant',
        content: data.reply?.trim() || buildClientRecoveryMessage(),
      }

      setMessages((prev) => [...prev, reply])

      if (!open) {
        setUnread((current) => current + 1)
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: buildClientRecoveryMessage() }])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    await submitMessage(input)
  }

  function handleKey(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageIndex(index)
      window.setTimeout(() => {
        setCopiedMessageIndex((current) => (current === index ? null : current))
      }, 2000)
    } catch {
      setCopiedMessageIndex(null)
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEscalateToHuman = useCallback(() => {
    const lastUserMessages = messages
      .filter((m) => m.role === 'user')
      .slice(-3)
      .map((m) => m.content)
      .join(' | ')

    const contextText = encodeURIComponent(
      `Oi! Vim do chat da Zairyx e preciso de ajuda humana.\n\nÚltimas dúvidas: ${lastUserMessages}`
    )

    window.open(
      `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${contextText}`,
      '_blank',
      'noopener,noreferrer'
    )

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          '✅ Abrindo conversa com nossa equipe no WhatsApp! Um humano vai continuar te ajudando por lá. 😊',
      },
    ])
    setShowEscalation(false)
  }, [messages])

  return (
    <>
      {open && (
        <div className="fixed right-4 bottom-24 z-50 flex h-130 w-90 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-linear-to-r from-orange-500 to-orange-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <CHAT_CONFIG.Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{CHAT_CONFIG.title}</p>
                <p className="flex items-center gap-1 text-xs text-orange-100">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                  {CHAT_CONFIG.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fechar chat"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 border-b border-amber-100 bg-amber-50 px-3 py-1.5">
            <span className="text-amber-500" aria-hidden>
              ⚠️
            </span>
            <p className="text-[10px] leading-tight text-amber-700">
              Assistente de IA — as respostas são geradas automaticamente e podem conter
              imprecisões.
            </p>
          </div>

          {showEscalation && (
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-xs text-blue-700">Prefere falar com um humano?</p>
              <button
                type="button"
                onClick={handleEscalateToHuman}
                className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-600"
              >
                <Phone className="h-3 w-3" />
                WhatsApp
              </button>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <CHAT_CONFIG.Icon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-orange-500 text-white'
                      : 'rounded-bl-sm border border-zinc-100 bg-white text-zinc-800 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.content, index)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-orange-200 px-2 py-1 text-[11px] font-medium text-orange-600 transition-colors hover:bg-orange-50"
                    >
                      {copiedMessageIndex === index ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar resposta
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500">
                  <CHAT_CONFIG.Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <p className="border-t border-zinc-100 bg-zinc-50 px-3 py-1 text-center text-[9px] text-zinc-500">
            Respostas geradas por IA — em caso de dúvida, fale com nossa equipe.
          </p>

          <div className="flex flex-col gap-1.5 border-t border-zinc-100 bg-white px-3 py-2">
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1">
                {QUICK_REPLY_CATEGORIES.map((cat) => (
                  <span key={cat.label} className="text-[10px] font-semibold text-zinc-400">
                    {cat.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {(messages.length <= 1
                ? QUICK_REPLY_CATEGORIES.flatMap((c) => c.questions).slice(0, 6)
                : CHAT_CONFIG.quickQuestions.slice(0, 4)
              ).map((question) => (
                <button
                  key={question}
                  onClick={() => void submitMessage(question)}
                  className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-100"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-100 bg-white px-3 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKey}
              placeholder="Digite sua dúvida..."
              maxLength={500}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-800 placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      <div className="fixed right-4 bottom-5 z-50 flex items-center gap-3">
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-lg shadow-zinc-900/10 transition-all hover:-translate-y-0.5 hover:bg-orange-50"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={() => setOpen((value) => !value)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transition-all hover:scale-110 hover:bg-orange-600 active:scale-95"
          aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unread}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  )
}
