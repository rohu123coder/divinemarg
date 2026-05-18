import { AnalyticsScripts } from "@/components/AnalyticsScripts";

export default function ThankYouDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AnalyticsScripts />
    </>
  );
}
