import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo Booked | DivineMarg",
  description: "Your ₹99 live demo booking is confirmed.",
  robots: { index: false },
};

export default function ThankYouDemoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A0B2E] px-4 text-center text-[#FFF8E7]">
      <p className="text-5xl">✨</p>
      <h1 className="mt-4 text-3xl font-bold md:text-4xl">Booking Confirmed!</h1>
      <p className="mt-4 max-w-md text-lg text-[#FFF8E7]/85">
        Aapko WhatsApp pe demo link mil jayega next 10 minutes mein. Agar kuch miss ho,
        email check karein ya support@divinemarg.com par likhein.
      </p>
      <Link
        href="/launch-your-astrology-business"
        className="mt-8 rounded-full bg-gradient-to-r from-[#FFD700] via-[#F4C430] to-[#FF6B9D] px-8 py-3 font-semibold text-[#1A0B2E]"
      >
        Back to Landing Page
      </Link>
    </main>
  );
}
