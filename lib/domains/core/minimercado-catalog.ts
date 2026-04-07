/**
 * Catálogo completo do template Minimercado Digital
 * 1200 SKUs organizados em 20 categorias, priorizando curva ABC digital.
 *
 * Estrutura baseada em pesquisa de mercado:
 * - 12% dos produtos geram ~80% das vendas (curva A)
 * - Foco em conveniência extrema e itens de alta rotatividade
 * - Kits estratégicos para aumentar ticket médio
 * - Limite prático de ~16 itens por entrega de moto
 */

import type { TemplateSampleProduct } from '@/lib/domains/marketing/templates-config'

// ─── Helper ──────────────────────────────────────────────────────
let _ordem = 0
function p(
  nome: string,
  descricao: string,
  preco: number,
  categoria: string
): TemplateSampleProduct {
  return { nome, descricao, preco, categoria, ordem: ++_ordem }
}

// ─── 01. Bebidas Não Alcoólicas (80 SKUs) ───────────────────────
const bebidasNaoAlcoolicas: TemplateSampleProduct[] = [
  // Refrigerantes
  p('Coca-Cola Lata 350ml', 'Refrigerante Coca-Cola original lata gelada', 4.99, 'Bebidas'),
  p('Coca-Cola 600ml', 'Refrigerante Coca-Cola garrafa 600ml', 6.99, 'Bebidas'),
  p('Coca-Cola 1L', 'Refrigerante Coca-Cola garrafa 1 litro', 8.49, 'Bebidas'),
  p('Coca-Cola 2L', 'Refrigerante Coca-Cola garrafa 2 litros', 10.99, 'Bebidas'),
  p('Coca-Cola Zero Lata 350ml', 'Refrigerante Coca-Cola Zero Açúcar lata', 4.99, 'Bebidas'),
  p('Coca-Cola Zero 2L', 'Refrigerante Coca-Cola Zero garrafa 2L', 10.99, 'Bebidas'),
  p('Guaraná Antarctica Lata 350ml', 'Refrigerante Guaraná Antarctica lata', 3.99, 'Bebidas'),
  p('Guaraná Antarctica 2L', 'Refrigerante Guaraná Antarctica 2 litros', 8.99, 'Bebidas'),
  p('Fanta Laranja Lata 350ml', 'Refrigerante Fanta sabor laranja lata', 3.99, 'Bebidas'),
  p('Fanta Laranja 2L', 'Refrigerante Fanta Laranja garrafa 2L', 8.49, 'Bebidas'),
  p('Fanta Uva Lata 350ml', 'Refrigerante Fanta sabor uva lata', 3.99, 'Bebidas'),
  p('Sprite Lata 350ml', 'Refrigerante Sprite sabor limão lata', 3.99, 'Bebidas'),
  p('Sprite 2L', 'Refrigerante Sprite garrafa 2 litros', 8.49, 'Bebidas'),
  p('Kuat Guaraná Lata 350ml', 'Refrigerante Kuat Guaraná lata', 3.49, 'Bebidas'),
  p('Pepsi Lata 350ml', 'Refrigerante Pepsi Cola lata', 3.49, 'Bebidas'),
  p('Pepsi 2L', 'Refrigerante Pepsi Cola garrafa 2L', 7.99, 'Bebidas'),
  p('Dolly Guaraná 2L', 'Refrigerante Dolly Guaraná 2 litros', 4.99, 'Bebidas'),
  p('Schweppes Citrus Lata 350ml', 'Água tônica Schweppes Citrus Original', 4.49, 'Bebidas'),
  p('Soda Limonada Antarctica 2L', 'Refrigerante Soda Limonada Antarctica', 7.99, 'Bebidas'),
  p('Tubaina Lata 350ml', 'Refrigerante Tubaina sabor tutti-frutti', 2.99, 'Bebidas'),
  // Águas
  p('Água Mineral 500ml', 'Água mineral sem gás garrafa 500ml', 2.49, 'Bebidas'),
  p('Água Mineral 1,5L', 'Água mineral sem gás garrafa 1,5 litros', 3.49, 'Bebidas'),
  p('Água Mineral 5L', 'Galão água mineral sem gás 5 litros', 7.99, 'Bebidas'),
  p('Água Com Gás 500ml', 'Água mineral com gás garrafa 500ml', 2.99, 'Bebidas'),
  p('Água de Coco Ducoco 200ml', 'Água de coco integral Ducoco 200ml', 4.99, 'Bebidas'),
  p('Água de Coco Kero Coco 1L', 'Água de coco integral Kero Coco 1 litro', 9.99, 'Bebidas'),
  // Sucos
  p('Suco Del Valle Uva 1L', 'Suco Del Valle néctar de uva 1 litro', 7.99, 'Bebidas'),
  p('Suco Del Valle Laranja 1L', 'Suco Del Valle néctar de laranja 1L', 7.99, 'Bebidas'),
  p('Suco Del Valle Pêssego 1L', 'Suco Del Valle néctar de pêssego 1L', 7.99, 'Bebidas'),
  p('Suco Del Valle Manga 1L', 'Suco Del Valle néctar de manga 1L', 7.99, 'Bebidas'),
  p('Suco Natural One Laranja 900ml', 'Suco 100% laranja Natural One', 14.99, 'Bebidas'),
  p('Suco Tang Laranja 25g', 'Refresco em pó Tang sabor laranja', 1.49, 'Bebidas'),
  p('Suco Tang Uva 25g', 'Refresco em pó Tang sabor uva', 1.49, 'Bebidas'),
  p('Suco Tang Maracujá 25g', 'Refresco em pó Tang sabor maracujá', 1.49, 'Bebidas'),
  p('Suco Ades Maçã 200ml', 'Bebida à base de soja Ades sabor maçã', 3.49, 'Bebidas'),
  // Energéticos e isotônicos
  p('Red Bull Energy Drink 250ml', 'Energético Red Bull lata 250ml', 11.99, 'Bebidas'),
  p('Red Bull Sugar Free 250ml', 'Energético Red Bull sem açúcar 250ml', 11.99, 'Bebidas'),
  p('Monster Energy 473ml', 'Energético Monster lata 473ml', 9.99, 'Bebidas'),
  p('Monster Mango Loco 473ml', 'Energético Monster sabor manga 473ml', 9.99, 'Bebidas'),
  p('TNT Energy Drink 473ml', 'Energético TNT lata 473ml', 5.99, 'Bebidas'),
  p('Gatorade Limão 500ml', 'Isotônico Gatorade sabor limão 500ml', 6.49, 'Bebidas'),
  p('Gatorade Laranja 500ml', 'Isotônico Gatorade sabor laranja 500ml', 6.49, 'Bebidas'),
  p('Powerade Frutas Cítricas 500ml', 'Isotônico Powerade frutas cítricas', 5.49, 'Bebidas'),
  // Chás e cafés prontos
  p('Chá Leão Pêssego 450ml', 'Chá gelado Leão sabor pêssego 450ml', 4.99, 'Bebidas'),
  p('Chá Leão Limão 450ml', 'Chá gelado Leão sabor limão 450ml', 4.99, 'Bebidas'),
  p('Chá Matte Leão Natural 300ml', 'Chá Matte Leão zero lata 300ml', 4.49, 'Bebidas'),
  p('Ice Tea Limão Lipton 340ml', 'Chá gelado Lipton sabor limão lata', 4.49, 'Bebidas'),
  p(
    'Starbucks Frappuccino Mocha 281ml',
    'Bebida de café Starbucks Frappuccino sabor mocha',
    12.99,
    'Bebidas'
  ),
  p('Nescafé Shakissimo 200ml', 'Bebida de café gelado Nescafé Shakissimo', 6.99, 'Bebidas'),
  // Leites e achocolatados
  p('Toddynho 200ml', 'Achocolatado Toddynho caixinha 200ml', 2.99, 'Bebidas'),
  p('Nescau Pronto 200ml', 'Achocolatado Nescau pronto caixinha 200ml', 2.99, 'Bebidas'),
  p('Leite UHT Integral Parmalat 1L', 'Leite integral UHT Parmalat 1 litro', 5.49, 'Bebidas'),
  p('Leite UHT Desnatado Parmalat 1L', 'Leite desnatado UHT Parmalat 1L', 5.49, 'Bebidas'),
  p('Leite UHT Semi Italac 1L', 'Leite semidesnatado UHT Italac 1L', 4.99, 'Bebidas'),
  p('Leite Condensado Moça 395g', 'Leite condensado Moça lata 395g', 7.99, 'Bebidas'),
  p('Creme de Leite Nestlé 200g', 'Creme de leite UHT Nestlé 200g', 4.49, 'Bebidas'),
  // Iogurtes líquidos
  p('Danoninho 320g', 'Petit suisse Danoninho bandeja 320g', 8.99, 'Bebidas'),
  p('Yakult 480ml (6un)', 'Leite fermentado Yakult embalagem 6 unidades', 9.99, 'Bebidas'),
  p('Activia Ameixa 170g', 'Iogurte Activia sabor ameixa 170g', 4.49, 'Bebidas'),
  p('Vigor Grego Morango 100g', 'Iogurte grego Vigor sabor morango 100g', 3.99, 'Bebidas'),
  // Diversas
  p('Gelo Filtrado 3kg', 'Saco de gelo filtrado 3 quilos', 7.99, 'Bebidas'),
  p('Gelo Filtrado 5kg', 'Saco de gelo filtrado 5 quilos', 11.99, 'Bebidas'),
  p('Água Tônica Schweppes 350ml', 'Água tônica Schweppes lata 350ml', 4.49, 'Bebidas'),
  p('Suco em Caixa Maguary Caju 200ml', 'Suco néctar Maguary sabor caju 200ml', 2.49, 'Bebidas'),
  p(
    'Suco em Caixa Maguary Goiaba 200ml',
    'Suco néctar Maguary sabor goiaba 200ml',
    2.49,
    'Bebidas'
  ),
  p('Refrigerante Guaraná Jesus Lata 350ml', 'Refrigerante Guaraná Jesus lata', 4.99, 'Bebidas'),
  p('Chá Verde Leão 250ml', 'Chá verde pronto Leão garrafa 250ml', 4.49, 'Bebidas'),
  p(
    'Shake de Proteína Piracanjuba 250ml',
    'Bebida láctea UHT proteica Piracanjuba',
    7.99,
    'Bebidas'
  ),
  p('Limonada Pronta Del Valle 1L', 'Refresco Del Valle limonada 1 litro', 6.99, 'Bebidas'),
  p('Coca-Cola Lata Pack 12un', 'Pack 12 latas Coca-Cola 350ml', 49.9, 'Bebidas'),
  p('Guaraná Antarctica Pack 12 Latas', 'Pack 12 latas Guaraná Antarctica 350ml', 39.9, 'Bebidas'),
  p('Água Mineral Pack 6un 500ml', 'Pack 6 garrafas água mineral 500ml', 11.99, 'Bebidas'),
  p('Leite Ninho Integral 1L', 'Leite UHT integral Ninho Nestlé 1L', 6.99, 'Bebidas'),
  p('Leite Zero Lactose Piracanjuba 1L', 'Leite UHT zero lactose Piracanjuba 1L', 6.49, 'Bebidas'),
  p('Leite de Amêndoas Alpro 1L', 'Bebida vegetal de amêndoas Alpro 1L', 14.99, 'Bebidas'),
  p('Leite de Aveia Oatly 1L', 'Bebida vegetal de aveia Oatly 1L', 16.99, 'Bebidas'),
  p('Isotônico Gatorade Morango 500ml', 'Isotônico Gatorade sabor morango 500ml', 6.49, 'Bebidas'),
]

// ─── 02. Cervejas & Destilados (80 SKUs) ────────────────────────
const cervejasDestilados: TemplateSampleProduct[] = [
  // Cervejas mainstream
  p('Brahma Lata 350ml', 'Cerveja Brahma Chopp lata 350ml', 3.49, 'Cervejas & Destilados'),
  p('Brahma Pack 12 Latas', 'Pack 12 latas Brahma Chopp 350ml', 34.9, 'Cervejas & Destilados'),
  p('Skol Lata 350ml', 'Cerveja Skol Pilsen lata 350ml', 3.29, 'Cervejas & Destilados'),
  p('Skol Pack 12 Latas', 'Pack 12 latas Skol Pilsen 350ml', 32.9, 'Cervejas & Destilados'),
  p(
    'Antarctica Original Lata 350ml',
    'Cerveja Antarctica Original lata',
    3.49,
    'Cervejas & Destilados'
  ),
  p('Heineken Lata 350ml', 'Cerveja Heineken Premium lata 350ml', 5.49, 'Cervejas & Destilados'),
  p('Heineken Long Neck 330ml', 'Cerveja Heineken long neck 330ml', 6.99, 'Cervejas & Destilados'),
  p('Heineken Pack 6 Long Neck', 'Pack 6 long neck Heineken 330ml', 36.9, 'Cervejas & Destilados'),
  p('Heineken Pack 12 Latas', 'Pack 12 latas Heineken 350ml', 59.9, 'Cervejas & Destilados'),
  p(
    'Stella Artois Lata 350ml',
    'Cerveja Stella Artois Premium lata',
    5.49,
    'Cervejas & Destilados'
  ),
  p(
    'Stella Artois Long Neck 330ml',
    'Cerveja Stella Artois long neck',
    6.99,
    'Cervejas & Destilados'
  ),
  p('Budweiser Lata 350ml', 'Cerveja Budweiser American lata 350ml', 4.49, 'Cervejas & Destilados'),
  p(
    'Budweiser Long Neck 330ml',
    'Cerveja Budweiser long neck 330ml',
    5.99,
    'Cervejas & Destilados'
  ),
  p(
    'Corona Extra Long Neck 330ml',
    'Cerveja Corona Extra long neck',
    7.99,
    'Cervejas & Destilados'
  ),
  p(
    'Corona Pack 6 Long Neck',
    'Pack 6 long neck Corona Extra 330ml',
    42.9,
    'Cervejas & Destilados'
  ),
  p('Amstel Lata 350ml', 'Cerveja Amstel Puro Malte lata 350ml', 3.99, 'Cervejas & Destilados'),
  p('Spaten Lata 350ml', 'Cerveja Spaten Puro Malte Munich lata', 4.49, 'Cervejas & Destilados'),
  p('Itaipava Lata 350ml', 'Cerveja Itaipava Pilsen lata 350ml', 2.99, 'Cervejas & Destilados'),
  p('Original 600ml', 'Cerveja Antarctica Original garrafa 600ml', 9.99, 'Cervejas & Destilados'),
  p('Bohemia Lata 350ml', 'Cerveja Bohemia Puro Malte lata', 4.29, 'Cervejas & Destilados'),
  // Cervejas artesanais / especiais
  p(
    'Colorado Appia 600ml',
    'Cerveja Colorado Appia trigo/mel 600ml',
    19.99,
    'Cervejas & Destilados'
  ),
  p(
    'Colorado Ribeirão Lager 355ml',
    'Cerveja Colorado Ribeirão Lager lata',
    7.99,
    'Cervejas & Destilados'
  ),
  p(
    'Eisenbahn Pilsen Long Neck 355ml',
    'Cerveja Eisenbahn Pilsen Extra long neck',
    6.99,
    'Cervejas & Destilados'
  ),
  p(
    'Baden Baden Witbier 600ml',
    'Cerveja Baden Baden de trigo 600ml',
    21.99,
    'Cervejas & Destilados'
  ),
  p(
    'Praya Witbier Lata 473ml',
    'Cerveja Praya Witbier artesanal 473ml',
    11.99,
    'Cervejas & Destilados'
  ),
  p(
    'Wäls Session Citra Lata 350ml',
    'Cerveja Wäls Session Citra IPA lata',
    9.99,
    'Cervejas & Destilados'
  ),
  p(
    'Patagonia Amber Lager Lata 350ml',
    'Cerveja Patagonia Amber Lager lata',
    5.99,
    'Cervejas & Destilados'
  ),
  p(
    'Blue Moon Belgian White Lata 355ml',
    'Cerveja Blue Moon trigo belga lata',
    10.99,
    'Cervejas & Destilados'
  ),
  // Sem álcool
  p('Heineken 0.0 Lata 350ml', 'Cerveja Heineken zero álcool lata', 5.49, 'Cervejas & Destilados'),
  p(
    'Brahma Duplo Malte 0.0 Lata 350ml',
    'Cerveja Brahma Duplo Malte zero álcool',
    4.49,
    'Cervejas & Destilados'
  ),
  // Vinhos
  p(
    'Vinho Tinto Pérgola Suave 1L',
    'Vinho tinto de mesa suave Pérgola 1L',
    14.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Branco Pérgola Suave 1L',
    'Vinho branco de mesa suave Pérgola 1L',
    14.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Rosé Pérgola Suave 1L',
    'Vinho rosé de mesa suave Pérgola 1L',
    14.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Tinto Concha y Toro 750ml',
    'Vinho Concha y Toro Cabernet Sauvignon',
    29.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Branco Concha y Toro 750ml',
    'Vinho Concha y Toro Chardonnay 750ml',
    29.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Tinto Casillero del Diablo 750ml',
    'Vinho Casillero del Diablo Merlot',
    49.99,
    'Cervejas & Destilados'
  ),
  p(
    'Espumante Chandon Brut 750ml',
    'Espumante Chandon Brut garrafa 750ml',
    69.99,
    'Cervejas & Destilados'
  ),
  p(
    'Espumante Freixenet Cordon Negro 750ml',
    'Espumante Freixenet brut garrafa',
    49.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho do Porto Sandeman 750ml',
    'Vinho do Porto Sandeman Ruby 750ml',
    59.99,
    'Cervejas & Destilados'
  ),
  // Destilados
  p('Vodka Absolut 750ml', 'Vodka Absolut Original garrafa 750ml', 59.99, 'Cervejas & Destilados'),
  p('Vodka Smirnoff 998ml', 'Vodka Smirnoff garrafa 998ml', 34.99, 'Cervejas & Destilados'),
  p(
    'Whisky Johnnie Walker Red 750ml',
    'Whisky Johnnie Walker Red Label 750ml',
    79.99,
    'Cervejas & Destilados'
  ),
  p(
    'Whisky Jack Daniels 750ml',
    "Whisky Jack Daniel's Old No.7 garrafa",
    129.99,
    'Cervejas & Destilados'
  ),
  p(
    'Whisky Chivas Regal 12 anos 750ml',
    'Whisky Chivas Regal 12 anos 750ml',
    149.99,
    'Cervejas & Destilados'
  ),
  p(
    'Rum Bacardi Carta Branca 980ml',
    'Rum Bacardi Carta Branca garrafa',
    39.99,
    'Cervejas & Destilados'
  ),
  p(
    'Gin Tanqueray London Dry 750ml',
    'Gin Tanqueray London Dry garrafa',
    89.99,
    'Cervejas & Destilados'
  ),
  p(
    'Gin Beefeater London Dry 750ml',
    'Gin Beefeater London Dry garrafa',
    79.99,
    'Cervejas & Destilados'
  ),
  p(
    'Tequila José Cuervo Ouro 750ml',
    'Tequila José Cuervo Especial Gold',
    89.99,
    'Cervejas & Destilados'
  ),
  p('Cachaça 51 980ml', 'Cachaça 51 garrafa 980ml', 9.99, 'Cervejas & Destilados'),
  p(
    'Cachaça Ypióca Prata 960ml',
    'Cachaça Ypióca Prata garrafa 960ml',
    19.99,
    'Cervejas & Destilados'
  ),
  p('Licor Amarula 750ml', 'Licor de creme Amarula garrafa 750ml', 79.99, 'Cervejas & Destilados'),
  // Drinks prontos
  p('Smirnoff Ice Original 275ml', 'Ice Smirnoff sabor limão 275ml', 6.99, 'Cervejas & Destilados'),
  p(
    'Smirnoff Ice Green Apple 275ml',
    'Ice Smirnoff sabor maçã verde 275ml',
    6.99,
    'Cervejas & Destilados'
  ),
  p('Beats GT Lata 269ml', 'Drink pronto Beats gin tônica lata', 5.99, 'Cervejas & Destilados'),
  p(
    'Beats Senses Lata 269ml',
    'Drink pronto Beats Senses tropical lata',
    5.99,
    'Cervejas & Destilados'
  ),
  p(
    "Mike's Hard Lemonade 275ml",
    "Drink Mike's sabor limão garrafa",
    7.99,
    'Cervejas & Destilados'
  ),
  // Extras
  p(
    'Cerveja Brahma Duplo Malte Lata 350ml',
    'Cerveja Brahma Duplo Malte lata',
    3.99,
    'Cervejas & Destilados'
  ),
  p(
    'Cerveja Devassa Tropical Lata 350ml',
    'Cerveja Devassa Tropical Lager lata',
    3.99,
    'Cervejas & Destilados'
  ),
  p(
    'Cerveja Petra Origem Lata 350ml',
    'Cerveja Petra Puro Malte Origem lata',
    3.99,
    'Cervejas & Destilados'
  ),
  p('Chopp Brahma Barril 5L', 'Barril de chopp Brahma 5 litros', 39.99, 'Cervejas & Destilados'),
  p('Campari 998ml', 'Aperitivo Campari garrafa 998ml', 49.99, 'Cervejas & Destilados'),
  p('Aperol 750ml', 'Aperitivo Aperol garrafa 750ml', 54.99, 'Cervejas & Destilados'),
  p(
    "Gin Gordon's London Dry 750ml",
    "Gin Gordon's London Dry garrafa",
    54.99,
    'Cervejas & Destilados'
  ),
  p('Vodka Grey Goose 750ml', 'Vodka francesa Grey Goose garrafa', 149.99, 'Cervejas & Destilados'),
  p(
    "Whisky Ballantine's Finest 750ml",
    "Whisky escocês Ballantine's Finest",
    54.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Tinto Marcus James 750ml',
    'Vinho Marcus James Cabernet Sauvignon',
    24.99,
    'Cervejas & Destilados'
  ),
  p(
    'Vinho Rosé Mateus 750ml',
    'Vinho rosé português Mateus garrafa',
    34.99,
    'Cervejas & Destilados'
  ),
  p(
    'Sangria Senorial 750ml',
    'Bebida Sangria Nacional garrafa 750ml',
    12.99,
    'Cervejas & Destilados'
  ),
  p('Sake Azuma Kirin 740ml', 'Sake nacional Azuma Kirin garrafa', 19.99, 'Cervejas & Destilados'),
  p('Catuaba Selvagem 1L', 'Catuaba Selvagem garrafa 1 litro', 12.99, 'Cervejas & Destilados'),
  p(
    'Cerveja Eisenbahn Strong Golden Ale 355ml',
    'Cerveja Eisenbahn Strong Golden Ale',
    8.99,
    'Cervejas & Destilados'
  ),
  p(
    'Brahma Extra Lager Lata 350ml',
    'Cerveja Brahma Extra Lager lata',
    4.49,
    'Cervejas & Destilados'
  ),
  p('Skol Beats 150bpm Lata 269ml', 'Drink Skol Beats 150bpm lata', 4.99, 'Cervejas & Destilados'),
  p('Amstel Ultra Lata 350ml', 'Cerveja Amstel Ultra low carb lata', 4.49, 'Cervejas & Destilados'),
  p('Carvão Vegetal 3kg', 'Carvão vegetal para churrasco saco 3kg', 14.99, 'Cervejas & Destilados'),
  p('Carvão Vegetal 5kg', 'Carvão vegetal para churrasco saco 5kg', 22.99, 'Cervejas & Destilados'),
]

