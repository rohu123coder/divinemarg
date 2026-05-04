import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const AdminShellWrapper = dynamic(() => import("./AdminShellWrapper"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      Loading…
    </div>
  ),
});

export const metadata: Metadata = {
  title: "DivineMarg Admin",
  description: "Admin console for DivineMarg",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">
        <AdminShellWrapper>{children}</AdminShellWrapper>
      </body>
    </html>
  );
}
