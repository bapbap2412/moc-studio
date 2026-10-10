'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { HeaderAuth } from "@/components/auth/header-auth";

const navLinks = [
  { href: '/san-pham?category=nu', label: 'Nữ' },
  { href: '/san-pham?category=nam', label: 'Nam' },
  { href: '/san-pham?category=phu-kien', label: 'Phụ kiện' },
  { href: '/san-pham?sort=newest', label: 'Hàng mới' },
]

export function SiteHeader() {
  const { count } = useCart()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
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
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
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
            {navLinks.map((link) => (
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
          </ul>
        </nav>
      )}
    </header>
  )
}
