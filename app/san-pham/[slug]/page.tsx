import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { ProductPurchase } from '@/components/product/product-purchase'
import { ReviewsList } from '@/components/product/reviews-list'
import { getCategoryById, products as sampleProducts } from '@/lib/data'
import { getStoreProductBySlug, getStoreProducts } from '@/lib/store-products'

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return sampleProducts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const product = await getStoreProductBySlug(slug)
  if (!product) return { title: 'Không tìm thấy sản phẩm' }
  return { title: product.name, description: product.description }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getStoreProductBySlug(slug)
  if (!product) notFound()

  const category = getCategoryById(product.categoryId)
  const allProducts = await getStoreProducts()
  const related = allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          {category && (
            <>
              <li>
                <Link href={`/san-pham?category=${category.slug}`} className="hover:text-foreground">
                  {category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li className="text-foreground" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[3/4] overflow-hidden bg-muted">
            <Image src={product.imageUrl} alt={product.name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image src={product.imageUrl} alt="" fill sizes="(min-width: 1024px) 27vw, 50vw" className="scale-150 object-cover object-top" />
          </div>
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image src={category?.imageUrl ?? product.imageUrl} alt="" fill sizes="(min-width: 1024px) 27vw, 50vw" className="object-cover" />
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <ProductPurchase product={product} />
        </div>
      </div>

      <ReviewsList productId={product.id} slug={product.slug} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="pt-24">
          <h2 id="related-heading" className="font-serif text-3xl">
            Có thể bạn cũng thích
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
