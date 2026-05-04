"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import ClientWrapper from "./ClientWrapper";

function HomePageContent() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("divinemarg-admin");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.isLoggedIn) {
          router.replace("/dashboard");
          return;
        }
      } catch {}
    }
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
      Loading…
    </div>
  );
}

export default function HomePage() {
  return (
    <ClientWrapper>
      <HomePageContent />
    </ClientWrapper>
  );
}
