import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas no .env.local')
  process.exit(1)
}

async function createTestAccount() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const email = 'teste@zairyx.com'
  const password = 'teste123456'

  console.log('🔄 Criando conta de teste...')
  console.log('📧 Email:', email)
  console.log('🔑 Senha:', password)
  console.log('🌐 URL:', supabaseUrl.substring(0, 30) + '...')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: 'Usuário Teste Zairyx',
        telefone: '(11) 99999-9999'
      }
    }
  })

  if (error) {
    console.log('❌ Erro:', error.message)
    return
  }

  console.log('✅ Conta criada com sucesso!')
  console.log('🆔 User ID:', data.user?.id)

  if (data.user && !data.user.email_confirmed_at) {
    console.log('⚠️  Email precisa ser confirmado.')
    console.log('💡 Para desenvolvimento, você pode confirmar manualmente no painel do Supabase')
  } else {
    console.log('✅ Email já confirmado!')
  }
}

createTestAccount().catch(console.error)