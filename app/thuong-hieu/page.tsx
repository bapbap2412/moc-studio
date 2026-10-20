import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Giới thiệu về MỘC',
  description: 'Câu chuyện và triết lý thiết kế của MỘC Studio.',
}

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-foreground">Giới thiệu về MỘC</span>
      </nav>
      <section id="chat-lieu" className="mt-6 grid items-center gap-8 bg-secondary md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[4/3] md:aspect-[5/4]">
          <Image src="/images/hero.png" alt="Bộ sưu tập thời trang MỘC với chất liệu tự nhiên" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="px-6 pb-10 md:px-12 md:py-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Câu chuyện của MỘC</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Mặc giản dị, sống gần gũi với thiên nhiên.</h1>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            MỘC Studio bắt đầu từ mong muốn tạo nên những món đồ dễ mặc, bền đẹp và tôn trọng chất liệu bản địa. Từ sợi lanh đến cotton tự nhiên, mỗi thiết kế hướng đến sự thoải mái trong nhịp sống hàng ngày.
          </p>
          <Link href="/san-pham" className="mt-7 inline-flex h-12 items-center bg-primary px-7 text-sm font-medium text-primary-foreground transition hover:bg-primary/85">Khám phá sản phẩm</Link>
        </div>
      </section>
    </div>
  )
}
