
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/dang-nhap");
  }

  return <>{children}</>;
}
