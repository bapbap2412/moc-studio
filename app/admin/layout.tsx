import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/dang-nhap");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
