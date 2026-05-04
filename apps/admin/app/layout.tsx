import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "./ClientWrapper";

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
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
