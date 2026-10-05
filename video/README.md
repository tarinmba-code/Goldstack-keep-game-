# Goldstack Keep — video (Remotion)

Programmatic trailers and promo clips for Goldstack Keep, built with [Remotion](https://www.remotion.dev).
This folder is self-contained and excluded from the Vercel deploy (see `../.vercelignore`), so the game itself stays a static site.

```bash
cd video
npm install
npm run dev      # open Remotion Studio to preview/edit
npm run render   # -> out/goldstack-intro.mp4 (1080x1920, 30fps, 5s)
npm run still    # -> out/goldstack-intro.png (frame 60)
```

Compositions live in `src/` and are registered in `src/Root.tsx`.
