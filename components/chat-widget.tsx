'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Loader2,
  ChevronDown,
  GraduationCap,
  Copy,
  Check,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Oi! Sou o Cadu, assistente do Cardápio Digital. Você tem restaurante, pizzaria, hamburgueria ou delivery? Me conta o seu negócio que te mostro como a gente pode te ajudar a vender mais! 🚀',
}

const AFFILIATE_GREETING: Message = {
  role: 'assistant',
  content:
    'Olá! Sou o Professor Nilo da Zairyx. Posso te ensinar como abordar operações de delivery, explicar comissões, subir de nível e transformar indicação em carteira recorrente. Qual parte do programa você quer dominar primeiro?',
}

const QUICK_QUESTIONS = [
  'Quanto custa?',
  'Como funciona?',
  'Tem período de teste?',
  'Preciso de programador?',
  'Aceita iFood junto?',
  'Como recebo pedidos?',
  'Quero ver templates',
  'Quero começar',
]

const AFFILIATE_QUICK_QUESTIONS = [
  'Como funciona o programa?',
  'Quanto ganho por cliente?',
  'Quando recebo?',
  'Como viro líder?',
  'Como abordar deliveries?',
  'Me dê um script de WhatsApp',
  'Modo copiar script',
  'Como subir de nível?',
  'Quero começar como afiliado',
]

function buildClientRecoveryMessage(isAffiliatePage: boolean) {
  if (isAffiliatePage) {
    return 'Professor Nilo vai seguir no modo direto: me diga se você quer comissão, pagamento, tiers, liderança, script de prospecção ou abordagem por perfil.'
  }

  return 'Cadu vai seguir no modo direto: me diga seu nicho e eu respondo com preço exato, template ideal, prazo de publicação ou formas de pagamento.'
}

export function ChatWidget() {
  const pathname = usePathname()
  const isAffiliatePage = pathname?.startsWith('/afiliados') ?? false
  const config = isAffiliatePage
    ? {
        greeting: AFFILIATE_GREETING,
        endpoint: '/api/chat/afiliados',
        quickQuestions: AFFILIATE_QUICK_QUESTIONS,
        title: 'Professor Nilo',
        subtitle: 'Mentor de afiliados',
        Icon: GraduationCap,
      }
    : {
        greeting: GREETING,
        endpoint: '/api/chat',
        quickQuestions: QUICK_QUESTIONS,
        title: 'Cadu — Cardápio Digital',
        subtitle: 'Online agora',
        Icon: Bot,
      }
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([config.greeting])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(1)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([config.greeting])
    setInput('')
    setLoading(false)
    setUnread(1)
  }, [config.greeting])

  async function submitMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter((m) => m.role !== 'assistant' || next.indexOf(m) > 0),
        }),
      })

      let data: { reply?: string } = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      const recoveryMessage = buildClientRecoveryMessage(isAffiliatePage)

      const reply: Message = {
        role: 'assistant',
        content: data.reply?.trim() || recoveryMessage,
      }
      setMessages((prev) => [...prev, reply])
      if (!open) setUnread((u) => u + 1)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: buildClientRecoveryMessage(isAffiliatePage) },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Scroll para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Foca o input ao abrir
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  async function sendMessage() {
    await submitMessage(input)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageIndex(index)
      window.setTimeout(
        () => setCopiedMessageIndex((current) => (current === index ? null : current)),
        2000
      )
    } catch {
      setCopiedMessageIndex(null)
    }
  }

  return (
    <>
      {/* Janela do chat */}
      {open && (
        <div className="fixed right-4 bottom-24 z-50 flex h-130 w-90 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-linear-to-r from-orange-500 to-orange-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <config.Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{config.title}</p>
                <p className="flex items-center gap-1 text-xs text-orange-100">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                  {config.subtitle}
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

          {/* Aviso IA */}
          <div className="flex items-center gap-1.5 border-b border-amber-100 bg-amber-50 px-3 py-1.5">
            <span className="text-amber-500" aria-hidden>
              ⚠️
            </span>
            <p className="text-[10px] leading-tight text-amber-700">
              Assistente de IA — as respostas são geradas automaticamente e podem conter
              imprecisões.
            </p>
          </div>

          {/* Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <config.Icon className="h-4 w-4 text-white" />
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
                  {isAffiliatePage && msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.content, i)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-orange-200 px-2 py-1 text-[11px] font-medium text-orange-600 transition-colors hover:bg-orange-50"
                    >
                      {copiedMessageIndex === i ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar script
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
                  <config.Icon className="h-4 w-4 text-white" />
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

          {/* Disclaimer rodapé */}
          <p className="border-t border-zinc-100 bg-zinc-50 px-3 py-1 text-center text-[9px] text-zinc-400">
            Respostas geradas por IA — em caso de dúvida, fale com nossa equipe.
          </p>

          {/* Atalhos rápidos */}
          <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 bg-white px-3 py-2">
            {config.quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => submitMessage(q)}
                className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-100"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-zinc-100 bg-white px-3 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Digite sua dúvida..."
              maxLength={500}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
            />
            <button
              onClick={sendMessage}
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

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transition-all hover:scale-110 hover:bg-orange-600 active:scale-95"
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
    </>
  )
}
