// Dữ liệu mẫu cho giai đoạn 1 — cấu trúc khớp với scripts/001_create_schema.sql.
// Giai đoạn 2 sẽ thay các hàm bên dưới bằng truy vấn tới Neon Postgres.

export type Gender = 'women' | 'men' | 'unisex'

export type Category = {
  id: number
  name: string
  slug: string
  imageUrl: string
  description: string
}

export type Color = { id: number; name: string; hexCode: string }
export type Size = { id: number; name: string; sortOrder: number }

export type ProductVariant = {
  id: string
  colorId: number
  sizeId: number
  sku: string
  stockQuantity: number
}

export type Product = {
  id: string
  categoryId: number
  name: string
  slug: string
  description: string
  material: string
  careInstructions: string
  basePrice: number
  salePrice: number | null
  gender: Gender
  isFeatured: boolean
  isNew: boolean
  imageUrl: string
  colorIds: number[]
  sizeIds: number[]
  variants: ProductVariant[]
  rating: number
  reviewCount: number
}

export const categories: Category[] = [
  { id: 1, name: 'Nữ', slug: 'nu', imageUrl: '/images/cat-women.png', description: 'Đầm, sơ mi, quần ống rộng' },
  { id: 2, name: 'Nam', slug: 'nam', imageUrl: '/images/cat-men.png', description: 'Blazer, áo thun, quần kaki' },
  { id: 3, name: 'Phụ kiện', slug: 'phu-kien', imageUrl: '/images/cat-accessories.png', description: 'Túi, mũ, thắt lưng' },
]

export const colors: Color[] = [
  { id: 1, name: 'Kem', hexCode: '#EDE4D3' },
  { id: 2, name: 'Đen', hexCode: '#2A2826' },
  { id: 3, name: 'Be', hexCode: '#D4C2A3' },
  { id: 4, name: 'Xanh rêu', hexCode: '#7C8565' },
  { id: 5, name: 'Nâu', hexCode: '#6B4A35' },
  { id: 6, name: 'Đất nung', hexCode: '#B5532F' },
  { id: 7, name: 'Tự nhiên', hexCode: '#C9A979' },
]

export const sizes: Size[] = [
  { id: 1, name: 'XS', sortOrder: 1 },
  { id: 2, name: 'S', sortOrder: 2 },
  { id: 3, name: 'M', sortOrder: 3 },
  { id: 4, name: 'L', sortOrder: 4 },
  { id: 5, name: 'XL', sortOrder: 5 },
  { id: 6, name: 'Free size', sortOrder: 6 },
]

type ProductSeed = Omit<Product, 'variants'>

