import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hướng dẫn chọn size" };

export default function SizeGuidePage() {
  return <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">Hướng dẫn mua sắm</p>
    <h1 className="mt-3 font-serif text-4xl">Hướng dẫn chọn size</h1>
    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">Số đo dưới đây là gợi ý tham khảo. Phom dáng và chất liệu có thể tạo khác biệt giữa từng sản phẩm; vui lòng xem mô tả hoặc liên hệ cửa hàng nếu cần tư vấn.</p>
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Bảng tham khảo size quần áo nữ</caption>
        <thead><tr className="border-b border-border"><th className="p-3">Size</th><th className="p-3">Ngực (cm)</th><th className="p-3">Eo (cm)</th><th className="p-3">Hông (cm)</th></tr></thead>
        <tbody>{[['XS','76–80','60–64','84–88'],['S','80–84','64–68','88–92'],['M','84–88','68–72','92–96'],['L','88–94','72–78','96–102'],['XL','94–100','78–84','102–108']].map((row) => <tr key={row[0]} className="border-b border-border"><th className="p-3 font-medium">{row[0]}</th>{row.slice(1).map((cell, index) => <td key={index} className="p-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <p className="mt-6 text-xs text-muted-foreground">Đo sát cơ thể bằng thước dây, giữ thước ngang và không siết chặt. Với số đo nằm giữa hai size, cân nhắc chọn size lớn hơn để mặc thoải mái.</p>
    <p className="mt-4 text-sm">Cần tư vấn? Gọi <a className="underline" href="tel:02838505520">028 3850 5520</a>.</p>
  </main>;
}
