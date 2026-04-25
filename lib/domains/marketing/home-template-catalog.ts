export interface HomeTemplateCard {
  slug: string
  name: string
  eyebrow: string
  description: string
  imageUrl: string
}

export interface HomeTemplateNiche {
  slug: string
  name: string
}

export const HOME_TEMPLATE_CARDS: HomeTemplateCard[] = [
  {
    slug: 'restaurante',
    name: 'Restaurante / Marmitaria',
    eyebrow: 'Operacao de almoco',
    description:
      'Canal digital ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porcoes e bebidas.',
    imageUrl:
      'https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'pizzaria',
    name: 'Pizzaria',
    eyebrow: 'Ticket alto no delivery',
    description:
      'Canal digital completo para pizzarias com opcoes de tamanhos, sabores e bordas recheadas.',
    imageUrl:
      'https://images.pexels.com/photos/7813574/pexels-photo-7813574.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'lanchonete',
    name: 'Hamburgueria / Lanchonete',
    eyebrow: 'Montagem e adicionais',
    description:
      'Canal digital para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.',
    imageUrl:
      'https://images.pexels.com/photos/3616956/pexels-photo-3616956.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'bar',
    name: 'Bar / Pub',
    eyebrow: 'Noite e giro rapido',
    description:
      'Canal digital para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.',
    imageUrl:
      'https://images.pexels.com/photos/36107885/pexels-photo-36107885.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'cafeteria',
    name: 'Cafeteria',
    eyebrow: 'Marca e atmosfera',
    description:
      'Canal digital para cafeterias, padarias e confeitarias. Com cafes especiais, doces e salgados.',
    imageUrl:
      'https://images.pexels.com/photos/7487381/pexels-photo-7487381.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'acai',
    name: 'Acaiteria',
    eyebrow: 'Visual leve e fresco',
    description:
      'Canal digital para acaiterias e lanchonetes naturais. Com tigelas, copos e adicionais.',
    imageUrl:
      'https://images.pexels.com/photos/1334129/pexels-photo-1334129.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
]

export const HOME_TEMPLATE_NICHES: HomeTemplateNiche[] = [
  { slug: 'restaurante', name: 'Restaurante / Marmitaria' },
  { slug: 'pizzaria', name: 'Pizzaria' },
  { slug: 'lanchonete', name: 'Hamburgueria / Lanchonete' },
  { slug: 'bar', name: 'Bar / Pub' },
  { slug: 'cafeteria', name: 'Cafeteria' },
  { slug: 'acai', name: 'Acaiteria' },
  { slug: 'sushi', name: 'Japones / Sushi' },
  { slug: 'adega', name: 'Adega / Delivery de Bebidas' },
  { slug: 'mercadinho', name: 'Mercadinho Essencial' },
  { slug: 'padaria', name: 'Padaria / Confeitaria' },
  { slug: 'sorveteria', name: 'Sorveteria' },
  { slug: 'acougue', name: 'Acougue / Casa de Carnes' },
  { slug: 'hortifruti', name: 'Hortifruti' },
  { slug: 'petshop', name: 'Petshop' },
  { slug: 'doceria', name: 'Doceria / Confeitaria' },
  { slug: 'minimercado', name: 'Minimercado Digital' },
]