const seeds: ProductSeed[] = [
  {
    id: 'p1', categoryId: 1, name: 'Áo sơ mi linen oversize', slug: 'ao-so-mi-linen-oversize',
    description: 'Áo sơ mi dáng rộng từ linen tự nhiên, thoáng mát cho mùa hè. Cổ đức cổ điển, hàng cúc gỗ dừa, vạt sau dài hơn tạo độ rủ mềm mại.',
    material: '100% linen', careInstructions: 'Giặt tay hoặc giặt máy chế độ nhẹ ở 30°C. Phơi trong bóng râm.',
    basePrice: 690000, salePrice: null, gender: 'women', isFeatured: true, isNew: true,
    imageUrl: '/images/products/ao-so-mi-linen.png', colorIds: [1, 3], sizeIds: [2, 3, 4], rating: 4.8, reviewCount: 124,
  },
  {
    id: 'p2', categoryId: 1, name: 'Đầm lụa hai dây midi', slug: 'dam-lua-hai-day-midi',
    description: 'Đầm hai dây cắt xéo vải giúp tôn dáng tự nhiên. Chất lụa satin mềm, bóng nhẹ, phù hợp dạo phố lẫn dự tiệc.',
    material: '92% lụa tơ tằm, 8% spandex', careInstructions: 'Giặt khô hoặc giặt tay nước lạnh. Ủi mặt trái ở nhiệt độ thấp.',
    basePrice: 1290000, salePrice: 990000, gender: 'women', isFeatured: true, isNew: false,
    imageUrl: '/images/products/dam-lua-midi.png', colorIds: [4, 2], sizeIds: [1, 2, 3], rating: 4.9, reviewCount: 86,
  },
  {
    id: 'p3', categoryId: 1, name: 'Quần ống rộng xếp ly', slug: 'quan-ong-rong-xep-ly',
    description: 'Quần cạp cao, ống suông rộng với hai ly trước. Dễ phối cùng sơ mi hoặc áo thun cho phong cách thanh lịch.',
    material: '55% linen, 45% cotton', careInstructions: 'Giặt máy chế độ nhẹ ở 30°C.',
    basePrice: 790000, salePrice: null, gender: 'women', isFeatured: true, isNew: true,
    imageUrl: '/images/products/quan-ong-rong.png', colorIds: [3, 1, 2], sizeIds: [2, 3, 4, 5], rating: 4.7, reviewCount: 52,
  },
  {
    id: 'p4', categoryId: 2, name: 'Blazer linen không lót', slug: 'blazer-linen-khong-lot',
    description: 'Blazer dáng suông, không lót trong, nhẹ và thoáng. Lựa chọn hoàn hảo cho văn phòng mùa nóng.',
    material: '100% linen', careInstructions: 'Giặt khô để giữ form tốt nhất.',
    basePrice: 1890000, salePrice: 1490000, gender: 'men', isFeatured: true, isNew: false,
    imageUrl: '/images/products/blazer-nam.png', colorIds: [5, 3], sizeIds: [3, 4, 5], rating: 4.6, reviewCount: 38,
  },
  {
    id: 'p5', categoryId: 2, name: 'Áo thun cotton dày dáng boxy', slug: 'ao-thun-cotton-boxy',
    description: 'Áo thun định lượng 250gsm, dáng boxy vai rơi. Cổ bo dày dặn, không bai giãn sau nhiều lần giặt.',
    material: '100% cotton compact', careInstructions: 'Giặt máy, lộn trái, không dùng chất tẩy.',
    basePrice: 390000, salePrice: null, gender: 'unisex', isFeatured: false, isNew: true,
    imageUrl: '/images/products/ao-thun-basic.png', colorIds: [2, 1], sizeIds: [2, 3, 4, 5], rating: 4.8, reviewCount: 210,
  },
  {
    id: 'p6', categoryId: 1, name: 'Cardigan len đan thô', slug: 'cardigan-len-dan-tho',
    description: 'Cardigan len đan tay mũi to, ấm áp nhưng không nặng. Sắc đất nung nổi bật cho những ngày se lạnh.',
    material: '70% len merino, 30% alpaca', careInstructions: 'Giặt tay nước lạnh, phơi phẳng.',
    basePrice: 1190000, salePrice: null, gender: 'women', isFeatured: false, isNew: false,
    imageUrl: '/images/products/ao-len-det.png', colorIds: [6, 1], sizeIds: [2, 3, 4], rating: 4.7, reviewCount: 41,
  },
  {
    id: 'p7', categoryId: 3, name: 'Túi cói đan tay quai da', slug: 'tui-coi-dan-tay-quai-da',
    description: 'Túi cói được đan thủ công bởi nghệ nhân Kim Sơn, Ninh Bình. Quai da bò thật, lót vải canvas bên trong.',
    material: 'Cói tự nhiên, da bò', careInstructions: 'Lau bằng khăn ẩm, tránh ngâm nước.',
    basePrice: 590000, salePrice: 490000, gender: 'unisex', isFeatured: true, isNew: false,
    imageUrl: '/images/products/tui-coi.png', colorIds: [7], sizeIds: [6], rating: 4.9, reviewCount: 97,
  },
  {
    id: 'p8', categoryId: 2, name: 'Quần kaki dáng relaxed', slug: 'quan-kaki-dang-relaxed',
    description: 'Quần kaki ống đứng thoải mái, vải twill dày dặn có độ co giãn nhẹ, phù hợp mặc hằng ngày.',
    material: '98% cotton, 2% spandex', careInstructions: 'Giặt máy ở 30°C.',
    basePrice: 690000, salePrice: null, gender: 'men', isFeatured: false, isNew: true,
    imageUrl: '/images/products/quan-kaki-nam.png', colorIds: [4, 3, 2], sizeIds: [3, 4, 5], rating: 4.5, reviewCount: 33,
  },
]

export const products: Product[] = seeds.map((seed) => ({
  ...seed,
  variants: seed.colorIds.flatMap((colorId) =>
    seed.sizeIds.map((sizeId) => ({
      id: `${seed.id}-${colorId}-${sizeId}`,
      colorId,
      sizeId,
      sku: `${seed.slug.slice(0, 8).toUpperCase()}-${colorId}-${sizeId}`,
      stockQuantity: (colorId * 7 + sizeId * 3) % 11,
    })),
  ),
}))

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function getCategoryById(id: number) {
  return categories.find((c) => c.id === id)
}

export function getColor(id: number) {
  return colors.find((c) => c.id === id)
}

export function getSize(id: number) {
  return sizes.find((s) => s.id === id)
}

export function effectivePrice(product: Pick<Product, 'basePrice' | 'salePrice'>) {
  return product.salePrice ?? product.basePrice
}

export type ProductFilters = {
  category?: string
  sizes?: string[]
  colors?: string[]
  maxPrice?: number
  q?: string
  sort?: 'newest' | 'price-asc' | 'price-desc'
}

export function filterProducts(filters: ProductFilters) {
  const category = categories.find((c) => c.slug === filters.category)
  const query = filters.q?.trim().toLowerCase()

  const result = products.filter((p) => {
    if (category && p.categoryId !== category.id) return false
    if (query && !p.name.toLowerCase().includes(query)) return false
    if (filters.maxPrice && effectivePrice(p) > filters.maxPrice) return false
    if (filters.sizes?.length) {
      const names = p.sizeIds.map((id) => getSize(id)?.name)
      if (!filters.sizes.some((s) => names.includes(s))) return false
    }
    if (filters.colors?.length) {
      const names = p.colorIds.map((id) => getColor(id)?.name)
      if (!filters.colors.some((c) => names.includes(c))) return false
    }
    return true
  })

  if (filters.sort === 'price-asc') result.sort((a, b) => effectivePrice(a) - effectivePrice(b))
  if (filters.sort === 'price-desc') result.sort((a, b) => effectivePrice(b) - effectivePrice(a))
  if (filters.sort === 'newest') result.sort((a, b) => Number(b.isNew) - Number(a.isNew))

  return result
}