// ─── 03. Mercearia Básica (100 SKUs) ────────────────────────────
const mercearia: TemplateSampleProduct[] = [
  // Arroz
  p('Arroz Branco Tio João 5kg', 'Arroz agulhinha tipo 1 Tio João 5kg', 24.99, 'Mercearia'),
  p('Arroz Branco Camil 5kg', 'Arroz agulhinha tipo 1 Camil 5kg', 22.99, 'Mercearia'),
  p('Arroz Integral Tio João 1kg', 'Arroz integral Tio João 1 quilo', 7.99, 'Mercearia'),
  p('Arroz Parboilizado Tio João 5kg', 'Arroz parboilizado Tio João 5kg', 23.99, 'Mercearia'),
  // Feijão
  p('Feijão Carioca Camil 1kg', 'Feijão carioca tipo 1 Camil 1kg', 8.99, 'Mercearia'),
  p('Feijão Preto Camil 1kg', 'Feijão preto tipo 1 Camil 1 quilo', 8.99, 'Mercearia'),
  p('Feijão Branco Camil 500g', 'Feijão branco tipo 1 Camil 500g', 7.99, 'Mercearia'),
  // Óleo e azeite
  p('Óleo de Soja Liza 900ml', 'Óleo de soja refinado Liza 900ml', 6.99, 'Mercearia'),
  p('Óleo de Soja Soya 900ml', 'Óleo de soja refinado Soya 900ml', 6.49, 'Mercearia'),
  p('Azeite Extra Virgem Gallo 500ml', 'Azeite de oliva extra virgem Gallo', 29.99, 'Mercearia'),
  p(
    'Azeite Extra Virgem Andorinha 500ml',
    'Azeite de oliva extra virgem Andorinha',
    27.99,
    'Mercearia'
  ),
  p('Vinagre Castelo 750ml', 'Vinagre de álcool Castelo garrafa', 3.99, 'Mercearia'),
  p('Vinagre de Maçã Castelo 750ml', 'Vinagre de maçã Castelo garrafa', 5.99, 'Mercearia'),
  // Açúcar e adoçantes
  p('Açúcar Refinado União 1kg', 'Açúcar refinado especial União 1kg', 4.99, 'Mercearia'),
  p('Açúcar Cristal Guarani 5kg', 'Açúcar cristal Guarani saco 5kg', 17.99, 'Mercearia'),
  p('Açúcar Demerara Native 1kg', 'Açúcar demerara orgânico Native 1kg', 8.99, 'Mercearia'),
  p('Adoçante Zero-Cal Sucralose 100ml', 'Adoçante líquido Zero-Cal Sucralose', 11.99, 'Mercearia'),
  // Café
  p('Café Pilão 500g', 'Café torrado e moído Pilão 500g', 14.99, 'Mercearia'),
  p('Café Melitta 500g', 'Café torrado e moído Melitta 500g', 15.99, 'Mercearia'),
  p('Café 3 Corações 500g', 'Café torrado e moído 3 Corações 500g', 13.99, 'Mercearia'),
  p('Nescafé Tradição 200g', 'Café solúvel Nescafé Tradição vidro', 19.99, 'Mercearia'),
  p('Cappuccino 3 Corações 200g', 'Cappuccino solúvel 3 Corações classic', 12.99, 'Mercearia'),
  // Massas
  p('Macarrão Espaguete Barilla 500g', 'Macarrão espaguete nº 5 Barilla', 6.99, 'Mercearia'),
  p('Macarrão Penne Barilla 500g', 'Macarrão penne rigate Barilla 500g', 6.99, 'Mercearia'),
  p('Macarrão Espaguete Renata 500g', 'Macarrão espaguete Renata 500g', 3.99, 'Mercearia'),
  p('Macarrão Parafuso Renata 500g', 'Macarrão parafuso Renata 500g', 3.99, 'Mercearia'),
  p(
    'Macarrão Instantâneo Miojo 85g',
    'Macarrão instantâneo sabor galinha Nissin',
    1.49,
    'Mercearia'
  ),
  p(
    'Macarrão Instantâneo Cup Noodles 69g',
    'Cup Noodles galinha caipira Nissin',
    5.99,
    'Mercearia'
  ),
  p('Lasanha Adria 500g', 'Massa para lasanha Adria 500g', 5.99, 'Mercearia'),
  // Molhos
  p('Molho de Tomate Heinz 340g', 'Molho de tomate Heinz sachê 340g', 4.49, 'Mercearia'),
  p('Molho de Tomate Pomarola 340g', 'Molho de tomate Pomarola tradicional', 4.99, 'Mercearia'),
  p('Extrato de Tomate Elefante 340g', 'Extrato de tomate Elefante lata', 5.99, 'Mercearia'),
  p('Ketchup Heinz 397g', 'Ketchup Heinz tradicional 397g', 11.99, 'Mercearia'),
  p('Mostarda Heinz 215g', 'Mostarda amarela Heinz 215g', 8.99, 'Mercearia'),
  p('Maionese Hellmanns 500g', 'Maionese Hellmanns tradicional 500g', 12.99, 'Mercearia'),
  p('Maionese Hellmanns 250g', 'Maionese Hellmanns tradicional 250g', 7.99, 'Mercearia'),
  p('Molho Shoyu Sakura 150ml', 'Molho de soja Sakura 150ml', 4.99, 'Mercearia'),
  p('Molho Inglês Worcestershire 150ml', 'Molho inglês Lea & Perrins 150ml', 12.99, 'Mercearia'),
  p('Molho de Pimenta Tabasco 60ml', 'Molho de pimenta Tabasco original 60ml', 16.99, 'Mercearia'),
  // Sal e temperos
  p('Sal Refinado Cisne 1kg', 'Sal refinado iodado Cisne 1 quilo', 2.99, 'Mercearia'),
  p('Sal Grosso para Churrasco 1kg', 'Sal grosso moído para churrasco 1kg', 3.49, 'Mercearia'),
  p('Tempero Sazon 60g (12 sachês)', 'Tempero Sazon sabor verde 60g', 3.99, 'Mercearia'),
  p('Tempero Knorr Meu Feijão 40g', 'Tempero pronto Knorr Meu Feijão', 3.49, 'Mercearia'),
  p('Alho descascado 200g', 'Alho descascado embalagem 200g', 6.99, 'Mercearia'),
  p('Caldo Knorr Galinha 57g (6 cubos)', 'Caldo de galinha Knorr 6 tabletes', 3.99, 'Mercearia'),
  p('Caldo Knorr Carne 57g (6 cubos)', 'Caldo de carne Knorr 6 tabletes', 3.99, 'Mercearia'),
  p('Pimenta do Reino Kitano 40g', 'Pimenta do reino moída Kitano 40g', 4.99, 'Mercearia'),
  p('Orégano Kitano 10g', 'Orégano desidratado Kitano 10g', 2.99, 'Mercearia'),
  p('Cominho Kitano 30g', 'Cominho em pó Kitano 30g', 3.99, 'Mercearia'),
  p('Colorífico Kitano 80g', 'Colorífico (urucum) Kitano 80g', 2.49, 'Mercearia'),
  // Farinhas e misturas
  p('Farinha de Trigo Dona Benta 1kg', 'Farinha de trigo especial Dona Benta', 5.99, 'Mercearia'),
  p('Farinha de Mandioca Yoki 500g', 'Farinha de mandioca torrada Yoki', 5.49, 'Mercearia'),
  p('Fubá Yoki 500g', 'Fubá mimoso Yoki para polenta 500g', 3.99, 'Mercearia'),
  p('Amido de Milho Maizena 200g', 'Amido de milho Maizena 200g', 5.49, 'Mercearia'),
  p('Mistura para Bolo Dr. Oetker 450g', 'Mistura bolo chocolate Dr. Oetker', 6.99, 'Mercearia'),
  p('Mistura para Pão Dona Benta 360g', 'Mistura para pão caseiro Dona Benta', 5.99, 'Mercearia'),
  p('Fermento Pó Royal 100g', 'Fermento em pó Royal 100g', 5.49, 'Mercearia'),
  // Enlatados e conservas
  p('Milho Verde Predilecta 200g', 'Milho verde em conserva Predilecta', 3.99, 'Mercearia'),
  p('Ervilha Predilecta 200g', 'Ervilha em conserva Predilecta 200g', 3.99, 'Mercearia'),
  p('Azeitona Verde Gallo 200g', 'Azeitona verde sem caroço Gallo', 7.99, 'Mercearia'),
  p('Palmito Jureia 300g', 'Palmito açaí em conserva Jureia 300g', 9.99, 'Mercearia'),
  p('Atum Sólido Gomes da Costa 170g', 'Atum sólido em óleo Gomes da Costa', 9.99, 'Mercearia'),
  p('Sardinha Coqueiro 125g', 'Sardinha em óleo Coqueiro 125g', 5.99, 'Mercearia'),
  p(
    'Seleta de Legumes Predilecta 200g',
    'Seleta de legumes conserva Predilecta',
    4.99,
    'Mercearia'
  ),
  p('Creme de Milho Predilecta 200g', 'Creme de milho verde Predilecta 200g', 3.99, 'Mercearia'),
  // Grãos e cereais
  p('Aveia em Flocos Quaker 200g', 'Aveia em flocos regulares Quaker', 4.99, 'Mercearia'),
  p('Granola Tradicional Kobber 800g', 'Granola tradicional Kobber 800g', 14.99, 'Mercearia'),
  p('Lentilha Yoki 500g', 'Lentilha seca Yoki 500g', 7.99, 'Mercearia'),
  p('Grão de Bico Yoki 500g', 'Grão de bico seco Yoki 500g', 8.99, 'Mercearia'),
  p('Quinoa em Grãos 200g', 'Quinoa real em grãos embalagem 200g', 9.99, 'Mercearia'),
  p('Chia em Grãos 150g', 'Semente de chia embalagem 150g', 8.99, 'Mercearia'),
  p('Linhaça Dourada 200g', 'Semente de linhaça dourada 200g', 6.99, 'Mercearia'),
  // Achocolatados e leite em pó
  p('Achocolatado Nescau 400g', 'Achocolatado em pó Nescau 2.0 lata', 9.99, 'Mercearia'),
  p('Achocolatado Toddy 400g', 'Achocolatado em pó Toddy pote 400g', 9.49, 'Mercearia'),
  p('Leite em Pó Ninho 400g', 'Leite em pó Ninho Integral lata 400g', 19.99, 'Mercearia'),
  p('Leite em Pó Itambé 400g', 'Leite em pó integral Itambé 400g', 14.99, 'Mercearia'),
  // Doces e sobremesas
  p('Leite Condensado Moça Bisnaga 395g', 'Leite condensado Moça bisnaga 395g', 7.49, 'Mercearia'),
  p('Creme de Leite Nestlé TP 200g', 'Creme de leite UHT Nestlé TP 200g', 4.49, 'Mercearia'),
  p('Goiabada Quero 300g', 'Goiabada cascão Quero 300g', 5.99, 'Mercearia'),
  p('Doce de Leite Itambé 350g', 'Doce de leite pastoso Itambé 350g', 8.99, 'Mercearia'),
  p('Gelatina em Pó Dr. Oetker 20g', 'Gelatina em pó sabor morango Dr. Oetker', 2.49, 'Mercearia'),
  p('Pudim Royal 50g', 'Pó para pudim de leite condensado Royal', 3.49, 'Mercearia'),
  // Pão e bicoitos de mesa
  p('Torrada Bauducco 160g', 'Torrada levíssima Bauducco integral', 5.99, 'Mercearia'),
  p('Cream Cracker Piraquê 200g', 'Biscoito cream cracker Piraquê', 3.99, 'Mercearia'),
  p('Biscoito Água e Sal Piraquê 200g', 'Biscoito água e sal Piraquê', 3.99, 'Mercearia'),
  p('Pão de Forma Wickbold 400g', 'Pão de forma integral Wickbold 400g', 8.99, 'Mercearia'),
  p('Bisnaguinha Pullman 300g', 'Bisnaguinha Pullman pacote 300g', 7.99, 'Mercearia'),
  // Mel e geleias
  p('Mel Puro Baldoni 300g', 'Mel de abelha puro Baldoni 300g', 19.99, 'Mercearia'),
  p('Geleia de Morango Queensberry 320g', 'Geleia de morango Queensberry', 14.99, 'Mercearia'),
  p('Geleia de Goiaba Queensberry 320g', 'Geleia de goiaba Queensberry', 14.99, 'Mercearia'),
]

// ─── 04. Laticínios & Frios (80 SKUs) ───────────────────────────
const laticiniosFrios: TemplateSampleProduct[] = [
  p('Queijo Mussarela Fatiado 200g', 'Queijo mussarela fatiado 200g', 9.99, 'Laticínios & Frios'),
  p('Queijo Prato Fatiado 200g', 'Queijo prato fatiado 200g', 10.99, 'Laticínios & Frios'),
  p(
    'Queijo Minas Frescal 500g',
    'Queijo tipo minas frescal peça 500g',
    14.99,
    'Laticínios & Frios'
  ),
  p('Queijo Parmesão Ralado 100g', 'Queijo parmesão ralado 100g', 8.99, 'Laticínios & Frios'),
  p(
    'Queijo Cottage Verde Campo 200g',
    'Queijo cottage cremoso Verde Campo',
    9.99,
    'Laticínios & Frios'
  ),
  p('Queijo Coalho 400g', 'Queijo coalho para assar peça 400g', 16.99, 'Laticínios & Frios'),
  p(
    'Queijo Brie President 125g',
    'Queijo brie cremoso President 125g',
    19.99,
    'Laticínios & Frios'
  ),
  p(
    'Presunto Cozido Fatiado Sadia 200g',
    'Presunto cozido fatiado Sadia 200g',
    8.99,
    'Laticínios & Frios'
  ),
  p(
    'Presunto Defumado Fatiado 200g',
    'Presunto defumado fatiado 200g',
    11.99,
    'Laticínios & Frios'
  ),
  p(
    'Peito de Peru Sadia 200g',
    'Peito de peru defumado Sadia fatiado',
    12.99,
    'Laticínios & Frios'
  ),
  p('Mortadela Ceratti 200g', 'Mortadela Ceratti fatiada 200g', 5.99, 'Laticínios & Frios'),
  p('Salame Italiano Sadia 100g', 'Salame tipo italiano Sadia fatiado', 9.99, 'Laticínios & Frios'),
  p('Apresuntado Fatiado Seara 200g', 'Apresuntado Seara fatiado 200g', 6.99, 'Laticínios & Frios'),
  p(
    'Requeijão Cremoso Catupiry 220g',
    'Requeijão cremoso Catupiry 220g',
    9.99,
    'Laticínios & Frios'
  ),
  p(
    'Requeijão Cremoso Vigor 200g',
    'Requeijão cremoso Vigor copo 200g',
    7.99,
    'Laticínios & Frios'
  ),
  p(
    'Cream Cheese Philadelphia 150g',
    'Cream cheese Philadelphia original',
    9.99,
    'Laticínios & Frios'
  ),
  p(
    'Manteiga com Sal Itambé 200g',
    'Manteiga extra com sal Itambé 200g',
    9.99,
    'Laticínios & Frios'
  ),
  p(
    'Manteiga sem Sal Président 200g',
    'Manteiga extra sem sal Président 200g',
    14.99,
    'Laticínios & Frios'
  ),
  p('Margarina Qualy 500g', 'Margarina Qualy cremosa c/ sal 500g', 8.99, 'Laticínios & Frios'),
  p('Margarina Doriana 500g', 'Margarina Doriana cremosa 500g', 7.99, 'Laticínios & Frios'),
  p(
    'Iogurte Natural Nestlé 170g',
    'Iogurte natural integral Nestlé 170g',
    3.99,
    'Laticínios & Frios'
  ),
  p('Iogurte Grego Danone 100g', 'Iogurte grego Danone tradicional', 4.49, 'Laticínios & Frios'),
  p(
    'Iogurte Corpus Morango 850g',
    'Iogurte desnatado Corpus morango 850g',
    8.99,
    'Laticínios & Frios'
  ),
  p(
    'Leite Fermentado Chamyto 450g',
    'Leite fermentado Chamyto embalagem',
    5.99,
    'Laticínios & Frios'
  ),
  p('Bebida Láctea Batavo 900g', 'Bebida láctea Batavo morango 900g', 5.99, 'Laticínios & Frios'),
  p(
    'Ovo Branco Bandeja 12un',
    'Ovos brancos tipo grande cx 12 unidades',
    9.99,
    'Laticínios & Frios'
  ),
  p('Ovo Caipira Bandeja 10un', 'Ovos caipira bandeja 10 unidades', 12.99, 'Laticínios & Frios'),
  p(
    'Ovo Branco Bandeja 30un',
    'Ovos brancos tipo grande cx 30 unidades',
    22.99,
    'Laticínios & Frios'
  ),
  p(
    'Queijo Cheddar Fatiado 200g',
    'Queijo cheddar processado fatiado',
    10.99,
    'Laticínios & Frios'
  ),
  p('Bacon Fatiado Sadia 250g', 'Bacon defumado fatiado Sadia 250g', 14.99, 'Laticínios & Frios'),
  p(
    'Linguiça Calabresa Sadia 500g',
    'Linguiça calabresa defumada Sadia',
    14.99,
    'Laticínios & Frios'
  ),
  p(
    'Linguiça Toscana Perdigão 700g',
    'Linguiça toscana suína Perdigão 700g',
    16.99,
    'Laticínios & Frios'
  ),
  p('Salsicha Hot Dog Sadia 500g', 'Salsicha tipo hot dog Sadia 500g', 7.99, 'Laticínios & Frios'),
  p(
    'Blanquet de Peru Sadia 200g',
    'Blanquet de peru defumado Sadia 200g',
    12.99,
    'Laticínios & Frios'
  ),
  p(
    'Creme de Ricota Light Tirolez 200g',
    'Creme de ricota light Tirolez 200g',
    7.99,
    'Laticínios & Frios'
  ),
  p(
    'Queijo Provolone Defumado 200g',
    'Queijo provolone defumado fatia 200g',
    14.99,
    'Laticínios & Frios'
  ),
  p('Nata Nestlé 200g', 'Nata fresca Nestlé copo 200g', 5.99, 'Laticínios & Frios'),
  p('Chantilly Nestlé 250ml', 'Creme chantilly spray Nestlé 250ml', 14.99, 'Laticínios & Frios'),
  p(
    'Ricota Fresca Tirolez 250g',
    'Ricota fresca Tirolez embalagem 250g',
    8.99,
    'Laticínios & Frios'
  ),
  p('Tofu Firme 400g', 'Tofu firme embalagem 400g', 7.99, 'Laticínios & Frios'),
  p('Patê Suíno Sadia 100g', 'Patê suíno cremoso Sadia 100g', 3.99, 'Laticínios & Frios'),
  p('Patê de Presunto Sadia 100g', 'Patê de presunto Sadia pote 100g', 3.99, 'Laticínios & Frios'),
  p('Mussarela de Búfala 200g', 'Mussarela de búfala bolinha 200g', 16.99, 'Laticínios & Frios'),
  p('Gorgonzola Tirolez 200g', 'Queijo gorgonzola Tirolez cunha 200g', 18.99, 'Laticínios & Frios'),
  p('Queijo Gruyère 200g', 'Queijo gruyère importado fatia 200g', 24.99, 'Laticínios & Frios'),
  p('Lombo Canadense Fatiado 150g', 'Lombo canadense fatiado 150g', 11.99, 'Laticínios & Frios'),
  p('Copa Fatiada 100g', 'Copa lombo defumada fatiada 100g', 12.99, 'Laticínios & Frios'),
  p('Queijo Bola Edam 200g', 'Queijo edam tipo bola fatia 200g', 14.99, 'Laticínios & Frios'),
  p('Creme Fraîche 200g', 'Creme fraîche importado pote 200g', 12.99, 'Laticínios & Frios'),
  p('Iogurte Skyr Natural 170g', 'Iogurte tipo skyr natural 170g', 6.99, 'Laticínios & Frios'),
  p(
    'Queijo Minas Padrão 500g',
    'Queijo minas padrão meia cura peça 500g',
    19.99,
    'Laticínios & Frios'
  ),
  p('Kefir Natural 500ml', 'Kefir natural probiótico garrafa 500ml', 9.99, 'Laticínios & Frios'),
  p(
    'Iogurte Grego Danone Frutas Vermelhas 100g',
    'Iogurte grego Danone frutas vermelhas',
    4.49,
    'Laticínios & Frios'
  ),
  p('Manteiga Ghee 200g', 'Manteiga ghee clarificada 200g', 19.99, 'Laticínios & Frios'),
  p(
    'Cream Cheese Light Philadelphia 150g',
    'Cream cheese light Philadelphia 150g',
    10.99,
    'Laticínios & Frios'
  ),
  p('Queijo Emmental 200g', 'Queijo emmental (suíço) fatia 200g', 18.99, 'Laticínios & Frios'),
  p('Presunto Parma Fatiado 100g', 'Presunto tipo parma fatiado 100g', 24.99, 'Laticínios & Frios'),
  p('Peperoni Fatiado 100g', 'Peperoni calabrês fatiado 100g', 9.99, 'Laticínios & Frios'),
  p('Queijo Canastra 250g', 'Queijo canastra artesanal MG cunha 250g', 29.99, 'Laticínios & Frios'),
  p(
    'Pasta de Ricota com Ervas 150g',
    'Pasta de ricota temperada com ervas 150g',
    8.99,
    'Laticínios & Frios'
  ),
  p(
    'Leite Fermentado Yakult 80ml (6un)',
    'Yakult probiótico embalagem 6 frascos',
    9.99,
    'Laticínios & Frios'
  ),
  p('Muçarela Ralada 200g', 'Queijo muçarela ralada 200g', 9.99, 'Laticínios & Frios'),
  p('Queijo Brie Mini 100g', 'Queijo brie porção mini 100g', 12.99, 'Laticínios & Frios'),
  p(
    'Iogurte Natural Desnatado 850g',
    'Iogurte natural desnatado garrafa 850g',
    7.99,
    'Laticínios & Frios'
  ),
  p(
    'Creme de Leite Fresco 200ml',
    'Creme de leite fresco garrafa 200ml',
    6.99,
    'Laticínios & Frios'
  ),
  p('Mascarpone 250g', 'Queijo mascarpone importado 250g', 22.99, 'Laticínios & Frios'),
  p('Linguiça de Frango Sadia 500g', 'Linguiça de frango Sadia 500g', 11.99, 'Laticínios & Frios'),
  p(
    'Hambúrguer Bovino Seara 672g (6un)',
    'Hambúrguer bovino Seara 672g 6un',
    14.99,
    'Laticínios & Frios'
  ),
  p('Nuggets Frango Sadia 300g', 'Nuggets de frango Sadia 300g', 12.99, 'Laticínios & Frios'),
  p(
    'Peito de Frango Temperado 1kg',
    'Peito de frango temperado bandeja 1kg',
    16.99,
    'Laticínios & Frios'
  ),
]

// ─── 05. Higiene Pessoal (80 SKUs) ──────────────────────────────
const higienePessoal: TemplateSampleProduct[] = [
  p(
    'Papel Higiênico Neve 12un',
    'Papel higiênico folha dupla Neve 12 rolos',
    19.99,
    'Higiene Pessoal'
  ),
  p(
    'Papel Higiênico Personal 4un',
    'Papel higiênico folha dupla Personal 4 rolos',
    6.99,
    'Higiene Pessoal'
  ),
  p('Papel Toalha Snob 2un', 'Papel toalha folha dupla Snob 2 rolos', 7.99, 'Higiene Pessoal'),
  p('Sabonete Dove Original 90g', 'Sabonete em barra Dove original 90g', 4.49, 'Higiene Pessoal'),
  p('Sabonete Lux 85g Pack 3un', 'Sabonete Lux botânicas pack 3 unidades', 8.99, 'Higiene Pessoal'),
  p(
    'Sabonete Líquido Protex 250ml',
    'Sabonete líquido antibacteriano Protex',
    12.99,
    'Higiene Pessoal'
  ),
  p('Shampoo Pantene 400ml', 'Shampoo Pantene restauração 400ml', 19.99, 'Higiene Pessoal'),
  p('Shampoo Dove 400ml', 'Shampoo Dove reconstrução completa 400ml', 19.99, 'Higiene Pessoal'),
  p(
    'Shampoo Head & Shoulders 200ml',
    'Shampoo anticaspa Head & Shoulders',
    18.99,
    'Higiene Pessoal'
  ),
  p(
    'Condicionador Pantene 400ml',
    'Condicionador Pantene restauração 400ml',
    19.99,
    'Higiene Pessoal'
  ),
  p('Condicionador Dove 400ml', 'Condicionador Dove nutrição 400ml', 19.99, 'Higiene Pessoal'),
  p(
    'Creme para Pentear Salon Line 300ml',
    'Creme para pentear Salon Line 300ml',
    14.99,
    'Higiene Pessoal'
  ),
  p(
    'Desodorante Rexona Roll-on 50ml',
    'Desodorante antitranspirante Rexona roll-on',
    12.99,
    'Higiene Pessoal'
  ),
  p(
    'Desodorante Dove Aerosol 150ml',
    'Desodorante aerosol Dove original 150ml',
    16.99,
    'Higiene Pessoal'
  ),
  p(
    'Desodorante Old Spice Aerosol 150ml',
    'Desodorante aerosol Old Spice',
    16.99,
    'Higiene Pessoal'
  ),
  p(
    'Creme Dental Colgate 90g',
    'Creme dental Colgate Total 12 Clean Mint',
    6.99,
    'Higiene Pessoal'
  ),
  p('Creme Dental Sensodyne 90g', 'Creme dental Sensodyne branqueador', 14.99, 'Higiene Pessoal'),
  p('Escova Dental Oral-B', 'Escova dental Oral-B Indicator Plus', 9.99, 'Higiene Pessoal'),
  p(
    'Enxaguante Bucal Listerine 500ml',
    'Enxaguante bucal Listerine Cool Mint',
    19.99,
    'Higiene Pessoal'
  ),
  p('Fio Dental Oral-B 50m', 'Fio dental Oral-B essencial 50 metros', 7.99, 'Higiene Pessoal'),
  p('Absorvente Always 8un', 'Absorvente noturno Always suave 8 unidades', 8.99, 'Higiene Pessoal'),
  p('Absorvente Intimus 16un', 'Absorvente diário Intimus 16 unidades', 9.99, 'Higiene Pessoal'),
  p('Fralda Pampers M 20un', 'Fralda descartável Pampers Premium M 20un', 34.99, 'Higiene Pessoal'),
  p('Fralda Pampers G 18un', 'Fralda descartável Pampers Premium G 18un', 34.99, 'Higiene Pessoal'),
  p(
    'Fralda Pampers XG 16un',
    'Fralda descartável Pampers Premium XG 16un',
    34.99,
    'Higiene Pessoal'
  ),
  p(
    'Lenço Umedecido Huggies 48un',
    'Lenço umedecido baby Huggies 48 folhas',
    9.99,
    'Higiene Pessoal'
  ),
  p('Algodão Apolo 100g', 'Algodão hidrófilo Apolo 100 gramas', 6.99, 'Higiene Pessoal'),
  p("Cotonete Johnson's 75un", "Hastes flexíveis Johnson's 75 unidades", 5.99, 'Higiene Pessoal'),
  p(
    'Aparelho de Barbear Gillette 2un',
    'Aparelho de barbear Gillette Prestobarba',
    8.99,
    'Higiene Pessoal'
  ),
  p(
    'Espuma de Barbear Bozzano 200g',
    'Espuma de barbear Bozzano pele sensível',
    14.99,
    'Higiene Pessoal'
  ),
  p('Hidratante Nivea 200ml', 'Hidratante corporal Nivea milk 200ml', 14.99, 'Higiene Pessoal'),
  p(
    'Protetor Solar Nivea FPS 30 200ml',
    'Protetor solar Nivea Sun FPS 30 200ml',
    29.99,
    'Higiene Pessoal'
  ),
  p('Repelente Off! 200ml', 'Repelente de insetos Off! Extra Duração', 19.99, 'Higiene Pessoal'),
  p("Band-Aid Johnson's 40un", 'Curativo adesivo Band-Aid flexível 40un', 12.99, 'Higiene Pessoal'),
  p('Álcool em Gel 70% 500ml', 'Álcool gel 70% higienizador mãos 500ml', 9.99, 'Higiene Pessoal'),
  p(
    'Máscara Descartável 50un',
    'Máscara descartável tripla cx 50 unidades',
    14.99,
    'Higiene Pessoal'
  ),
  p(
    'Preservativo Jontex 3un',
    'Preservativo lubrificado Jontex 3 unidades',
    7.99,
    'Higiene Pessoal'
  ),
  p(
    'Vitamina C Efervescente 10 comp',
    'Vitamina C efervescente 1g 10 comprimidos',
    8.99,
    'Higiene Pessoal'
  ),
  p('Buscopan Composto 20 comp', 'Buscopan Composto analgésico 20 comp', 14.99, 'Higiene Pessoal'),
  p('Dorflex 10 comp', 'Dorflex analgésico/relaxante 10 comp', 6.99, 'Higiene Pessoal'),
  p(
    "Sabonete Líquido Johnson's Baby 200ml",
    "Sabonete líquido infantil Johnson's",
    14.99,
    'Higiene Pessoal'
  ),
  p(
    "Shampoo Johnson's Baby 200ml",
    "Shampoo infantil Johnson's Baby 200ml",
    14.99,
    'Higiene Pessoal'
  ),
  p(
    'Creme para Assaduras Hipoglós 45g',
    'Creme contra assaduras Hipoglós 45g',
    14.99,
    'Higiene Pessoal'
  ),
  p('Sabonete Dove Baby 75g', 'Sabonete hidratante Dove Baby barra', 4.99, 'Higiene Pessoal'),
  p(
    'Gel Dental Infantil Tandy 50g',
    'Gel dental infantil Tandy tutti-frutti',
    5.99,
    'Higiene Pessoal'
  ),
  p("Talco Johnson's Baby 200g", "Talco para bebê Johnson's Baby 200g", 12.99, 'Higiene Pessoal'),
  p(
    'Lenço de Papel Kleenex 50un',
    'Lenço de papel Kleenex caixa 50 unidades',
    7.99,
    'Higiene Pessoal'
  ),
  p('Esponja de Banho Ponjita', 'Esponja de banho Ponjita unidade', 5.99, 'Higiene Pessoal'),
  p(
    'Lâmina de Barbear Gillette Mach3 4un',
    'Cartucho Gillette Mach3 embalagem 4 lâminas',
    29.99,
    'Higiene Pessoal'
  ),
  p(
    'Desodorante Spray Nivea 150ml',
    'Desodorante spray Nivea Men Silver',
    16.99,
    'Higiene Pessoal'
  ),
  p(
    'Sabonete Íntimo Dermacyd 200ml',
    'Sabonete íntimo Dermacyd Femina 200ml',
    24.99,
    'Higiene Pessoal'
  ),
  p(
    'Creme Hidratante Goicoechea 400ml',
    'Creme para pernas Goicoechea refrescante',
    24.99,
    'Higiene Pessoal'
  ),
  p('Acetona Risqué 100ml', 'Removedor de esmalte Risqué 100ml', 4.99, 'Higiene Pessoal'),
  p(
    'Tintura de Cabelo Koleston',
    'Coloração permanente Koleston unidade',
    16.99,
    'Higiene Pessoal'
  ),
  p(
    'Cera Depilatória Veet 250g',
    'Creme depilatório Veet pele normal 250g',
    19.99,
    'Higiene Pessoal'
  ),
  p('Gel Fixador Bozzano 300g', 'Gel fixador Bozzano extra forte 300g', 9.99, 'Higiene Pessoal'),
  p(
    "Óleo Corporal Johnson's Soft 200ml",
    "Óleo corporal Johnson's Soft Musk 200ml",
    16.99,
    'Higiene Pessoal'
  ),
  p('Perfume Desodorante Kaiak 100ml', 'Desodorante colônia Kaiak 100ml', 99.99, 'Higiene Pessoal'),
  p('Esmalte Risqué 8ml', 'Esmalte para unhas Risqué cremoso 8ml', 4.99, 'Higiene Pessoal'),
  p(
    'Kit Manicure Descartável',
    'Kit manicure descartável lixa + palito 3un',
    3.99,
    'Higiene Pessoal'
  ),
]

