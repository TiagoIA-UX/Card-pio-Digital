import React from "react"
import Link from "next/link"
import { 
  MessageCircle, 
  Phone, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Smartphone,
  ShoppingBag,
  Send,
  ClipboardList,
  Pizza,
  UtensilsCrossed,
  Store,
  Truck,
  Ban,
  Zap,
  ThumbsUp,
  ArrowRight,
  Eye,
  Beer,
  Coffee,
  IceCream,
  Fish,
  Sparkles
} from "lucide-react"

const WHATSAPP_NUMBER = "5512996887993"
const WHATSAPP_MESSAGE = encodeURIComponent("Olá Tiago! Quero saber mais sobre o Cardápio Digital para meu restaurante.")
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`
const GOOGLE_MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=Rua+50+CEP+11671-318+Caraguatatuba+SP"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4" />
            Caraguatatuba e Litoral Norte
          </div>
          
          <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl text-balance">
            Um site profissional onde seu cliente escolhe o pedido e ele chega pronto no seu{" "}
            <span className="text-primary">WhatsApp</span>
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Site com Cardápio Digital, bonito e sem pagar comissão para aplicativos
          </p>
          
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]"
          >
            <MessageCircle className="h-6 w-6" />
            Quero vender mais pelo WhatsApp
          </a>
          
          <p className="mt-4 text-sm text-muted-foreground">
            Resposta em até 2 horas
          </p>
        </div>
      </section>

      {/* Food Image Banner */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80" 
          alt="Pizza deliciosa"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Problem Section */}
      <section className="px-4 py-12 md:py-16 bg-secondary/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
              Você perde pedidos todos os dias
            </h2>
            <p className="text-muted-foreground">
              Reconhece alguma dessas situações?
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <ProblemCard 
              text="Cliente entra no Instagram e se perde nos posts"
            />
            <ProblemCard 
              text="Cardápio em PDF é ruim de ver no celular"
            />
            <ProblemCard 
              text="iFood cobra comissão de até 27% por pedido"
            />
            <ProblemCard 
              text="Cliente desiste antes de conseguir pedir"
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
              A solução é um site inteligente
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Não é aplicativo. É um site com Cardápio Digital que envia pedido direto no WhatsApp.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SolutionCard 
              icon={<ClipboardList className="h-6 w-6" />}
              text="Cardápio organizado por categorias"
            />
            <SolutionCard 
              icon={<Smartphone className="h-6 w-6" />}
              text="Cliente escolhe os itens no celular"
            />
            <SolutionCard 
              icon={<Send className="h-6 w-6" />}
              text="Pedido vai direto pro seu WhatsApp"
            />
            <SolutionCard 
              icon={<Ban className="h-6 w-6" />}
              text="Sem app para baixar"
            />
            <SolutionCard 
              icon={<CheckCircle className="h-6 w-6" />}
              text="Sem comissão por pedido"
            />
            <SolutionCard 
              icon={<Zap className="h-6 w-6" />}
              text="Sem complicação"
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 py-12 md:py-16 bg-secondary/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
              Como funciona
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StepCard 
              number={1}
              title="Cliente acessa"
              description="Entra no seu site pelo link ou QR Code"
            />
            <StepCard 
              number={2}
              title="Escolhe os itens"
              description="Navega pelas categorias e monta o pedido"
            />
            <StepCard 
              number={3}
              title="Envia no WhatsApp"
              description="Com um clique, o pedido chega formatado"
            />
            <StepCard 
              number={4}
              title="Você confirma"
              description="Confere, confirma e prepara o pedido"
            />
          </div>
        </div>
      </section>

      {/* Food Image */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80" 
          alt="Hambúrguer artesanal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* For Who */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
              Feito para quem trabalha com comida
            </h2>
          </div>
          
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <ForWhoCard 
              icon={<Store className="h-8 w-8" />}
              title="Lanchonetes"
            />
            <ForWhoCard 
              icon={<Pizza className="h-8 w-8" />}
              title="Pizzarias"
            />
            <ForWhoCard 
              icon={<UtensilsCrossed className="h-8 w-8" />}
              title="Lanches"
            />
            <ForWhoCard 
              icon={<Truck className="h-8 w-8" />}
              title="Delivery local"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-12 md:py-16 bg-secondary/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
              O que você ganha
            </h2>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <BenefitItem text="Mais pedidos pelo WhatsApp" />
            <BenefitItem text="Menos erros de anotação" />
            <BenefitItem text="Pedido organizado e completo" />
            <BenefitItem text="Zero comissão por venda" />
            <BenefitItem text="Funciona em qualquer celular" />
            <BenefitItem text="Intuitivo, sem complicação" />
          </div>
        </div>
      </section>

      {/* Visual Examples - All 7 Templates */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              7 Templates Profissionais
            </div>
            <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
              Veja como fica na prática
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Clique em qualquer modelo e navegue como se fosse seu cliente. 
              Teste o carrinho, formulário de pedido e envio via WhatsApp.
            </p>
          </div>
          
          {/* Grid principal - 3 templates em destaque */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {/* Restaurante */}
            <Link href="/templates/restaurante" className="group relative rounded-2xl overflow-hidden border-2 border-border shadow-md transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
              <div className="relative h-48 md:h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80" 
                  alt="Restaurante"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Store className="h-3.5 w-3.5" />
                    Restaurante
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-bold text-white text-lg mb-1">Marmitaria & Self-Service</p>
                  <p className="text-white/80 text-sm">Pratos executivos, marmitas, porções</p>
                </div>
              </div>
              <div className="p-4 bg-card flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-primary font-semibold">
                  <Eye className="h-4 w-4" />
                  Testar cardápio
                </span>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
            
            {/* Pizzaria */}
            <Link href="/templates/pizzaria" className="group relative rounded-2xl overflow-hidden border-2 border-border shadow-md transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
              <div className="relative h-48 md:h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80" 
                  alt="Pizzaria"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Pizza className="h-3.5 w-3.5" />
                    Pizzaria
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-bold text-white text-lg mb-1">Pizzaria Completa</p>
                  <p className="text-white/80 text-sm">Pizzas, bordas recheadas, combos</p>
                </div>
              </div>
              <div className="p-4 bg-card flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-primary font-semibold">
                  <Eye className="h-4 w-4" />
                  Testar cardápio
                </span>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
            
            {/* Hamburgueria */}
            <Link href="/templates/lanchonete" className="group relative rounded-2xl overflow-hidden border-2 border-border shadow-md transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
              <div className="relative h-48 md:h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80" 
                  alt="Lanchonete"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    Hamburgueria
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-bold text-white text-lg mb-1">Hamburgueria Artesanal</p>
                  <p className="text-white/80 text-sm">Burgers, hot dogs, combos</p>
                </div>
              </div>
              <div className="p-4 bg-card flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-primary font-semibold">
                  <Eye className="h-4 w-4" />
                  Testar cardápio
                </span>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {/* Grid secundário - 4 templates adicionais */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {/* Bar */}
            <Link href="/templates/bar" className="group relative rounded-xl overflow-hidden border-2 border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary hover:-translate-y-1">
              <div className="relative h-32 md:h-40 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&auto=format&fit=crop&q=80" 
                  alt="Bar"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-1 text-xs font-bold text-white">
                    <Beer className="h-3 w-3" />
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-bold text-white text-sm">Bar / Pub</p>
                  <p className="text-white/70 text-xs">Drinks e petiscos</p>
                </div>
              </div>
            </Link>

            {/* Cafeteria */}
            <Link href="/templates/cafeteria" className="group relative rounded-xl overflow-hidden border-2 border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary hover:-translate-y-1">
              <div className="relative h-32 md:h-40 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80" 
                  alt="Cafeteria"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-800 px-2 py-1 text-xs font-bold text-white">
                    <Coffee className="h-3 w-3" />
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-bold text-white text-sm">Cafeteria</p>
                  <p className="text-white/70 text-xs">Cafés e doces</p>
                </div>
              </div>
            </Link>

            {/* Açaíteria */}
            <Link href="/templates/acai" className="group relative rounded-xl overflow-hidden border-2 border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary hover:-translate-y-1">
              <div className="relative h-32 md:h-40 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1590080874088-eec64895b423?w=400&auto=format&fit=crop&q=80" 
                  alt="Açaíteria"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                    <IceCream className="h-3 w-3" />
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-bold text-white text-sm">Açaíteria</p>
                  <p className="text-white/70 text-xs">Açaí e tigelas</p>
                </div>
              </div>
            </Link>

            {/* Sushi */}
            <Link href="/templates/sushi" className="group relative rounded-xl overflow-hidden border-2 border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary hover:-translate-y-1">
              <div className="relative h-32 md:h-40 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&auto=format&fit=crop&q=80" 
                  alt="Japonês"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-xs font-bold text-white">
                    <Fish className="h-3 w-3" />
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-bold text-white text-sm">Japonês / Sushi</p>
                  <p className="text-white/70 text-xs">Sushis e temakis</p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">Todos os templates incluem:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" /> Carrinho funcional
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" /> Formulário de pedido
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" /> Envio via WhatsApp
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" /> 100% responsivo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 py-12 md:py-16 bg-secondary/50">
        <div className="mx-auto max-w-2xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <ThumbsUp className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-foreground font-medium">
                &ldquo;Ideal para quem quer vender mais pelo WhatsApp&rdquo;
              </p>
              <p className="text-muted-foreground">
                Solução prática que funciona no dia a dia
              </p>
              <p className="text-muted-foreground">
                Feito sob medida para seu restaurante
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            Transforme seu WhatsApp em um canal de pedidos
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Converse com a gente. Sem compromisso, sem enrolação.
          </p>
          
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]"
          >
            <MessageCircle className="h-6 w-6" />
            Quero meu site com Cardápio Digital
          </a>
          
          <p className="mt-4 text-sm text-muted-foreground">
            Tiago responde em até 2 horas
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-lg font-semibold text-foreground">
            Caraguá Digital
          </p>
          <p className="mb-1 text-sm text-muted-foreground">
            Tiago Rocha | Sites com Cardápio Digital para restaurantes
          </p>
          <p className="text-sm text-muted-foreground">
            Atendimento em Caraguatatuba e região
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <a href={`tel:+${WHATSAPP_NUMBER}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" />
              (12) 99688-7993
            </a>
            <a href={GOOGLE_MAPS_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <MapPin className="h-4 w-4" />
              Ver no mapa
            </a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Chamar no WhatsApp"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-20 animate-pulse" />
        
        {/* Button */}
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform duration-200 group-hover:scale-110 md:h-[72px] md:w-[72px]">
          <svg 
            viewBox="0 0 24 24" 
            className="h-8 w-8 md:h-9 md:w-9 fill-current"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          Fale conosco
        </span>
      </a>
    </main>
  )
}

function ProblemCard({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <XCircle className="h-5 w-5 text-destructive shrink-0" />
      <p className="text-foreground">{text}</p>
    </div>
  )
}

function SolutionCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="font-medium text-foreground">{text}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
        {number}
      </div>
      <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function ForWhoCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-center transition-shadow hover:shadow-md">
      <div className="text-primary">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
      <p className="text-foreground">{text}</p>
    </div>
  )
}
