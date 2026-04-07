'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  MessageCircle,
  Send,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import {
  resolveChatPageContext,
  type ChatPageType,
} from '@/lib/domains/marketing/chat-page-context'

interface CartItem {
  name: string
  price: number
  qty: number
  obs?: string
}

type CartAction =
  | { type: 'add'; name: string; price: number; qty: number }
  | { type: 'remove'; name: string }
  | { type: 'clear' }

const ACTION_REGEX =
  /\[ADD_ITEM\|([^|]+)\|([^|]+)\|([^\]]+)\]|\[REMOVE_ITEM\|([^\]]+)\]|\[CLEAR_CART\]/g

function parseActionsFromReply(reply: string): { text: string; actions: CartAction[] } {
  const actions: CartAction[] = []
  let match: RegExpExecArray | null

  while ((match = ACTION_REGEX.exec(reply)) !== null) {
    if (match[1]) {
      const price = parseFloat(match[2])
      const qty = parseInt(match[3], 10)
      if (Number.isFinite(price) && Number.isFinite(qty) && qty > 0) {
        actions.push({ type: 'add', name: match[1].trim(), price, qty })
      }
    } else if (match[4]) {
      actions.push({ type: 'remove', name: match[4].trim() })
    } else {
      actions.push({ type: 'clear' })
    }
  }

  // Reset regex lastIndex for next call
  ACTION_REGEX.lastIndex = 0

  const text = reply.replace(ACTION_REGEX, '').replace(/\n+$/, '').trim()

  // Reset again after second use
  ACTION_REGEX.lastIndex = 0

  return { text, actions }
}

function applyCartActions(currentCart: CartItem[], actions: CartAction[]): CartItem[] {
  let cart = [...currentCart]

  for (const action of actions) {
    if (action.type === 'clear') {
      cart = []
    } else if (action.type === 'remove') {
      cart = cart.filter((item) => item.name.toLowerCase() !== action.name.toLowerCase())
    } else if (action.type === 'add') {
      const existing = cart.find((item) => item.name.toLowerCase() === action.name.toLowerCase())
      if (existing) {
        existing.qty += action.qty
      } else {
        cart.push({ name: action.name, price: action.price, qty: action.qty })
      }
    }
  }

  return cart
}

function formatCartWhatsAppMessage(cart: CartItem[], restaurantName?: string): string {
  const lines: string[] = []
  lines.push(`🛒 *Pedido via Cardápio Digital*${restaurantName ? ` — ${restaurantName}` : ''}`)
  lines.push('')

  let total = 0
  for (const item of cart) {
    const subtotal = item.price * item.qty
    total += subtotal
    lines.push(
      `• ${item.qty}x ${item.name} — ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${item.obs ? ` _(${item.obs})_` : ''}`
    )
  }

  lines.push('')
  lines.push(`💰 *Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`)
  return lines.join('\n')
}

function formatWhatsAppPhone(phone: string): string {
  let numero = phone.replace(/\D/g, '')
  if (numero.startsWith('00')) numero = numero.slice(2)
  if (numero.startsWith('55')) numero = numero.slice(2)
  if (numero.startsWith('0')) numero = numero.slice(1)
  if (numero.length > 11) numero = numero.slice(-11)
  return `55${numero}`
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const DEMO_GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Olá! Sou a Zai, sua guia nesta demonstração. Clique em qualquer elemento do editor para editar ao vivo — foto, nome, preço, categoria e muito mais! Me pergunte o que quiser. 😊',
}

const MARKETING_GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Oi! Sou a Zai, assistente IA da Zairyx. Posso te ajudar a:\n\n• Encontrar o plano ideal para seu negócio\n• Mostrar como funciona na prática\n• Tirar dúvidas técnicas ou de preço\n\nMe conta: qual é o seu tipo de negócio? 😊',
}

const PANEL_GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Oi! Sou o assistente do painel. Posso te ajudar a editar seu canal digital, cadastrar produtos, ajustar categorias, QR Code, pedidos e configurações. Me diga onde você travou que eu te passo o caminho mais curto.',
}

const DELIVERY_GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Olá! Sou a Zai, assistente deste delivery. Posso te ajudar a:\n\n• Encontrar produtos no cardápio\n• Tirar dúvidas sobre preços e entrega\n• Sugerir combos e promoções\n\nO que você gostaria de pedir? 😊',
}

const TEMPLATE_PREVIEW_GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Oi! Estou vendo este template com você. Posso explicar para qual tipo de negócio ele serve, o que já vem pronto, como ele vende melhor e qual plano faz mais sentido. Me diga o que você quer entender. 😊',
}

