import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
