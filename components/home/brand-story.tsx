import Image from 'next/image'
import Link from 'next/link'

export function BrandStory() {
  return (
    <section aria-labelledby="story-heading" className="mx-auto max-w-7xl px-4 pt-24 md:px-8">
      <div className="grid items-center gap-10 bg-secondary md:grid-cols-2">
        <div className="relative aspect-[4/5] md:aspect-auto md:h-full md:min-h-[520px]">
          <Image
            src="/images/cat-accessories.png"
            alt="Túi cói, mũ vải và thắt lưng da đặt trên nền thạch cao màu be"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="px-6 pb-12 md:px-12 md:py-16">
          <p className="text-xs tracking-[0.3em] text-accent uppercase">Câu chuyện của MỘC</p>
          <h2 id="story-heading" className="mt-3 font-serif text-4xl leading-tight text-balance md:text-5xl">
            Mộc mạc là cách chúng tôi tôn trọng thiên nhiên.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
            Từ sợi lanh Lâm Đồng đến cói Kim Sơn, MỘC chọn những chất liệu bản địa và cách làm chậm rãi để tạo ra những
            món đồ bạn sẽ mặc nhiều năm, không phải một mùa.
          </p>
          <Link
            href="/san-pham"
            className="mt-8 inline-flex h-12 items-center bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Khám phá bộ sưu tập
          </Link>
        </div>
      </div>
    </section>
  )
}
