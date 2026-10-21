import type { Metadata } from "next";

export const metadata: Metadata = { title: "Liên hệ" };

export default function ContactPage() {
  return <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
    <h1 className="font-serif text-4xl">Liên hệ MỘC Studio</h1>
    <p className="mt-4 text-sm text-muted-foreground">Cửa hàng hỗ trợ tư vấn sản phẩm, đơn hàng và thanh toán qua hotline.</p>
    <section id="he-thong-cua-hang" className="mt-8 border-t border-border pt-6"><h2 className="text-lg font-medium">Hệ thống cửa hàng
      </h2><address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">180 Cao Lỗ, Phường Chánh Hưng, Thành phố Hồ Chí Minh
      <br />Hotline: <a href="tel:0365175711" className="underline">0365 175 711</a></address></section>
  </main>;
}
