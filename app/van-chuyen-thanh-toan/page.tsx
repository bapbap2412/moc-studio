import type { Metadata } from "next";
import { formatPrice } from "@/lib/format";
import { getStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = { title: "Vận chuyển và thanh toán" };

export default async function ShippingPaymentPage() {
  const settings = await getStoreSettings();
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
      <h1 className="font-serif text-4xl">Vận chuyển và thanh toán</h1>
      <section className="mt-8">
        <h2 className="text-lg font-medium">Vận chuyển</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Phí giao hàng tiêu chuẩn {formatPrice(settings.shippingFee)}. Đơn từ {formatPrice(settings.freeShippingThreshold)} được miễn phí vận chuyển. Thời gian giao dự kiến 2–4 ngày làm việc trên toàn quốc.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-medium">Thanh toán</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Thanh toán khi nhận hàng (COD).</li>
          <li>Chuyển khoản ngân hàng theo thông tin hiển thị sau khi đặt hàng; ghi mã đơn trong nội dung chuyển khoản.</li>
          <li>VNPay hỗ trợ thanh toán qua thẻ, tài khoản ngân hàng và QR. Đơn chỉ được xác nhận đã thanh toán sau khi máy chủ xác minh IPN có chữ ký hợp lệ.</li>
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-medium">Đổi trả</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{settings.returnPolicy}</p>
      </section>
      <p className="mt-8 text-xs text-muted-foreground">
        Đơn chuyển khoản chỉ được xác nhận sau khi cửa hàng đối soát. Trạng thái VNPay chỉ được cập nhật từ IPN đã xác thực.
      </p>
    </main>
  );
}
