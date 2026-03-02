import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Seed dos 7 templates (igual ao schema.sql) — usado se a tabela estiver vazia */
const TEMPLATES_SEED = [
  { slug: 'restaurante', name: 'Restaurante / Marmitaria', description: 'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.', price: 247, original_price: 297, category: 'restaurante', image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', is_featured: true, is_new: false, is_bestseller: true, sales_count: 156, rating_avg: 4.8, rating_count: 42, status: 'active' },
  { slug: 'pizzaria', name: 'Pizzaria', description: 'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.', price: 247, original_price: 297, category: 'pizzaria', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', is_featured: true, is_new: false, is_bestseller: false, sales_count: 89, rating_avg: 4.7, rating_count: 28, status: 'active' },
  { slug: 'lanchonete', name: 'Hamburgueria / Lanchonete', description: 'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.', price: 247, original_price: 297, category: 'lanchonete', image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', is_featured: false, is_new: true, is_bestseller: false, sales_count: 67, rating_avg: 4.9, rating_count: 19, status: 'active' },
  { slug: 'bar', name: 'Bar / Pub', description: 'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.', price: 247, original_price: 297, category: 'bar', image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80', is_featured: false, is_new: false, is_bestseller: false, sales_count: 34, rating_avg: 4.6, rating_count: 12, status: 'active' },
  { slug: 'cafeteria', name: 'Cafeteria', description: 'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.', price: 247, original_price: 297, category: 'cafeteria', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', is_featured: false, is_new: true, is_bestseller: false, sales_count: 45, rating_avg: 4.8, rating_count: 15, status: 'active' },
  { slug: 'acai', name: 'Açaíteria', description: 'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.', price: 247, original_price: 297, category: 'acai', image_url: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80', is_featured: false, is_new: false, is_bestseller: false, sales_count: 28, rating_avg: 4.5, rating_count: 9, status: 'active' },
  { slug: 'sushi', name: 'Japonês / Sushi', description: 'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.', price: 247, original_price: 297, category: 'sushi', image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80', is_featured: true, is_new: false, is_bestseller: false, sales_count: 52, rating_avg: 4.7, rating_count: 18, status: 'active' },
]

/**
 * POST /api/dev/unlock-all-templates
 * Libera todos os templates para o usuário logado (como se tivesse pago todos).
 * Se a tabela templates estiver vazia, insere os 7 templates padrão antes.
 * Também define status_pagamento = 'ativo' no restaurante do usuário, se existir.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Faça login para desbloquear os templates.' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Buscar todos os templates ativos
    let { data: templates, error: templatesError } = await admin
      .from('templates')
      .select('id')
      .eq('status', 'active')

    // Se não houver templates, inserir os 7 padrão (seed) um a um para evitar falha de constraint
    if (!templatesError && (!templates || templates.length === 0)) {
      for (const row of TEMPLATES_SEED) {
        const { error: insertError } = await admin
          .from('templates')
          .upsert(row, { onConflict: 'slug' })
        if (insertError) {
          console.error('Erro ao inserir template:', row.slug, insertError)
          return NextResponse.json(
            { error: `Não foi possível criar os templates no banco. Execute o seed no Supabase (SQL Editor): tabela "templates". Detalhe: ${insertError.message}` },
            { status: 500 }
          )
        }
      }
      const res = await admin.from('templates').select('id')
      templates = res.data ?? []
      templatesError = res.error
    }

    if (templatesError || !templates?.length) {
      return NextResponse.json(
        {
          error: 'Nenhum template encontrado no sistema. No Supabase, SQL Editor, execute o conteúdo da seção "DADOS INICIAIS: TEMPLATES" do arquivo supabase/schema.sql para criar os 7 templates.',
        },
        { status: 500 }
      )
    }

    // Inserir/atualizar user_purchases para cada template (status active)
    const purchases = templates.map((t) => ({
      user_id: user.id,
      template_id: t.id,
      status: 'active',
      purchased_at: new Date().toISOString(),
    }))

    const { error: upsertError } = await admin
      .from('user_purchases')
      .upsert(purchases, {
        onConflict: 'user_id,template_id',
        ignoreDuplicates: false,
      })

    if (upsertError) {
      console.error('Erro ao liberar templates:', upsertError)
      return NextResponse.json(
        { error: 'Erro ao registrar as licenças dos templates.' },
        { status: 500 }
      )
    }

    // Ativar painel: marcar status_pagamento = 'ativo' no restaurante do usuário (se existir)
    await admin
      .from('restaurants')
      .update({ status_pagamento: 'ativo' })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      count: templates.length,
      message: `${templates.length} templates liberados. Você já pode acessar "Meus Templates" e o Painel.`,
    })
  } catch (error) {
    console.error('Erro em unlock-all-templates:', error)
    return NextResponse.json(
      { error: 'Erro interno ao desbloquear templates.' },
      { status: 500 }
    )
  }
}