// ─── 06. Limpeza (80 SKUs) ──────────────────────────────────────
const limpeza: TemplateSampleProduct[] = [
  p('Detergente Ypê 500ml', 'Detergente líquido neutro Ypê 500ml', 2.49, 'Limpeza'),
  p('Detergente Limpol 500ml', 'Detergente líquido Limpol neutro 500ml', 2.29, 'Limpeza'),
  p('Sabão em Pó Omo 800g', 'Sabão em pó Omo Lavagem Perfeita 800g', 12.99, 'Limpeza'),
  p('Sabão em Pó Omo 1,6kg', 'Sabão em pó Omo Lavagem Perfeita 1,6kg', 21.99, 'Limpeza'),
  p('Sabão em Pó Brilhante 800g', 'Sabão em pó Brilhante Delicadeza 800g', 9.99, 'Limpeza'),
  p('Sabão Líquido Omo 3L', 'Sabão líquido concentrado Omo 3 litros', 34.99, 'Limpeza'),
  p('Amaciante Downy 500ml', 'Amaciante concentrado Downy suavidade', 11.99, 'Limpeza'),
  p('Amaciante Comfort 500ml', 'Amaciante concentrado Comfort 500ml', 11.49, 'Limpeza'),
  p('Água Sanitária Candida 2L', 'Água sanitária Candida 2 litros', 5.99, 'Limpeza'),
  p('Água Sanitária Ypê 2L', 'Água sanitária Ypê 2 litros', 4.99, 'Limpeza'),
  p('Desinfetante Pinho Sol 1L', 'Desinfetante Pinho Sol original 1 litro', 8.99, 'Limpeza'),
  p('Desinfetante Lysoform 1L', 'Desinfetante Lysoform original 1 litro', 10.99, 'Limpeza'),
  p('Limpador Multiuso Veja 500ml', 'Limpador multiuso Veja original 500ml', 7.99, 'Limpeza'),
  p(
    'Limpador Multiuso Veja 2L Refil',
    'Limpador multiuso Veja refil econômico 2L',
    17.99,
    'Limpeza'
  ),
  p('Limpa Vidros Veja 500ml', 'Limpa vidros Veja Vidrex 500ml', 9.99, 'Limpeza'),
  p('Alvejante Vanish 450ml', 'Alvejante sem cloro Vanish 450ml', 14.99, 'Limpeza'),
  p(
    'Esponja Scotch-Brite Multiuso 3un',
    'Esponja multiuso Scotch-Brite 3 unidades',
    4.99,
    'Limpeza'
  ),
  p(
    'Esponja Scotch-Brite Limpeza Pesada',
    'Esponja Scotch-Brite alta performance',
    3.99,
    'Limpeza'
  ),
  p('Pano de Chão Multiuso', 'Pano de chão multiuso algodão unidade', 4.99, 'Limpeza'),
  p('Flanela Microfibra', 'Flanela microfibra multiuso unidade', 6.99, 'Limpeza'),
  p('Luva de Limpeza Sanro M', 'Luva de borracha para limpeza tamanho M', 5.99, 'Limpeza'),
  p('Saco de Lixo 30L 50un', 'Saco de lixo preto 30 litros 50 unidades', 9.99, 'Limpeza'),
  p('Saco de Lixo 50L 30un', 'Saco de lixo preto 50 litros 30 unidades', 9.99, 'Limpeza'),
  p('Saco de Lixo 100L 20un', 'Saco de lixo preto 100 litros 20 unidades', 12.99, 'Limpeza'),
  p('Inseticida SBP 300ml', 'Inseticida aerosol SBP 300ml', 14.99, 'Limpeza'),
  p('Inseticida Raid Mult-Insetos 300ml', 'Inseticida Raid multi-insetos 300ml', 13.99, 'Limpeza'),
  p('Vassoura Noviça', 'Vassoura cerdas plásticas Noviça', 14.99, 'Limpeza'),
  p('Rodo Noviça 40cm', 'Rodo de borracha Noviça 40cm', 12.99, 'Limpeza'),
  p('Balde 10L', 'Balde plástico 10 litros', 9.99, 'Limpeza'),
  p('Pá de Lixo', 'Pá de lixo plástica resistente', 5.99, 'Limpeza'),
  p('Sabão em Barra Ypê 5un', 'Sabão em barra glicerinado Ypê 5 unidades', 9.99, 'Limpeza'),
  p('Lava-Roupas Líquido Ariel 2L', 'Sabão líquido Ariel concentrado 2 litros', 29.99, 'Limpeza'),
  p('Tira Manchas Vanish Líquido 500ml', 'Tira manchas Vanish Oxi Action 500ml', 16.99, 'Limpeza'),
  p('Limpa Alumínio Brilhante 500ml', 'Limpa alumínio Brilhante líquido 500ml', 5.99, 'Limpeza'),
  p('Limpa Forno Mr. Músculo 300ml', 'Limpa forno Mr. Músculo aerosol 300ml', 14.99, 'Limpeza'),
  p('Desentupidor de Ralo 300g', 'Desentupidor granulado para ralos 300g', 9.99, 'Limpeza'),
  p('Naftalina 30g', 'Naftalina em bolas embalagem 30g', 3.99, 'Limpeza'),
  p('Cera Líquida para Piso 750ml', 'Cera líquida autobrilho piso frio 750ml', 9.99, 'Limpeza'),
  p('Desinfetante Tipo Cloro Gel 500ml', 'Desinfetante cloro gel banheiro 500ml', 8.99, 'Limpeza'),
  p('Limpa Inox Tramontina 300ml', 'Limpa inox spray Tramontina 300ml', 19.99, 'Limpeza'),
  p('Purificador Bom Ar 360ml', 'Purificador de ar Bom Ar aerosol 360ml', 12.99, 'Limpeza'),
  p('Pedra Sanitária Pato', 'Pedra sanitária Pato com cesta plástica', 5.99, 'Limpeza'),
  p('Limpa Piso Limpol 1L', 'Limpa piso Limpol lavanda 1 litro', 6.99, 'Limpeza'),
  p('Sabão Líquido Ypê 500ml', 'Detergente líquido para louça Ypê coco', 2.49, 'Limpeza'),
  p('Lã de Aço Bombril 8un', 'Lã de aço Bombril 8 unidades', 2.99, 'Limpeza'),
  p('Cesto Organizador PP', 'Cesto organizador plástico polipropileno', 12.99, 'Limpeza'),
  p('Pregador de Roupa 12un', 'Prendedor de roupa plástico 12 unidades', 3.99, 'Limpeza'),
  p('Cabide Plástico 6un', 'Cabide para roupa plástico 6 unidades', 8.99, 'Limpeza'),
  p('Mop Giratório com Balde', 'Mop giratório com balde espremedor', 49.99, 'Limpeza'),
  p('Aspirador Portátil', 'Mini aspirador portátil para migalhas', 79.99, 'Limpeza'),
  p('Vela Perfumada Glade', 'Vela perfumada aromatizante Glade', 14.99, 'Limpeza'),
  p('Sachê Perfumado para Guarda-Roupa', 'Sachê aromatizante para guarda-roupa', 4.99, 'Limpeza'),
  p('Limpa Carpete Resolve 500ml', 'Limpador para tapetes Resolve 500ml', 16.99, 'Limpeza'),
  p('Sapólio Radium Cremoso 300ml', 'Sapólio cremoso Radium para pia 300ml', 4.99, 'Limpeza'),
  p('Papel Alumínio 30cm x 7,5m', 'Papel alumínio rolo 30cm x 7,5 metros', 6.99, 'Limpeza'),
  p('Filme PVC Transparente 28cm x 15m', 'Filme plástico PVC rolo 28cm x 15m', 4.99, 'Limpeza'),
  p('Saco Zip Lock Médio 20un', 'Saco hermético zip lock médio 20 unidades', 5.99, 'Limpeza'),
  p('Pote Plástico 500ml 3un', 'Pote plástico com tampa 500ml 3 unidades', 9.99, 'Limpeza'),
  p('Marmita Descartável 750ml 10un', 'Marmita descartável PP 750ml 10 unidades', 8.99, 'Limpeza'),
  p('Copo Descartável 200ml 100un', 'Copo descartável PP 200ml 100 unidades', 6.99, 'Limpeza'),
]

// ─── 07. Congelados (80 SKUs) ───────────────────────────────────
const congelados: TemplateSampleProduct[] = [
  p(
    'Pizza Congelada Sadia Mussarela',
    'Pizza congelada Sadia sabor mussarela 460g',
    14.99,
    'Congelados'
  ),
  p('Pizza Congelada Seara Calabresa', 'Pizza congelada Seara calabresa 460g', 13.99, 'Congelados'),
  p(
    'Pizza Congelada Dr. Oetker 4 Queijos',
    'Pizza Ristorante Dr. Oetker 4 Queijos',
    24.99,
    'Congelados'
  ),
  p(
    'Lasanha Congelada Sadia Bolonhesa 600g',
    'Lasanha congelada Sadia bolonhesa 600g',
    16.99,
    'Congelados'
  ),
  p(
    'Lasanha Congelada Perdigão 4 Queijos 600g',
    'Lasanha Perdigão 4 queijos 600g',
    15.99,
    'Congelados'
  ),
  p('Nuggets Sadia 300g', 'Nuggets de frango empanado Sadia 300g', 12.99, 'Congelados'),
  p('Nuggets Seara 300g', 'Nuggets de frango Seara 300g', 11.99, 'Congelados'),
  p('Steak Empanado Sadia 100g', 'Empanado tipo steak frango Sadia 100g', 4.99, 'Congelados'),
  p(
    'Hambúrguer Seara Gourmet 360g',
    'Hambúrguer bovino Seara Gourmet 360g 4un',
    16.99,
    'Congelados'
  ),
  p('Hambúrguer Sadia Angus 340g', 'Hambúrguer Sadia Angus 340g 2 unidades', 19.99, 'Congelados'),
  p('Pão de Queijo Forno de Minas 400g', 'Pão de queijo Forno de Minas 400g', 14.99, 'Congelados'),
  p(
    'Coxinha da Asa Congelada Seara 1kg',
    'Coxinha da asa de frango Seara 1kg',
    17.99,
    'Congelados'
  ),
  p('Batata Pré-Frita McCain 400g', 'Batata pré-frita congelada McCain 400g', 9.99, 'Congelados'),
  p(
    'Batata Pré-Frita McCain 1,5kg',
    'Batata pré-frita congelada McCain 1,5kg',
    24.99,
    'Congelados'
  ),
  p('Polpa de Açaí 400g', 'Polpa de açaí congelada embalagem 400g', 16.99, 'Congelados'),
  p('Polpa de Fruta Maracujá 100g', 'Polpa de maracujá congelada 100g', 3.49, 'Congelados'),
  p('Polpa de Fruta Morango 100g', 'Polpa de morango congelada 100g', 3.49, 'Congelados'),
  p('Sorvete Kibon Magnum 3un', 'Picolé Magnum clássico Kibon 3 unidades', 19.99, 'Congelados'),
  p('Sorvete Kibon Cornetto 2un', 'Cornetto clássico Kibon 2 unidades', 14.99, 'Congelados'),
  p('Sorvete Pote Kibon 1,5L', 'Sorvete pote Kibon napolitano 1,5 litro', 22.99, 'Congelados'),
  p('Picolé Nestlé Prestígio', 'Picolé Nestlé sabor Prestígio unidade', 5.99, 'Congelados'),
  p('Picolé Kibom Fruttare Manga', 'Picolé Fruttare manga Kibon unidade', 4.99, 'Congelados'),
  p('Açaí na Tigela Congelado 500g', 'Açaí pronto tigela congelado 500g', 14.99, 'Congelados'),
  p('Filé de Peixe Congelado 400g', 'Filé de merluza congelado Seara 400g', 14.99, 'Congelados'),
  p('Camarão Congelado 400g', 'Camarão cinza limpo congelado 400g', 29.99, 'Congelados'),
  p('Legumes Congelados Mix 300g', 'Mix de legumes congelados Bonduelle', 8.99, 'Congelados'),
  p('Brócolis Congelado 300g', 'Brócolis ninja congelado embalagem 300g', 7.99, 'Congelados'),
  p('Ervilha Congelada 300g', 'Ervilha congelada Bonduelle 300g', 7.99, 'Congelados'),
  p('Milho Verde Congelado 300g', 'Milho verde em grãos congelado 300g', 6.99, 'Congelados'),
  p('Mandioca Congelada 500g', 'Mandioca descascada congelada 500g', 6.99, 'Congelados'),
  p(
    'Esfiha Congelada 360g (6un)',
    'Esfiha congelada carne bandeja 6 unidades',
    12.99,
    'Congelados'
  ),
  p('Croquete de Carne 300g', 'Croquete de carne congelado 300g', 9.99, 'Congelados'),
  p('Bolinho de Bacalhau 300g', 'Bolinho de bacalhau congelado 300g', 16.99, 'Congelados'),
  p('Kibe Congelado 300g', 'Kibe congelado para fritar 300g', 14.99, 'Congelados'),
  p('Empada de Frango 6un', 'Empada de frango congelada 6 unidades', 12.99, 'Congelados'),
  p('Mini Churros Congelados 300g', 'Mini churros recheados congelados 300g', 11.99, 'Congelados'),
  p('Massa Folhada Congelada 400g', 'Massa folhada congelada 400g', 9.99, 'Congelados'),
  p('Massa para Pastel 500g', 'Massa para pastel congelada 500g', 8.99, 'Congelados'),
  p("Sorvete Ben & Jerry's 458ml", "Sorvete Ben & Jerry's Cookie Dough 458ml", 39.99, 'Congelados'),
  p('Sorvete Häagen-Dazs 473ml', 'Sorvete Häagen-Dazs baunilha 473ml', 44.99, 'Congelados'),
  p('Picolé de Frutas Artesanal un', 'Picolé artesanal de frutas da estação', 5.99, 'Congelados'),
  p(
    'Bolo de Chocolate Congelado 500g',
    'Bolo de chocolate congelado fatiado 500g',
    16.99,
    'Congelados'
  ),
  p('Waffle Congelado 6un', 'Waffle congelado para toaster 6 unidades', 12.99, 'Congelados'),
  p('Mini Pizza Brotinho 4un', 'Mini pizza brotinho sortida congelada 4un', 14.99, 'Congelados'),
  p('Filé de Tilápia 500g', 'Filé de tilápia congelado 500g', 19.99, 'Congelados'),
  p('Peito de Frango Congelado 1kg', 'Peito de frango sem osso congelado 1kg', 14.99, 'Congelados'),
  p(
    'Coxa e Sobrecoxa Congelada 1kg',
    'Coxa e sobrecoxa de frango congelada 1kg',
    12.99,
    'Congelados'
  ),
  p('Carne Moída Congelada 500g', 'Carne moída bovina congelada 500g', 14.99, 'Congelados'),
  p('Linguiça de Pernil Congelada 700g', 'Linguiça de pernil congelada 700g', 12.99, 'Congelados'),
  p(
    'Calabresa Defumada Congelada 500g',
    'Linguiça calabresa defumada cong. 500g',
    14.99,
    'Congelados'
  ),
  p(
    'Mix Legumes Primavera Bonduelle 300g',
    'Mix primavera cenoura/vagem Bonduelle',
    8.99,
    'Congelados'
  ),
  p('Espinafre Congelado 300g', 'Espinafre picado congelado 300g', 6.99, 'Congelados'),
  p('Mandioquinha Congelada 500g', 'Mandioquinha descascada congelada 500g', 8.99, 'Congelados'),
  p(
    'Risoles Presunto e Queijo 300g',
    'Risoles presunto e queijo congelado 300g',
    11.99,
    'Congelados'
  ),
  p('Coxinha Congelada 300g', 'Coxinha de frango congelada 300g', 12.99, 'Congelados'),
  p('Massa para Wonton 200g', 'Massa para wonton/gyoza congelada 200g', 8.99, 'Congelados'),
  p('Guioza Congelada 320g', 'Guioza recheada congelada 320g', 16.99, 'Congelados'),
  p('Lamen Congelado Premium 450g', 'Lamen congelado tipo ramen premium 450g', 14.99, 'Congelados'),
  p('Edamame Congelado 300g', 'Edamame em vagem congelado 300g', 12.99, 'Congelados'),
  p('Pão de Alho Congelado 400g', 'Pão de alho bolinha congelado 400g', 12.99, 'Congelados'),
]

// ─── 08. Snacks & Doces (80 SKUs) ──────────────────────────────
const snacksDoces: TemplateSampleProduct[] = [
  p('Batata Chips Ruffles 96g', 'Batata ondulada Ruffles original 96g', 8.99, 'Snacks & Doces'),
  p("Batata Chips Lay's 96g", "Batata Lay's clássica lisa 96g", 8.99, 'Snacks & Doces'),
  p('Doritos Nacho 96g', 'Salgadinho Doritos sabor nacho 96g', 8.99, 'Snacks & Doces'),
  p('Cheetos Bola 37g', 'Salgadinho Cheetos bolinha queijo 37g', 3.49, 'Snacks & Doces'),
  p('Fandangos Presunto 45g', 'Salgadinho Fandangos sabor presunto', 3.49, 'Snacks & Doces'),
  p('Amendoim Japonês 150g', 'Amendoim tipo japonês embalagem 150g', 5.99, 'Snacks & Doces'),
  p('Amendoim Torrado Salgado 200g', 'Amendoim torrado salgado 200g', 4.99, 'Snacks & Doces'),
  p('Castanha de Caju 100g', 'Castanha de caju torrada salgada 100g', 16.99, 'Snacks & Doces'),
  p('Mix de Nuts 150g', 'Mix de castanhas e frutas secas 150g', 14.99, 'Snacks & Doces'),
  p(
    'Pipoca de Micro-ondas Yoki 100g',
    'Pipoca de micro-ondas Yoki manteiga',
    4.99,
    'Snacks & Doces'
  ),
  p('Pipoca Pronta Caramelo 80g', 'Pipoca pronta sabor caramelo 80g', 5.99, 'Snacks & Doces'),
  p('Biscoito Oreo 90g', 'Biscoito recheado Oreo original 90g', 3.99, 'Snacks & Doces'),
  p('Biscoito Negresco 90g', 'Biscoito recheado Negresco Nestlé', 3.49, 'Snacks & Doces'),
  p('Biscoito Passatempo 130g', 'Biscoito recheado Passatempo chocolate', 3.99, 'Snacks & Doces'),
  p(
    'Biscoito Wafer Bauducco 140g',
    'Biscoito wafer Bauducco chocolate 140g',
    4.99,
    'Snacks & Doces'
  ),
  p('Biscoito Maisena Vitarella 400g', 'Biscoito maisena Vitarella 400g', 4.99, 'Snacks & Doces'),
  p('Biscoito Maria Piraquê 200g', 'Biscoito Maria Piraquê 200g', 3.99, 'Snacks & Doces'),
  p(
    'Biscoito Cereale Integral 130g',
    'Biscoito integral Cereale aveia/mel',
    5.99,
    'Snacks & Doces'
  ),
  p(
    'Chocolate Lacta Ao Leite 80g',
    'Tablete de chocolate Lacta ao leite 80g',
    6.99,
    'Snacks & Doces'
  ),
  p(
    'Chocolate Lacta Diamante Negro 80g',
    'Tablete Lacta Diamante Negro 80g',
    6.99,
    'Snacks & Doces'
  ),
  p('Chocolate Nestlé Classic 80g', 'Tablete Nestlé Classic ao leite 80g', 6.99, 'Snacks & Doces'),
  p('Chocolate Garoto Caixa 250g', 'Caixa bombom sortido Garoto 250g', 14.99, 'Snacks & Doces'),
  p('Chocolate Lacta Caixa 250g', 'Caixa bombom sortido Lacta 250g', 14.99, 'Snacks & Doces'),
  p(
    'Barra de Cereal Nutry 25g 3un',
    'Barra de cereal Nutry frutas 3 unidades',
    5.99,
    'Snacks & Doces'
  ),
  p('Bala Halls 28g', 'Bala Halls extra forte pacote 28g', 2.99, 'Snacks & Doces'),
  p('Bala Fini Minhoca 80g', 'Bala de gelatina Fini minhocas 80g', 5.99, 'Snacks & Doces'),
  p('Chiclete Trident 8g', 'Chiclete Trident menta cartela 8g', 2.99, 'Snacks & Doces'),
  p('Chiclete Mentos 37g', 'Chiclete Mentos garrafa pure fresh', 6.99, 'Snacks & Doces'),
  p('Paçoquinha 18g 10un', 'Paçoquinha rolha Love embalagem 10 unidades', 7.99, 'Snacks & Doces'),
  p('Pé de Moleque 20g 10un', 'Pé de moleque embalagem 10 unidades', 6.99, 'Snacks & Doces'),
  p('KitKat 41,5g', 'Chocolate KitKat 4 fingers 41,5g', 4.99, 'Snacks & Doces'),
  p('Bis Lacta 126g', 'Chocolate Bis Lacta caixa 20 unidades', 9.99, 'Snacks & Doces'),
  p('Snickers 45g', 'Chocolate Snickers com caramelo 45g', 4.99, 'Snacks & Doces'),
  p("M&M's Chocolate 45g", "Confeito M&M's amendoim chocolate 45g", 5.99, 'Snacks & Doces'),
  p('Kinder Bueno 43g', 'Chocolate Kinder Bueno barra 43g', 6.99, 'Snacks & Doces'),
  p('Nutella 140g', 'Creme de avelã Nutella pote 140g', 12.99, 'Snacks & Doces'),
  p('Nutella 350g', 'Creme de avelã Nutella pote 350g', 22.99, 'Snacks & Doces'),
  p('Barra Proteína Bold 60g', 'Barra proteica Bold brownie 60g', 9.99, 'Snacks & Doces'),
  p(
    'Batata Pringles Original 114g',
    'Batata Pringles sabor original 114g',
    14.99,
    'Snacks & Doces'
  ),
  p(
    'Batata Pringles Creme e Cebola 114g',
    'Batata Pringles sour cream cebola',
    14.99,
    'Snacks & Doces'
  ),
  p(
    'Snack Elma Chips Sensações 45g',
    'Snack Sensações Thai Sweet Chili 45g',
    5.99,
    'Snacks & Doces'
  ),
  p('Tortuguita 15g 3un', 'Chocolate Tortuguita ao leite 3 unidades', 5.99, 'Snacks & Doces'),
  p(
    'Serenata de Amor cx 20un',
    'Bombom Serenata de Amor caixa 20 unidades',
    16.99,
    'Snacks & Doces'
  ),
  p('Sonho de Valsa cx 20un', 'Bombom Sonho de Valsa caixa 20 unidades', 24.99, 'Snacks & Doces'),
  p(
    'Pirulito Pin Pop 50un',
    'Pirulito Pin Pop chicle sortido 50 unidades',
    19.99,
    'Snacks & Doces'
  ),
  p('Jujuba Fini 250g', 'Bala de gelatina Fini sortida 250g', 9.99, 'Snacks & Doces'),
  p('Torresmo Pururuca 100g', 'Torresmo pururuca crocante 100g', 8.99, 'Snacks & Doces'),
  p('Snack Integral Flormel 30g', 'Snack salgado integral Flormel 30g', 4.99, 'Snacks & Doces'),
  p('Barra de Granola 25g 3un', 'Barra de granola mel e castanha 3un', 5.49, 'Snacks & Doces'),
  p('Cookie Bauducco 60g', 'Cookie chips chocolate Bauducco 60g', 3.99, 'Snacks & Doces'),
  p('Rosquinha Coco Vitarella 300g', 'Rosquinha de coco Vitarella 300g', 4.99, 'Snacks & Doces'),
  p(
    'Biscoito Amanteigado Bauducco 375g',
    'Biscoito amanteigado Bauducco 375g',
    8.99,
    'Snacks & Doces'
  ),
  p(
    "Chocolate Hershey's meio amargo 92g",
    "Tablete Hershey's Special Dark 92g",
    7.99,
    'Snacks & Doces'
  ),
  p('Twix 45g', 'Chocolate Twix caramelo 45g', 4.99, 'Snacks & Doces'),
  p('Ruffles Cheddar 96g', 'Batata ondulada Ruffles sabor cheddar', 8.99, 'Snacks & Doces'),
  p('Torcida Cebola 70g', 'Salgadinho Torcida sabor cebola 70g', 3.49, 'Snacks & Doces'),
  p('Cebolitos 60g', 'Salgadinho Cebolitos Elma Chips 60g', 3.49, 'Snacks & Doces'),
  p('Baconzitos 55g', 'Salgadinho Baconzitos Elma Chips 55g', 3.49, 'Snacks & Doces'),
  p('Bala Ursinho Haribo 80g', 'Bala de gelatina Haribo ursinhos 80g', 6.99, 'Snacks & Doces'),
  p('Chocolate Trento 32g', 'Wafer recheado Trento chocolate 32g', 2.99, 'Snacks & Doces'),
]

