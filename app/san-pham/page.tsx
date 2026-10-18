import type { Metadata } from 'next'
import { ProductCard } from '@/components/product-card'
import { ShopFilters } from '@/components/shop/shop-filters'
import { SortSelect } from '@/components/shop/sort-select'
import { categories, PRODUCT_TYPES, type ProductFilters, type ProductType } from '@/lib/data'
import { filterStoreProducts, getStoreProducts } from '@/lib/store-products'

export const metadata: Metadata = {
  title: 'Sản phẩm',
  description: 'Khám phá toàn bộ sản phẩm thời trang nam, nữ và phụ kiện của MỘC Studio.',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const sort = param(sp.sort)
  const type = param(sp.type)
  const maxPrice = Number(param(sp.maxPrice))

  const filters: ProductFilters = {
    category: param(sp.category),
    type: type && Object.prototype.hasOwnProperty.call(PRODUCT_TYPES, type) ? type as ProductType : undefined,
    q: param(sp.q),
    sizes: param(sp.sizes)?.split(',').filter(Boolean),
    colors: param(sp.colors)?.split(',').filter(Boolean),
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    sort: sort === 'price-asc' || sort === 'price-desc' || sort === 'newest' ? sort : undefined,
  }

  const allProducts = await getStoreProducts()
  const results = filterStoreProducts(allProducts, filters)
  const category = categories.find((c) => c.slug === filters.category)
  const title = filters.q ? `Kết quả cho “${filters.q}”` : (category?.name ?? 'Tất cả sản phẩm')

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex gap-2">
          <li>Trang chủ</li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{category?.name ?? 'Sản phẩm'}</li>
        </ol>
      </nav>
      <div className="mt-4 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{results.length} sản phẩm</p>
        </div>
        <SortSelect />
      </div>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <ShopFilters />
        <div className="flex-1">
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 border border-dashed border-border py-20 text-center">
              <p className="font-serif text-2xl">Không tìm thấy sản phẩm</p>
              <p className="text-sm text-muted-foreground">Hãy thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
