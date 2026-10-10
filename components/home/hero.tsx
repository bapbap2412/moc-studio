import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
      <Image
        src="/images/hero.png"
        alt="Người mẫu mặc áo sơ mi linen màu kem và quần ống rộng màu be dưới nắng chiều"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 text-primary-foreground md:px-8 md:pb-20">
        <p className="text-xs tracking-[0.3em] uppercase">Bộ sưu tập Hè 2026</p>
        <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.05] text-balance md:text-7xl">
          Mặc nhẹ như gió, sống chậm như nắng.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/85 md:text-base">
          Linen, lụa và cotton tự nhiên — những thiết kế tối giản cho mùa hè nhiệt đới.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/san-pham?category=nu"
            className="inline-flex h-12 items-center gap-2 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
          >
            Mua đồ nữ
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/san-pham?category=nam"
            className="inline-flex h-12 items-center gap-2 border border-primary-foreground/70 px-7 text-sm font-medium transition-colors hover:bg-primary-foreground/10"
          >
            Mua đồ nam
          </Link>
        </div>
      </div>
    </section>
  )
}
