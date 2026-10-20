
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserRound, LogOut } from "lucide-react";

type AuthUser = {
  id: string;
  email: string;
  role: "customer" | "admin";
};

export function HeaderAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (active) {
          setUser(data.authenticated ? data.user : null);
        }
      } catch (error) {
        console.error("Không thể kiểm tra đăng nhập:", error);
      } finally {
        if (active) setChecked(true);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

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

      setUser(null);
      router.replace("/dang-nhap");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      window.alert("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (!checked) {
    return <div className="h-9 w-24" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dang-nhap"
          className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-70"
        >
          <LogIn size={17} />
          Đăng nhập
        </Link>

        
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={user.role === "admin" ? "/admin" : "/tai-khoan"}
        className="flex max-w-56 items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-gray-100"
        title={user.email}
      >
        <UserRound size={19} className="shrink-0" />

        <span className="min-w-0">
          <span className="block text-sm font-semibold">
            {user.role === "admin" ? "Quản trị viên" : "Tài khoản"}
          </span>
          <span className="block truncate text-xs text-gray-500">
            {user.email}
          </span>
        </span>
      </Link>
        {user.role === "customer" && <Link href="/wishlist" className="text-sm hover:underline">Yêu thích</Link>}

      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
      >
        <LogOut size={16} />
        {loading ? "Đang thoát..." : "Đăng xuất"}
      </button>
    </div>
  );
}
