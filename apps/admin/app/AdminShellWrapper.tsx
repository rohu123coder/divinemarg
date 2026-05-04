"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminStore } from "@/lib/store";
import { useAdminHydrated } from "@/lib/useAdminHydrated";
import { AdminShell } from "@/components/AdminShell";

export default function AdminShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAdminHydrated();
  const isLoggedIn = useAdminStore((s) => s.isLoggedIn);
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!hydrated || isLogin) return;
    if (!isLoggedIn) router.replace("/login");
  }, [hydrated, isLoggedIn, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return <AdminShell>{children}</AdminShell>;
}
