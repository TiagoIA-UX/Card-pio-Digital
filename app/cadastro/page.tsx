import { redirect } from 'next/navigation'

// Cadastro é feito automaticamente via Google OAuth
// Redireciona para a página de login
export default function CadastroPage() {
  redirect('/login')
}
