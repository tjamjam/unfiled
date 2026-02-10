# Unfiled

**Privacy-first PDF toolkit.** Merge, split, compress, and organize PDFs entirely in your browser. No uploads, no servers, no tracking.

## Why?

Adobe Acrobat charges $20-30/month for basic operations like merging two PDFs. Free alternatives like Smallpdf limit you to 2 tasks per day and upload your files to their servers. Unfiled runs 100% client-side — your files never leave your device.

## Features

- **Merge PDFs** — Combine multiple PDFs into one document
- **Split / Extract Pages** — Select pages visually with thumbnails and extract them
- **Compress PDFs** — Reduce file size by removing unused objects
- **Rotate Pages** — Rotate all pages 90, 180, or 270 degrees
- **Images to PDF** — Convert JPG/PNG images into a PDF document

All processing happens in your browser using WebAssembly and JavaScript. Zero server-side processing.

## Tech Stack

- React + TypeScript + Vite
- [pdf-lib](https://pdf-lib.js.org/) — PDF manipulation (merge, split, rotate, forms)
- [pdf.js](https://mozilla.github.io/pdf.js/) — PDF rendering and thumbnails
- Tailwind CSS v4

## Getting Started

```bash
git clone https://github.com/tjamjam/unfiled.git
cd unfiled
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Building

```bash
npm run build
```

The output is a static site in `dist/` that can be deployed to any static host (GitHub Pages, Netlify, Vercel, etc.).

## License

MIT
