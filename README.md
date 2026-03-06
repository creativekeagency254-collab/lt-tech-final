# Lifetime Limited Website

Clean static website setup for easy deployment to Vercel.

## Project Structure

- `index.html` - Main page markup
- `assets/styles/site.css` - All styles
- `assets/scripts/site.js` - All frontend logic
- `assets/images/` - Brand assets and icons
- `robots.txt` - Search engine crawl rules
- `sitemap.xml` - Primary sitemap for production domain
- `vercel.json` - Vercel config
- `supabase-schema.sql` - Required tables/policies for Supabase (`products`, `orders`)
- `products/`, `categories/`, `about/`, `contact/`, `login/`, `track-order/`, `blog/` - SEO landing pages for sitelink indexing

## Run Locally

```powershell
http-server -p 3000 -c-1 .
```

Then open:

- `http://localhost:3000`

## Supabase Setup

1. Open Supabase SQL Editor for project `fbulitfyarmnyegxduqy`.
2. Run the SQL from `supabase-schema.sql`.
3. Refresh the website/admin dashboard.

If dashboard shows `Schema Missing` or `Schema Update Needed`:

1. Open Admin -> `Settings & Images`.
2. In `Supabase Setup Wizard`, click `Copy Schema SQL`.
3. Click `Open SQL Editor`, paste and run.
4. Return to admin and click `Recheck Schema`.
5. Optional: click `Seed Products` to load starter catalog, or `Sync Current Catalog` to upsert all current products.

Supabase credentials can be updated in Admin -> `Store Configuration`:

1. Set `Supabase URL`.
2. Set `Supabase Publishable / Anon Key` (never use `sb_secret` or `service_role` in browser).
3. Click `Save Settings` and the page reloads automatically to apply new credentials.

Paystack public key can be updated in Admin -> `Store Configuration`:

1. Set `Paystack Public Key` to `pk_test_...` for testing or `pk_live_...` for production.
2. Click `Save Settings`.
3. For production live charges, set Vercel environment variable `PAYSTACK_SECRET_KEY` to your server secret (`sk_live_...`).

Important:
- Never place `sk_test_...`, `sk_live_...`, `service_role`, or `sb_secret_...` keys in frontend fields.
- Live payment is marked paid only after server verification via `/api/paystack-verify`.

## Deploy to Vercel

1. Import this folder/repo into Vercel.
2. Framework preset: `Other`.
3. Build command: *(leave empty)*.
4. Output directory: *(leave empty / root)*.
5. Add custom domain: `lifetimetechnology.store`.
6. Add alias domain: `www.lifetimetechnology.store` (redirects to apex domain via `vercel.json`).
7. Add environment variable in Vercel Project Settings:
   - `PAYSTACK_SECRET_KEY=sk_live_...` (or `sk_test_...` for test verification).
