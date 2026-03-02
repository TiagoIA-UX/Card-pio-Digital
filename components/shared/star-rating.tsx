"use client"

import { Star, StarHalf } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  showCount?: boolean
  count?: number
  className?: string
  interactive?: boolean
  onChange?: (rating: number) => void
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  showCount = false,
  count = 0,
  className,
  interactive = false,
  onChange
}: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Stars */}
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <button
            key={`full-${i}`}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(i)}
            aria-label={`${i + 1} ${i + 1 === 1 ? 'estrela' : 'estrelas'}`}
            className={cn(
              "text-yellow-400",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
          >
            <Star className={cn(sizeClasses[size], "fill-current")} />
          </button>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <button
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(fullStars)}
            aria-label={`${fullStars + 0.5} estrelas`}
            className={cn(
              "relative text-yellow-400",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
          >
            <Star className={cn(sizeClasses[size], "text-muted-foreground/30")} />
            <StarHalf className={cn(
              sizeClasses[size], 
              "absolute inset-0 fill-current"
            )} />
          </button>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(fullStars + (hasHalfStar ? 1 : 0) + i)}
            aria-label={`${fullStars + (hasHalfStar ? 1 : 0) + i + 1} estrelas`}
            className={cn(
              "text-muted-foreground/30",
              interactive && "cursor-pointer hover:scale-110 hover:text-yellow-400 transition-all"
            )}
          >
            <Star className={sizeClasses[size]} />
          </button>
        ))}
      </div>

      {/* Value */}
      {showValue && (
        <span className={cn(
          "font-medium text-foreground",
          textSizeClasses[size]
        )}>
          {rating.toFixed(1)}
        </span>
      )}

      {/* Count */}
      {showCount && count > 0 && (
        <span className={cn(
          "text-muted-foreground",
          textSizeClasses[size]
        )}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  )
}

// Versão compacta para listas
export function StarRatingCompact({
  rating,
  count,
  className
}: {
  rating: number
  count?: number
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </div>
  )
}
