import { Leaf, RefreshCcw, Scissors, Truck } from 'lucide-react'

const values = [
  { icon: Leaf, title: 'Chất liệu tự nhiên', text: 'Linen, lụa tơ tằm, cotton hữu cơ thân thiện với làn da.' },
  { icon: Scissors, title: 'May thủ công', text: 'Từng sản phẩm được hoàn thiện tỉ mỉ bởi thợ may Việt.' },
  { icon: Truck, title: 'Giao hàng toàn quốc', text: 'Miễn phí vận chuyển cho đơn hàng từ 1.000.000₫.' },
  { icon: RefreshCcw, title: 'Đổi trả 30 ngày', text: 'Đổi size hoặc trả hàng dễ dàng, không cần lý do.' },
]

export function BrandValues() {
  return (
    <section aria-label="Cam kết của MỘC" className="mx-auto max-w-7xl px-4 pt-24 md:px-8">
      <ul className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-3 bg-background p-8">
            <Icon className="size-5 text-accent" aria-hidden="true" />
            <h3 className="font-serif text-xl">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
