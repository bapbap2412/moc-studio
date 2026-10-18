import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/data'

export function FeaturedProducts({
  title,
  eyebrow,
  products,
  href,
}: {
  title: string
  eyebrow: string
  products: Product[]
  href: string
}) {
  const headingId = `${href.replace(/\W/g, '')}-heading`
  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-7xl px-4 pt-20 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-accent uppercase">{eyebrow}</p>
          <h2 id={headingId} className="mt-2 font-serif text-3xl md:text-4xl">
            {title}
          </h2>
        </div>
        <Link href={href} className="text-sm underline underline-offset-4 hover:text-accent">
          Xem thêm
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
