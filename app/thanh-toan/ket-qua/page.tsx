import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SePayResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl">Đang kiểm tra thanh toán</h1>
      <p className="mt-4 text-muted-foreground">
        SePay đã chuyển bạn trở lại cửa hàng. Trạng thái đơn hàng chỉ được cập nhật sau khi máy chủ xác minh thông báo thanh toán.
      </p>
      {order && <p className="mt-4 text-sm">Mã đơn hàng: <span className="font-medium">{order}</span></p>}
      <p className="mt-2 text-sm text-muted-foreground">Vui lòng xem trạng thái đơn hàng trong tài khoản của bạn sau ít phút.</p>
      <Link className="mt-6 inline-block underline underline-offset-4" href="/tai-khoan">Xem đơn hàng</Link>
    </main>
  );
}
