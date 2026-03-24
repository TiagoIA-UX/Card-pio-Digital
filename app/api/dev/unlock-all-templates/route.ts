import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/** Seed dos 15 templates — usado se a tabela estiver vazia */
const TEMPLATES_SEED = [
  {
    slug: 'restaurante',
    name: 'Restaurante / Marmitaria',
    description:
      'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.',
    price: 247,
    original_price: 297,
    category: 'restaurante',
    image_url:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    is_featured: true,
    is_new: false,
    is_bestseller: true,
    sales_count: 156,
    rating_avg: 4.8,
    rating_count: 42,
    status: 'active',
  },
  {
    slug: 'pizzaria',
    name: 'Pizzaria',
    description:
      'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.',
    price: 247,
    original_price: 297,
    category: 'pizzaria',
    image_url:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    is_featured: true,
    is_new: false,
    is_bestseller: false,
    sales_count: 89,
    rating_avg: 4.7,
    rating_count: 28,
    status: 'active',
  },
  {
    slug: 'lanchonete',
    name: 'Hamburgueria / Lanchonete',
    description:
      'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.',
    price: 247,
    original_price: 297,
    category: 'lanchonete',
    image_url:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 67,
    rating_avg: 4.9,
    rating_count: 19,
    status: 'active',
  },
  {
    slug: 'bar',
    name: 'Bar / Pub',
    description:
      'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.',
    price: 247,
    original_price: 297,
    category: 'bar',
    image_url:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: false,
    is_bestseller: false,
    sales_count: 34,
    rating_avg: 4.6,
    rating_count: 12,
    status: 'active',
  },
  {
    slug: 'cafeteria',
    name: 'Cafeteria',
    description:
      'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.',
    price: 247,
    original_price: 297,
    category: 'cafeteria',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 45,
    rating_avg: 4.8,
    rating_count: 15,
    status: 'active',
  },
  {
    slug: 'acai',
    name: 'Açaíteria',
    description:
      'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.',
    price: 247,
    original_price: 297,
    category: 'acai',
    image_url:
      'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: false,
    is_bestseller: false,
    sales_count: 28,
    rating_avg: 4.5,
    rating_count: 9,
    status: 'active',
  },
  {
    slug: 'sushi',
    name: 'Japonês / Sushi',
    description: 'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.',
    price: 247,
    original_price: 297,
    category: 'sushi',
    image_url:
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80',
    is_featured: true,
    is_new: false,
    is_bestseller: false,
    sales_count: 52,
    rating_avg: 4.7,
    rating_count: 18,
    status: 'active',
  },
  {
    slug: 'adega',
    name: 'Adega / Delivery de Bebidas',
    description:
      'Cardápio para adegas e deliveries de bebidas do litoral. Cervejas artesanais, vinhos, destilados, kits para praia e churrasco.',
    price: 247,
    original_price: 297,
    category: 'adega',
    image_url:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'mercadinho',
    name: 'Mercadinho / Minimercado',
    description:
      'Cardápio completo para mercadinhos, minimercados e lojas de conveniência. Bebidas, mercearia, frios, higiene, limpeza e muito mais.',
    price: 247,
    original_price: 297,
    category: 'mercadinho',
    image_url:
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'padaria',
    name: 'Padaria / Confeitaria',
    description:
      'Cardápio completo para padarias e confeitarias. Pães artesanais, bolos, salgados, cafés e lanches.',
    price: 247,
    original_price: 297,
    category: 'padaria',
    image_url:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'sorveteria',
    name: 'Sorveteria',
    description:
      'Cardápio para sorveterias, gelaterias e paleterias. Sorvetes artesanais, picolés, milkshakes e sobremesas geladas.',
    price: 247,
    original_price: 297,
    category: 'sorveteria',
    image_url:
      'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'acougue',
    name: 'Açougue / Casa de Carnes',
    description:
      'Cardápio para açougues, casas de carnes e churrascarias. Cortes bovinos, suínos, frango, embutidos e kits churrasco.',
    price: 247,
    original_price: 297,
    category: 'acougue',
    image_url:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'hortifruti',
    name: 'Hortifruti',
    description:
      'Cardápio para hortifrutis, sacolões e feiras. Frutas, verduras, legumes, orgânicos e cestas prontas.',
    price: 247,
    original_price: 297,
    category: 'hortifruti',
    image_url:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'petshop',
    name: 'Petshop',
    description:
      'Catálogo para petshops com ração, petiscos, higiene, brinquedos e acessórios para cães, gatos e outros pets.',
    price: 247,
    original_price: 297,
    category: 'petshop',
    image_url:
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
  {
    slug: 'doceria',
    name: 'Doceria / Confeitaria',
    description:
      'Cardápio para docerias, confeitarias e cake designers. Brigadeiros, bolos, trufas, brownies e encomendas para festas.',
    price: 247,
    original_price: 297,
    category: 'doceria',
    image_url:
      'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=600&auto=format&fit=crop&q=80',
    is_featured: false,
    is_new: true,
    is_bestseller: false,
    sales_count: 0,
    rating_avg: 0,
    rating_count: 0,
    status: 'active',
  },
]

/**
 * POST /api/dev/unlock-all-templates
 * Libera todos os templates para o usuário logado (como se tivesse pago todos).
 * Se a tabela templates estiver vazia, insere os 15 templates padrão antes.
 * Também define status_pagamento = 'ativo' no restaurante do usuário, se existir.
 */
export async function POST(req: NextRequest) {
  const adminUser = await requireAdmin(req)
  if (!adminUser) {
    return NextResponse.json({ error: 'Rota indisponivel.' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Faça login para desbloquear os templates.' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()

    // Garantir que os 15 templates padrão existam mesmo se o banco estiver parcialmente seedado.
    for (const row of TEMPLATES_SEED) {
      const { error: insertError } = await admin
        .from('templates')
        .upsert(row, { onConflict: 'slug' })
      if (insertError) {
        console.error('Erro ao inserir template:', row.slug, insertError)
        return NextResponse.json(
          {
            error: `Não foi possível sincronizar os templates no banco. Detalhe: ${insertError.message}`,
          },
          { status: 500 }
        )
      }
    }

    const { data: templates, error: templatesError } = await admin
      .from('templates')
      .select('id')
      .eq('status', 'active')

    if (templatesError || !templates?.length) {
      return NextResponse.json(
        {
          error:
            'Nenhum template encontrado no sistema. A sincronização dos 15 templates falhou e precisa ser revisada no banco.',
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

    const { error: upsertError } = await admin.from('user_purchases').upsert(purchases, {
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
    await admin.from('restaurants').update({ status_pagamento: 'ativo' }).eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      count: templates.length,
      message: `${templates.length} templates liberados. Você já pode acessar "Meus Templates" e o Painel.`,
    })
  } catch (error) {
    console.error('Erro em unlock-all-templates:', error)
    return NextResponse.json({ error: 'Erro interno ao desbloquear templates.' }, { status: 500 })
  }
}
