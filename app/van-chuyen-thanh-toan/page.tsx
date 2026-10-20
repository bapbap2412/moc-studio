import type { Metadata } from "next";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Vận chuyển và thanh toán" };

export default function ShippingPaymentPage() {
  return <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
    <h1 className="font-serif text-4xl">Vận chuyển & thanh toán</h1>
    <section className="mt-8"><h2 className="text-lg font-medium">Vận chuyển</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Phí giao hàng tiêu chuẩn {formatPrice(SHIPPING_FEE)}. Đơn từ {formatPrice(FREE_SHIPPING_THRESHOLD)} được miễn phí vận chuyển. Thời gian giao dự kiến 2–4 ngày làm việc trên toàn quốc.</p></section>
    <section className="mt-8"><h2 className="text-lg font-medium">Thanh toán</h2><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"><li>Thanh toán khi nhận hàng (COD).</li><li>Chuyển khoản ngân hàng theo thông tin hiển thị sau khi đặt hàng; ghi mã đơn trong nội dung chuyển khoản.</li><li>Ví MoMo sẽ hiện ở bước thanh toán khi cửa hàng đã cấu hình tài khoản merchant. Giao dịch được xác nhận qua thông báo máy chủ có chữ ký hợp lệ.</li></ul></section>
    <p className="mt-8 text-xs text-muted-foreground">Đơn chuyển khoản chỉ được xác nhận sau khi cửa hàng đối soát. Trạng thái MoMo chỉ được cập nhật từ thông báo IPN đã xác thực.</p>
  </main>;
}