const CHECKOUT_GREETING: Message = {
  role: 'assistant',
  content:
    '👋 Oi! Estou com você nesta compra. Posso explicar a diferença entre os planos, o que está incluso no setup, formas de pagamento e próximos passos da ativação. O que você quer confirmar? 😊',
}

interface QuickReplyCategory {
  label: string
  questions: string[]
}

const DEMO_QUICK_REPLY_CATEGORIES: QuickReplyCategory[] = [
  {
    label: '✏️ Editor',
    questions: [
      'Como troco a foto do produto?',
      'Como edito o nome e o preço?',
      'Como adiciono uma categoria?',
    ],
  },
  {
    label: '🚀 Publicar',
    questions: ['Isso fica salvo?', 'Como publico de verdade?', 'Quanto custa o plano?'],
  },
  {
    label: '🎨 Visual',
    questions: ['Como troco as cores?', 'Como troco o banner?', 'Posso usar meu próprio logo?'],
  },
]

const MARKETING_QUICK_REPLY_CATEGORIES: QuickReplyCategory[] = [
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

const PANEL_QUICK_REPLY_CATEGORIES: QuickReplyCategory[] = [
  {
    label: '🛠️ Painel',
    questions: [
      'Como editar meu canal digital?',
      'Onde cadastro produtos?',
      'Como ajustar categorias?',
    ],
  },
  {
    label: '📲 Operação',
    questions: ['Como abrir meu link?', 'Como gerar QR Code?', 'Onde vejo os pedidos?'],
  },
  {
    label: '⚙️ Configurações',
    questions: [
      'Como trocar logo e banner?',
      'Como ativar a IA do meu delivery?',
      'Onde altero horário e entrega?',
    ],
  },
]

const DELIVERY_QUICK_REPLY_CATEGORIES: QuickReplyCategory[] = [
  {
    label: '🍽️ Cardápio',
    questions: ['O que tem no cardápio?', 'Qual o mais pedido?', 'Tem promoção?'],
  },
  {
    label: '🛵 Entrega',
    questions: ['Qual o tempo de entrega?', 'Tem pedido mínimo?', 'Vocês estão abertos?'],
  },
  {
    label: '💡 Sugestões',
    questions: ['Me sugira um combo', 'Quero algo diferente', 'O que combina com...'],
  },
]

type ChatRuntimeConfig = {
  greeting: Message
  endpoint: string
  quickQuestions: string[]
  quickReplyCategories: QuickReplyCategory[]
  title: string
  subtitle: string
  Icon: typeof Bot
  pageType: ChatPageType
}

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

function getChatConfig(pathname: string | null): ChatRuntimeConfig {
  const pageContext = resolveChatPageContext(pathname)

  if (pageContext?.pageType === 'delivery') {
    return {
      greeting: DELIVERY_GREETING,
      endpoint: '/api/chat',
      quickQuestions: DELIVERY_QUICK_REPLY_CATEGORIES.flatMap((category) => category.questions),
      quickReplyCategories: DELIVERY_QUICK_REPLY_CATEGORIES,
      title: 'Zai — Atendente IA',
      subtitle: 'Online agora',
      Icon: Bot,
      pageType: 'delivery',
    }
  }

  if (pageContext?.pageType === 'template-preview') {
    return {
      greeting: TEMPLATE_PREVIEW_GREETING,
      endpoint: '/api/chat',
      quickQuestions: [
        'Esse template serve para qual negócio?',
        'O que já vem pronto nesse template?',
        'Qual plano faz mais sentido para esse template?',
      ],
      quickReplyCategories: [
        {
          label: '🧩 Template',
          questions: [
            'Esse template serve para qual negócio?',
            'O que já vem pronto nesse template?',
            'Quais categorias esse template prioriza?',
          ],
        },
        {
          label: '💰 Compra',
          questions: [
            'Qual plano faz mais sentido para esse template?',
            'Qual a diferença entre os planos?',
            'Como funciona a ativação?',
          ],
        },
      ],
      title: 'Zai — Especialista em Templates',
      subtitle: 'Vendo este template com você',
      Icon: Bot,
      pageType: 'template-preview',
    }
  }

  if (pageContext?.pageType === 'checkout') {
    return {
      greeting: CHECKOUT_GREETING,
      endpoint: '/api/chat',
      quickQuestions: [
        'Qual a diferença entre os planos?',
        'O que está incluso no setup?',
        'Como funciona a ativação após o pagamento?',
      ],
      quickReplyCategories: [
        {
          label: '🛒 Compra',
          questions: [
            'Qual a diferença entre os planos?',
            'O que está incluso no setup?',
            'Tem suporte na implantação?',
          ],
        },
        {
          label: '💳 Pagamento',
          questions: [
            'Quais formas de pagamento vocês aceitam?',
            'Como funciona a ativação após o pagamento?',
            'Posso começar sozinho e depois pedir ajuda?',
          ],
        },
      ],
      title: 'Zai — Assistente de Compra',
      subtitle: 'Ajudando no fechamento',
      Icon: Bot,
      pageType: 'checkout',
    }
  }

  if (pageContext?.pageType === 'demo') {
    return {
      greeting: DEMO_GREETING,
      endpoint: '/api/chat',
      quickQuestions: DEMO_QUICK_REPLY_CATEGORIES.flatMap((category) => category.questions),
      quickReplyCategories: DEMO_QUICK_REPLY_CATEGORIES,
      title: 'Zai — Guia do Editor',
      subtitle: 'Tire suas dúvidas',
      Icon: Bot,
      pageType: 'demo',
    }
  }

  if (pageContext?.pageType === 'panel') {
    return {
      greeting: PANEL_GREETING,
      endpoint: '/api/chat',
      quickQuestions: PANEL_QUICK_REPLY_CATEGORIES.flatMap((category) => category.questions),
      quickReplyCategories: PANEL_QUICK_REPLY_CATEGORIES,
      title: 'Assistente do Painel',
      subtitle: 'Ajuda rápida',
      Icon: Bot,
      pageType: 'panel',
    }
  }

  return {
    greeting: MARKETING_GREETING,
    endpoint: '/api/chat',
    quickQuestions: MARKETING_QUICK_REPLY_CATEGORIES.flatMap((category) => category.questions),
    quickReplyCategories: MARKETING_QUICK_REPLY_CATEGORIES,
    title: 'Zai — Zairyx',
    subtitle: 'Online agora',
    Icon: Bot,
    pageType: 'marketing',
  }
}

function buildClientRecoveryMessage(pageType: ChatPageType) {
  return pageType === 'panel'
    ? 'Opa, voltei! Me diga em qual parte do painel você travou que eu te explico o próximo passo sem enrolação.'
    : pageType === 'demo'
      ? 'Opa, voltei! Me pergunte sobre o editor — como editar produtos, categorias, cores ou como publicar de verdade. 😊'
      : pageType === 'delivery'
        ? 'Opa, voltei! Me diga o que você gostaria de pedir ou pergunte sobre o cardápio. 😊'
        : pageType === 'template-preview'
          ? 'Opa, voltei! Posso explicar para qual negócio este template serve, o que já vem pronto e qual plano combina melhor com ele. 😊'
          : pageType === 'checkout'
            ? 'Opa, voltei! Posso esclarecer plano, implantação, pagamento e ativação deste template. 😊'
        : 'Opa, voltei! Me conta sobre o seu negócio que te ajudo com preço, template ideal, como funciona o painel... o que você precisar 😊'
}

export function ChatWidget() {
  const pathname = usePathname()
  const chatConfig = useMemo(() => getChatConfig(pathname), [pathname])
  const ChatIcon = chatConfig.Icon
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([chatConfig.greeting])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(1)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [restaurantPhone, setRestaurantPhone] = useState<string | null>(null)
  const [canOrder, setCanOrder] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userMessageCount = useRef(0)

  useEffect(() => {
    setMessages([chatConfig.greeting])
    setInput('')
    setLoading(false)
    setUnread(1)
    setShowEscalation(false)
    setCart([])
    setShowCart(false)
    setRestaurantPhone(null)
    setCanOrder(true)
    userMessageCount.current = 0
  }, [chatConfig])

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
      const chatContext = resolveChatPageContext(pathname)

      const res = await fetch(chatConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.filter((message, index) => {
            return message.role !== 'assistant' || index > 0
          }),
          context: chatContext,
          cart: chatConfig.pageType === 'delivery' ? cart : undefined,
        }),
      })

      let data: { reply?: string; restaurantPhone?: string; canOrder?: boolean } = {}

      try {
        data = await res.json()
      } catch {
        data = {}
      }

      if (data.restaurantPhone && !restaurantPhone) {
        setRestaurantPhone(data.restaurantPhone)
      }

      if (typeof data.canOrder === 'boolean') {
        setCanOrder(data.canOrder)
      }

      const rawReply = data.reply?.trim() || buildClientRecoveryMessage(chatConfig.pageType)

      // Parse and apply cart actions for delivery mode
      if (chatConfig.pageType === 'delivery') {
        const { text, actions } = parseActionsFromReply(rawReply)

        if (actions.length > 0) {
          setCart((prev) => applyCartActions(prev, actions))
        }

        const reply: Message = {
          role: 'assistant',
          content: text || buildClientRecoveryMessage(chatConfig.pageType),
        }
        setMessages((prev) => [...prev, reply])
      } else {
        const reply: Message = {
          role: 'assistant',
          content: rawReply,
        }
        setMessages((prev) => [...prev, reply])
      }

      if (!open) {
        setUnread((current) => current + 1)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: buildClientRecoveryMessage(chatConfig.pageType) },
      ])
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
      chatConfig.pageType === 'panel'
        ? `Oi! A Zai não conseguiu concluir meu atendimento no painel e preciso de suporte humano.\n\nÚltimas dúvidas: ${lastUserMessages}`
        : `Oi! A Zai não conseguiu concluir meu atendimento e preciso de suporte humano.\n\nÚltimas dúvidas: ${lastUserMessages}`
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
          chatConfig.pageType === 'panel'
            ? '✅ Abrindo o canal de suporte humano para continuar a ajuda no painel.'
            : '✅ Abrindo o canal de suporte humano para você continuar o atendimento com a equipe. 😊',
      },
    ])
    setShowEscalation(false)
  }, [chatConfig.pageType, messages])

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  )

  const handleFinalizeOrder = useCallback(() => {
    if (cart.length === 0) return

    if (!canOrder) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ Este delivery não está aceitando pedidos no momento. Verifique o horário de funcionamento e tente novamente mais tarde.',
        },
      ])
      return
    }

    const message = formatCartWhatsAppMessage(cart)
    const encoded = encodeURIComponent(message)

    const phone = restaurantPhone ? formatWhatsAppPhone(restaurantPhone) : WHATSAPP_NUMBER

    window.open(
      `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`,
      '_blank',
      'noopener,noreferrer'
    )

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          '✅ Pedido enviado pro WhatsApp! Agora é só confirmar com o delivery. Bom apetite! 😊',
      },
    ])
    setShowCart(false)
  }, [cart, restaurantPhone, canOrder])

  const handleRemoveCartItem = useCallback((itemName: string) => {
    setCart((prev) => prev.filter((item) => item.name !== itemName))
  }, [])

  const isDelivery = chatConfig.pageType === 'delivery'

  return (
    <>
      {open && (
        <div className="fixed right-4 bottom-24 z-50 flex h-130 w-90 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-linear-to-r from-orange-500 to-orange-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <ChatIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{chatConfig.title}</p>
                <p className="flex items-center gap-1 text-xs text-orange-100">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                  {chatConfig.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isDelivery && cart.length > 0 && (
                <button
                  onClick={() => setShowCart((v) => !v)}
                  className="relative rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Ver carrinho"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-400 text-[10px] font-bold text-white">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar chat"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
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
              <p className="text-xs text-blue-700">
                Se a Zai não resolver, posso abrir suporte humano.
              </p>
              <button
                type="button"
                onClick={handleEscalateToHuman}
                className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-600"
              >
                <Bot className="h-3 w-3" />
                Solicitar suporte humano
              </button>
            </div>
          )}

          {isDelivery && showCart && cart.length > 0 && (
            <div className="border-b border-green-100 bg-green-50 px-3 py-2">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-bold text-green-800">
                  🛒 Carrinho ({cart.reduce((s, i) => s + i.qty, 0)} itens)
                </p>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[10px] text-red-500 hover:text-red-700"
                >
                  Limpar
                </button>
              </div>
              <div className="max-h-28 space-y-1 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-[11px] text-green-900"
                  >
                    <span>
                      {item.qty}x {item.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {(item.price * item.qty).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(item.name)}
                        className="text-red-400 hover:text-red-600"
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-green-200 pt-1.5">
                <span className="text-xs font-bold text-green-900">
                  Total:{' '}
                  {cartTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-green-700"
                >
                  Finalizar Pedido
                </button>
              </div>
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
                    <ChatIcon className="h-4 w-4 text-white" />
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
                  <ChatIcon className="h-4 w-4 text-white" />
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
            Respostas geradas por IA — o suporte humano entra só quando a Zai não conseguir
            concluir.
          </p>

          {isDelivery && cart.length > 0 && !showCart && (
            <div className="flex items-center justify-between border-t border-green-200 bg-green-50 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setShowCart(true)}
                className="text-[11px] font-medium text-green-800"
              >
                🛒 {cart.reduce((s, i) => s + i.qty, 0)} itens ·{' '}
                {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </button>
              <button
                type="button"
                onClick={handleFinalizeOrder}
                className="rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-green-700"
              >
                Finalizar Pedido
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5 border-t border-zinc-100 bg-white px-3 py-2">
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1">
                {chatConfig.quickReplyCategories.map((cat) => (
                  <span key={cat.label} className="text-[10px] font-semibold text-zinc-400">
                    {cat.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {(messages.length <= 1
                ? chatConfig.quickReplyCategories.flatMap((c) => c.questions).slice(0, 6)
                : chatConfig.quickQuestions.slice(0, 4)
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
