"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { toast } from "sonner";
import { setAdminActive } from "@/app/admin/cai-dat/actions";

export type AdminAccount = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
};

export function AdminAccountsManager({
  accounts,
  currentUserId,
}: {
  accounts: AdminAccount[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(account: AdminAccount) {
    const nextActive = !account.is_active;
    const prompt = nextActive
      ? `Mở khóa tài khoản ${account.email}?`
      : `Khóa tài khoản ${account.email}? Tài khoản sẽ mất quyền admin ngay lập tức.`;
    if (!window.confirm(prompt)) return;

    startTransition(async () => {
      const result = await setAdminActive(account.id, nextActive);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-[#e8e5dc] bg-white">
      <div className="border-b border-[#eeeae2] p-5 md:p-6">
        <h2 className="font-medium">Tài khoản quản trị</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Khóa tài khoản sẽ thu hồi quyền quản trị ngay trong các yêu cầu tiếp theo. Không thể tự khóa hoặc khóa quản trị viên hoạt động cuối cùng.
        </p>
      </div>
      <div className="divide-y divide-[#eeeae2]">
        {accounts.map((account) => {
          const isSelf = account.id === currentUserId;
          return (
            <div key={account.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div>
                <p className="font-medium text-neutral-800">
                  {account.full_name} {isSelf && <span className="text-xs font-normal text-neutral-500">(Bạn)</span>}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{account.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs ${account.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {account.is_active ? "Đang hoạt động" : "Đã khóa"}
                </span>
                <button
                  type="button"
                  disabled={pending || isSelf}
                  onClick={() => toggle(account)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e8e5dc] px-3 py-2 text-sm transition hover:bg-[#f5f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                  title={isSelf ? "Không thể thay đổi tài khoản đang sử dụng" : undefined}
                >
                  {account.is_active ? <LockKeyhole size={15} /> : <LockKeyholeOpen size={15} />}
                  {account.is_active ? "Khóa" : "Mở khóa"}
                </button>
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && <p className="p-6 text-sm text-neutral-500">Chưa có tài khoản quản trị.</p>}
      </div>
    </section>
  );
}
