"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, router]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: "#64748b" }}>
      Loading…
    </div>
  );
}