// ─── 09. Padaria & Matinal (60 SKUs) ────────────────────────────
const padariaMatinal: TemplateSampleProduct[] = [
  p('Pão Francês 10un', 'Pão francês/cacetinho 10 unidades', 5.99, 'Padaria & Matinal'),
  p('Pão de Forma Integral 450g', 'Pão de forma integral fatiado 450g', 8.99, 'Padaria & Matinal'),
  p('Pão de Forma Branco 450g', 'Pão de forma branco fatiado 450g', 6.99, 'Padaria & Matinal'),
  p('Pão de Hot Dog 6un', 'Pão para cachorro-quente 6 unidades', 5.99, 'Padaria & Matinal'),
  p('Pão de Hambúrguer 6un', 'Pão para hambúrguer 6 unidades', 7.99, 'Padaria & Matinal'),
  p('Tortilha Wickbold 6un', 'Tortilha integral Wickbold 6 unidades', 9.99, 'Padaria & Matinal'),
  p('Bolo Pronto Pullman 250g', 'Bolo pronto chocolate Pullman 250g', 8.99, 'Padaria & Matinal'),
  p('Bolo de Laranja Ana Maria', 'Bolo bolinho Ana Maria 35g unidade', 2.99, 'Padaria & Matinal'),
  p('Croissant Congelado 300g', 'Croissant pré-assado congelado 300g', 12.99, 'Padaria & Matinal'),
  p('Cuca Alemã 300g', 'Cuca alemã de farofa sweet 300g', 14.99, 'Padaria & Matinal'),
  p('Sonho Recheado 80g', 'Sonho recheado doce de leite 80g', 4.99, 'Padaria & Matinal'),
  p('Rosca Doce Pullman 350g', 'Rosca doce glaceada Pullman 350g', 12.99, 'Padaria & Matinal'),
  p('Panetone Bauducco 500g', 'Panetone frutas Bauducco 500g', 24.99, 'Padaria & Matinal'),
  p(
    "Cereal Sucrilhos Kellogg's 240g",
    "Cereal matinal Sucrilhos Kellogg's",
    11.99,
    'Padaria & Matinal'
  ),
  p('Cereal Nescau Nestlé 210g', 'Cereal matinal Nescau Nestlé 210g', 10.99, 'Padaria & Matinal'),
  p('Cereal Granola Nesfit 300g', 'Granola cereal matinal Nesfit 300g', 9.99, 'Padaria & Matinal'),
  p(
    'Aveia Flocos Finos Quaker 200g',
    'Aveia em flocos finos Quaker 200g',
    4.99,
    'Padaria & Matinal'
  ),
  p('Pão Sírio 6un', 'Pão sírio (árabe) 6 unidades', 7.99, 'Padaria & Matinal'),
  p('Bisnaguinha Seven Boys 300g', 'Bisnaguinha Seven Boys 300g', 7.49, 'Padaria & Matinal'),
  p('Wrap Integral 8un', 'Wrap integral tortilha 8 unidades', 12.99, 'Padaria & Matinal'),
  p(
    'Pão Australiano Seven Boys 350g',
    'Pão australiano Seven Boys 350g',
    9.99,
    'Padaria & Matinal'
  ),
  p('Pão Ciabatta Artesanal 4un', 'Pão ciabatta artesanal 4 unidades', 11.99, 'Padaria & Matinal'),
  p('Broa de Milho 6un', 'Broa de fubá/milho 6 unidades', 7.99, 'Padaria & Matinal'),
  p(
    'Pão de Queijo Congelado 400g',
    'Pão de queijo congelado mineiro 400g',
    14.99,
    'Padaria & Matinal'
  ),
  p('Pão Brioche 4un', 'Pão brioche artesanal 4 unidades', 12.99, 'Padaria & Matinal'),
  p(
    'Torrada Integral Bauducco 160g',
    'Torrada integral levíssima Bauducco',
    5.99,
    'Padaria & Matinal'
  ),
  p(
    'Geleia de Morango Diet 200g',
    'Geleia diet de morango embalagem 200g',
    9.99,
    'Padaria & Matinal'
  ),
  p('Manteiga de Amendoim 300g', 'Manteiga de amendoim integral 300g', 19.99, 'Padaria & Matinal'),
  p('Tapioca Hidratada 500g', 'Goma de tapioca hidratada pronta 500g', 5.99, 'Padaria & Matinal'),
  p('Acerola em Pó 100g', 'Vitamina de acerola em pó solúvel 100g', 14.99, 'Padaria & Matinal'),
  p('Müesli Swiss Cereal 500g', 'Müesli tradicional suíço 500g', 16.99, 'Padaria & Matinal'),
  p('Pancake Mix Pronto 200g', 'Mistura pronta para panquecas 200g', 8.99, 'Padaria & Matinal'),
  p('Waffles Mix 200g', 'Mistura pronta para waffles 200g', 9.99, 'Padaria & Matinal'),
  p('Mel Silvestre 500g', 'Mel silvestre puro embalagem 500g', 24.99, 'Padaria & Matinal'),
  p('Doce de Leite Colonial 400g', 'Doce de leite colonial pote 400g', 12.99, 'Padaria & Matinal'),
  p(
    'Bisc. Amanteigado Leite 400g',
    'Biscoito amanteigado sabor leite 400g',
    7.99,
    'Padaria & Matinal'
  ),
  p('Cookie Integral Aveia 200g', 'Cookie integral aveia e passas 200g', 6.99, 'Padaria & Matinal'),
  p(
    'Bolo Integral Banana 300g',
    'Bolo integral de banana caseiro 300g',
    14.99,
    'Padaria & Matinal'
  ),
  p('Palha Italiana 200g', 'Palha italiana artesanal 200g', 12.99, 'Padaria & Matinal'),
  p(
    'Mini Queijo Minas 30g 4un',
    'Mini queijo minas frescal snack 30g 4un',
    6.99,
    'Padaria & Matinal'
  ),
]

// ─── 10. Hortifruti (80 SKUs) ───────────────────────────────────
const hortifruti: TemplateSampleProduct[] = [
  p('Banana Prata kg', 'Banana prata madura por quilo', 5.99, 'Hortifruti'),
  p('Banana Nanica kg', 'Banana nanica por quilo', 4.49, 'Hortifruti'),
  p('Maçã Fuji kg', 'Maçã fuji selecionada por quilo', 8.99, 'Hortifruti'),
  p('Maçã Gala kg', 'Maçã gala selecionada por quilo', 7.99, 'Hortifruti'),
  p('Laranja Pera kg', 'Laranja pera para suco por quilo', 4.99, 'Hortifruti'),
  p('Limão Tahiti kg', 'Limão tahiti verde por quilo', 5.99, 'Hortifruti'),
  p('Mamão Papaya un', 'Mamão papaya maduro unidade', 4.99, 'Hortifruti'),
  p('Melancia un (média)', 'Melancia inteira tamanho médio', 14.99, 'Hortifruti'),
  p('Melão un', 'Melão amarelo inteiro unidade', 9.99, 'Hortifruti'),
  p('Manga Palmer un', 'Manga palmer grande unidade', 3.99, 'Hortifruti'),
  p('Abacaxi Pérola un', 'Abacaxi pérola grande unidade', 6.99, 'Hortifruti'),
  p('Uva Itália kg', 'Uva itália de mesa por quilo', 12.99, 'Hortifruti'),
  p('Morango Bandeja 250g', 'Morango selecionado bandeja 250g', 8.99, 'Hortifruti'),
  p('Kiwi Bandeja 3un', 'Kiwi importado bandeja 3 unidades', 7.99, 'Hortifruti'),
  p('Goiaba Vermelha kg', 'Goiaba vermelha por quilo', 6.99, 'Hortifruti'),
  p('Pêssego kg', 'Pêssego fresco por quilo', 12.99, 'Hortifruti'),
  p('Ameixa Importada Bandeja', 'Ameixa vermelha importada bandeja', 14.99, 'Hortifruti'),
  p('Pera Williams kg', 'Pera Williams importada por quilo', 14.99, 'Hortifruti'),
  p('Coco Seco un', 'Coco seco maduro unidade', 4.99, 'Hortifruti'),
  p('Maracujá kg', 'Maracujá azedo para suco por quilo', 8.99, 'Hortifruti'),
  // Verduras e legumes
  p('Tomate Italiano kg', 'Tomate italiano/saladete por quilo', 7.99, 'Hortifruti'),
  p('Tomate Cereja Bandeja 300g', 'Tomate cereja bandeja 300g', 5.99, 'Hortifruti'),
  p('Cebola kg', 'Cebola branca por quilo', 4.99, 'Hortifruti'),
  p('Batata Inglesa kg', 'Batata inglesa lavada por quilo', 5.99, 'Hortifruti'),
  p('Batata Doce kg', 'Batata doce rosada por quilo', 6.99, 'Hortifruti'),
  p('Cenoura kg', 'Cenoura lavada por quilo', 4.99, 'Hortifruti'),
  p('Alface Americana un', 'Alface americana higienizada unidade', 3.99, 'Hortifruti'),
  p('Alface Crespa un', 'Alface crespa orgânica unidade', 3.49, 'Hortifruti'),
  p('Rúcula Maço', 'Rúcula fresca maço', 3.99, 'Hortifruti'),
  p('Espinafre Maço', 'Espinafre fresco maço', 4.99, 'Hortifruti'),
  p('Brócolis Ninja un', 'Brócolis ninja fresco unidade', 5.99, 'Hortifruti'),
  p('Couve-Flor un', 'Couve-flor fresca inteira', 6.99, 'Hortifruti'),
  p('Repolho un', 'Repolho verde inteiro', 4.99, 'Hortifruti'),
  p('Pepino un', 'Pepino japonês fresco unidade', 2.49, 'Hortifruti'),
  p('Abobrinha Italiana un', 'Abobrinha italiana fresca unidade', 2.99, 'Hortifruti'),
  p('Berinjela un', 'Berinjela escura fresca unidade', 3.99, 'Hortifruti'),
  p('Pimentão Verde un', 'Pimentão verde fresco unidade', 2.99, 'Hortifruti'),
  p('Pimentão Vermelho un', 'Pimentão vermelho fresco unidade', 4.99, 'Hortifruti'),
  p('Pimentão Amarelo un', 'Pimentão amarelo fresco unidade', 4.99, 'Hortifruti'),
  p('Cheiro-Verde Maço', 'Cheiro-verde (cebolinha + salsinha) maço', 2.49, 'Hortifruti'),
  p('Coentro Maço', 'Coentro fresco maço', 1.99, 'Hortifruti'),
  p('Hortelã Maço', 'Hortelã fresca maço', 1.99, 'Hortifruti'),
  p('Gengibre 100g', 'Gengibre fresco 100 gramas', 3.99, 'Hortifruti'),
  p('Alho Cabeça 3un', 'Alho 3 cabeças embalagem', 4.99, 'Hortifruti'),
  p('Milho Verde Espiga 4un', 'Milho verde espiga 4 unidades', 8.99, 'Hortifruti'),
  p('Mandioca Descascada 1kg', 'Mandioca (aipim) descascada 1 quilo', 7.99, 'Hortifruti'),
  p('Inhame kg', 'Inhame fresco por quilo', 6.99, 'Hortifruti'),
  p('Chuchu un', 'Chuchu fresco unidade', 1.99, 'Hortifruti'),
  p('Vagem kg', 'Vagem fresca por quilo', 9.99, 'Hortifruti'),
  p('Acelga Maço', 'Acelga fresca maço', 4.99, 'Hortifruti'),
  // Orgânicos e especiais
  p('Tomate Orgânico 500g', 'Tomate orgânico bandeja 500g', 9.99, 'Hortifruti'),
  p('Cenoura Baby Orgânica 200g', 'Cenoura baby orgânica embalagem 200g', 6.99, 'Hortifruti'),
  p('Mix Salada Pronto 200g', 'Mix salada pronta higienizada 200g', 7.99, 'Hortifruti'),
  p('Cogumelo Paris Bandeja 200g', 'Cogumelo champignon fresco bandeja', 9.99, 'Hortifruti'),
  p('Shimeji 150g', 'Cogumelo shimeji fresco bandeja 150g', 8.99, 'Hortifruti'),
  p('Abóbora Cabotiá Fatia kg', 'Abóbora cabotiá cortada por quilo', 5.99, 'Hortifruti'),
  p('Beterraba kg', 'Beterraba fresca por quilo', 4.99, 'Hortifruti'),
  p('Quiabo kg', 'Quiabo fresco por quilo', 9.99, 'Hortifruti'),
  p('Jiló kg', 'Jiló fresco verde por quilo', 6.99, 'Hortifruti'),
  p('Aipim/Macaxeira kg', 'Aipim (macaxeira) fresco por quilo', 5.99, 'Hortifruti'),
  p('Tangerina/Poncã kg', 'Tangerina ponkan por quilo', 6.99, 'Hortifruti'),
  p('Abacate un', 'Abacate maduro unidade', 4.99, 'Hortifruti'),
  p('Lichia Bandeja 200g', 'Lichia fresca bandeja 200g', 12.99, 'Hortifruti'),
  p('Pitaya un', 'Pitaya vermelha unidade', 9.99, 'Hortifruti'),
  p('Caqui un', 'Caqui fuyu unidade', 3.99, 'Hortifruti'),
  p('Framboesa Bandeja 125g', 'Framboesa fresca bandeja 125g', 14.99, 'Hortifruti'),
  p('Mirtilo (Blueberry) Bandeja 125g', 'Mirtilo fresco bandeja 125g', 16.99, 'Hortifruti'),
  p('Nabo un', 'Nabo branco fresco unidade', 2.99, 'Hortifruti'),
  p('Rabanete Maço', 'Rabanete fresco maço', 3.99, 'Hortifruti'),
  p('Palmito Pupunha 300g', 'Palmito pupunha em conserva pote 300g', 14.99, 'Hortifruti'),
]

// ─── 11. Pet & Animais (60 SKUs) ────────────────────────────────
const petAnimais: TemplateSampleProduct[] = [
  p('Ração Pedigree Adulto 3kg', 'Ração Pedigree carne adulto 3kg', 34.99, 'Pet & Animais'),
  p('Ração Pedigree Adulto 10,1kg', 'Ração Pedigree carne adulto 10,1kg', 89.99, 'Pet & Animais'),
  p('Ração Pedigree Filhote 3kg', 'Ração Pedigree carne filhote 3kg', 36.99, 'Pet & Animais'),
  p('Ração Golden Adulto 3kg', 'Ração Golden Formula frango adulto 3kg', 49.99, 'Pet & Animais'),
  p('Ração Golden Filhote 3kg', 'Ração Golden Formula frango filhote 3kg', 52.99, 'Pet & Animais'),
  p(
    'Ração Premier Adulto 2,5kg',
    'Ração Premier raças médias adulto 2,5kg',
    64.99,
    'Pet & Animais'
  ),
  p('Ração Whiskas Adulto 3kg', 'Ração Whiskas carne gato adulto 3kg', 39.99, 'Pet & Animais'),
  p('Ração Whiskas Sachê 85g', 'Sachê Whiskas gato adulto carne 85g', 2.99, 'Pet & Animais'),
  p('Ração Whiskas Sachê Filhote 85g', 'Sachê Whiskas gato filhote frango', 2.99, 'Pet & Animais'),
  p(
    'Ração Royal Canin Gato 1,5kg',
    'Ração Royal Canin Interior gato 1,5kg',
    59.99,
    'Pet & Animais'
  ),
  p(
    'Ração Royal Canin Cão 2,5kg',
    'Ração Royal Canin Mini Indoor adulto 2,5kg',
    74.99,
    'Pet & Animais'
  ),
  p('Petisco Pedigree Dentastix', 'Petisco dental Pedigree Dentastix 7un', 14.99, 'Pet & Animais'),
  p('Petisco Dreamies Gato 40g', 'Petisco Dreamies para gato salmão 40g', 6.99, 'Pet & Animais'),
  p('Bifinho Keldog 65g', 'Bifinho Keldog para cão carne 65g', 4.99, 'Pet & Animais'),
  p(
    'Ossinho Natural Cães 3un',
    'Osso natural prensado para cão 3 unidades',
    12.99,
    'Pet & Animais'
  ),
  p('Areia Higiênica Gato 4kg', 'Areia higiênica para gatos 4kg', 14.99, 'Pet & Animais'),
  p(
    'Areia Higiênica Gato Perfumada 4kg',
    'Areia perfumada para gatos lavanda 4kg',
    16.99,
    'Pet & Animais'
  ),
  p(
    'Tapete Higiênico 30un',
    'Tapete higiênico descartável cão 30 unidades',
    29.99,
    'Pet & Animais'
  ),
  p('Shampoo Pet 500ml', 'Shampoo neutro para cães e gatos 500ml', 16.99, 'Pet & Animais'),
  p('Condicionador Pet 500ml', 'Condicionador hidratante pet 500ml', 16.99, 'Pet & Animais'),
  p(
    'Antipulgas Frontline Cão Spray 100ml',
    'Antipulgas Frontline spray cão 100ml',
    54.99,
    'Pet & Animais'
  ),
  p('Coleira Antipulgas Cão', 'Coleira antipulgas e carrapatos cão', 34.99, 'Pet & Animais'),
  p('Brinquedo Corda Cão', 'Brinquedo corda trançada para cão', 14.99, 'Pet & Animais'),
  p('Bolinha de Tênis Pet', 'Bolinha de tênis brinquedo pet', 6.99, 'Pet & Animais'),
  p('Comedouro Inox Cão Médio', 'Comedouro aço inox para cão médio', 19.99, 'Pet & Animais'),
  p('Bebedouro Inox Gato', 'Bebedouro aço inox para gato', 16.99, 'Pet & Animais'),
  p('Caixa de Transporte Pet M', 'Caixa transporte pet tamanho M', 69.99, 'Pet & Animais'),
  p('Coleira Nylon Cão P', 'Coleira nylon ajustável cão pequeno', 14.99, 'Pet & Animais'),
  p('Guia Retrátil Cão 5m', 'Guia retrátil para cão até 20kg 5m', 49.99, 'Pet & Animais'),
  p('Sachê Dog Chow 100g', 'Sachê úmido Dog Chow cão adulto carne', 3.49, 'Pet & Animais'),
  p('Ração GranPlus Cão 3kg', 'Ração GranPlus Choice frango/carne cão 3kg', 32.99, 'Pet & Animais'),
  p('Ração GranPlus Gato 3kg', 'Ração GranPlus Gourmet gato adulto 3kg', 36.99, 'Pet & Animais'),
  p(
    'Saquinho de Cocô 8 Rolos',
    'Refil saquinhos para coletar fezes 8 rolos',
    9.99,
    'Pet & Animais'
  ),
  p('Perfume Pet 120ml', 'Deo colônia para cães e gatos 120ml', 19.99, 'Pet & Animais'),
  p(
    'Escova Desembaraçadora Pet',
    'Escova rastelo desembaraçadora para pet',
    16.99,
    'Pet & Animais'
  ),
  p('Cortador de Unha Pet', 'Cortador de unha alicate para pet', 14.99, 'Pet & Animais'),
  p('Caminha Pet M', 'Caminha almofadão pet tamanho M', 59.99, 'Pet & Animais'),
  p('Arranhador Gato com Brinquedo', 'Arranhador para gato com bolinha', 39.99, 'Pet & Animais'),
  p('Comedouro Gato Anti-vômito', 'Comedouro elevado anti-vômito gato', 29.99, 'Pet & Animais'),
  p(
    'Brinquedo Ratinho Catnip Gato',
    'Brinquedo ratinho com catnip para gato',
    9.99,
    'Pet & Animais'
  ),
  p('Ração Pássaro 500g', 'Ração mista para pássaros 500g', 12.99, 'Pet & Animais'),
  p('Ração Peixe Flocos 50g', 'Ração flocos para peixes ornamentais 50g', 9.99, 'Pet & Animais'),
  p('Ração Hamster 500g', 'Ração premium para hamster 500g', 16.99, 'Pet & Animais'),
  p('Substrato Terrário 1kg', 'Substrato para terrário répteis 1kg', 19.99, 'Pet & Animais'),
  p('Ração Coelho 1kg', 'Ração gran premium coelho/roedor 1kg', 16.99, 'Pet & Animais'),
  p('Feno Timothy 500g', 'Feno timothy para roedores 500g', 14.99, 'Pet & Animais'),
  p(
    'Graveto Mastigável Cão M 5un',
    'Graveto natural mastigável cão médio 5un',
    16.99,
    'Pet & Animais'
  ),
  p(
    'Spray Amargo Anti-mordida 120ml',
    'Spray amargo pet anti-mordida 120ml',
    24.99,
    'Pet & Animais'
  ),
  p('Roupinha Inverno Cão P', 'Roupinha soft inverno cão pequeno', 29.99, 'Pet & Animais'),
  p('Capa de Chuva Pet M', 'Capa de chuva impermeável pet tamanho M', 34.99, 'Pet & Animais'),
]

