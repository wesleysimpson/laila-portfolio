# Laila Milan — Stylist

A single-page styling portfolio. Plain HTML, CSS, and JavaScript — no framework,
no build tool to learn. You edit **one block of content** and drop in photos; the
layout takes care of itself.

- **Live site:** https://lailamilan.com
- **Design:** editorial and restrained — near-black on warm off-white, one accent,
  self-hosted fonts, no analytics, no cookies, no third-party scripts.

---

## The one thing to know

Everything you'll ever edit lives at the **top of `index.html`**, inside the
block marked:

```
✎  EDIT YOUR CONTENT HERE
```

That block holds all the words (statement, bio, capabilities, credits, contact)
**and** the list of which photos appear, grouped by shoot. You do not need to open
`styles.css` or `main.js`.

- Plain text = a sensible default you can keep or rewrite.
- Text written like `[✎ … ]` = a **placeholder to replace** before launch.
- Every photo needs an `alt` — a short plain-language description (used by screen
  readers and search engines).

---

## Adding, removing, or reordering photos

1. **Add the photo file** to `images/raw/`. Give it a clean name that matches its
   shoot, e.g. `acne-05.jpg`, `sportswear-06.jpg`. (JPG, PNG, or WebP are all fine.)
2. **Optimize it** — in a terminal, from this folder, run:
   ```bash
   npm install      # first time only
   npm run optimize
   ```
   This creates the resized/WebP versions, a blurred placeholder, and updates the
   size manifest. It reads everything in `images/raw/` and writes to
   `images/optimized/`.
3. **List it on the page** — in `index.html`, find the matching section and add a
   line to its `images: [ … ]`:
   ```js
   { src: "acne-05", alt: "Short description of the look", caption: "" },
   ```
   `src` is the filename **without** the extension. Order in the list = order on
   the page. Remove a line to remove a photo. Delete a whole `{ … }` section to
   drop a shoot.

That's it — you never touch the layout.

> **Tip:** to preview locally, run `npm run optimize` once, then open `index.html`
> in your browser (or run `npx serve` in this folder for an exact preview).

### Starting a brand-new shoot section

Copy an existing section block in the config and change the `id`, `title`,
`credit`, and `images`. `id` must be unique and URL-friendly (lowercase, hyphens).

---

## Editing text, credits, and contact

All in the same top block:

- **Statement / bio / capabilities** — under `copy`.
- **Selected credits** (the list in the About section) — `copy.credits`, one per line.
- **Per-shoot credit** (shown under each shoot heading and in the photo viewer) —
  each section's `credit`.
- **Contact** — `copy.email`, `copy.phone`, `copy.instagram` (+ `instagramUrl`).

---

## What's intentionally **not** on the site

- **Miami Swim Week 2025** — the only files provided were **Getty Images press
  photos with the watermark visible**, so they're left off; publishing watermarked
  stock is a copyright exposure. The originals sit in `images/archive/` (not
  deployed). To add the shoot, put **your own** or properly licensed, watermark-free
  photos into `images/raw/`, run `npm run optimize`, and add a section in the config.

The **People** feature *is* on the site — in the **Published** section — shown as a
**tearsheet**: the People article page with the masthead and the original
photographer's credit (Dean Chambers) left intact, which is how published work is
properly credited. It is deliberately not cropped or passed off as an original
photograph.

---

## Deploying (GitHub Pages)

The site auto-deploys on every push to `main` via
`.github/workflows/deploy.yml` — it optimizes the images and publishes. First-time
setup:

1. Create a GitHub repo and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Laila Milan portfolio"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The `deploy` workflow runs automatically. Watch it under the **Actions** tab.

### Custom domain (lailamilan.com)

- `CNAME` (already in this folder) tells Pages to serve the site at
  `lailamilan.com`. Keep it.
- At your domain registrar, point DNS at GitHub Pages:
  - Four `A` records for the apex `lailamilan.com` →
    `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - (optional) a `CNAME` record for `www` → `<you>.github.io`
- In **Settings → Pages**, set the custom domain to `lailamilan.com` and enable
  **Enforce HTTPS** once the certificate is issued.

---

## Project structure

```
index.html            The page + the editable content block (start here)
styles.css            Design system — rarely touched
main.js               Renders the galleries + runs the photo viewer/lightbox
scripts/
  optimize-images.js  Turns images/raw/* into responsive, optimized files
images/
  raw/                Your source photos (input)
  optimized/          Generated: WebP + JPEG at 640/1280/1920 + blur placeholder
  archive/            Set aside, not published (see note above)
  manifest.json/.js   Generated: real pixel sizes (prevents layout shift)
  og-image.jpg        Hand-cropped 1200×630 link-preview image (not auto-generated)
fonts/                Self-hosted Fraunces + Inter (Google Fonts, no tracking)
CNAME                 Custom domain for GitHub Pages
.github/workflows/    Auto-deploy on push to main
```

## Requirements

- [Node.js](https://nodejs.org) 18+ (only needed to run `npm run optimize`).

## The image pipeline, briefly

`npm run optimize` uses [sharp](https://sharp.pixelplumbing.com/) to, for each
photo: strip EXIF/location metadata, auto-rotate, export WebP **and** JPEG at up to
three widths (never upscaling), generate a tiny blurred placeholder for the blur-up
effect, and record exact dimensions so the page reserves space and never “jumps”
while loading.

The social link-preview image, `images/og-image.jpg`, is a **hand-cropped**
1200×630 file (deliberately not auto-generated, so it can't be rebuilt at the
wrong dimensions). To change it, crop a new 1200×630 JPEG under 300KB, save it to
`images/og-image.jpg`, and keep the `<meta property="og:image" …>` URL in
`index.html` pointing at it.
