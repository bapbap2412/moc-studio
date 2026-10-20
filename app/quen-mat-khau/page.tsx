import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return <main className="mx-auto min-h-[55vh] max-w-xl px-4 py-16">
    <h1 className="font-serif text-4xl">Quên mật khẩu?</h1>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Hiện tại cửa hàng chưa bật gửi email đặt lại mật khẩu tự động. Để xác minh chủ tài khoản và được hỗ trợ đặt lại, vui lòng gọi hotline trong giờ làm việc.</p>
    <a href="tel:02838505520" className="mt-6 inline-flex h-12 items-center bg-primary px-6 text-sm text-primary-foreground">Gọi 028 3850 5520</a>
  </main>;
}