// ─── 12. Utilidades & Descartáveis (60 SKUs) ────────────────────
const utilidades: TemplateSampleProduct[] = [
  p('Pilha AA Duracell 4un', 'Pilha alcalina AA Duracell 4 unidades', 14.99, 'Utilidades'),
  p('Pilha AAA Duracell 4un', 'Pilha alcalina AAA Duracell 4 unidades', 14.99, 'Utilidades'),
  p('Pilha AA Rayovac 4un', 'Pilha alcalina AA Rayovac 4 unidades', 9.99, 'Utilidades'),
  p('Isqueiro Bic', 'Isqueiro Bic maxi unidade', 5.99, 'Utilidades'),
  p('Fósforo Fiat Lux 10cx', 'Fósforo de segurança Fiat Lux 10 caixas', 3.99, 'Utilidades'),
  p('Vela Branca 6un', 'Vela branca lisa pacote 6 unidades', 5.99, 'Utilidades'),
  p('Lâmpada LED 9W', 'Lâmpada LED 9W bivolt luz branca', 9.99, 'Utilidades'),
  p('Fita Adesiva Larga 45mm', 'Fita adesiva transparente 45mm x 40m', 4.99, 'Utilidades'),
  p('Super Bonder 3g', 'Adesivo instantâneo Super Bonder 3g', 8.99, 'Utilidades'),
  p('Cola Branca Tenaz 90g', 'Cola branca escolar Tenaz 90g', 3.99, 'Utilidades'),
  p('Caneta BIC Azul 4un', 'Caneta esferográfica BIC azul 4 unidades', 6.99, 'Utilidades'),
  p('Caderno Espiral 96 folhas', 'Caderno espiral capa dura 96 folhas', 12.99, 'Utilidades'),
  p('Prato Descartável 15cm 10un', 'Prato descartável branco 15cm 10 unidades', 3.99, 'Utilidades'),
  p('Prato Descartável 21cm 10un', 'Prato descartável branco 21cm 10 unidades', 5.99, 'Utilidades'),
  p('Guardanapo Grande 50un', 'Guardanapo papel folha dupla 50 unidades', 4.99, 'Utilidades'),
  p('Talher Descartável Kit 10un', 'Kit talher descartável garfo/faca/colher', 4.99, 'Utilidades'),
  p('Copo Plástico 300ml 50un', 'Copo plástico descartável 300ml 50un', 7.99, 'Utilidades'),
  p('Canudo Biodegradável 100un', 'Canudo papel biodegradável 100 unidades', 5.99, 'Utilidades'),
  p('Balão Colorido 50un', 'Balão/bexiga colorida festa 50 unidades', 9.99, 'Utilidades'),
  p('Toalha de Mesa TNT', 'Toalha de mesa TNT descartável festa', 5.99, 'Utilidades'),
  p('Kit Churrasco Espeto 6un', 'Espeto inox para churrasco 6 unidades', 19.99, 'Utilidades'),
  p(
    'Carvão Especial Eucalipto 4kg',
    'Carvão especial para churrasco eucalipto 4kg',
    17.99,
    'Utilidades'
  ),
  p('Acendedor para Churrasqueira', 'Acendedor à álcool gel para carvão', 12.99, 'Utilidades'),
  p('Sal Grosso para Churrasco 1kg', 'Sal grosso moído especial churrasco', 3.99, 'Utilidades'),
  p(
    'Bandeja Alumínio Retangular 5un',
    'Bandeja alumínio descartável 5 unidades',
    9.99,
    'Utilidades'
  ),
  p('Marmitex Alumínio 500ml 10un', 'Marmitex alumínio 500ml 10 unidades', 12.99, 'Utilidades'),
  p('Sacola Retornável TNT', 'Sacola retornável ecobag TNT unidade', 3.99, 'Utilidades'),
  p('Guarda-Chuva Compacto', 'Guarda-chuva portátil compacto', 19.99, 'Utilidades'),
  p('Protetor de Tomada 10un', 'Protetor de tomada infantil 10 unidades', 7.99, 'Utilidades'),
  p('Extensão Elétrica 3m', 'Extensão elétrica 3 tomadas 3 metros', 19.99, 'Utilidades'),
  p('Adaptador de Tomada 3 Pinos', 'Adaptador tomada 3 pinos/2 pinos', 5.99, 'Utilidades'),
  p('Tesoura Doméstica Inox', 'Tesoura multiuso aço inox 18cm', 14.99, 'Utilidades'),
  p('Abridor de Garrafa', 'Abridor de garrafa aço inox', 7.99, 'Utilidades'),
  p('Saca-Rolhas', 'Saca-rolhas tipo garçom profissional', 14.99, 'Utilidades'),
  p('Batedor de Ovos Manual', 'Batedor de ovos fouet inox manual', 9.99, 'Utilidades'),
  p('Descascador de Legumes', 'Descascador de legumes aço inox', 6.99, 'Utilidades'),
  p('Escorredor de Arroz', 'Escorredor de arroz plástico resistente', 9.99, 'Utilidades'),
  p('Forma de Gelo Silicone', 'Forma de gelo silicone 12 cubos', 12.99, 'Utilidades'),
  p('Pote Hermético Vidro 500ml', 'Pote hermético vidro com tampa 500ml', 16.99, 'Utilidades'),
  p('Garrafa Térmica 500ml', 'Garrafa térmica inox 500ml', 29.99, 'Utilidades'),
  p('Caneca Porcelana 350ml', 'Caneca porcelana branca 350ml', 9.99, 'Utilidades'),
  p('Pano de Prato Algodão 3un', 'Pano de prato algodão estampado 3 unidades', 12.99, 'Utilidades'),
  p('Luva Térmica para Forno', 'Luva térmica para forno silicone', 16.99, 'Utilidades'),
  p('Tábua de Corte Bambu', 'Tábua de corte bambu 30cm', 24.99, 'Utilidades'),
  p('Afiador de Facas', 'Afiador de facas manual 2 estágios', 19.99, 'Utilidades'),
  p('Ventosa Adesiva Gancho 4un', 'Gancho adesivo ventosa banheiro 4un', 9.99, 'Utilidades'),
  p('Timer de Cozinha Digital', 'Timer/cronômetro digital magnético cozinha', 14.99, 'Utilidades'),
  p('Balança Digital Cozinha 5kg', 'Balança digital para cozinha até 5kg', 34.99, 'Utilidades'),
  p('Termômetro Culinário', 'Termômetro digital culinário espeto', 24.99, 'Utilidades'),
  p('Kit Panela 5 Peças', 'Jogo de panelas alumínio antiaderente 5 peças', 99.99, 'Utilidades'),
]

// ─── 13. Kits & Combos Estratégicos (60 SKUs) ──────────────────
const kitsCombos: TemplateSampleProduct[] = [
  // Kits Churrasco
  p(
    'Kit Churrasco Básico',
    'Carvão 3kg + Sal grosso 1kg + Gelo 5kg + 6 Brahma lata',
    54.99,
    'Kits & Combos'
  ),
  p(
    'Kit Churrasco Premium',
    'Carvão 5kg + Sal grosso + Gelo 5kg + 12 Heineken lata + Farofa',
    129.99,
    'Kits & Combos'
  ),
  p(
    'Kit Churrasco Família',
    'Carvão 5kg + Sal + Gelo 5kg + 6 Coca 2L + Espetos 6un',
    89.99,
    'Kits & Combos'
  ),
  p('Kit Cerveja Gelada 12un', 'Pack 12 Brahma lata + Gelo 3kg', 44.99, 'Kits & Combos'),
  p('Kit Cerveja Premium 12un', 'Pack 12 Heineken lata + Gelo 3kg', 69.99, 'Kits & Combos'),
  p('Kit Cerveja + Petisco', '6 Heineken lata + Amendoim 200g + Gelo 3kg', 49.99, 'Kits & Combos'),
  // Kits Café da Manhã
  p(
    'Kit Café da Manhã Básico',
    'Pão francês 10un + Café 250g + Leite 1L + Margarina 250g',
    24.99,
    'Kits & Combos'
  ),
  p(
    'Kit Café da Manhã Completo',
    'Pão 10un + Café 500g + Leite 1L + Manteiga + Presunto + Queijo',
    44.99,
    'Kits & Combos'
  ),
  p(
    'Kit Brunch Premium',
    'Croissant 4un + Suco natural + Queijo brie + Geleia + Café',
    54.99,
    'Kits & Combos'
  ),
  p(
    'Kit Café + Leite + Açúcar',
    'Café Pilão 500g + Leite integral 1L + Açúcar 1kg',
    24.99,
    'Kits & Combos'
  ),
  // Kits Festa
  p(
    'Kit Festa Infantil 20 Pessoas',
    'Refri 2L x3 + Salgados + Balões + Pratos desc + Guardanapos',
    89.99,
    'Kits & Combos'
  ),
  p(
    'Kit Aniversário Básico',
    'Refri 2L x4 + Salgados cong. + Pratos/copos desc + Guardanapos',
    69.99,
    'Kits & Combos'
  ),
  p('Kit Happy Hour', '6 Heineken + 6 Stella + Amendoim + Gelo 5kg', 79.99, 'Kits & Combos'),
  p(
    'Kit Noite do Vinho',
    'Vinho Concha y Toro + Queijo Brie + Azeitonas + Torrada',
    69.99,
    'Kits & Combos'
  ),
  p(
    'Kit Gin Tônica',
    'Gin Tanqueray 750ml + Tônica Schweppes 350ml x4 + Limão 3un + Gelo',
    109.99,
    'Kits & Combos'
  ),
  // Kits Limpeza
  p(
    'Kit Limpeza da Casa',
    'Detergente + Desinfetante + Multiuso + Esponja 3un + Saco lixo 30L',
    29.99,
    'Kits & Combos'
  ),
  p(
    'Kit Limpeza Pesada',
    'Detergente x2 + Água sanitária + Desinfetante + Luva + Esponja pesada',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Lavanderia Completo',
    'Sabão líquido 2L + Amaciante 500ml + Alvejante 450ml',
    49.99,
    'Kits & Combos'
  ),
  p(
    'Kit Banheiro',
    'Desinfetante cloro gel + Pedra sanitária + Limpa vidros',
    24.99,
    'Kits & Combos'
  ),
  // Kits Bebê
  p(
    'Kit Bebê Essencial',
    'Fralda M 20un + Lenço 48un + Creme assadura + Shampoo baby',
    69.99,
    'Kits & Combos'
  ),
  p(
    'Kit Bebê Banho',
    'Shampoo baby + Sabonete líquido baby + Condicionador baby',
    39.99,
    'Kits & Combos'
  ),
  // Kits Higiene
  p(
    'Kit Higiene Pessoal',
    'Shampoo + Sabonete barra x3 + Desodorante + Creme dental',
    39.99,
    'Kits & Combos'
  ),
  p('Kit Barba', 'Aparelho barbear + Espuma barbear + Pós-barba', 34.99, 'Kits & Combos'),
  // Kits Refeição Rápida
  p(
    'Kit Macarrão Rápido',
    'Macarrão 500g + Molho tomate 340g + Queijo ralado 100g',
    14.99,
    'Kits & Combos'
  ),
  p('Kit Arroz e Feijão', 'Arroz 5kg + Feijão 1kg + Óleo 900ml + Tempero', 39.99, 'Kits & Combos'),
  p(
    'Kit Feijoada',
    'Feijão preto 1kg + Calabresa 500g + Tempenos + Farinha mandioca',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Sopa Prática',
    'Legumes frescos + Macarrão letrinhas + Caldo galinha + Tempero',
    19.99,
    'Kits & Combos'
  ),
  // Kits Petisco
  p(
    'Kit Petisco Futebol',
    'Amendoim 150g x2 + Batata chips x2 + 6 Brahma lata + Gelo',
    49.99,
    'Kits & Combos'
  ),
  p(
    'Kit Cinema em Casa',
    'Pipoca micro x3 + Chocolate barra x2 + Refri 2L',
    29.99,
    'Kits & Combos'
  ),
  p('Kit Lanche da Tarde', 'Pão forma + Presunto + Queijo + Suco caixa x4', 34.99, 'Kits & Combos'),
  // Kits Pet
  p(
    'Kit Pet Cão Mensal',
    'Ração Pedigree 3kg + Petisco + Tapete higiênico 30un',
    74.99,
    'Kits & Combos'
  ),
  p(
    'Kit Pet Gato Mensal',
    'Ração Whiskas 3kg + Sachê x6 + Areia 4kg + Petisco',
    79.99,
    'Kits & Combos'
  ),
  // Kits Conveniência
  p(
    'Kit Ressaca',
    'Água 1,5L x2 + Gatorade 500ml + Paracetamol + Gelo 3kg',
    29.99,
    'Kits & Combos'
  ),
  p(
    'Kit Praia',
    'Gelo 5kg + Água mineral x6 + Protetor solar + Refri 2L x2',
    54.99,
    'Kits & Combos'
  ),
  p('Kit Viagem Curta', 'Água x2 + Snacks x3 + Chiclete + Lenço umedecido', 24.99, 'Kits & Combos'),
  p('Kit Dia dos Namorados', 'Vinho + Chocolate Lindt + Vela perfumada', 89.99, 'Kits & Combos'),
  p(
    'Kit Presente Homem',
    'Whisky Johnnie Walker Red + Copo + Gelo + Amendoim',
    99.99,
    'Kits & Combos'
  ),
  p(
    'Kit Presente Mulher',
    'Espumante + Chocolate Lindt + Vela + Hidratante',
    99.99,
    'Kits & Combos'
  ),
  // Kits Saúde/Fit
  p(
    'Kit Saudável',
    'Granola 800g + Mel 300g + Frutas secas 200g + Iogurte natural x2',
    49.99,
    'Kits & Combos'
  ),
  p(
    'Kit Detox',
    'Limão 1kg + Gengibre 100g + Hortelã maço + Água coco 1L x2',
    29.99,
    'Kits & Combos'
  ),
  p(
    'Kit Proteico',
    'Ovos 30un + Peito frango 1kg + Aveia 200g + Banana 1kg',
    49.99,
    'Kits & Combos'
  ),
  // Kits Cozinha Gourmet
  p(
    'Kit Fondue',
    'Queijo emmental + Queijo gruyère + Vinho branco + Pão 4un',
    79.99,
    'Kits & Combos'
  ),
  p(
    'Kit Pasta Italiana',
    'Massa Barilla + Molho Pomarola + Azeite Gallo + Parmesão',
    39.99,
    'Kits & Combos'
  ),
  p(
    'Kit Sushi em Casa',
    'Arroz japonês + Nori + Vinagre arroz + Shoyu + Gengibre',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Taco Night',
    'Tortilha x6 + Carne moída 500g + Molho + Queijo + Guacamole',
    44.99,
    'Kits & Combos'
  ),
  p(
    'Kit Pizza Caseira',
    'Massa pizza + Molho tomate + Mussarela + Orégano + Presunto',
    29.99,
    'Kits & Combos'
  ),
  p(
    'Kit Hambúrguer',
    'Pão hambúrguer 6un + Hambúrguer 6un + Cheddar + Alface + Tomate',
    39.99,
    'Kits & Combos'
  ),
  p(
    'Kit Hot Dog',
    'Pão hot dog 6un + Salsicha 500g + Ketchup + Mostarda + Batata palha',
    29.99,
    'Kits & Combos'
  ),
  p(
    'Kit Crepioca Fit',
    'Tapioca 500g + Ovos 12un + Requeijão light + Presunto peru',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Açaí em Casa',
    'Polpa açaí 400g + Granola + Banana + Leite condensado',
    29.99,
    'Kits & Combos'
  ),
  p('Kit Smoothie', 'Frutas congeladas + Iogurte x2 + Mel + Aveia', 29.99, 'Kits & Combos'),
  p(
    'Kit Sopão Inverno',
    'Legumes variados + Macarrão + Calabresa + Caldo + Pão',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Fondue Chocolate',
    'Chocolate meio amargo + Chocolate branco + Morango + Banana + Marshmallow',
    49.99,
    'Kits & Combos'
  ),
  p(
    'Kit Panqueca',
    'Farinha 1kg + Ovos 12un + Leite 1L + Molho tomate + Mussarela',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Marmita Semanal',
    'Arroz 2kg + Feijão 500g + Frango 1kg + Legumes variados + Temperos',
    59.99,
    'Kits & Combos'
  ),
]

// ─── 14. Bebê & Infantil (40 SKUs) ──────────────────────────────
const bebeInfantil: TemplateSampleProduct[] = [
  p(
    'Fralda Pampers Confort Sec M 44un',
    'Fralda Pampers Confort Sec tamanho M',
    44.99,
    'Bebê & Infantil'
  ),
  p(
    'Fralda Pampers Confort Sec G 38un',
    'Fralda Pampers Confort Sec tamanho G',
    44.99,
    'Bebê & Infantil'
  ),
  p(
    'Fralda Pampers Confort Sec XG 32un',
    'Fralda Pampers Confort Sec tamanho XG',
    44.99,
    'Bebê & Infantil'
  ),
  p(
    'Fralda Huggies Supreme M 40un',
    'Fralda Huggies Supreme Care tamanho M',
    42.99,
    'Bebê & Infantil'
  ),
  p(
    'Fralda Huggies Supreme G 36un',
    'Fralda Huggies Supreme Care tamanho G',
    42.99,
    'Bebê & Infantil'
  ),
  p(
    'Fralda Calça Pampers Pants G 30un',
    'Fralda calça Pampers Pants tamanho G',
    44.99,
    'Bebê & Infantil'
  ),
  p(
    'Lenço Umedecido Pampers 96un',
    'Lenço umedecido Pampers Aloe Vera 96un',
    14.99,
    'Bebê & Infantil'
  ),
  p(
    'Lenço Umedecido Huggies 96un',
    'Lenço umedecido turma da Mônica 96un',
    12.99,
    'Bebê & Infantil'
  ),
  p(
    'Creme Assadura Desitin 57g',
    'Creme preventivo assaduras Desitin 57g',
    24.99,
    'Bebê & Infantil'
  ),
  p("Shampoo Johnson's 400ml", "Shampoo infantil Johnson's Baby 400ml", 19.99, 'Bebê & Infantil'),
  p(
    'Sabonete Líquido Baby 200ml',
    'Sabonete líquido infantil suave 200ml',
    14.99,
    'Bebê & Infantil'
  ),
  p(
    'Condicionador Baby 200ml',
    'Condicionador infantil cheiro suave 200ml',
    14.99,
    'Bebê & Infantil'
  ),
  p("Óleo Baby Johnson's 200ml", "Óleo baby Johnson's Regular 200ml", 14.99, 'Bebê & Infantil'),
  p('Mamadeira Avent 260ml', 'Mamadeira Philips Avent Anti-Colic 260ml', 49.99, 'Bebê & Infantil'),
  p('Chupeta Avent 0-6m', 'Chupeta Philips Avent Ultra Air 0-6 meses', 29.99, 'Bebê & Infantil'),
  p('Fórmula Infantil NAN 400g', 'Fórmula infantil NAN Comfor 1 400g', 39.99, 'Bebê & Infantil'),
  p(
    'Farinha Láctea Nestlé 230g',
    'Farinha láctea Nestlé tradicional 230g',
    9.99,
    'Bebê & Infantil'
  ),
  p('Papinha Nestlé 120g', 'Papinha baby Nestlé carne com legumes', 4.99, 'Bebê & Infantil'),
  p('Mucilon Arroz 230g', 'Cereal infantil Mucilon arroz 230g', 9.99, 'Bebê & Infantil'),
  p('Biscoito Baby Nestlé 180g', 'Biscoitinho infantil Nestlé Naturnes', 8.99, 'Bebê & Infantil'),
  p('Suco Baby Nestlé 120ml', 'Suco baby Nestlé maçã 120ml', 3.99, 'Bebê & Infantil'),
  p('Água de Coco Kids 200ml', 'Água de coco infantil sem açúcar 200ml', 4.99, 'Bebê & Infantil'),
  p(
    'Prato Infantil com Divisórias',
    'Prato infantil plástico com 3 divisórias',
    14.99,
    'Bebê & Infantil'
  ),
  p('Copo Transição 200ml', 'Copo de transição bico macio 200ml', 19.99, 'Bebê & Infantil'),
  p('Colher Silicone Baby 2un', 'Colher silicone para bebê 2 unidades', 12.99, 'Bebê & Infantil'),
  p('Babador Impermeável', 'Babador impermeável com bolso unidade', 9.99, 'Bebê & Infantil'),
  p('Escova Mamadeira', 'Escova para lavar mamadeira e bico', 9.99, 'Bebê & Infantil'),
  p(
    'Detergente de Mamadeira 500ml',
    'Detergente líquido para mamadeira 500ml',
    12.99,
    'Bebê & Infantil'
  ),
  p('Mordedor Bebê Gelável', 'Mordedor gelável para aliviar gengiva', 14.99, 'Bebê & Infantil'),
  p(
    'Termômetro Digital Infantil',
    'Termômetro digital ponta flexível baby',
    24.99,
    'Bebê & Infantil'
  ),
  p('Aspirador Nasal Baby', 'Aspirador nasal infantil manual', 14.99, 'Bebê & Infantil'),
  p(
    'Soro Fisiológico 30 ampolas',
    'Soro fisiológico 5ml embalagem 30 ampolas',
    16.99,
    'Bebê & Infantil'
  ),
  p(
    'Algodão Quadradinho Baby 50un',
    'Algodão quadradinho para bebê 50 unidades',
    6.99,
    'Bebê & Infantil'
  ),
  p('Fralda de Pano 3un', 'Fralda de pano algodão 3 unidades', 19.99, 'Bebê & Infantil'),
  p('Bolsa Térmica Cólica Baby', 'Bolsa térmica para cólica do bebê', 24.99, 'Bebê & Infantil'),
  p(
    'Kit Higiene Baby 5 peças',
    'Kit higiene bebê pente/escova/tesoura/cortador',
    29.99,
    'Bebê & Infantil'
  ),
  p(
    'Toalha Fralda Estampada 3un',
    'Toalha fralda cueiro estampada 3 unidades',
    16.99,
    'Bebê & Infantil'
  ),
  p('Manta Cobertor Baby', 'Manta microfibra cobertor baby 80x100cm', 29.99, 'Bebê & Infantil'),
  p(
    'Protetor de Berço 3 peças',
    'Kit protetor de berço almofadado 3 peças',
    49.99,
    'Bebê & Infantil'
  ),
  p('Trocador Portátil', 'Trocador de fraldas portátil impermeável', 24.99, 'Bebê & Infantil'),
]

// ─── 15. Carnes & Açougue (60 SKUs) ────────────────────────────
const carnesAcougue: TemplateSampleProduct[] = [
  p('Picanha Bovina kg', 'Picanha bovina especial por quilo', 69.99, 'Carnes & Açougue'),
  p('Contra-Filé kg', 'Bife contra-filé bovino por quilo', 44.99, 'Carnes & Açougue'),
  p('Alcatra kg', 'Alcatra bovina limpa por quilo', 39.99, 'Carnes & Açougue'),
  p('Maminha kg', 'Maminha bovina para churrasco por quilo', 44.99, 'Carnes & Açougue'),
  p('Fraldinha kg', 'Fraldinha bovina para grelha por quilo', 39.99, 'Carnes & Açougue'),
  p('Costela Bovina kg', 'Costela bovina para churrasco por quilo', 29.99, 'Carnes & Açougue'),
  p('Coxão Mole kg', 'Coxão mole bovino por quilo', 34.99, 'Carnes & Açougue'),
  p('Coxão Duro kg', 'Coxão duro bovino por quilo', 29.99, 'Carnes & Açougue'),
  p('Patinho Bovino kg', 'Patinho bovino moído ou peça por quilo', 32.99, 'Carnes & Açougue'),
  p('Acém Bovino kg', 'Acém bovino para cozidos por quilo', 27.99, 'Carnes & Açougue'),
  p('Músculo Bovino kg', 'Músculo bovino para sopas por quilo', 26.99, 'Carnes & Açougue'),
  p('Carne Moída 1ª kg', 'Carne moída bovina primeira por quilo', 29.99, 'Carnes & Açougue'),
  p('Carne Moída 2ª kg', 'Carne moída bovina segunda por quilo', 24.99, 'Carnes & Açougue'),
  p('Cupim Bovino kg', 'Cupim bovino para churrasco por quilo', 34.99, 'Carnes & Açougue'),
  p('Filé Mignon kg', 'Filé mignon bovino por quilo', 79.99, 'Carnes & Açougue'),
  p('T-Bone Steak kg', 'Bife T-Bone bovino por quilo', 59.99, 'Carnes & Açougue'),
  p('Ossobuco Bovino kg', 'Ossobuco bovino para cozidos por quilo', 24.99, 'Carnes & Açougue'),
  p('Rabada Bovina kg', 'Rabada bovina por quilo', 34.99, 'Carnes & Açougue'),
  // Suíno
  p('Costela Suína kg', 'Costela suína inteira por quilo', 21.99, 'Carnes & Açougue'),
  p('Pernil Suíno kg', 'Pernil suíno com osso por quilo', 16.99, 'Carnes & Açougue'),
  p('Bisteca Suína kg', 'Bisteca suína (lombo) por quilo', 22.99, 'Carnes & Açougue'),
  p('Lombo Suíno kg', 'Lombo suíno peça por quilo', 24.99, 'Carnes & Açougue'),
  p('Panceta Suína kg', 'Panceta suína para churrasco por quilo', 19.99, 'Carnes & Açougue'),
  p(
    'Linguiça Toscana Fresca kg',
    'Linguiça toscana artesanal fresca por kg',
    18.99,
    'Carnes & Açougue'
  ),
  p(
    'Linguiça Calabresa Fresca kg',
    'Linguiça calabresa fresca por quilo',
    19.99,
    'Carnes & Açougue'
  ),
  p(
    'Linguiça de Frango Fresca kg',
    'Linguiça de frango temperada fresca por kg',
    16.99,
    'Carnes & Açougue'
  ),
  // Frango
  p('Frango Inteiro Resfriado kg', 'Frango inteiro resfriado por quilo', 12.99, 'Carnes & Açougue'),
  p(
    'Peito de Frango Resfriado kg',
    'Peito de frango sem osso resfriado por kg',
    16.99,
    'Carnes & Açougue'
  ),
  p('Coxa de Frango kg', 'Coxa de frango resfriada por quilo', 10.99, 'Carnes & Açougue'),
  p('Sobrecoxa de Frango kg', 'Sobrecoxa de frango resfriada por quilo', 12.99, 'Carnes & Açougue'),
  p('Asa de Frango kg', 'Asa de frango resfriada por quilo', 14.99, 'Carnes & Açougue'),
  p('Coxinha da Asa kg', 'Coxinha da asa de frango por quilo', 18.99, 'Carnes & Açougue'),
  p('Filé Sassami kg', 'Filé sassami de frango por quilo', 19.99, 'Carnes & Açougue'),
  p('Frango Assado Inteiro', 'Frango assado temperado inteiro (~1,5kg)', 29.99, 'Carnes & Açougue'),
  // Peixes e frutos do mar
  p('Filé de Tilápia Fresco kg', 'Filé de tilápia fresco por quilo', 39.99, 'Carnes & Açougue'),
  p('Salmão em Posta kg', 'Salmão em posta por quilo', 69.99, 'Carnes & Açougue'),
  p('Filé de Merluza kg', 'Filé de merluza por quilo', 34.99, 'Carnes & Açougue'),
  p('Sardinha Fresca kg', 'Sardinha fresca inteira por quilo', 14.99, 'Carnes & Açougue'),
  p('Camarão Rosa Limpo kg', 'Camarão rosa limpo por quilo', 59.99, 'Carnes & Açougue'),
  p(
    'Bacalhau Dessalgado 500g',
    'Bacalhau dessalgado lombo embalagem 500g',
    49.99,
    'Carnes & Açougue'
  ),
  // Embutidos frescos
  p('Espetinho Bovino 5un', 'Espetinho de carne bovina 5 unidades', 22.99, 'Carnes & Açougue'),
  p(
    'Espetinho de Frango 5un',
    'Espetinho de frango temperado 5 unidades',
    17.99,
    'Carnes & Açougue'
  ),
  p('Espetinho Misto 5un', 'Espetinho misto carne/frango 5 unidades', 19.99, 'Carnes & Açougue'),
  p('Kafta Bovina 500g', 'Kafta bovina temperada 500g', 24.99, 'Carnes & Açougue'),
  p(
    'Hambúrguer Artesanal 4un',
    'Hambúrguer artesanal bovino 4 unidades',
    24.99,
    'Carnes & Açougue'
  ),
  p(
    'Hambúrguer Blend 4un',
    'Hambúrguer blend costela/fraldinha 180g 4un',
    34.99,
    'Carnes & Açougue'
  ),
  p('Carne Seca Dianteira kg', 'Carne seca dianteira por quilo', 44.99, 'Carnes & Açougue'),
  p('Charque 500g', 'Charque embalagem 500g', 24.99, 'Carnes & Açougue'),
  p(
    'Medalhão de Filé Mignon 4un',
    'Medalhão de filé mignon 4 unidades (~600g)',
    54.99,
    'Carnes & Açougue'
  ),
  p('Bife Ancho kg', 'Bife ancho (entrecôte) bovino por quilo', 59.99, 'Carnes & Açougue'),
  p('Cordeiro Pernil kg', 'Pernil de cordeiro por quilo', 59.99, 'Carnes & Açougue'),
  p('Coxa de Pato un', 'Coxa de pato confit unidade (~300g)', 34.99, 'Carnes & Açougue'),
  p('Fígado Bovino kg', 'Fígado bovino fatiado por quilo', 14.99, 'Carnes & Açougue'),
  p('Coração de Frango kg', 'Coração de frango para churrasco por kg', 16.99, 'Carnes & Açougue'),
  p('Moela de Frango kg', 'Moela de frango para cozido por quilo', 12.99, 'Carnes & Açougue'),
  p('Tender Sadia 1kg', 'Tender Sadia defumado 1 quilo', 39.99, 'Carnes & Açougue'),
  p('Peru Inteiro Sadia 3kg', 'Peru inteiro Sadia temperado 3kg', 54.99, 'Carnes & Açougue'),
  p('Chester Perdigão 3kg', 'Chester ave natalina Perdigão 3kg', 59.99, 'Carnes & Açougue'),
  p('Lombo Defumado 500g', 'Lombo suíno defumado fatia 500g', 24.99, 'Carnes & Açougue'),
  p('Torresmo Pronto 200g', 'Torresmo de barriga suíno pronto 200g', 16.99, 'Carnes & Açougue'),
]

