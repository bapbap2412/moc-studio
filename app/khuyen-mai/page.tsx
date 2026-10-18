import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { products } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Chương trình khuyến mãi',
  description: 'Khám phá những sản phẩm MỘC Studio đang được ưu đãi.',
}

const saleProducts = products.filter(
  (product) => product.salePrice !== null && product.salePrice > 0 && product.salePrice < product.basePrice,
)

export default function PromotionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-foreground">Chương trình khuyến mãi</span>
      </nav>
      <div className="mt-5 flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Ưu đãi dành cho bạn</p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl">Sản phẩm đang giảm giá</h1>
        </div>
        <Link href="/san-pham" className="text-sm underline underline-offset-4">Xem tất cả sản phẩm</Link>
      </div>
      {saleProducts.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {saleProducts.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}
        </div>
      ) : (
        <p className="mt-8 border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Hiện chưa có sản phẩm giảm giá.</p>
      )}
    </div>
  )
}
