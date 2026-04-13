import { Suspense } from "react";

import { RashiHoroscopeContent } from "./RashiHoroscopeContent";

function HoroscopeFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50 via-white to-fuchsia-50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
}

export default function RashiHoroscopePage() {
  return (
    <Suspense fallback={<HoroscopeFallback />}>
      <RashiHoroscopeContent />
    </Suspense>
  );
}
