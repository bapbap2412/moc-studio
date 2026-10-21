'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Pause, Play } from 'lucide-react'

const heroImages = [
  { src: '/images/hero.png', alt: 'Người mẫu mặc trang phục linen của MỘC Studio' },
  { src: '/images/hero01.jpg', alt: 'Kệ quần áo với các thiết kế thời trang tông màu tự nhiên' },
  { src: '/images/hero02.jpg', alt: 'Bộ sưu tập phụ kiện và trang phục thanh lịch' },
  { src: '/images/hero03.jpg', alt: 'Bộ sưu tập trang phục nữ nhiều phong cách' },
]

export function Hero() {
  const [activeImage, setActiveImage] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [paused])

  return (
    <section
      className="relative isolate flex min-h-[78svh] items-end overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Ảnh giới thiệu MỘC Studio"
    >
      {heroImages.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          priority={index === 0}
          sizes="100vw"
          aria-hidden={index !== activeImage}
          className={`-z-10 object-cover transition-opacity duration-1000 ${index === activeImage ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent dark:from-black/85 dark:via-black/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/45 via-foreground/15 to-transparent dark:from-black/65 dark:via-black/25" />
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
      <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 md:bottom-8 md:right-8">
        <div className="flex items-center gap-1.5 rounded-full bg-foreground/35 px-3 py-2 backdrop-blur-sm">
          {heroImages.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Hiển thị ảnh ${index + 1} trên ${heroImages.length}`}
              aria-current={index === activeImage ? 'true' : undefined}
              onClick={() => setActiveImage(index)}
              className={`h-2 rounded-full transition-all ${index === activeImage ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? 'Tiếp tục tự động chuyển ảnh' : 'Tạm dừng tự động chuyển ảnh'}
          className="flex size-9 items-center justify-center rounded-full bg-foreground/35 text-white backdrop-blur-sm transition hover:bg-foreground/55"
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </section>
  )
}
