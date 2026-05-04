"use client";
import dynamic from "next/dynamic";

const AdminShellWrapper = dynamic(() => import("./AdminShellWrapper"), {
  ssr: false,
});

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShellWrapper>{children}</AdminShellWrapper>;
}
