import Image from 'next/image'
import Link from 'next/link'
import { categories } from '@/lib/data'

export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 pt-20 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 id="categories-heading" className="font-serif text-3xl md:text-4xl">
          Mua theo danh mục
        </h2>
        <Link href="/san-pham" className="text-sm underline underline-offset-4 hover:text-accent">
          Xem tất cả
        </Link>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link href={`/san-pham?category=${cat.slug}`} className="group relative block aspect-[4/5] overflow-hidden">
              <Image
                src={cat.imageUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground">
                <h3 className="font-serif text-3xl">{cat.name}</h3>
                <p className="mt-1 text-sm text-primary-foreground/80">{cat.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
