DCL CRICKET OVERLAY — CLOUDFLARE PAGES VERSION

This package is the Cloudflare replacement for the Netlify-hosted overlay.

FILES
index.html
functions/api/score.js
README.txt

WHAT CHANGED
- Netlify URLs were replaced with /api/score.
- netlify/functions/score.mjs is no longer used.
- Cloudflare Pages automatically maps functions/api/score.js to:
    /api/score
- Visual layout and live-score behavior remain the same.
- Live score refresh remains 2 seconds.
- Team logo proxy remains enabled.
- DCL league logo discovery remains enabled.
- Extras and Current Partnership remain enabled.

CLOUDFLARE PRISM URL
https://YOUR-PROJECT.pages.dev/?match=5923

TEST API URL
https://YOUR-PROJECT.pages.dev/api/score?match=5923

IMPORTANT
Use Cloudflare Pages Git integration so the /functions folder is deployed
as Pages Functions.
