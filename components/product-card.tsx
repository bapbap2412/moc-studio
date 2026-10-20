import Image from 'next/image'
import Link from 'next/link'
import { getColor, type Product } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { WishlistButton } from '@/components/product/wishlist-button'

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.basePrice) * 100)
    : 0

  return (
    <article className="group relative">
      <Link href={`/san-pham/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-background px-2 py-1 text-[10px] font-medium tracking-widest uppercase">Mới</span>
            )}
            {discount > 0 && (
              <span className="bg-accent px-2 py-1 text-[10px] font-medium tracking-widest text-accent-foreground uppercase">
                -{discount}%
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <h3 className="text-sm leading-snug text-pretty">{product.name}</h3>
          <div className="flex items-baseline gap-2 text-sm">
            <span className={discount > 0 ? 'font-medium text-accent' : 'font-medium'}>
              {formatPrice(product.salePrice ?? product.basePrice)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.basePrice)}</span>
            )}
          </div>
          <ul className="mt-1 flex gap-1.5" aria-label="Màu sắc có sẵn">
            {product.colorIds.map((id) => {
              const color = getColor(id)
              if (!color) return null
              return (
                <li
                  key={id}
                  className="size-3 rounded-full border border-foreground/15"
                  style={{ backgroundColor: color.hexCode }}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </Link>
      <div className="absolute top-3 right-3 z-10">
        <WishlistButton productId={product.id} compact />
      </div>
    </article>
  )
}
