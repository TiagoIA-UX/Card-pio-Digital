-- Cole e execute no Supabase: SQL Editor
-- Cria os 7 templates para "Liberar todos os templates" funcionar

INSERT INTO templates (slug, name, description, price, original_price, category, image_url, is_featured, is_new, is_bestseller, sales_count, rating_avg, rating_count)
VALUES 
  ('restaurante', 'Restaurante / Marmitaria', 'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.', 247, 297, 'restaurante', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', true, false, true, 156, 4.8, 42),
  ('pizzaria', 'Pizzaria', 'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.', 247, 297, 'pizzaria', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', true, false, false, 89, 4.7, 28),
  ('lanchonete', 'Hamburgueria / Lanchonete', 'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.', 247, 297, 'lanchonete', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', false, true, false, 67, 4.9, 19),
  ('bar', 'Bar / Pub', 'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.', 247, 297, 'bar', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80', false, false, false, 34, 4.6, 12),
  ('cafeteria', 'Cafeteria', 'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.', 247, 297, 'cafeteria', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', false, true, false, 45, 4.8, 15),
  ('acai', 'Açaíteria', 'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.', 247, 297, 'acai', 'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80', false, false, false, 28, 4.5, 9),
  ('sushi', 'Japonês / Sushi', 'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.', 247, 297, 'sushi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80', true, false, false, 52, 4.7, 18)
ON CONFLICT (slug) DO NOTHING;
