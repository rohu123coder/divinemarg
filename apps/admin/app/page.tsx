"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAdminHydrated } from "@/lib/useAdminHydrated";
import { useAdminStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAdminHydrated();
  const isLoggedIn = useAdminStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(isLoggedIn ? "/dashboard" : "/login");
  }, [hydrated, isLoggedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
      Redirecting…
    </div>
  );
}
