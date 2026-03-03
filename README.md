# Life Time Limited Website

Clean static website setup for easy deployment to Vercel.

## Project Structure

- `index.html` - Main page markup
- `assets/css/site.css` - All styles
- `assets/js/site.js` - All frontend logic
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

