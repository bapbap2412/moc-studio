'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { HeaderAuth } from "@/components/auth/header-auth";
import { PRODUCT_TYPES } from '@/lib/product-types'

const navLinks = [
  { href: '/san-pham?category=nu', label: 'N\u1eef' },
  { href: '/san-pham?category=nam', label: 'Nam' },
  { href: '/san-pham?category=tre-em', label: 'Trẻ em' },
  { href: '/san-pham?category=phu-kien', label: 'Ph\u1ee5 ki\u1ec7n' },
  { href: '/san-pham?sort=newest', label: 'H\u00e0ng m\u1edbi' },
]

const brandLinks = [
  { href: '/thuong-hieu', label: 'Gi\u1edbi thi\u1ec7u v\u1ec1 M\u1ed8C' },
  { href: '/khuyen-mai', label: 'Ch\u01b0\u01a1ng tr\u00ecnh khuy\u1ebfn m\u00e3i' },
  { href: '/chinh-sach-khach-hang-than-thiet', label: 'Ch\u00ednh s\u00e1ch kh\u00e1ch h\u00e0ng th\u00e2n thi\u1ebft' },
]

const accessoryTypes = ['hat', 'bag', 'wallet', 'belt', 'socks', 'sandals', 'shoes', 'gloves'] as const
const accessoryLinks = accessoryTypes.map((type) => ({
  href: `/san-pham?category=phu-kien&type=${type}`,
  label: PRODUCT_TYPES[type],
}))

export function SiteHeader() {
  const { count } = useCart()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [brandMenuOpen, setBrandMenuOpen] = useState(false)
  const [accessoryMenuOpen, setAccessoryMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/san-pham?q=${encodeURIComponent(q)}` : '/san-pham')
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <p className="bg-primary px-4 py-2 text-center text-xs tracking-wide text-primary-foreground">
        Miễn phí giao hàng cho đơn từ 1.000.000₫ · Đổi trả trong 30 ngày
      </p>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex flex-1 items-center gap-8">
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <nav aria-label="Danh mục chính" className="hidden md:block">
            <ul className="flex items-center gap-7 text-sm">
              {navLinks.map((link) => link.href.includes('category=phu-kien') ? (
                <li
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setAccessoryMenuOpen(true)}
                  onMouseLeave={() => setAccessoryMenuOpen(false)}
                >
                  <Link href={link.href} className="inline-flex items-center gap-1 transition-colors hover:text-accent">
                    {link.label}
                    <ChevronDown size={14} />
                  </Link>
                  {accessoryMenuOpen && (
                    <div className="absolute left-0 top-full z-50 w-56 pt-3">
                      <div className="border border-border bg-background p-2 shadow-lg">
                        {accessoryLinks.map((accessory) => (
                          <Link
                            key={accessory.href}
                            href={accessory.href}
                            onClick={() => setAccessoryMenuOpen(false)}
                            className="block px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                          >
                            {accessory.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ) : (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li
                className="relative"
                onMouseEnter={() => setBrandMenuOpen(true)}
                onMouseLeave={() => setBrandMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setBrandMenuOpen((open) => !open)}
                  aria-expanded={brandMenuOpen}
                  className="inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-accent"
                >
                  Thông tin thương hiệu
                  <ChevronDown size={14} />
                </button>
                {brandMenuOpen && (
                  <div className="absolute left-0 top-full z-50 w-72 pt-3">
                    <div className="border border-border bg-background p-2 shadow-lg">
                      {brandLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setBrandMenuOpen(false)}
                          className="block px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <Link href="/" className="font-serif text-2xl tracking-[0.2em]" aria-label="MỘC Studio — Trang chủ">
          MỘC
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            className="flex size-10 items-center justify-center rounded-sm hover:bg-muted"
            aria-label="Tìm kiếm"
            aria-expanded={searchOpen}
          >
            <Search className="size-5" />
          </button>
          <HeaderAuth />
          <Link
            href="/gio-hang"
            className="relative flex size-10 items-center justify-center rounded-sm hover:bg-muted"
            aria-label={`Giỏ hàng, ${count} sản phẩm`}
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={handleSearch} className="border-t border-border px-4 py-3 md:px-8" role="search">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="site-search" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <input
              id="site-search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm áo sơ mi, đầm lụa, túi cói..."
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="text-sm font-medium underline underline-offset-4">
              Tìm
            </button>
          </div>
        </form>
      )}

      {menuOpen && (
        <nav aria-label="Menu di động" className="border-t border-border md:hidden">
          <ul className="flex flex-col px-4 py-2">
            {navLinks.map((link) => link.href.includes('category=phu-kien') ? (
              <li key={link.href} className="border-b border-border py-3 last:border-0">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg">
                    {link.label}
                    <ChevronDown size={17} />
                  </summary>
                  <ul className="mt-2 flex flex-col pl-3">
                    <li>
                      <Link href={link.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">
                        Tất cả phụ kiện
                      </Link>
                    </li>
                    {accessoryLinks.map((accessory) => (
                      <li key={accessory.href}>
                        <Link href={accessory.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">
                          {accessory.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-border py-3 font-serif text-lg last:border-0"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-b border-border py-3 last:border-0">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg">
                  Thông tin thương hiệu
                  <ChevronDown size={17} />
                </summary>
                <ul className="mt-2 flex flex-col pl-3">
                  {brandLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="block py-2 text-sm text-muted-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
