# Launch Your Astrology Business — Landing Page

Route: `/launch-your-astrology-business`

## Updating content

- **Copy & data**: Edit `lib/content.ts` (testimonials, FAQs, features, sales notifications, etc.).
- **Section layout**: Each section lives in `components/*.tsx`.
- **SEO**: Update `layout.tsx` metadata and JSON-LD.

## Adding images

| Asset | Path |
|-------|------|
| Founder photo | `public/landing-assets/rohit-founder.jpg` |
| OG image | `public/landing-assets/og-image.jpg` |
| Demo screenshots | `public/landing-assets/demo-1.png` … `demo-6.png` |

Recommended sizes: founder 800×800 (square), demos 1920×1080, OG 1200×630.

## Testimonial photos

Add avatar URLs to `testimonials` in `lib/content.ts` and render with `next/image` in `Testimonials.tsx` when ready.

## Razorpay / API

Set `NEXT_PUBLIC_API_URL` to your backend (e.g. `https://divinemarg.onrender.com` or `http://localhost:4000`).

Backend endpoints: `POST /api/leads/demo-booking`, `POST /api/leads/demo-booking/verify`.

Run migration: `backend/migrations/20260518_demo_booking_leads.sql`.
