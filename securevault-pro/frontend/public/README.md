# Static assets (served at the site root)

Anything in this `public/` folder is copied to the root of the deployed site
by Vite. For example `public/favicon.svg` is served at `/favicon.svg`.

## Required: og-image.png (social share banner)

`index.html` references a social-preview image at `/og-image.png`
(used by Open Graph + Twitter Card meta tags).

To finish setup, save the SecureVault Pro banner here as:

    public/og-image.png

Recommended size: **1200 × 630 px** (PNG or JPG). The current banner is fine
even if slightly larger — most platforms scale it. If you use a very different
aspect ratio, update the `og:image:width` / `og:image:height` values in
`index.html` to match.

After adding the file, commit & push — Vercel will serve it at
`https://<your-app>.vercel.app/og-image.png`.
