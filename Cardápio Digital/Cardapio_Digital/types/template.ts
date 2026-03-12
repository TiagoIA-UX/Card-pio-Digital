// Types para Templates

export interface Template {
  id: string
  slug: string
  name: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  category: TemplateCategory
  imageUrl: string
  previewUrl?: string
  features: string[]
  isFeatured: boolean
  isNew: boolean
  isBestseller: boolean
  salesCount: number
  ratingAvg: number
  ratingCount: number
  status: 'active' | 'inactive' | 'draft'
  createdAt: string
  updatedAt: string
}

export type TemplateCategory = 
  | 'restaurante'
  | 'pizzaria'
  | 'lanchonete'
  | 'bar'
  | 'cafeteria'
  | 'acai'
  | 'sushi'

export interface TemplateFilters {
  category?: TemplateCategory
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating'
  featured?: boolean
}

export interface TemplateReview {
  id: string
  templateId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment?: string
  isVerifiedPurchase: boolean
  createdAt: string
}
