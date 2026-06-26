import Link from "next/link";

import { getTenant } from "@/lib/tenants";

const links = [
  ["Privacy", "/privacy-policy"],
  ["Terms", "/terms"],
  ["Refund Policy", "/refund-policy"],
  ["Contact", "/contact"],
] as const;

export function Footer() {
  const tenant = getTenant();

  return (
    <footer className="border-t border-white/10 bg-[#0A0418] py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-2xl font-bold text-gold-accent">{tenant.logo.text}</p>
            <p className="mt-2 font-sans text-sm text-cream-white/70">
              Powering India&apos;s Astrology Entrepreneurs
            </p>
          </div>
          <div className="flex flex-wrap gap-4 font-sans text-sm text-cream-white/80">
            {links.map(([label, href]) => (
              <Link key={label} href={href} className="hover:text-gold-accent">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-2 font-sans text-sm text-cream-white/60">
          <p>
            Email:{" "}
            <a href={`mailto:${tenant.contact.supportEmail}`} className="text-gold-accent hover:underline">
              {tenant.contact.supportEmail}
            </a>
          </p>
          <p>
            WhatsApp:{" "}
            <a href="https://wa.me/919876543210" className="text-gold-accent hover:underline">
              +91 98765 43210
            </a>
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="https://www.facebook.com/DivineMargOfficial"
            target="_blank"
            rel="noreferrer"
            className="font-sans text-sm text-cream-white/70 hover:text-gold-accent"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/divinemarg"
            target="_blank"
            rel="noreferrer"
            className="font-sans text-sm text-cream-white/70 hover:text-gold-accent"
          >
            Instagram
          </a>
        </div>

        <p className="mt-8 font-sans text-xs text-cream-white/50">
          © {new Date().getFullYear()} {tenant.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
