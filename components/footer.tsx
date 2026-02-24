import Link from "next/link"
import { Github, Instagram } from "lucide-react"

const footerLinks = {
  produto: [
    { label: "Templates", href: "#templates" },
    { label: "Categorias", href: "#categorias" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
  ],
  suporte: [
    { label: "Contato", href: "mailto:suporte@cardapiodigital.com" },
    { label: "WhatsApp", href: "https://wa.me/5511999999999" },
  ],
  legal: [
    { label: "Termos de Uso", href: "/termos" },
    { label: "Privacidade", href: "/privacidade" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">CD</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Cardápio Digital</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Cardápios digitais profissionais para seu restaurante, bar, lanchonete ou cafeteria. Sistema completo com QR Code e gestão de pedidos.
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="https://instagram.com/cardapiodigital" target="_blank" className="text-muted-foreground transition-colors hover:text-foreground">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="https://github.com/palmfranca/Cardapio_Digital" target="_blank" className="text-muted-foreground transition-colors hover:text-foreground">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Produto</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Suporte</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.suporte.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cardápio Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
