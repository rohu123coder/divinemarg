"use client";

import Image from "next/image";

import { SectionReveal } from "./SectionReveal";
import { GoldCTA } from "./GoldCTA";

export function FounderStory() {
  return (
    <SectionReveal className="py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-full border-4 border-gold-accent/40 shadow-gold-glow">
          <Image
            src="/landing-assets/rohit-founder.jpg"
            alt="Rohit Jha, Founder of DivineMarg"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 400px"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-cosmic-secondary text-center text-cream-white/60">
            <div>
              <p className="text-5xl">👤</p>
              <p className="mt-2 font-sans text-sm">Add rohit-founder.jpg</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-heading text-3xl text-cream-white md:text-5xl">Founder Ki Kahani</h2>
          <div className="mt-6 space-y-4 font-sans text-cream-white/85 leading-relaxed">
            <p>Main Rohit Jha hoon — founder of DivineMarg.</p>
            <p>
              3 saal pehle maine DivineMarg launch kiya — apna khud ka astrology platform. Mujhe pata
              chala ki actually platform banana, run karna, scale karna kitni mehnat ka kaam hai.
            </p>
            <p>
              Lakhs spent on developers. Months wasted on debugging. Endless nights making everything
              work.
            </p>
            <p>
              Aaj DivineMarg India ke top astrology platforms mein se ek hai. Lekin journey mein maine
              ek baat samjhi:
            </p>
            <p className="font-semibold text-cream-white">
              Bahut saare talented astrologers hain jinke paas knowledge hai, customers hain, par
              technology nahi hai. Aur jo log ye business start karna chahte hain, unhe pata hi nahi
              hota shuru kahaan se karein.
            </p>
            <p>
              Isiliye maine DivineMarg ka entire tech stack — same exact platform — ab dusre
              astrologers aur spiritual entrepreneurs ke liye open kiya hai.
            </p>
            <p>
              Aapko mere 3 saal ki mehnat ka shortcut milta hai. 30 din mein launch. Aap consultations
              dijiye. Tech aur systems hum handle karte hain.
            </p>
            <p>Demo mein milte hain. ₹99 mein 30 minute. Decide aap karein.</p>
          </div>
          <p className="mt-6 font-sans font-semibold text-gold-accent">
            Rohit Jha, Founder — DivineMarg
          </p>
          <div className="mt-6">
            <GoldCTA source="founder-story">🔮 Book ₹99 Live Demo with Rohit</GoldCTA>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
