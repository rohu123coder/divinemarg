import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AdminShell } from "@/components/AdminShell";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DivineMarg Admin",
  description: "Admin console for DivineMarg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased text-slate-900`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
