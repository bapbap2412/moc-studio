import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chính sách khách hàng thân thiết',
  description: 'Quy định tích lũy điểm và quyền lợi hội viên MỘC Studio.',
}

const tiers = [
  { name: 'Hội viên Member', points: '< 3.000 điểm tích lũy', birthday: '100.000 VNĐ', upgrade: '—' },
  { name: 'Hội viên Silver', points: '3.000 – 5.000 điểm tích lũy', birthday: '200.000 VNĐ', upgrade: '200.000 VNĐ' },
  { name: 'Hội viên Gold', points: '5.000 – 10.000 điểm tích lũy', birthday: '300.000 VNĐ', upgrade: '300.000 VNĐ' },
  { name: 'Hội viên Diamond', points: 'Từ 10.000 điểm tích lũy', birthday: '500.000 VNĐ', upgrade: '500.000 VNĐ' },
]

export default function LoyaltyPolicyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-foreground">Chính sách khách hàng thân thiết</span>
      </nav>
      <h1 className="mt-6 border-b border-border pb-5 text-center text-xl font-semibold uppercase tracking-wide md:text-2xl">Chính sách khách hàng thân thiết</h1>

      <div className="mt-8 space-y-9 text-sm leading-7 text-muted-foreground">
        <section aria-labelledby="loyalty-general">
          <h2 id="loyalty-general" className="font-semibold text-foreground">I. Quy định chung</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6">
            <li>Chính sách khách hàng thân thiết dành cho khách hàng đăng ký thông tin thành viên tại các kênh bán hàng của MỘC.</li>
            <li>Điểm tích lũy được ghi nhận từ giá trị hóa đơn của các giao dịch mua hàng. Điểm dùng để xét hạng và duy trì hạng thành viên.</li>
            <li>Khách hàng vui lòng cung cấp đầy đủ: họ và tên, số điện thoại đang hoạt động, email, ngày tháng năm sinh, giới tính và địa chỉ đang sống.</li>
            <li>Giá trị quy đổi: 1.000 VNĐ = 1 điểm. Điểm có thời hạn 365 ngày từ ngày tích lũy; hết thời hạn, điểm sẽ được trừ khỏi tổng điểm.</li>
            <li>Điểm chỉ dùng để xét hạng, duy trì hoặc nâng hạng thành viên; không quy đổi thành tiền mặt, không chuyển nhượng hoặc tặng cho người khác.</li>
          </ol>
        </section>

        <section aria-labelledby="loyalty-benefits">
          <h2 id="loyalty-benefits" className="font-semibold text-foreground">II. Chính sách khách hàng thân thiết</h2>
          <h3 className="mt-3 font-medium text-foreground">1. Quyền lợi của từng hạng thành viên</h3>
          <div className="mt-4 overflow-x-auto border border-foreground/70">
            <table className="w-full min-w-[760px] border-collapse text-center text-sm text-foreground">
              <thead className="bg-accent text-accent-foreground">
                <tr>
                  <th className="w-52 border border-foreground/70 px-3 py-3 text-left">Ưu đãi</th>
                  {tiers.map((tier) => <th key={tier.name} className="border border-foreground/70 px-3 py-3 font-semibold">{tier.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><th className="border border-foreground/70 px-3 py-3 text-left">Điểm tích lũy</th>{tiers.map((tier) => <td key={tier.name} className="border border-foreground/70 px-3 py-3">{tier.points}</td>)}</tr>
                <tr className="bg-secondary/60"><th className="border border-foreground/70 px-3 py-3 text-left">Voucher sinh nhật</th>{tiers.map((tier) => <td key={tier.name} className="border border-foreground/70 px-3 py-3">{tier.birthday}</td>)}</tr>
                <tr><th className="border border-foreground/70 px-3 py-3 text-left">Ưu đãi độc quyền</th>{tiers.map((tier) => <td key={tier.name} aria-label={`Có ưu đãi cho ${tier.name}`} className="border border-foreground/70 px-3 py-3">♥</td>)}</tr>
                <tr className="bg-secondary/60"><th className="border border-foreground/70 px-3 py-3 text-left">Quà tặng đặc biệt</th>{tiers.map((tier, index) => <td key={tier.name} className="border border-foreground/70 px-3 py-3">{index >= 2 ? '♥' : '—'}</td>)}</tr>
                <tr><th className="border border-foreground/70 px-3 py-3 text-left">Ưu đãi tích điểm ngày memberday</th>{tiers.map((tier) => <td key={tier.name} className="border border-foreground/70 px-3 py-3">♥</td>)}</tr>
                <tr className="bg-secondary/60"><th className="border border-foreground/70 px-3 py-3 text-left">Voucher lên hạng</th>{tiers.map((tier) => <td key={tier.name} className="border border-foreground/70 px-3 py-3">{tier.upgrade}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Voucher sinh nhật và voucher lên hạng là mã riêng, có giá trị trong 30 ngày và được gửi qua số điện thoại hoặc email đã đăng ký.</li>
            <li>Quà tặng, ưu đãi độc quyền và ưu đãi tích điểm được áp dụng theo thể lệ từng chương trình MỘC triển khai.</li>
          </ul>
        </section>

        <section aria-labelledby="loyalty-maintenance">
          <h2 id="loyalty-maintenance" className="font-semibold text-foreground">2. Xét hạng và duy trì hạng thành viên</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Thành viên tích lũy điểm theo giá trị đơn hàng. Khi đạt điều kiện của hạng tiếp theo, khách hàng được xét nâng hạng.</li>
            <li>Thời gian duy trì hạng là 365 ngày. Điểm hết hạn được trừ khỏi tổng điểm khi xét hạng lại.</li>
          </ul>
        </section>
        <p className="text-xs">Chính sách áp dụng tại hệ thống MỘC Studio. Quyền lợi theo hạng được thực hiện theo điều kiện và thời gian của từng chương trình.</p>
      </div>
    </div>
  )
}
