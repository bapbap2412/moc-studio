'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const columns = [
  {
    title: 'Mua sắm',
    links: [
      { href: '/san-pham?category=nu', label: 'Thời trang nữ' },
      { href: '/san-pham?category=nam', label: 'Thời trang nam' },
      { href: '/san-pham?category=tre-em', label: 'Tr\u1ebb em' },
      { href: '/san-pham?category=phu-kien', label: 'Phụ kiện' },
      { href: '/san-pham?sort=newest', label: 'Hàng mới về' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { href: '/huong-dan-chon-size', label: 'Hướng dẫn chọn size' },
      { href: '/chinh-sach-khach-hang-than-thiet', label: 'Chính sách khách hàng thân thiết' },
      { href: '/van-chuyen-thanh-toan', label: 'Vận chuyển & thanh toán' },
      { href: '/lien-he', label: 'Liên hệ' },
    ],
  },
  {
    title: 'Về MỘC',
    links: [
      { href: '/thuong-hieu', label: 'Câu chuyện thương hiệu' },
      { href: '/thuong-hieu#chat-lieu', label: 'Chất liệu bền vững' },
      { href: '/lien-he#he-thong-cua-hang', label: 'Hệ thống cửa hàng' },
    ],
  },
]

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-5 md:px-8">
        <div className="md:col-span-2">
          <p className="font-serif text-3xl tracking-[0.2em]">MỘC</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            Thời trang tối giản từ chất liệu tự nhiên. Thiết kế tại Sài Gòn, may thủ công bởi những người thợ Việt.
          </p>
          <address className="mt-6 text-sm not-italic leading-relaxed text-primary-foreground/70">
            180 Cao Lỗ, Phường Chánh Hưng, Hồ Chí Minh, Việt Nam
            <br />
            Hotline: 02838505520
          </address>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-medium tracking-widest uppercase">{col.title}</h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-primary-foreground/70">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-primary-foreground/15">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-primary-foreground/60 md:px-8">
          {'© 2026 MỘC Studio. Bảo lưu mọi quyền.'}
        </p>
      </div>
    </footer>
  )
}
