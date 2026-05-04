"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store";
import { useAdminHydrated } from "@/lib/useAdminHydrated";
import { AdminShell } from "@/components/AdminShell";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAdminHydrated();
  const isLoggedIn = useAdminStore((s) => s.isLoggedIn);
  const isLogin = pathname === "/login";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !hydrated || isLogin) return;
    if (!isLoggedIn) router.replace("/login");
  }, [mounted, hydrated, isLoggedIn, isLogin, router]);

  if (!mounted) return null;
  if (isLogin) return <>{children}</>;
  if (!hydrated || !isLoggedIn) return null;
  return <AdminShell>{children}</AdminShell>;
}
