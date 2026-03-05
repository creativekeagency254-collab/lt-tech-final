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

## Run Locally

```powershell
http-server -p 3000 -c-1 .
```

Then open:

- `http://localhost:3000`

## Deploy to Vercel

1. Import this folder/repo into Vercel.
2. Framework preset: `Other`.
3. Build command: *(leave empty)*.
4. Output directory: *(leave empty / root)*.
5. Add custom domain: `lifetimetechnology.store`.
6. Add alias domain: `www.lifetimetechnology.store` (redirects to apex domain via `vercel.json`).
