# Deploy

You can deploy this Vite SPA to **Netlify** or **Vercel**.

---

## Netlify (recommended simple path)

### A) Via Dashboard (no CI required)
1. Push the repo to GitHub.
2. Go to https://app.netlify.com → **Add new site → Import an existing project**.
3. Pick your repo.
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**.
6. (Optional) Set a custom domain in Site settings.

This repo includes:
- `netlify.toml` with SPA redirect and dev server hints.
- `public/_redirects` → ensures `/* → /index.html 200`.

### B) Via GitHub Actions (CI CD)
- Add repo secrets:
  - `NETLIFY_AUTH_TOKEN` (User settings → Applications → Personal access tokens).
  - `NETLIFY_SITE_ID` (Site settings → Site information).
- The workflow `.github/workflows/deploy-netlify.yml` will build and deploy on pushes to `main`.

---

## Vercel

### A) Via Dashboard (easiest)
1. Push the repo to GitHub.
2. Go to https://vercel.com/new → Import the repo.
3. Framework preset: **Vite** (automatically detected).
4. Build Command: `npm run build`  
   Output Directory: `dist`
5. Deploy.

This repo includes `vercel.json` with a SPA fallback.

### B) Via GitHub Actions
- Add repo secrets:
  - `VERCEL_TOKEN` (Account → Tokens)
  - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (Found in Vercel project settings → General → IDs)
- Workflow `.github/workflows/deploy-vercel.yml` uses Vercel CLI to build & deploy on `main`.

---

## Local test
```bash
npm run build
npm run preview
```

Then open the shown URL. The app must be served over **HTTPS** in production for API calls; Netlify and Vercel provide HTTPS by default.
