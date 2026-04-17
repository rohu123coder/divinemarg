import Link from "next/link";

const footerLinks = [
  ["About", "/about"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms", "/terms"],
  ["Contact", "/contact"],
  ["Astrologer Registration", "/astrologer/register"],
  ["Blog", "/blog"],
  ["Refund Policy", "/refund-policy"],
  ["Pricing", "/pricing"],
  ["Disclaimer", "/disclaimer"],
] as const;

const socialLinks = [
  ["Facebook", "f", "https://www.facebook.com/DivineMargOfficial"],
  ["Instagram", "ig", "#"],
  ["YouTube", "yt", "#"],
  ["X", "x", "#"],
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 py-12 text-slate-300">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-slate-800 pb-8 md:flex-row">
          <div>
            <p className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
              ✨ DivineMarg
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Accurate guidance, verified astrologers, and trusted reports.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {footerLinks.map(([label, href]) => (
              <Link key={label} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            {socialLinks.map(([platform, text, href]) => (
              <Link
                key={platform}
                href={href}
                title={platform}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-xs font-bold uppercase text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                {text}
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-500">© {year} DivineMarg. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
