"use client";

import { useState } from "react";

type FounderPhotoProps = {
  src: string;
  alt: string;
};

export function FounderPhoto({ src, alt }: FounderPhotoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex h-[300px] w-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-center text-sm font-semibold text-slate-500">
        Founder photo placeholder
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={300}
      height={300}
      className="h-[300px] w-[300px] rounded-3xl border border-slate-200 object-cover"
      onError={() => setHasError(true)}
    />
  );
}