// ─── 16. Pratos Prontos & Refeições Rápidas (50 SKUs) ──────────
const pratosRefeicoesRapidas: TemplateSampleProduct[] = [
  p(
    'Marmita Arroz/Feijão/Bife 400g',
    'Marmita pronta arroz, feijão e bife acebolado',
    16.99,
    'Pratos Prontos'
  ),
  p(
    'Marmita Arroz/Feijão/Frango 400g',
    'Marmita pronta arroz, feijão e frango grelhado',
    14.99,
    'Pratos Prontos'
  ),
  p(
    'Marmita Fitness Frango 350g',
    'Marmita fit frango, batata doce e brócolis',
    18.99,
    'Pratos Prontos'
  ),
  p(
    'Marmita Fitness Carne 350g',
    'Marmita fit patinho, arroz integral e legumes',
    19.99,
    'Pratos Prontos'
  ),
  p('Marmita Low Carb 350g', 'Marmita low carb carne com legumes', 21.99, 'Pratos Prontos'),
  p(
    'Marmita Vegana 350g',
    'Marmita vegana grão de bico, quinoa e legumes',
    19.99,
    'Pratos Prontos'
  ),
  p('Feijoada Pronta 500g', 'Feijoada pronta porção individual 500g', 19.99, 'Pratos Prontos'),
  p('Estrogonofe de Frango 400g', 'Estrogonofe de frango com arroz 400g', 17.99, 'Pratos Prontos'),
  p(
    'Estrogonofe de Carne 400g',
    'Estrogonofe de carne com arroz e batata palha',
    19.99,
    'Pratos Prontos'
  ),
  p(
    'Escondidinho de Carne Seca 400g',
    'Escondidinho de carne seca com purê 400g',
    22.99,
    'Pratos Prontos'
  ),
  p(
    'Lasanha Bolonhesa 500g',
    'Lasanha à bolonhesa caseira resfriada 500g',
    24.99,
    'Pratos Prontos'
  ),
  p('Lasanha 4 Queijos 500g', 'Lasanha 4 queijos caseira resfriada 500g', 26.99, 'Pratos Prontos'),
  p('Macarrão à Bolonhesa 400g', 'Espaguete à bolonhesa porção 400g', 14.99, 'Pratos Prontos'),
  p('Panqueca de Carne 4un', 'Panqueca recheada carne moída 4 unidades', 16.99, 'Pratos Prontos'),
  p('Nhoque ao Sugo 400g', 'Nhoque de batata ao sugo porção 400g', 14.99, 'Pratos Prontos'),
  p('Arroz Carreteiro 400g', 'Arroz de carreteiro gaúcho porção 400g', 16.99, 'Pratos Prontos'),
  p('Galinhada 400g', 'Galinhada caipira com açafrão 400g', 17.99, 'Pratos Prontos'),
  p('Baião de Dois 400g', 'Baião de dois nordestino porção 400g', 16.99, 'Pratos Prontos'),
  p('Virada Paulista 400g', 'Virada paulista completa porção 400g', 19.99, 'Pratos Prontos'),
  p('Bobó de Camarão 400g', 'Bobó de camarão baiano porção 400g', 29.99, 'Pratos Prontos'),
  p('Frango Xadrez 400g', 'Frango xadrez com arroz porção 400g', 17.99, 'Pratos Prontos'),
  p('Yakisoba Misto 450g', 'Yakisoba misto carne e frango 450g', 19.99, 'Pratos Prontos'),
  p('Risoto de Cogumelos 400g', 'Risoto de cogumelos paris caseiro 400g', 24.99, 'Pratos Prontos'),
  p(
    'Carne de Panela com Legumes 400g',
    'Carne de panela com batata e cenoura',
    18.99,
    'Pratos Prontos'
  ),
  p(
    'Frango Assado com Legumes 500g',
    'Frango assado inteiro com legumes 500g',
    24.99,
    'Pratos Prontos'
  ),
  p('Caldo de Cana 1L', 'Caldo de cana natural garrafa 1 litro', 9.99, 'Pratos Prontos'),
  p('Sopa de Legumes 500ml', 'Sopa caseira de legumes porção 500ml', 12.99, 'Pratos Prontos'),
  p('Canja de Galinha 500ml', 'Canja de galinha caseira porção 500ml', 14.99, 'Pratos Prontos'),
  p('Sopa de Feijão 500ml', 'Sopa de feijão com macarrão 500ml', 12.99, 'Pratos Prontos'),
  p('Salada Caesar 300g', 'Salada Caesar com frango grelhado 300g', 19.99, 'Pratos Prontos'),
  p('Salada Tropical 300g', 'Salada tropical com manga e camarão 300g', 22.99, 'Pratos Prontos'),
  p('Wrap de Frango 250g', 'Wrap integral de frango grelhado 250g', 16.99, 'Pratos Prontos'),
  p('Sanduíche Natural 200g', 'Sanduíche natural de frango com salada', 11.99, 'Pratos Prontos'),
  p('Quiche Lorraine Fatia', 'Quiche Lorraine presunto e queijo fatia', 12.99, 'Pratos Prontos'),
  p('Torta de Frango Fatia', 'Torta salgada de frango com requeijão fatia', 9.99, 'Pratos Prontos'),
  p('Coxinha de Frango 6un', 'Coxinha de frango com catupiry 6un', 14.99, 'Pratos Prontos'),
  p('Pastel Frito Carne 4un', 'Pastel frito carne seca 4 unidades', 14.99, 'Pratos Prontos'),
  p('Esfiha Aberta Carne 6un', 'Esfiha aberta carne temperada 6 unidades', 16.99, 'Pratos Prontos'),
  p('Empanada Argentina 4un', 'Empanada argentina carne 4 unidades', 19.99, 'Pratos Prontos'),
  p('Pão de Queijo Assado 10un', 'Pão de queijo assado 10 unidades', 14.99, 'Pratos Prontos'),
  p('Tapioca Recheada Frango', 'Tapioca recheada frango e requeijão', 12.99, 'Pratos Prontos'),
  p('Açaí Tigela 500ml', 'Açaí na tigela com granola e banana 500ml', 19.99, 'Pratos Prontos'),
  p('Açaí Tigela 300ml', 'Açaí na tigela com granola 300ml', 14.99, 'Pratos Prontos'),
  p('Salada de Frutas 300g', 'Salada de frutas frescas porção 300g', 9.99, 'Pratos Prontos'),
  p('Mousse de Maracujá 200g', 'Mousse de maracujá individual 200g', 8.99, 'Pratos Prontos'),
  p('Pudim de Leite Fatia', 'Pudim de leite condensado fatia', 7.99, 'Pratos Prontos'),
  p('Brigadeiro Gourmet 6un', 'Brigadeiro gourmet sortido 6 unidades', 14.99, 'Pratos Prontos'),
  p('Pavê de Chocolate 400g', 'Pavê de chocolate caseiro porção 400g', 16.99, 'Pratos Prontos'),
  p(
    'Bolo de Cenoura Fatia',
    'Bolo de cenoura com cobertura chocolate fatia',
    8.99,
    'Pratos Prontos'
  ),
  p('Bolo de Fubá Fatia', 'Bolo de fubá caseiro fatia', 6.99, 'Pratos Prontos'),
]

// ─── 17. Fitness & Saúde (40 SKUs) ─────────────────────────────
const fitnessSaude: TemplateSampleProduct[] = [
  p('Whey Protein 900g', 'Whey protein concentrado baunilha 900g', 89.99, 'Fitness & Saúde'),
  p('Whey Protein sachê 30g', 'Whey protein dose única sachê 30g', 9.99, 'Fitness & Saúde'),
  p('Creatina 300g', 'Creatina monohidratada pura 300g', 69.99, 'Fitness & Saúde'),
  p('BCAA 120 caps', 'BCAA aminoácidos 120 cápsulas', 49.99, 'Fitness & Saúde'),
  p('Albumina 500g', 'Albumina em pó sabor baunilha 500g', 29.99, 'Fitness & Saúde'),
  p(
    'Pasta de Amendoim Integral 500g',
    'Pasta de amendoim integral sem açúcar',
    19.99,
    'Fitness & Saúde'
  ),
  p(
    'Pasta de Amendoim Crocante 500g',
    'Pasta de amendoim crocante com pedaços',
    21.99,
    'Fitness & Saúde'
  ),
  p('Barra Proteica 60g', 'Barra proteica bold cookies 60g', 9.99, 'Fitness & Saúde'),
  p('Barra Proteica Pack 3un', 'Pack 3 barras proteicas sortidas', 24.99, 'Fitness & Saúde'),
  p('Granola Sem Açúcar 500g', 'Granola sem açúcar orgânica 500g', 14.99, 'Fitness & Saúde'),
  p('Tapioca Goma 1kg', 'Goma de tapioca hidratada para crepioca 1kg', 8.99, 'Fitness & Saúde'),
  p('Óleo de Coco 200ml', 'Óleo de coco extravirgem 200ml', 16.99, 'Fitness & Saúde'),
  p('Açúcar de Coco 250g', 'Açúcar de coco orgânico 250g', 14.99, 'Fitness & Saúde'),
  p('Farinha de Amêndoas 200g', 'Farinha de amêndoas sem glúten 200g', 24.99, 'Fitness & Saúde'),
  p('Farinha de Coco 200g', 'Farinha de coco sem glúten 200g', 14.99, 'Fitness & Saúde'),
  p('Psyllium 200g', 'Psyllium fibra natural 200g', 19.99, 'Fitness & Saúde'),
  p('Spirulina 60 caps', 'Spirulina superalimento 60 cápsulas', 29.99, 'Fitness & Saúde'),
  p('Colágeno Hidrolisado 300g', 'Colágeno hidrolisado em pó 300g', 34.99, 'Fitness & Saúde'),
  p('Vitamina D3 60 caps', 'Vitamina D3 2000UI 60 cápsulas', 19.99, 'Fitness & Saúde'),
  p('Ômega 3 60 caps', 'Ômega 3 óleo de peixe 1000mg 60 cápsulas', 24.99, 'Fitness & Saúde'),
  p(
    'Multivitamínico 60 caps',
    'Multivitamínico A-Z completo 60 cápsulas',
    24.99,
    'Fitness & Saúde'
  ),
  p('Magnésio 60 caps', 'Magnésio dimalato 60 cápsulas', 19.99, 'Fitness & Saúde'),
  p('Macarrão Konjac Zero 200g', 'Macarrão konjac zero carboidrato 200g', 12.99, 'Fitness & Saúde'),
  p('Chocolate Amargo 70% 80g', 'Chocolate amargo 70% cacau barra 80g', 9.99, 'Fitness & Saúde'),
  p('Chocolate Amargo 85% 80g', 'Chocolate amargo 85% cacau barra 80g', 12.99, 'Fitness & Saúde'),
  p('Adoçante Xilitol 300g', 'Adoçante natural xilitol 300g', 24.99, 'Fitness & Saúde'),
  p(
    'Adoçante Stevia Líquido 80ml',
    'Adoçante líquido Stevia natural 80ml',
    14.99,
    'Fitness & Saúde'
  ),
  p('Chá Verde Sachê 20un', 'Chá verde natural sachê 20 unidades', 7.99, 'Fitness & Saúde'),
  p(
    'Chá de Hibisco Sachê 20un',
    'Chá de hibisco natural sachê 20 unidades',
    7.99,
    'Fitness & Saúde'
  ),
  p(
    'Chá de Camomila Sachê 20un',
    'Chá de camomila natural sachê 20 unidades',
    6.99,
    'Fitness & Saúde'
  ),
  p('Arroz Integral 1kg', 'Arroz integral tipo 1 embalagem 1kg', 7.99, 'Fitness & Saúde'),
  p('Macarrão Integral 500g', 'Macarrão espaguete integral 500g', 5.99, 'Fitness & Saúde'),
  p('Pão Integral Low Carb 400g', 'Pão integral low carb fatiado 400g', 12.99, 'Fitness & Saúde'),
  p(
    'Leite Desnatado Zero Lactose 1L',
    'Leite UHT desnatado zero lactose 1L',
    6.99,
    'Fitness & Saúde'
  ),
  p('Iogurte Grego Proteico 200g', 'Iogurte grego proteico natural 200g', 7.99, 'Fitness & Saúde'),
  p('Mix de Frutas Secas 150g', 'Mix de frutas secas desidratadas 150g', 12.99, 'Fitness & Saúde'),
  p('Semente de Girassol 100g', 'Semente de girassol sem casca 100g', 5.99, 'Fitness & Saúde'),
  p('Cacau em Pó 100% 200g', 'Cacau em pó 100% sem açúcar 200g', 14.99, 'Fitness & Saúde'),
  p('Snack Proteico 40g', 'Snack proteico salgado 40g', 6.99, 'Fitness & Saúde'),
  p('Chips de Batata Doce 40g', 'Chips de batata doce assada 40g', 7.99, 'Fitness & Saúde'),
]

// ─── 18. Tabacaria & Conveniência (30 SKUs) ────────────────────
const tabacariaConveniencia: TemplateSampleProduct[] = [
  p(
    'Cigarro Marlboro Maço',
    'Cigarro Marlboro vermelho maço 20 unidades',
    12.99,
    'Tabacaria & Conveniência'
  ),
  p(
    'Cigarro Lucky Strike Maço',
    'Cigarro Lucky Strike original maço',
    10.99,
    'Tabacaria & Conveniência'
  ),
  p('Cigarro Dunhill Maço', 'Cigarro Dunhill Carlton maço', 11.99, 'Tabacaria & Conveniência'),
  p(
    'Tabaco para Cigarro 25g',
    'Tabaco para enrolar cigarro 25g',
    14.99,
    'Tabacaria & Conveniência'
  ),
  p(
    'Papel para Cigarro 50un',
    'Papel para enrolar cigarro 50 folhas',
    3.99,
    'Tabacaria & Conveniência'
  ),
  p(
    'Filtro para Cigarro 120un',
    'Filtro slim para cigarro 120 unidades',
    4.99,
    'Tabacaria & Conveniência'
  ),
  p(
    'Essência Narguile 50g',
    'Essência para narguile sabor sortido 50g',
    9.99,
    'Tabacaria & Conveniência'
  ),
  p(
    'Carvão para Narguile 10un',
    'Carvão pastilha para narguile 10 unidades',
    7.99,
    'Tabacaria & Conveniência'
  ),
  p('Cartão Presente R$50', 'Gift card presente R$ 50,00', 50.0, 'Tabacaria & Conveniência'),
  p('Cartão Presente R$100', 'Gift card presente R$ 100,00', 100.0, 'Tabacaria & Conveniência'),
  p(
    'Recarga Celular R$20',
    'Recarga de celular crédito R$ 20,00',
    20.0,
    'Tabacaria & Conveniência'
  ),
  p(
    'Recarga Celular R$30',
    'Recarga de celular crédito R$ 30,00',
    30.0,
    'Tabacaria & Conveniência'
  ),
  p(
    'Recarga Celular R$50',
    'Recarga de celular crédito R$ 50,00',
    50.0,
    'Tabacaria & Conveniência'
  ),
  p('Jornal do Dia', 'Jornal impresso do dia edição local', 4.99, 'Tabacaria & Conveniência'),
  p('Revista Semanal', 'Revista semanal informativa', 14.99, 'Tabacaria & Conveniência'),
  p(
    'Guarda-Chuva Descartável',
    'Guarda-chuva compacto emergência',
    14.99,
    'Tabacaria & Conveniência'
  ),
  p(
    'Carregador Portátil USB 5000mAh',
    'Power bank portátil USB 5000mAh',
    39.99,
    'Tabacaria & Conveniência'
  ),
  p('Cabo USB-C 1m', 'Cabo USB tipo C carregamento rápido 1m', 19.99, 'Tabacaria & Conveniência'),
  p('Cabo Lightning 1m', 'Cabo Lightning Apple carregamento 1m', 24.99, 'Tabacaria & Conveniência'),
  p(
    'Fone de Ouvido Básico',
    'Fone de ouvido intra-auricular P2',
    14.99,
    'Tabacaria & Conveniência'
  ),
  p('Pen Drive 32GB', 'Pen drive USB 3.0 32GB', 29.99, 'Tabacaria & Conveniência'),
  p('Cartão de Memória 32GB', 'Cartão micro SD 32GB classe 10', 29.99, 'Tabacaria & Conveniência'),
  p(
    'Óculos de Sol Básico',
    'Óculos de sol com proteção UV unissex',
    19.99,
    'Tabacaria & Conveniência'
  ),
  p('Colete Refletivo', 'Colete refletivo segurança universal', 9.99, 'Tabacaria & Conveniência'),
  p('Cadeado com Chave', 'Cadeado latão 25mm com 2 chaves', 14.99, 'Tabacaria & Conveniência'),
  p(
    'Lanterna LED Compacta',
    'Lanterna LED compacta 3 pilhas AAA',
    19.99,
    'Tabacaria & Conveniência'
  ),
  p('Fita Isolante 10m', 'Fita isolante preta 19mm x 10m', 3.99, 'Tabacaria & Conveniência'),
  p(
    'Parafuso/Bucha Kit 20 peças',
    'Kit parafuso e bucha sortidos 20 peças',
    5.99,
    'Tabacaria & Conveniência'
  ),
  p('Mapa da Cidade', 'Mapa turístico da cidade e região', 7.99, 'Tabacaria & Conveniência'),
  p('Saco de Pano Ecobag', 'Sacola ecológica reutilizável pano', 9.99, 'Tabacaria & Conveniência'),
]

// ─── 19. Sorvetes & Sobremesas Geladas (40 SKUs) ───────────────
const sorvetesSobremesas: TemplateSampleProduct[] = [
  p(
    'Sorvete Kibon Magnum Amêndoas',
    'Picolé Magnum amêndoas Kibon unidade',
    8.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Sorvete Kibon Magnum Branco',
    'Picolé Magnum chocolate branco Kibon',
    8.99,
    'Sorvetes & Sobremesas'
  ),
  p('Picolé Chicabon', 'Picolé Chicabon chocolate Kibon unidade', 4.99, 'Sorvetes & Sobremesas'),
  p('Picolé Tablito', 'Picolé Tablito Kibon unidade', 4.99, 'Sorvetes & Sobremesas'),
  p('Picolé Eskibon', 'Picolé Eskibon Kibon unidade', 4.99, 'Sorvetes & Sobremesas'),
  p('Picolé de Limão', 'Picolé de limão artesanal unidade', 3.99, 'Sorvetes & Sobremesas'),
  p('Picolé de Açaí', 'Picolé de açaí recheado unidade', 5.99, 'Sorvetes & Sobremesas'),
  p('Picolé de Maracujá', 'Picolé de maracujá natural unidade', 3.99, 'Sorvetes & Sobremesas'),
  p(
    'Sorvete Pote 2L Napolitano',
    'Sorvete pote 2 litros napolitano',
    24.99,
    'Sorvetes & Sobremesas'
  ),
  p('Sorvete Pote 2L Chocolate', 'Sorvete pote 2 litros chocolate', 24.99, 'Sorvetes & Sobremesas'),
  p('Sorvete Pote 2L Morango', 'Sorvete pote 2 litros morango', 24.99, 'Sorvetes & Sobremesas'),
  p('Sorvete Pote 2L Baunilha', 'Sorvete pote 2 litros baunilha', 24.99, 'Sorvetes & Sobremesas'),
  p('Sorvete Pote 2L Creme', 'Sorvete pote 2 litros creme', 22.99, 'Sorvetes & Sobremesas'),
  p('Sorvete Pote 2L Flocos', 'Sorvete pote 2 litros flocos', 24.99, 'Sorvetes & Sobremesas'),
  p(
    "Sorvete Ben & Jerry's Half Baked 458ml",
    "Sorvete Ben & Jerry's Half Baked 458ml",
    39.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Sundae Pronto Chocolate 200ml',
    'Sundae pronto calda chocolate 200ml',
    9.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Casquinha de Sorvete 12un',
    'Casquinha de sorvete embalada 12 unidades',
    6.99,
    'Sorvetes & Sobremesas'
  ),
  p('Calda Chocolate 300g', 'Calda de chocolate para sorvete 300g', 9.99, 'Sorvetes & Sobremesas'),
  p('Calda Morango 300g', 'Calda de morango para sorvete 300g', 8.99, 'Sorvetes & Sobremesas'),
  p('Calda Caramelo 300g', 'Calda de caramelo para sorvete 300g', 9.99, 'Sorvetes & Sobremesas'),
  p(
    'Granulado Chocolate 150g',
    'Granulado de chocolate para sorvete 150g',
    4.99,
    'Sorvetes & Sobremesas'
  ),
  p('Marshmallow 150g', 'Marshmallow fofinho pacote 150g', 5.99, 'Sorvetes & Sobremesas'),
  p(
    'Chantilly Spray 250ml',
    'Chantilly spray para sobremesas 250ml',
    14.99,
    'Sorvetes & Sobremesas'
  ),
  p('Gelatina Pronta 400g', 'Gelatina pronta morango pote 400g', 5.99, 'Sorvetes & Sobremesas'),
  p(
    'Mousse Pronta Chocolate 70g',
    'Mousse pronta chocolate Chandelle 70g',
    3.49,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Mousse Pronta Maracujá 70g',
    'Mousse pronta maracujá Chandelle 70g',
    3.49,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Petit Gateau Congelado 120g',
    'Petit gateau chocolate congelado 120g',
    12.99,
    'Sorvetes & Sobremesas'
  ),
  p('Açaí Sorvete Pote 500ml', 'Sorvete de açaí pote 500ml', 14.99, 'Sorvetes & Sobremesas'),
  p('Frozen Yogurt Pote 500ml', 'Frozen yogurt natural pote 500ml', 16.99, 'Sorvetes & Sobremesas'),
  p(
    'Paleta Mexicana un',
    'Paleta mexicana recheada artesanal unidade',
    9.99,
    'Sorvetes & Sobremesas'
  ),
  p('Bolo Gelado Fatia', 'Bolo gelado fatia sabor coco', 7.99, 'Sorvetes & Sobremesas'),
  p(
    'Torta de Sorvete Fatia',
    'Torta de sorvete com biscoito fatia',
    12.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Banana Split Kit',
    'Kit banana split: banana + 3 bolas + calda',
    14.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Copão Açaí 750ml',
    'Copão açaí 750ml c/ banana, granola e leite pó',
    24.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Milkshake Chocolate 400ml',
    'Milkshake chocolate com chantilly 400ml',
    14.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Milkshake Morango 400ml',
    'Milkshake morango com chantilly 400ml',
    14.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Milkshake Ovomaltine 400ml',
    'Milkshake Ovomaltine com chantilly 400ml',
    16.99,
    'Sorvetes & Sobremesas'
  ),
  p('Smoothie Frutas 400ml', 'Smoothie de frutas tropicais 400ml', 12.99, 'Sorvetes & Sobremesas'),
  p(
    'Granita Limão Siciliano 300ml',
    'Granita de limão siciliano 300ml',
    9.99,
    'Sorvetes & Sobremesas'
  ),
  p(
    'Churros Doce de Leite 120g',
    'Churros recheado doce de leite 120g',
    8.99,
    'Sorvetes & Sobremesas'
  ),
]

