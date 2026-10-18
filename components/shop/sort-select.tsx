'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('sort', value)
    else params.delete('sort')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <label htmlFor="sort" className="text-muted-foreground">
        Sắp xếp
      </label>
      <select
        id="sort"
        value={searchParams.get('sort') ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Nổi bật</option>
        <option value="newest">Mới nhất</option>
        <option value="price-asc">Giá: thấp đến cao</option>
        <option value="price-desc">Giá: cao đến thấp</option>
      </select>
    </div>
  )
}
