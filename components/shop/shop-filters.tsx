'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { categories, colors, PRODUCT_TYPES, sizes } from '@/lib/data'
import { cn } from '@/lib/utils'

const priceOptions = [
  { value: '', label: 'Tất cả mức giá' },
  { value: '500000', label: 'Dưới 500.000₫' },
  { value: '1000000', label: 'Dưới 1.000.000₫' },
  { value: '1500000', label: 'Dưới 1.500.000₫' },
]

export function ShopFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? ''
  const activeType = searchParams.get('type') ?? ''
  const activeSizes = searchParams.get('sizes')?.split(',').filter(Boolean) ?? []
  const activeColors = searchParams.get('colors')?.split(',').filter(Boolean) ?? []
  const activePrice = searchParams.get('maxPrice') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function toggle(key: string, list: string[], value: string) {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    update(key, next.join(','))
  }

  const hasFilters = activeCategory || activeType || activeSizes.length || activeColors.length || activePrice

  return (
    <aside aria-label="Bộ lọc sản phẩm" className="flex flex-col gap-8 lg:w-56 lg:shrink-0">
      <fieldset>
        <legend className="text-xs font-medium tracking-widest uppercase">Danh mục</legend>
        <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-2.5">
          <li>
            <button
              type="button"
              onClick={() => update('category', '')}
              className={cn('text-sm hover:text-accent', !activeCategory ? 'font-medium underline underline-offset-4' : 'text-muted-foreground')}
            >
              Tất cả
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => update('category', c.slug)}
                aria-pressed={activeCategory === c.slug}
                className={cn(
                  'text-sm hover:text-accent',
                  activeCategory === c.slug ? 'font-medium underline underline-offset-4' : 'text-muted-foreground',
                )}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium tracking-widest uppercase">Loại sản phẩm</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(PRODUCT_TYPES).map(([value, label]) => {
            const active = activeType === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => update('type', active ? '' : value)}
                className={cn(
                  'h-9 border px-3 text-xs transition-colors',
                  active ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium tracking-widest uppercase">Kích cỡ</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {sizes.map((s) => {
            const active = activeSizes.includes(s.name)
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle('sizes', activeSizes, s.name)}
                className={cn(
                  'h-9 min-w-10 border px-3 text-xs transition-colors',
                  active ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground',
                )}
              >
                {s.name}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium tracking-widest uppercase">Màu sắc</legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {colors.map((c) => {
            const active = activeColors.includes(c.name)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                aria-label={c.name}
                title={c.name}
                onClick={() => toggle('colors', activeColors, c.name)}
                className={cn(
                  'size-8 rounded-full border border-foreground/15 ring-offset-2 ring-offset-background transition',
                  active && 'ring-2 ring-foreground',
                )}
                style={{ backgroundColor: c.hexCode }}
              />
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium tracking-widest uppercase">Mức giá</legend>
        <div className="mt-4 flex flex-col gap-2.5">
          {priceOptions.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="maxPrice"
                value={opt.value}
                checked={activePrice === opt.value}
                onChange={() => update('maxPrice', opt.value)}
                className="size-4 accent-[var(--foreground)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="self-start text-sm text-accent underline underline-offset-4"
        >
          Xóa bộ lọc
        </button>
      ) : null}
    </aside>
  )
}