// ─── 20. Bebidas Quentes & Chás (30 SKUs) ─────────────────────
const bebidasQuentes: TemplateSampleProduct[] = [
  p(
    'Café Expresso Cápsulas 10un',
    'Cápsula de café expresso compatível 10un',
    19.99,
    'Bebidas Quentes'
  ),
  p(
    'Café Dolce Gusto Cappuccino 10un',
    'Cápsula Dolce Gusto cappuccino 10un',
    24.99,
    'Bebidas Quentes'
  ),
  p(
    'Café Dolce Gusto Chococino 10un',
    'Cápsula Dolce Gusto chococino 10un',
    24.99,
    'Bebidas Quentes'
  ),
  p('Café em Grão Premium 500g', 'Café em grão torrado premium 500g', 29.99, 'Bebidas Quentes'),
  p('Café Orgânico 250g', 'Café orgânico torrado e moído 250g', 19.99, 'Bebidas Quentes'),
  p(
    'Chá Preto English Breakfast 20un',
    'Chá preto English Breakfast sachê 20un',
    8.99,
    'Bebidas Quentes'
  ),
  p('Chá Earl Grey 20un', 'Chá Earl Grey sachê 20 unidades', 9.99, 'Bebidas Quentes'),
  p('Chá Boldo 20un', 'Chá de boldo Leão sachê 20 unidades', 5.99, 'Bebidas Quentes'),
  p('Chá Hortelã 20un', 'Chá de hortelã sachê 20 unidades', 5.99, 'Bebidas Quentes'),
  p('Chá Cidreira 20un', 'Chá de erva cidreira sachê 20 unidades', 5.99, 'Bebidas Quentes'),
  p(
    'Chá Gengibre e Limão 20un',
    'Chá gengibre com limão sachê 20 unidades',
    7.99,
    'Bebidas Quentes'
  ),
  p('Chocolate Quente em Pó 200g', 'Mistura para chocolate quente 200g', 9.99, 'Bebidas Quentes'),
  p(
    'Chocolate Quente Premium 200g',
    'Chocolate quente premium 50% cacau 200g',
    16.99,
    'Bebidas Quentes'
  ),
  p('Capuccino em Pó Sachê 10un', 'Cappuccino cremoso sachê 10 unidades', 14.99, 'Bebidas Quentes'),
  p('Café Solúvel Gourmet 100g', 'Café solúvel premium liofilizado 100g', 24.99, 'Bebidas Quentes'),
  p('Chai Latte em Pó 200g', 'Chai latte mistura em pó 200g', 19.99, 'Bebidas Quentes'),
  p('Matcha em Pó 30g', 'Matcha japonês em pó premium 30g', 29.99, 'Bebidas Quentes'),
  p('Chá Mate Tostado 250g', 'Erva mate tostada para chimarrão 250g', 7.99, 'Bebidas Quentes'),
  p(
    'Filtro de Papel Melitta 40un',
    'Filtro de café papel Melitta nº 102 40un',
    6.99,
    'Bebidas Quentes'
  ),
  p('Coador de Pano', 'Coador de café de pano reutilizável', 4.99, 'Bebidas Quentes'),
  p('Açúcar Mascavo 500g', 'Açúcar mascavo não refinado 500g', 7.99, 'Bebidas Quentes'),
  p('Achocolatado Orgânico 400g', 'Achocolatado orgânico em pó 400g', 14.99, 'Bebidas Quentes'),
  p('Canela em Pau 30g', 'Canela em pau embalagem 30g', 4.99, 'Bebidas Quentes'),
  p('Canela em Pó 40g', 'Canela em pó moída 40g', 3.99, 'Bebidas Quentes'),
  p('Cravo da Índia 15g', 'Cravo da índia inteiro 15g', 3.99, 'Bebidas Quentes'),
  p('Gengibre Cristalizado 100g', 'Gengibre cristalizado embalagem 100g', 8.99, 'Bebidas Quentes'),
  p('Mistura Quentão 100g', 'Mistura pronta para quentão 100g', 6.99, 'Bebidas Quentes'),
  p('Vinho Quente Pronto 1L', 'Vinho quente pronto garrafa 1 litro', 14.99, 'Bebidas Quentes'),
  p(
    'Chocolate ao Leite Callets 200g',
    'Chocolate callets/gotas ao leite 200g',
    12.99,
    'Bebidas Quentes'
  ),
  p(
    'Chocolate Meio Amargo Callets 200g',
    'Chocolate callets meio amargo 200g',
    14.99,
    'Bebidas Quentes'
  ),
]

// ─── 21. Molhos Especiais & Importados (30 SKUs) ───────────────
const molhosEspeciais: TemplateSampleProduct[] = [
  p(
    "Molho Barbecue Sweet Baby Ray's 510g",
    "Molho barbecue Sweet Baby Ray's importado",
    24.99,
    'Molhos Especiais'
  ),
  p('Molho Sriracha 266ml', 'Molho de pimenta Sriracha Huy Fong', 24.99, 'Molhos Especiais'),
  p('Molho Ranch 350ml', 'Molho ranch para salada 350ml', 16.99, 'Molhos Especiais'),
  p('Azeite Trufado 100ml', 'Azeite de oliva com trufa negra 100ml', 39.99, 'Molhos Especiais'),
  p('Molho Pesto 190g', 'Molho pesto genovese vidro 190g', 19.99, 'Molhos Especiais'),
  p('Tahine 250g', 'Pasta de gergelim tahine 250g', 16.99, 'Molhos Especiais'),
  p('Chimichurri 200ml', 'Molho chimichurri argentino 200ml', 12.99, 'Molhos Especiais'),
  p('Molho Teriyaki 250ml', 'Molho teriyaki japonês 250ml', 14.99, 'Molhos Especiais'),
  p('Molho Curry 200ml', 'Molho curry indiano 200ml', 16.99, 'Molhos Especiais'),
  p('Wasabi em Pasta 43g', 'Wasabi em pasta para sushi 43g', 9.99, 'Molhos Especiais'),
  p('Gengibre em Conserva 100g', 'Gengibre fatiado conserva (gari) 100g', 9.99, 'Molhos Especiais'),
  p('Molho de Ostras 255ml', 'Molho de ostras oriental Lee Kum Kee', 14.99, 'Molhos Especiais'),
  p('Vinagre Balsâmico 250ml', 'Vinagre balsâmico de Modena 250ml', 19.99, 'Molhos Especiais'),
  p('Azeite de Dendê 200ml', 'Azeite de dendê para culinária baiana', 8.99, 'Molhos Especiais'),
  p('Leite de Coco 200ml', 'Leite de coco para receitas 200ml', 4.99, 'Molhos Especiais'),
  p('Pasta de Alho 200g', 'Pasta de alho pronta embalagem 200g', 6.99, 'Molhos Especiais'),
  p('Pimenta Biquinho 200g', 'Pimenta biquinho em conserva 200g', 9.99, 'Molhos Especiais'),
  p('Pimenta Dedo de Moça kg', 'Pimenta dedo de moça fresca por quilo', 14.99, 'Molhos Especiais'),
  p('Páprica Defumada 40g', 'Páprica defumada especial 40g', 5.99, 'Molhos Especiais'),
  p('Açafrão (Cúrcuma) 30g', 'Açafrão da terra em pó (cúrcuma) 30g', 4.99, 'Molhos Especiais'),
  p('Noz Moscada 20g', 'Noz moscada em pó 20g', 4.99, 'Molhos Especiais'),
  p('Ervas finas Desidratadas 10g', 'Mix ervas finas desidratadas 10g', 3.99, 'Molhos Especiais'),
  p('Tomilho Desidratado 10g', 'Tomilho desidratado embalagem 10g', 3.49, 'Molhos Especiais'),
  p('Alecrim Desidratado 10g', 'Alecrim desidratado embalagem 10g', 3.49, 'Molhos Especiais'),
  p('Manjericão Desidratado 10g', 'Manjericão desidratado 10g', 3.49, 'Molhos Especiais'),
  p('Louro em Folhas 5g', 'Folha de louro desidratada 5g', 2.99, 'Molhos Especiais'),
  p('Pimenta Calabresa 40g', 'Flocos de pimenta calabresa 40g', 3.99, 'Molhos Especiais'),
  p(
    'Molho de Pimenta Habanero 60ml',
    'Molho de pimenta habanero extra forte',
    19.99,
    'Molhos Especiais'
  ),
  p('Shoyu Premium 500ml', 'Molho de soja premium fermentado 500ml', 14.99, 'Molhos Especiais'),
  p('Missô Paste 200g', 'Pasta de missô (soja fermentada) 200g', 14.99, 'Molhos Especiais'),
]

// ─── 22. Importados & Gourmet (72 SKUs) ────────────────────────
const importadosGourmet: TemplateSampleProduct[] = [
  p(
    'Azeite Extra Virgem Italiano 500ml',
    'Azeite extra virgem DOP italiano 500ml',
    49.99,
    'Importados & Gourmet'
  ),
  p(
    'Macarrão Italiano De Cecco 500g',
    'Massa De Cecco spaghetti nº 12 500g',
    12.99,
    'Importados & Gourmet'
  ),
  p('Tomate San Marzano 400g', 'Tomate pelato San Marzano DOP lata', 19.99, 'Importados & Gourmet'),
  p(
    'Parmigiano Reggiano 200g',
    'Queijo parmigiano reggiano DOP 200g',
    49.99,
    'Importados & Gourmet'
  ),
  p(
    'Presunto de Parma Importado 100g',
    'Prosciutto di Parma importado 100g',
    39.99,
    'Importados & Gourmet'
  ),
  p(
    'Salame Importado Italiano 100g',
    'Salame Milano importado fatiado 100g',
    24.99,
    'Importados & Gourmet'
  ),
  p(
    'Biscoito Importado Belvita 300g',
    'Biscoito Belvita cereal integral 300g',
    12.99,
    'Importados & Gourmet'
  ),
  p(
    'Chocolate Lindt 100g',
    'Tablete chocolate Lindt Excellence 70%',
    24.99,
    'Importados & Gourmet'
  ),
  p(
    'Chocolate Lindt Lindor 200g',
    'Bombom Lindt Lindor sortido 200g',
    39.99,
    'Importados & Gourmet'
  ),
  p(
    'Chocolate Ferrero Rocher 8un',
    'Bombom Ferrero Rocher caixa 8 unidades',
    29.99,
    'Importados & Gourmet'
  ),
  p('Chocolate Toblerone 100g', 'Chocolate Toblerone ao leite 100g', 14.99, 'Importados & Gourmet'),
  p('Chocolate Milka 100g', 'Chocolate Milka Alpine Milk 100g', 14.99, 'Importados & Gourmet'),
  p(
    'Cookies Importados Oreo 154g',
    'Cookies Oreo Double Stuff importado',
    12.99,
    'Importados & Gourmet'
  ),
  p(
    'Pringles Importada Sour Cream 165g',
    'Pringles Sour Cream & Onion importada',
    19.99,
    'Importados & Gourmet'
  ),
  p(
    'Doritos Dinamita 150g',
    'Doritos Dinamita chile limón importado',
    16.99,
    'Importados & Gourmet'
  ),
  p('Kinder Ovo 20g', 'Kinder Ovo surpresa unidade 20g', 9.99, 'Importados & Gourmet'),
  p('Nutella & Go', 'Nutella com palitos para mergulhar unidade', 12.99, 'Importados & Gourmet'),
  p(
    'Queijo Gouda Holandês 200g',
    'Queijo gouda holandês envelhecido 200g',
    29.99,
    'Importados & Gourmet'
  ),
  p(
    'Cream Cheese President 150g',
    'Cream cheese importado President 150g',
    12.99,
    'Importados & Gourmet'
  ),
  p(
    'Ghee Importado 300g',
    'Manteiga ghee clarificada importada 300g',
    34.99,
    'Importados & Gourmet'
  ),
  p(
    'Risoto Pronto Arbório 300g',
    'Arroz arbório italiano para risoto 300g',
    14.99,
    'Importados & Gourmet'
  ),
  p('Alcaparra 100g', 'Alcaparra em conserva vidro 100g', 12.99, 'Importados & Gourmet'),
  p('Tomate Seco 200g', 'Tomate seco em conserva 200g', 14.99, 'Importados & Gourmet'),
  p('Cebola Crispy 100g', 'Cebola frita crispy embalagem 100g', 9.99, 'Importados & Gourmet'),
  p('Tahini Premium 300g', 'Tahini premium importado 300g', 24.99, 'Importados & Gourmet'),
  p('Homus 200g', 'Homus de grão de bico pronto 200g', 14.99, 'Importados & Gourmet'),
  p('Guacamole Pronto 200g', 'Guacamole fresco pronto 200g', 16.99, 'Importados & Gourmet'),
  p('Nachos Tortilla 200g', 'Nachos tortilla chips milho 200g', 12.99, 'Importados & Gourmet'),
  p(
    'Molho Guacamole para Nachos 200g',
    'Molho tipo guacamole para nachos 200g',
    12.99,
    'Importados & Gourmet'
  ),
  p(
    'Queijo Pecorino Romano 100g',
    'Queijo pecorino romano ralado 100g',
    24.99,
    'Importados & Gourmet'
  ),
  p(
    'Trufas Artesanais 6un',
    'Trufas de chocolate artesanais 6un sortidas',
    24.99,
    'Importados & Gourmet'
  ),
  p('Macaron Francês 6un', 'Macaron francês sortido 6 unidades', 34.99, 'Importados & Gourmet'),
  p(
    'Brownie Artesanal 4un',
    'Brownie chocolate artesanal 4 unidades',
    19.99,
    'Importados & Gourmet'
  ),
  p(
    'Cantucci Italiano 200g',
    'Biscoito cantucci italiano amêndoas 200g',
    19.99,
    'Importados & Gourmet'
  ),
  p(
    'Cookies Speculoos Lotus 250g',
    'Biscoito Lotus Biscoff Speculoos 250g',
    19.99,
    'Importados & Gourmet'
  ),
  p('Pasta Lotus Crunchy 400g', 'Pasta Lotus Biscoff crocante 400g', 34.99, 'Importados & Gourmet'),
  p(
    'Tortellini Fresco 250g',
    'Tortellini fresco recheio ricota 250g',
    16.99,
    'Importados & Gourmet'
  ),
  p('Ravioli Fresco 250g', 'Ravioli fresco recheio carne 250g', 16.99, 'Importados & Gourmet'),
  p('Gnocchi Fresco 500g', 'Nhoque de batata fresco artesanal 500g', 12.99, 'Importados & Gourmet'),
  p('Pão Focaccia 300g', 'Focaccia italiana com ervas 300g', 14.99, 'Importados & Gourmet'),
  p('Grissini 125g', 'Palito grissini italiano 125g', 9.99, 'Importados & Gourmet'),
  p(
    'Bruschetta Pronta Tomate 200g',
    'Bruschetta pronta tomate seco 200g',
    12.99,
    'Importados & Gourmet'
  ),
  p('Creme de Trufas 80g', 'Creme de trufas negras importado 80g', 39.99, 'Importados & Gourmet'),
  p('Escargot Enlatado 125g', 'Escargot (caracol) enlatado 125g', 34.99, 'Importados & Gourmet'),
  p('Foie Gras Mousse 80g', 'Mousse de foie gras importado 80g', 49.99, 'Importados & Gourmet'),
  p('Caviar Preto 50g', 'Caviar preto importado vidro 50g', 89.99, 'Importados & Gourmet'),
  p('Queijo Roquefort 100g', 'Queijo Roquefort francês DOP 100g', 34.99, 'Importados & Gourmet'),
  p('Queijo Camembert 125g', 'Queijo Camembert francês 125g', 24.99, 'Importados & Gourmet'),
  p(
    'Champagne Moët Chandon 750ml',
    'Champagne Moët & Chandon Brut 750ml',
    199.99,
    'Importados & Gourmet'
  ),
  p(
    'Prosecco Italiano 750ml',
    'Prosecco DOC italiano garrafa 750ml',
    59.99,
    'Importados & Gourmet'
  ),
  p(
    'Vinho Argentino Malbec 750ml',
    'Vinho Catena malbec argentino 750ml',
    69.99,
    'Importados & Gourmet'
  ),
  p(
    'Whisky Macallan 12 anos 750ml',
    'Whisky Macallan 12 anos Double Cask',
    299.99,
    'Importados & Gourmet'
  ),
  p('Sake Junmai 720ml', 'Sake Junmai japonês premium 720ml', 49.99, 'Importados & Gourmet'),
  p(
    'Cerveja Belga Tripel 330ml',
    'Cerveja belga estilo Tripel 330ml',
    19.99,
    'Importados & Gourmet'
  ),
  p(
    'Cerveja IPA Importada 473ml',
    'Cerveja IPA americana importada 473ml',
    16.99,
    'Importados & Gourmet'
  ),
  p("Gin Hendrick's 750ml", "Gin Hendrick's escocês 750ml", 159.99, 'Importados & Gourmet'),
  p(
    'Tequila Patron Silver 750ml',
    'Tequila Patron Silver premium 750ml',
    199.99,
    'Importados & Gourmet'
  ),
  p('Vermouth Cinzano 1L', 'Vermouth Cinzano rosso 1 litro', 34.99, 'Importados & Gourmet'),
  p('Angostura Bitters 200ml', 'Angostura aromatic bitters 200ml', 49.99, 'Importados & Gourmet'),
  p('Tônica Fever-Tree 200ml', 'Tônica premium Fever-Tree 200ml', 9.99, 'Importados & Gourmet'),
  p(
    'Água com Gás Perrier 330ml',
    'Água mineral c/ gás Perrier 330ml',
    9.99,
    'Importados & Gourmet'
  ),
  p(
    'Suco de Cranberry Ocean Spray 1L',
    'Suco cranberry Ocean Spray 1 litro',
    19.99,
    'Importados & Gourmet'
  ),
  p('Geleia de Damasco 320g', 'Geleia de damasco importada 320g', 16.99, 'Importados & Gourmet'),
  p('Mel de Manuka 250g', 'Mel de manuka neozelandês MGO 100+ 250g', 89.99, 'Importados & Gourmet'),
  p(
    'Azeite de Trufas Brancas 100ml',
    'Azeite de trufas brancas italianas 100ml',
    54.99,
    'Importados & Gourmet'
  ),
  p(
    'Chá Inglês Twinings 25un',
    'Chá Twinings English Breakfast 25 sachês',
    16.99,
    'Importados & Gourmet'
  ),
  p('Café Illy 250g', 'Café Illy classico moído 250g', 34.99, 'Importados & Gourmet'),
  p('Wafer Manner 200g', 'Wafer Manner original Viena 200g', 19.99, 'Importados & Gourmet'),
  p('Drops Ricola 40g', 'Pastilha Ricola ervas suíça 40g', 9.99, 'Importados & Gourmet'),
  p('Mochi Japonês 210g', 'Mochi ice cream japonês sortido 210g', 24.99, 'Importados & Gourmet'),
  p('Pocky Morango 40g', 'Biscoito palito Pocky morango 40g', 9.99, 'Importados & Gourmet'),
  p(
    'Kit Kat Matcha 4 fingers',
    'Kit Kat sabor Matcha japonês 4 fingers',
    14.99,
    'Importados & Gourmet'
  ),
]

// ─── 23. Farmácia Básica & OTC (35 SKUs) ───────────────────────
const farmaciaBasica: TemplateSampleProduct[] = [
  p('Dipirona 500mg 10 comp', 'Dipirona sódica 500mg 10 comprimidos', 4.99, 'Farmácia Básica'),
  p('Paracetamol 750mg 20 comp', 'Paracetamol 750mg 20 comprimidos', 5.99, 'Farmácia Básica'),
  p('Ibuprofeno 400mg 10 comp', 'Ibuprofeno 400mg 10 comprimidos', 6.99, 'Farmácia Básica'),
  p('Neosaldina 20 comp', 'Neosaldina analgésico 20 comprimidos', 12.99, 'Farmácia Básica'),
  p('Benegrip 6 comp', 'Benegrip antigripal 6 comprimidos', 8.99, 'Farmácia Básica'),
  p('Engov After 6 comp', 'Engov After 6 comprimidos efervescentes', 14.99, 'Farmácia Básica'),
  p('Sal de Frutas Eno 5g', 'Sal de frutas Eno sachê 5g', 2.99, 'Farmácia Básica'),
  p('Luftal 40mg 20 comp', 'Luftal gotas/comprimidos 40mg 20 comp', 14.99, 'Farmácia Básica'),
  p('Estomazil 10 comp', 'Estomazil estomacal 10 comprimidos', 7.99, 'Farmácia Básica'),
  p('Pastilha Benalet 8un', 'Pastilha para garganta Benalet 8 unidades', 8.99, 'Farmácia Básica'),
  p('Colirio Moura Brasil 20ml', 'Colírio Moura Brasil refrescante 20ml', 9.99, 'Farmácia Básica'),
  p('Soro Fisiológico 500ml', 'Soro fisiológico nasal/lavagem 500ml', 9.99, 'Farmácia Básica'),
  p('Descongestionante Nasal 30ml', 'Descongestionante nasal spray 30ml', 14.99, 'Farmácia Básica'),
  p('Termômetro Digital', 'Termômetro digital ponta rígida', 14.99, 'Farmácia Básica'),
  p('Gaze Estéril 10un', 'Gaze estéril 7,5x7,5cm 10 unidades', 4.99, 'Farmácia Básica'),
  p('Esparadrapo 10cm x 4,5m', 'Esparadrapo impermeável 10cm x 4,5m', 9.99, 'Farmácia Básica'),
  p('Água Oxigenada 100ml', 'Água oxigenada 10 volumes 100ml', 3.99, 'Farmácia Básica'),
  p('Iodo Povidine 100ml', 'Povidine tópico antisséptico 100ml', 12.99, 'Farmácia Básica'),
  p('Pomada Nebacetin 15g', 'Pomada Nebacetin cicatrizante 15g', 14.99, 'Farmácia Básica'),
  p('Biotonico Fontoura 400ml', 'Complemento alimentar Biotônico 400ml', 29.99, 'Farmácia Básica'),
  p('Melatonina 5mg 30 comp', 'Melatonina 5mg sono natural 30 comp', 19.99, 'Farmácia Básica'),
  p('Cálcio + Vitamina D 60 comp', 'Cálcio 600mg + Vit D 60 comprimidos', 19.99, 'Farmácia Básica'),
  p('Zinco 30mg 60 comp', 'Zinco quelado 30mg 60 comprimidos', 14.99, 'Farmácia Básica'),
  p('Probiótico 30 caps', 'Probiótico intestinal 30 cápsulas', 29.99, 'Farmácia Básica'),
  p('Bolsa Térmica Gel', 'Bolsa gel quente/frio reutilizável', 14.99, 'Farmácia Básica'),
  p(
    'Luva Descartável 100un',
    'Luva latex descartável caixa 100 unidades',
    24.99,
    'Farmácia Básica'
  ),
  p('Máscara N95 5un', 'Máscara N95 proteção respiratória 5un', 16.99, 'Farmácia Básica'),
  p(
    'Antisséptico Bucal 250ml',
    'Antisséptico bucal digluconato clorexidina',
    12.99,
    'Farmácia Básica'
  ),
  p('Protetor Labial FPS 30', 'Protetor labial com FPS 30 unidade', 9.99, 'Farmácia Básica'),
  p('Atadura Elástica 10cm', 'Atadura elástica crepom 10cm x 1,8m', 3.99, 'Farmácia Básica'),
  p('Multigrip Dia 10 comp', 'Antigripal Multigrip dia 10 comprimidos', 9.99, 'Farmácia Básica'),
  p('Imosec 12 comp', 'Imosec antidiarreico 2mg 12 comprimidos', 14.99, 'Farmácia Básica'),
  p('Dramin 10 comp', 'Dramin antienjoô 50mg 10 comprimidos', 9.99, 'Farmácia Básica'),
  p('Tylenol Sinusite 12 comp', 'Tylenol Sinus 12 comprimidos', 14.99, 'Farmácia Básica'),
  p('Vitamina B12 30 comp', 'Vitamina B12 sublingual 30 comprimidos', 14.99, 'Farmácia Básica'),
]

// ─── 24. Papelaria & Escola (25 SKUs) ──────────────────────────
const papelaria: TemplateSampleProduct[] = [
  p(
    'Caderno Universitário 200 folhas',
    'Caderno espiral universitário 200 folhas',
    24.99,
    'Papelaria'
  ),
  p('Caderno 48 Folhas Brochura', 'Caderno brochura 48 folhas capa dura', 6.99, 'Papelaria'),
  p('Lápis Grafite HB cx 12un', 'Lápis grafite Faber-Castell HB 12 unidades', 9.99, 'Papelaria'),
  p('Borracha Branca 2un', 'Borracha escolar branca Pentel 2 unidades', 2.99, 'Papelaria'),
  p('Apontador com Depósito', 'Apontador com depósito Faber-Castell', 3.99, 'Papelaria'),
  p('Caneta Esferográfica Azul 4un', 'Caneta BIC Cristal azul 4 unidades', 6.99, 'Papelaria'),
  p('Caneta Esferográfica Preta 4un', 'Caneta BIC Cristal preta 4 unidades', 6.99, 'Papelaria'),
  p(
    'Canetinha Hidrográfica 12 cores',
    'Canetinha hidrocor Faber-Castell 12 cores',
    14.99,
    'Papelaria'
  ),
  p('Lápis de Cor 12 cores', 'Lápis de cor Faber-Castell 12 cores', 12.99, 'Papelaria'),
  p('Giz de Cera 12 cores', 'Giz de cera Acrilex 12 cores', 5.99, 'Papelaria'),
  p('Marca Texto 6 cores', 'Marca texto Faber-Castell 6 cores', 14.99, 'Papelaria'),
  p('Cola Branca 90g', 'Cola branca escolar Tenaz 90g', 3.99, 'Papelaria'),
  p('Cola Bastão 10g', 'Cola bastão Pritt 10g', 5.99, 'Papelaria'),
  p('Tesoura Escolar', 'Tesoura escolar sem ponta Faber-Castell', 6.99, 'Papelaria'),
  p('Régua 30cm', 'Régua plástica transparente 30cm', 2.99, 'Papelaria'),
  p('Compasso Escolar', 'Compasso escolar metálico com grafite', 12.99, 'Papelaria'),
  p('Massa de Modelar 6 cores', 'Massa de modelar Acrilex 6 cores', 6.99, 'Papelaria'),
  p('Tinta Guache 6 cores', 'Tinta guache Acrilex 6 potes', 9.99, 'Papelaria'),
  p('Bloco de Notas Adesivo 76x76mm', 'Post-it bloco adesivo amarelo 76x76mm', 6.99, 'Papelaria'),
  p('Envelope Pardo A4 10un', 'Envelope pardo tamanho A4 10 unidades', 4.99, 'Papelaria'),
  p('Papel Sulfite A4 100 folhas', 'Papel sulfite A4 branco 100 folhas', 7.99, 'Papelaria'),
  p('Papel Sulfite A4 500 folhas', 'Papel sulfite A4 branco 500 folhas', 24.99, 'Papelaria'),
  p('Pasta Elástico A4', 'Pasta com elástico plástica A4', 4.99, 'Papelaria'),
  p('Grampeador + Grampos', 'Grampeador mesa + grampos 26/6 1000un', 16.99, 'Papelaria'),
  p('Clipes Nº 2/0 cx 100un', 'Clipes para papel nº 2/0 caixa 100 unidades', 3.99, 'Papelaria'),
]

