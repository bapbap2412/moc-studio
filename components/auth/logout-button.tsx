
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Đăng xuất thất bại.");
      }

      router.replace("/dang-nhap");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      window.alert("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Đăng xuất"
      title={compact ? "Đăng xuất" : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 ${compact ? "size-10 px-0" : "px-4 py-2.5"} text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <LogOut size={17} strokeWidth={2.2} />
      )}

      {!compact && <span>{loading ? "Đang đăng xuất..." : "Đăng xuất"}</span>}
    </button>
  );
}
