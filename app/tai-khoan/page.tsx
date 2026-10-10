
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect("/dang-nhap");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="min-h-[70vh] bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-muted-foreground">
          MỘC Studio / Tài khoản
        </p>

        <h1 className="mt-3 font-serif text-3xl">
          Tài khoản của tôi
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Xin chào, chào mừng bạn quay lại MỘC Studio.
        </p>

        <section className="mt-8 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">
            Thông tin tài khoản
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Email
              </p>
              <p className="mt-1 font-medium">
                {session.email}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/san-pham"
              className="rounded-md bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:opacity-80"
            >
              Tiếp tục mua sắm
            </Link>

            <LogoutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