// ─── 25. Bebidas Extras & Regionais (35 SKUs) ─────────────────
const bebidasExtras: TemplateSampleProduct[] = [
  p(
    'Cerveja Artesanal IPA local 473ml',
    'Cerveja artesanal IPA produção local',
    14.99,
    'Bebidas Extras'
  ),
  p(
    'Cerveja Artesanal Pilsen local 473ml',
    'Cerveja artesanal Pilsen produção local',
    12.99,
    'Bebidas Extras'
  ),
  p(
    'Cerveja Artesanal Weiss local 473ml',
    'Cerveja artesanal de trigo produção local',
    13.99,
    'Bebidas Extras'
  ),
  p(
    'Refrigerante Regional Guaraná 2L',
    'Refrigerante guaraná regional 2 litros',
    5.99,
    'Bebidas Extras'
  ),
  p(
    'Refrigerante Regional Laranja 2L',
    'Refrigerante laranja regional 2 litros',
    5.99,
    'Bebidas Extras'
  ),
  p('Suco Verde Detox 500ml', 'Suco verde detox prensado a frio 500ml', 14.99, 'Bebidas Extras'),
  p('Suco Pink Lemonade 500ml', 'Pink lemonade artesanal garrafa 500ml', 9.99, 'Bebidas Extras'),
  p('Kombucha 350ml', 'Kombucha fermentada natural 350ml', 12.99, 'Bebidas Extras'),
  p('Suco de Uva Integral 1L', 'Suco de uva integral gaúcho 1 litro', 14.99, 'Bebidas Extras'),
  p('Suco de Caju Integral 1L', 'Suco de caju integral 1 litro', 9.99, 'Bebidas Extras'),
  p('Suco de Goiaba Integral 1L', 'Suco de goiaba integral 1 litro', 9.99, 'Bebidas Extras'),
  p('Suco de Manga Integral 1L', 'Suco de manga integral 1 litro', 9.99, 'Bebidas Extras'),
  p('Água de Coco 1L Pack 3un', 'Pack 3 caixas água de coco 1 litro', 24.99, 'Bebidas Extras'),
  p('Energético Vibe 473ml', 'Energético Vibe energy drink 473ml', 5.99, 'Bebidas Extras'),
  p('Energético Reign 473ml', 'Energético Reign total body fuel 473ml', 9.99, 'Bebidas Extras'),
  p('Água Mineral Galão 10L', 'Galão água mineral sem gás 10 litros', 12.99, 'Bebidas Extras'),
  p('Água Mineral Galão 20L', 'Galão água mineral retornável 20 litros', 14.99, 'Bebidas Extras'),
  p(
    'Chopp Artesanal Growler 1L',
    'Chopp artesanal Pilsen growler 1 litro',
    24.99,
    'Bebidas Extras'
  ),
  p('Sidra Cereser 660ml', 'Sidra Cereser champagne 660ml', 12.99, 'Bebidas Extras'),
  p('Frizante Rosé 750ml', 'Vinho frizante rosé doce 750ml', 19.99, 'Bebidas Extras'),
  p('Soda Italiana Limão 275ml', 'Soda italiana artesanal limão 275ml', 8.99, 'Bebidas Extras'),
  p(
    'Refrigerante Schweppes Tônica 2L',
    'Schweppes tônica garrafa 2 litros',
    9.99,
    'Bebidas Extras'
  ),
  p('Club Soda 350ml', 'Água gasificada Club Soda lata 350ml', 3.99, 'Bebidas Extras'),
  p(
    'Drink Aperol Spritz Pronto 275ml',
    'Drink pronto Aperol Spritz garrafa 275ml',
    14.99,
    'Bebidas Extras'
  ),
  p('Vinho Bag in Box Tinto 3L', 'Vinho tinto bag in box 3 litros', 49.99, 'Bebidas Extras'),
  p('Sangria Pronta 1L', 'Sangria espanhola pronta garrafa 1 litro', 19.99, 'Bebidas Extras'),
  p('Limonada Suíça 1L', 'Limonada suíça artesanal garrafa 1 litro', 12.99, 'Bebidas Extras'),
  p('Chá Mate Pronto 1,5L', 'Chá mate pronto garrafa 1,5 litro', 5.99, 'Bebidas Extras'),
  p('Energético C4 473ml', 'Energético C4 Original pre-workout 473ml', 12.99, 'Bebidas Extras'),
  p('Limonada Pink Garrafa 1L', 'Limonada pink artesanal 1 litro', 9.99, 'Bebidas Extras'),
  p(
    'Água Saborizada Limão 500ml',
    'Água saborizada sem açúcar limão 500ml',
    3.99,
    'Bebidas Extras'
  ),
  p(
    'Água Saborizada Tangerina 500ml',
    'Água saborizada sem açúcar tangerina',
    3.99,
    'Bebidas Extras'
  ),
  p('Whey Shake Pronto 330ml', 'Whey shake pronto para beber 330ml', 12.99, 'Bebidas Extras'),
  p('Suco Orgânico Laranja 1L', 'Suco orgânico de laranja natural 1L', 16.99, 'Bebidas Extras'),
  p('Café Cold Brew 350ml', 'Café cold brew artesanal garrafa 350ml', 12.99, 'Bebidas Extras'),
]

// ─── 26. Mercearia Suplementar (40 SKUs) ───────────────────────
const merceariaSuplementar: TemplateSampleProduct[] = [
  p('Pipoca Microondas Bacon 100g', 'Pipoca microondas sabor bacon 100g', 4.99, 'Mercearia'),
  p('Pipoca Microondas Natural 100g', 'Pipoca microondas natural 100g', 4.49, 'Mercearia'),
  p('Milho para Pipoca 500g', 'Milho especial para pipoca 500g', 3.99, 'Mercearia'),
  p('Batata Palha Elma Chips 120g', 'Batata palha Elma Chips original 120g', 8.99, 'Mercearia'),
  p('Farofa Pronta Yoki 500g', 'Farofa pronta temperada Yoki 500g', 5.99, 'Mercearia'),
  p('Polvilho Doce Yoki 500g', 'Polvilho doce Yoki 500g', 6.99, 'Mercearia'),
  p('Polvilho Azedo 500g', 'Polvilho azedo para pão de queijo 500g', 7.99, 'Mercearia'),
  p('Trigo para Quibe 500g', 'Trigo para quibe Yoki 500g', 6.99, 'Mercearia'),
  p('Canjica Branca 500g', 'Canjica branca Yoki 500g', 5.99, 'Mercearia'),
  p('Cuscuz Flocão 500g', 'Flocão de milho para cuscuz 500g', 3.99, 'Mercearia'),
  p('Tapioca Granulada 500g', 'Tapioca granulada para pudim 500g', 4.99, 'Mercearia'),
  p('Coco Ralado 100g', 'Coco ralado úmido adoçado 100g', 3.99, 'Mercearia'),
  p('Coco Ralado Seco 200g', 'Coco ralado seco desidratado 200g', 5.99, 'Mercearia'),
  p('Chocolate em Pó 50% 200g', 'Chocolate em pó 50% cacau 200g', 6.99, 'Mercearia'),
  p('Cacau em Pó Nobre 200g', 'Cacau em pó nobre alcalino 200g', 12.99, 'Mercearia'),
  p('Essência de Baunilha 30ml', 'Essência de baunilha artificial 30ml', 3.99, 'Mercearia'),
  p('Corante Alimentício 10ml', 'Corante alimentício vermelho 10ml', 2.99, 'Mercearia'),
  p('Confeitos Coloridos 80g', 'Confeitos de chocolate coloridos 80g', 4.99, 'Mercearia'),
  p('Cobertura Chocolate 500g', 'Cobertura fracionada chocolate ao leite', 14.99, 'Mercearia'),
  p('Marshmallow Mini 150g', 'Marshmallow mini para hot chocolate', 5.99, 'Mercearia'),
  p('Chantilly em Pó 50g', 'Mistura para chantilly em pó 50g', 3.99, 'Mercearia'),
  p('Suspiro Tradicional 100g', 'Suspiro meringue crocante 100g', 5.99, 'Mercearia'),
  p('Doce de Banana 300g', 'Doce de banana em pasta 300g', 5.99, 'Mercearia'),
  p('Rapadura 300g', 'Rapadura de cana artesanal 300g', 4.99, 'Mercearia'),
  p('Castanha do Pará 100g', 'Castanha do Pará embalagem 100g', 14.99, 'Mercearia'),
  p('Nozes 100g', 'Nozes descascadas embalagem 100g', 14.99, 'Mercearia'),
  p('Amêndoas 100g', 'Amêndoas torradas embalagem 100g', 14.99, 'Mercearia'),
  p('Uva Passa 150g', 'Uva passa escura embalagem 150g', 6.99, 'Mercearia'),
  p('Damasco Seco 150g', 'Damasco seco desidratado 150g', 12.99, 'Mercearia'),
  p('Cranberry Seco 100g', 'Cranberry seco desidratado 100g', 14.99, 'Mercearia'),
  p('Banana Chips 100g', 'Banana chips crocante 100g', 5.99, 'Mercearia'),
  p('Biscoito de Arroz 80g', 'Biscoito de arroz integral 80g', 5.99, 'Mercearia'),
  p('Creme de Amendoim 200g', 'Creme de amendoim sem açúcar 200g', 12.99, 'Mercearia'),
  p('Missoshiru Instantâneo 8g', 'Sopa missoshiru instantâneo sachê 8g', 2.49, 'Mercearia'),
  p('Alga Nori 10 folhas', 'Alga nori para sushi 10 folhas', 9.99, 'Mercearia'),
  p('Arroz Japonês 1kg', 'Arroz grão curto tipo japonês 1kg', 12.99, 'Mercearia'),
  p('Vinagre de Arroz 200ml', 'Vinagre de arroz para sushi 200ml', 7.99, 'Mercearia'),
  p('Panko (Farinha Japonesa) 200g', 'Farinha panko japonesa para empanar 200g', 8.99, 'Mercearia'),
  p('Leite de Coco 400ml', 'Leite de coco integral garrafa 400ml', 7.99, 'Mercearia'),
  p('Curry em Pó 40g', 'Curry em pó especiaria 40g', 5.99, 'Mercearia'),
]

// ─── 27. Congelados Extras (35 SKUs) ──────────────────────────
const congeladosExtras: TemplateSampleProduct[] = [
  p(
    'Carne para Strogonoff 500g cong.',
    'Carne em tiras para strogonoff congelada',
    22.99,
    'Congelados'
  ),
  p('Isca de Frango 500g cong.', 'Isca de frango temperada congelada 500g', 14.99, 'Congelados'),
  p('Costela de Porco Congelada 1kg', 'Costela de porco congelada 1kg', 24.99, 'Congelados'),
  p('Iscas de Peixe Empanado 300g', 'Iscas de peixe empanado congelado 300g', 16.99, 'Congelados'),
  p('Fish & Chips 400g', 'Fish and chips congelado pronto 400g', 19.99, 'Congelados'),
  p('Onion Rings Congelados 300g', 'Anéis de cebola empanados congelados', 12.99, 'Congelados'),
  p('Cheese Sticks 300g', 'Palitos de queijo empanados congelados', 16.99, 'Congelados'),
  p('Mozzarella Sticks 300g', 'Mozzarella sticks empanados congelados', 18.99, 'Congelados'),
  p('Jalapeño Poppers 300g', 'Jalapeño poppers recheados congelados', 19.99, 'Congelados'),
  p(
    'Mini Churros Doce de Leite 300g',
    'Mini churros doce de leite congelados',
    13.99,
    'Congelados'
  ),
  p('Pão de Alho Recheado 400g', 'Pão de alho recheado catupiry congelado', 14.99, 'Congelados'),
  p(
    'Torta Frango c/ Requeijão cong. 500g',
    'Torta de frango/requeijão congelada 500g',
    22.99,
    'Congelados'
  ),
  p('Quiche Alho-Poró cong. 300g', 'Quiche de alho-poró congelada 300g', 16.99, 'Congelados'),
  p(
    'Pastel de Forno Frango cong. 6un',
    'Pastel de forno frango congelado 6un',
    14.99,
    'Congelados'
  ),
  p('Burrito Congelado 300g', 'Burrito mexicano congelado 300g', 16.99, 'Congelados'),
  p(
    'Croissant Chocolate cong. 4un',
    'Croissant chocolate congelado 4 unidades',
    16.99,
    'Congelados'
  ),
  p('Pão na Chapa Congelado 6un', 'Pão na chapa pré-assado congelado 6un', 9.99, 'Congelados'),
  p('Açaí Puro sem Açúcar 1kg', 'Açaí puro congelado sem açúcar 1kg', 29.99, 'Congelados'),
  p(
    'Polpa Frutas Sortidas 10un',
    'Pack polpas de frutas sortidas 10 unidades',
    24.99,
    'Congelados'
  ),
  p('Sorvete Artesanal Pote 500ml', 'Sorvete artesanal local pote 500ml', 19.99, 'Congelados'),
  p('Picolé Frutas Vermelhas', 'Picolé artesanal frutas vermelhas unidade', 5.99, 'Congelados'),
  p('Mix Oriental Congelado 400g', 'Mix oriental gyoza/harumaki congelado', 19.99, 'Congelados'),
  p('Dim Sum Congelado 300g', 'Dim sum variados congelados 300g', 19.99, 'Congelados'),
  p('Spring Roll Congelado 300g', 'Rolinho primavera congelado 300g', 14.99, 'Congelados'),
  p('Acarajé Congelado 4un', 'Acarajé baiano congelado 4 unidades', 19.99, 'Congelados'),
  p('Tapioca Recheada Cong. 4un', 'Tapioca recheada congelada sortida 4un', 16.99, 'Congelados'),
  p(
    'Legumes para Sopa Congelados 400g',
    'Mix legumes para sopa congelados 400g',
    8.99,
    'Congelados'
  ),
  p('Couve Picada Congelada 300g', 'Couve picada congelada 300g', 5.99, 'Congelados'),
  p('Açaí Bowl Kit Congelado', 'Kit açaí bowl congelado com toppings', 24.99, 'Congelados'),
  p('Brownie Congelado 4un', 'Brownie de chocolate congelado 4 unidades', 16.99, 'Congelados'),
  p('Cheesecake Fatia Congelada', 'Cheesecake fatia congelada unidade', 14.99, 'Congelados'),
  p('Red Velvet Fatia Cong.', 'Bolo red velvet fatia congelada', 12.99, 'Congelados'),
  p('Tiramisù Pote 200g cong.', 'Tiramisù porção congelada 200g', 16.99, 'Congelados'),
  p('Profiteroles Cong. 200g', 'Profiteroles com chocolate congelados 200g', 14.99, 'Congelados'),
  p('Massa Wonton Cong. 200g', 'Massa wonton fina congelada 200g', 9.99, 'Congelados'),
]

// ─── 28. Snacks Extras & Importados (35 SKUs) ─────────────────
const snacksExtras: TemplateSampleProduct[] = [
  p('Pretzel Snack 100g', 'Pretzel mini crocante salgado 100g', 9.99, 'Snacks & Doces'),
  p('Popchips 85g', 'Chips estourados Popchips original 85g', 12.99, 'Snacks & Doces'),
  p('Grão de Bico Crocante 100g', 'Grão de bico crocante temperado 100g', 7.99, 'Snacks & Doces'),
  p('Edamame Salgado 100g', 'Edamame torrado salgado embalagem 100g', 8.99, 'Snacks & Doces'),
  p('Macadâmia 100g', 'Macadâmia torrada salgada 100g', 19.99, 'Snacks & Doces'),
  p('Pistache 100g', 'Pistache torrado salgado 100g', 19.99, 'Snacks & Doces'),
  p('Pecan 100g', 'Noz pecan embalagem 100g', 16.99, 'Snacks & Doces'),
  p(
    'Trail Mix Energético 150g',
    'Trail mix energético nuts e frutas 150g',
    14.99,
    'Snacks & Doces'
  ),
  p('Chips de Banana 100g', 'Chips de banana doce crocante 100g', 5.99, 'Snacks & Doces'),
  p('Chips de Mandioca 100g', 'Chips de mandioca artesanal 100g', 7.99, 'Snacks & Doces'),
  p(
    'Cracker de Arroz Integral 100g',
    'Cracker de arroz integral temperado',
    6.99,
    'Snacks & Doces'
  ),
  p('Avelã Torrada 100g', 'Avelã torrada embalagem 100g', 16.99, 'Snacks & Doces'),
  p('Alfajor Argentino un', 'Alfajor argentino Havanna unidade', 9.99, 'Snacks & Doces'),
  p('Bolo de Rolo 300g', 'Bolo de rolo pernambucano 300g', 14.99, 'Snacks & Doces'),
  p('Rapadurinha 30g 10un', 'Rapadurinha embalada 30g 10 unidades', 4.99, 'Snacks & Doces'),
  p('Cocada 100g', 'Cocada artesanal embalagem 100g', 5.99, 'Snacks & Doces'),
  p('Maria Mole 100g', 'Maria mole de coco artesanal 100g', 4.99, 'Snacks & Doces'),
  p('Quindim 3un', 'Quindim artesanal 3 unidades', 12.99, 'Snacks & Doces'),
  p('Beijinho 10un', 'Doce beijinho festa 10 unidades', 9.99, 'Snacks & Doces'),
  p('Brigadeiro 10un', 'Doce brigadeiro festa 10 unidades', 9.99, 'Snacks & Doces'),
  p('Cajuzinho 10un', 'Doce cajuzinho festa 10 unidades', 9.99, 'Snacks & Doces'),
  p('Bem-Casado 6un', 'Bem-casado artesanal 6 unidades', 14.99, 'Snacks & Doces'),
  p('Goiabinha Cascão 6un', 'Goiabinha cascão artesanal 6 unidades', 5.99, 'Snacks & Doces'),
  p('Romeu e Julieta 200g', 'Goiabada com queijo artesanal 200g', 12.99, 'Snacks & Doces'),
  p('Doce de Abóbora 300g', 'Doce de abóbora caseiro 300g', 7.99, 'Snacks & Doces'),
  p('Marmelada 300g', 'Marmelada artesanal 300g', 9.99, 'Snacks & Doces'),
  p('Ambrosia 300g', 'Ambrosia doce de ovos artesanal 300g', 12.99, 'Snacks & Doces'),
  p(
    'Churros Recheado Chocolate 120g',
    'Churros recheado chocolate ao leite 120g',
    8.99,
    'Snacks & Doces'
  ),
  p('Sonho de Valsa un', 'Bombom Sonho de Valsa unidade', 2.49, 'Snacks & Doces'),
  p('Serenata de Amor un', 'Bombom Serenata de Amor unidade', 1.99, 'Snacks & Doces'),
  p(
    'Negresco Coberto Chocolate 120g',
    'Biscoito Negresco coberto chocolate',
    4.99,
    'Snacks & Doces'
  ),
  p('Ruffles Queijo 96g', 'Batata ondulada Ruffles sabor queijo', 8.99, 'Snacks & Doces'),
  p('Cheetos Tubo Cheddar 47g', 'Cheetos tubo sabor cheddar 47g', 5.99, 'Snacks & Doces'),
  p('Stax Pringles Sour Cream 163g', "Stax Lay's sour cream & onion 163g", 12.99, 'Snacks & Doces'),
  p('Barra Açaí com Granola 25g', 'Barra de cereal açaí com granola 25g', 2.99, 'Snacks & Doces'),
]

// ─── 29. Kits Suplementares (25 SKUs) ─────────────────────────
const kitsSuplementares: TemplateSampleProduct[] = [
  p(
    'Kit Lanche Escolar',
    'Suco caixa + Biscoito + Fruta + Sanduíche natural',
    16.99,
    'Kits & Combos'
  ),
  p(
    'Kit Pic-Nic',
    'Pão ciabatta + Presunto + Queijo + Suco natural + Frutas',
    39.99,
    'Kits & Combos'
  ),
  p(
    'Kit Fondue de Queijo c/ Bebida',
    'Kit fondue queijo + Vinho branco + Pão + Legumes',
    89.99,
    'Kits & Combos'
  ),
  p(
    'Kit Raclette',
    'Queijo raclette + Batata + Presunto + Pepino conserva',
    69.99,
    'Kits & Combos'
  ),
  p('Kit Bruschetta', 'Pão ciabatta + Tomate + Azeite + Manjericão + Alho', 24.99, 'Kits & Combos'),
  p(
    'Kit Tábua de Frios',
    'Salame + Presunto + 3 queijos + Azeitona + Torrada',
    59.99,
    'Kits & Combos'
  ),
  p(
    'Kit Espaguete Completo',
    'Massa + Molho + Carne moída + Parmesão + Vinho tinto',
    49.99,
    'Kits & Combos'
  ),
  p('Kit Panificação', 'Farinha 1kg + Fermento + Açúcar + Ovos + Manteiga', 29.99, 'Kits & Combos'),
  p(
    'Kit Dia de Chuva',
    'Chocolate quente + Biscoito + Vela perfumada + Chá',
    24.99,
    'Kits & Combos'
  ),
  p(
    'Kit Festa Junina',
    'Milho pipoca + Amendoim + Paçoca + Pé de moleque + Quentão',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Noite Mexicana',
    'Nachos + Guacamole + Queijo cheddar + Pimenta + Cerveja x6',
    49.99,
    'Kits & Combos'
  ),
  p(
    'Kit Ramen em Casa',
    'Lamen + Ovo + Nori + Shoyu + Óleo de gergelim + Cebolinha',
    19.99,
    'Kits & Combos'
  ),
  p('Kit Tempurá', 'Farinha tempurá + Legumes variados + Shoyu + Gengibre', 24.99, 'Kits & Combos'),
  p('Kit Brunch', 'Ovos + Bacon + Pão + Suco natural + Café + Frutas', 39.99, 'Kits & Combos'),
  p('Kit Crepe', 'Farinha + Ovos + Leite + Presunto + Queijo + Nutella', 29.99, 'Kits & Combos'),
  p(
    'Kit Cardápio da Semana Básico',
    'Arroz 5kg + Feijão 2kg + Óleo + Macarrão + Molho + Sal',
    49.99,
    'Kits & Combos'
  ),
  p(
    'Kit Cardápio Semana Completo',
    'Arroz + Feijão + Carnes + Legumes + Frutas + Temperos',
    149.99,
    'Kits & Combos'
  ),
  p(
    'Kit Emergência Doméstica',
    'Vela 6un + Fósforo + Pilha AA4 + Lanterna + Água 5L',
    44.99,
    'Kits & Combos'
  ),
  p(
    'Kit Chá da Tarde',
    'Chá sortido x3 + Biscoito fino + Geleia + Mel + Xícara desc.',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Petit-Déjeuner',
    'Croissant 4un + Geleia + Manteiga + Suco + Café',
    34.99,
    'Kits & Combos'
  ),
  p(
    'Kit Aniversário Completo',
    'Bolo pronto + Salgados cong. + Refri 2L x4 + Pratos + Velas',
    99.99,
    'Kits & Combos'
  ),
  p(
    'Kit Natal',
    'Tender + Farofa + Arroz + Salpicão + Panetone + Espumante',
    129.99,
    'Kits & Combos'
  ),
  p(
    'Kit Réveillon',
    'Espumante x2 + Frutas + Lentilha + Romã + Taças desc. 12un',
    89.99,
    'Kits & Combos'
  ),
  p(
    'Kit Dia das Mães',
    'Flores artificial + Chocolate Lindt + Espumante + Cartão',
    79.99,
    'Kits & Combos'
  ),
  p('Kit Dia dos Pais', 'Whisky Red Label + Copo + Mix nuts + Cartão', 99.99, 'Kits & Combos'),
]

// ─── EXPORT: Catálogo completo ──────────────────────────────────
export const MINIMERCADO_CATALOG: TemplateSampleProduct[] = [
  ...bebidasNaoAlcoolicas,
  ...cervejasDestilados,
  ...mercearia,
  ...laticiniosFrios,
  ...higienePessoal,
  ...limpeza,
  ...congelados,
  ...snacksDoces,
  ...padariaMatinal,
  ...hortifruti,
  ...petAnimais,
  ...utilidades,
  ...kitsCombos,
  ...bebeInfantil,
  ...carnesAcougue,
  ...pratosRefeicoesRapidas,
  ...fitnessSaude,
  ...tabacariaConveniencia,
  ...sorvetesSobremesas,
  ...bebidasQuentes,
  ...molhosEspeciais,
  ...importadosGourmet,
  ...farmaciaBasica,
  ...papelaria,
  ...bebidasExtras,
  ...merceariaSuplementar,
  ...congeladosExtras,
  ...snacksExtras,
  ...kitsSuplementares,
]
