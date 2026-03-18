-- =============================================
-- TEMPLATES: Criar tabela e seed dos 7 templates
-- Necessário para /dev/unlock e Meus Templates
-- =============================================

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 247,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL DEFAULT 'restaurante',
  image_url TEXT,
  preview_url TEXT,
  features JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  sales_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);

-- Seed dos 8 templates
INSERT INTO templates (slug, name, description, price, original_price, category, image_url, is_featured, is_new, is_bestseller, sales_count, rating_avg, rating_count, status)
VALUES
  ('restaurante', 'Restaurante / Marmitaria', 'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.', 247, 297, 'restaurante', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', true, false, true, 156, 4.8, 42, 'active'),
  ('pizzaria', 'Pizzaria', 'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.', 247, 297, 'pizzaria', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', true, false, false, 89, 4.7, 28, 'active'),
  ('lanchonete', 'Hamburgueria / Lanchonete', 'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.', 247, 297, 'lanchonete', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', false, true, false, 67, 4.9, 19, 'active'),
  ('bar', 'Bar / Pub', 'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.', 247, 297, 'bar', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80', false, false, false, 34, 4.6, 12, 'active'),
  ('cafeteria', 'Cafeteria', 'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.', 247, 297, 'cafeteria', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', false, true, false, 45, 4.8, 15, 'active'),
  ('acai', 'Açaíteria', 'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.', 247, 297, 'acai', 'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80', false, false, false, 28, 4.5, 9, 'active'),
  ('sushi', 'Japonês / Sushi', 'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.', 247, 297, 'sushi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80', true, false, false, 52, 4.7, 18, 'active'),
  ('adega', 'Adega / Delivery de Bebidas', 'Cardápio para adegas e deliveries de bebidas do litoral. Cervejas artesanais, vinhos, destilados, kits para praia e churrasco.', 247, 297, 'adega', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80', false, true, false, 0, 0, 0, 'active')
ON CONFLICT (slug) DO NOTHING;
