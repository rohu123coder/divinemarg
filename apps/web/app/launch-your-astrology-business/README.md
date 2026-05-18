# Launch Your Astrology Business — Landing Page

Route: `/launch-your-astrology-business`

## Environment Variables Required

### Web (`apps/web/.env.local` and Vercel)

```env
NEXT_PUBLIC_RAZORPAY_PAYMENT_PAGE_URL=https://rzp.io/rzp/divinemarg-demo
NEXT_PUBLIC_META_PIXEL_ID=477011361415427
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_API_URL=https://divinemarg.onrender.com
```

Optional (legacy SDK checkout):

```env
NEXT_PUBLIC_USE_CUSTOM_CHECKOUT=true
```

### Backend (Render)

```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=<from Razorpay webhook settings>
RESEND_API_KEY=re_xxxxx
ADMIN_NOTIFY_EMAIL=rohit.1702jha@gmail.com
```

## Payment flow (Razorpay Payment Page)

1. User submits lead form → `POST /api/leads/demo-booking` (status: `lead_only`)
2. Meta `Lead` + GA4 `generate_lead` fire
3. Redirect to `NEXT_PUBLIC_RAZORPAY_PAYMENT_PAGE_URL` with prefill + `notes[lead_id]`
4. Razorpay webhook `POST /api/webhooks/razorpay` updates lead to `paid` on `payment.captured`
5. Success redirect: `https://divinemarg.com/thank-you-demo` (configure in Razorpay Payment Page settings)

Run migrations:

```bash
psql $DATABASE_URL -f backend/migrations/20260518_demo_booking_leads.sql
psql $DATABASE_URL -f backend/migrations/20260519_demo_leads_payment_page.sql
```

**Razorpay dashboard:** Webhook URL = `https://divinemarg.onrender.com/api/webhooks/razorpay`  
Events: `payment.captured`, `payment.failed`

## Tracking events

| Location | Meta Pixel | GA4 |
|----------|------------|-----|
| Page load | `ViewContent` | `view_content` |
| Modal open | `InitiateCheckout` | `begin_checkout` |
| Form submit (before redirect) | `Lead` | `generate_lead` |
| Thank-you page | `Purchase` | `purchase` |

## Switching back to custom Razorpay integration

When divinemarg.com Razorpay account is approved (currently using LearnEmpire account via Payment Page):

1. Add divinemarg.com Razorpay keys to backend
2. Set `NEXT_PUBLIC_USE_CUSTOM_CHECKOUT=true` in web env
3. Uncomment custom Razorpay SDK integration in `RazorpayCheckout.tsx`
4. Update webhook URL in new Razorpay dashboard to `/api/webhooks/razorpay`

## Updating content

- **Copy & data**: Edit `lib/content.ts`
- **Section layout**: `components/*.tsx`
- **SEO**: `layout.tsx` metadata and JSON-LD

## Adding images

| Asset | Path |
|-------|------|
| Founder photo | `public/landing-assets/rohit-founder.jpg` |
| OG image | `public/landing-assets/og-image.jpg` |
| Demo screenshots | `public/landing-assets/demo-1.png` … `demo-6.png` |
