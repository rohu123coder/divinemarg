"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated || isLogin) return;
    if (!isLoggedIn) router.replace("/login");
  }, [mounted, hydrated, isLoggedIn, isLogin, router]);

  if (!mounted) return null;
  if (isLogin) return <>{children}</>;
  if (!hydrated) return null;
  if (!isLoggedIn) return null;

  return <AdminShell>{children}</AdminShell>;
}
