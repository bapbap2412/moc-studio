import { Hero } from '@/components/home/hero'
import { CategoryGrid } from '@/components/home/category-grid'
import { FeaturedProducts } from '@/components/home/featured-products'
import { BrandStory } from '@/components/home/brand-story'
import { BrandValues } from '@/components/home/brand-values'
import { products } from '@/lib/data'

export default function HomePage() {
  const featured = products.filter((p) => p.isFeatured).slice(0, 4)
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4)

  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts eyebrow="Được yêu thích" title="Sản phẩm nổi bật" products={featured} href="/san-pham" />
      <BrandStory />
      <FeaturedProducts eyebrow="Vừa cập bến" title="Hàng mới về" products={newArrivals} href="/san-pham?sort=newest" />
      <BrandValues />
    </>
  )
}
