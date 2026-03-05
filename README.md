# Life Time Limited Website

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

If dashboard shows `Schema Missing`:

1. Open Admin -> `Settings & Images`.
2. In `Supabase Setup Wizard`, click `Copy Schema SQL`.
3. Click `Open SQL Editor`, paste and run.
4. Return to admin and click `Recheck Schema`.
5. Optional: click `Seed Products` to load the starter catalog into Supabase.

## Deploy to Vercel

1. Import this folder/repo into Vercel.
2. Framework preset: `Other`.
3. Build command: *(leave empty)*.
4. Output directory: *(leave empty / root)*.
5. Add custom domain: `lifetimetechnology.store`.
6. Add alias domain: `www.lifetimetechnology.store` (redirects to apex domain via `vercel.json`).
