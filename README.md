# Proselect Fleet & Industrial Solutions Limited — B2B Procurement & Manufacturer Representation Platform

Corporate B2B sourcing website, multi-step Request for Quotation (RFQ) engine, Client Portal, Manufacturer Partnership Onboarding Portal, and Admin Command Centre for **Proselect Fleet & Industrial Solutions Limited** (Nairobi, Kenya — `www.proselectimports.com`).

---

## 1. Technology Stack

- **Framework:** Next.js 16.4 (App Router, React Server Components by default, `src/proxy.ts` edge session guard)
- **UI & Styling:** React 19.3, TypeScript, Tailwind CSS 4.3, Radix UI primitives, Lucide React icons, Motion (`motion/react`) with `prefers-reduced-motion` support
- **Forms & Validation:** React Hook Form + Zod 4 (client + server validation, honeypot, elapsed-time bot check, optional Cloudflare Turnstile, DB-backed fixed-window rate limiting)
- **Database, Auth & Storage:** Supabase PostgreSQL (Row Level Security + column-level grants), Supabase Auth (`@supabase/ssr`), Supabase Storage (`product-media`, private `documents`, private `manufacturer-submissions`)
- **Admin Data & Analytics:** TanStack Table v8 (`@tanstack/react-table`), Recharts
- **Commercial PDF Generation:** `@react-pdf/renderer` (`/api/quotations/[id]/pdf`)
- **Transactional Email:** Resend (`src/lib/email.ts`)
- **Deployment:** Vercel (`vercel.json`)

---

## 2. Local Development Quickstart

```bash
npm install
cp .env.example .env.local   # or copy manually on Windows
npm run dev
```

Open `http://localhost:3000`.

> **Zero-Credential Preview Mode:** When Supabase environment variables are not yet populated in `.env.local`, all public pages, the dynamic Equipment Catalogue (populated with clearly labelled `Sample listing — demo data` items), comparison drawer, and multi-step RFQ wizard UI render cleanly out of the box, while `/login`, `/portal`, and `/admin` display a clear setup banner.

---

## 3. Supabase Database & Storage Setup

1. Create a new Supabase project (recommended region: EU Central / Frankfurt or AWS Cape Town for lowest latency to Nairobi).
2. In the **Supabase SQL Editor** (or via `supabase db push`), run in order:
   - `supabase/migrations/0001_schema.sql` — creates all normalized tables, enums, sequences (`PS-RFQ-YYYY-####`, `PS-QTN-YYYY-####`, `PS-ORD-YYYY-####`, `PS-MFR-YYYY-####`, `PS-LEAD-YYYY-####`), helper functions, auth user trigger, Row Level Security policies, column-level grants (hiding `kra_pin` and `registration_number` from browser roles), and the three Storage buckets (`product-media`, `documents`, `manufacturer-submissions`).
   - `supabase/migrations/0002_seed.sql` — seeds all 20 equipment categories across the 3 divisions, default CMS `site_settings`, and sample demonstration listings (`is_sample = true`, excluded from search engine indexing).
3. Copy your credentials into `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://www.proselectimports.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM="ProSelect <no-reply@proselectimports.com>"
SALES_NOTIFY_EMAIL=info@proselectimports.com

# Optional Cloudflare Turnstile spam protection
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

4. **Promote your first Super Administrator:**
   Register your account at `/register`, then run once in the Supabase SQL Editor:
   ```sql
   update public.profiles
   set role = 'super_admin'
   where email = 'info@proselectimports.com';
   ```
   Subsequent staff roles (`admin`, `sales_manager`, `procurement_officer`, `operations_officer`) can be managed directly from **Admin Command Centre → Team & Audit Logs (`/admin/audit`)**.

---

## 4. Security & Data Integrity Architecture

- **Strict Cost Isolation:** Internal factory costs, freight costs, and margin calculations live exclusively in `quotation_internal_costs` (RLS restricted to `can_manage_commercial()`). Neither the Client Portal (`/portal/quotations/[id]`) nor the PDF generator (`/api/quotations/[id]/pdf`) ever queries this table.
- **No Unverified Claims:** Every product specification carries `verification` (`verified` vs `awaiting_confirmation`). Specification facet filters only advertise `verified` values. Demonstration listings carry `is_sample = true` and `robots: { index: false }`.
- **Non-Binding RFQs & Controlled Order Initiation:** RFQs are explicitly logged as non-binding enquiries. Client acceptance of a quotation in `/portal/quotations/[id]` records intent and notifies sales, while confirmed orders (`/admin/orders`) can only be initiated by authorised commercial staff.
- **Private Document Streaming:** Client documents and manufacturer application attachments live in private buckets and are streamed server-side via `/api/documents/[id]` and `/api/manufacturer-submissions` after verifying RLS ownership/role and magic-byte file signatures on upload.

---

## 5. Production Deployment (Vercel + Domain)

1. Push the repository to GitHub / GitLab and import into **Vercel**.
2. Add all environment variables from `.env.example` in **Vercel → Project Settings → Environment Variables**.
3. Verify `proselectimports.com` in **Resend** (DKIM / SPF DNS records) so transactional emails deliver from `no-reply@proselectimports.com`.
4. In **Supabase → Authentication → URL Configuration**, set:
   - **Site URL:** `https://www.proselectimports.com`
   - **Redirect URLs:** `https://www.proselectimports.com/auth/callback`
5. Attach `www.proselectimports.com` and `proselectimports.com` in **Vercel → Domains**.

