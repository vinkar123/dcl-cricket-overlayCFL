DCL CLOUDFLARE OVERLAY — BROADCAST FONT FINAL

This version keeps the approved score-ribbon layout and replaces Aptos.

FONT
Primary: Roboto Condensed
Weights: 600 / 700 / 800 / 900
Loaded from Google Fonts in index.html.
Fallbacks: Arial Narrow, Segoe UI, Arial, sans-serif.

Why this font:
- condensed sports/broadcast appearance
- larger-looking characters in limited ribbon space
- strong number readability for score, CRR and RRR
- team names fit better without reducing font size

All approved behavior remains:
- Batter 1 / Batter 2 / Batting Team are always three visible lines
- Batting and bowling team names use the same font size
- Center panel dynamically follows batting-team logo primary color
- Contrasting center text
- Bowling panel border/team name follows bowling-team primary color
- Extras
- Current Partnership x runs in y balls
- Result/target/equation
- This-over balls
- 2-second refresh
- Cloudflare Pages /api/score backend

GitHub structure:
index.html
README.txt
functions/api/score.js
