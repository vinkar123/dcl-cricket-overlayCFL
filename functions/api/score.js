/*
 * Dallas Cricket League -> Cloudflare Pages Function
 *
 * Routes:
 *   /api/score?match=5923
 *   /api/score?logo=/storage/...
 *   /api/score?leagueLogo=1
 *
 * This replaces the former Netlify score.mjs function.
 */

export async function onRequest(context) {
  const request = context.request;

  try {
    const url = new URL(request.url);

    /*
     * ============================================================
     * CURRENT DALLAS CRICKET LEAGUE WEBSITE LOGO
     * ============================================================
     * The overlay requests:
     *   /api/score?leagueLogo=1
     *
     * It inspects the current DCL website and its current JS assets
     * for the logo used by the site, while avoiding generic PWA icons.
     * ============================================================
     */
    if (url.searchParams.get("leagueLogo") === "1") {
      const SITE = "https://www.dallascricket.org/";

      async function fetchText(target) {
        const r = await fetch(target, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html,application/javascript,text/javascript,*/*"
          }
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.text();
      }

      async function sendImage(target) {
        try {
          const absolute = new URL(target, SITE).href;
          const r = await fetch(absolute, {
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*,*/*"
            }
          });

          if (!r.ok) return null;

          const contentType = r.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) return null;

          return new Response(await r.arrayBuffer(), {
            status: 200,
            headers: {
              "content-type": contentType,
              "cache-control": "public, max-age=1800",
              "access-control-allow-origin": "*"
            }
          });
        } catch {
          return null;
        }
      }

      try {
        const homeHtml = await fetchText(SITE);

        // 1. Prefer image tags whose attributes look like DCL branding.
        const imgTags = [...homeHtml.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
        const preferredTags = imgTags
          .filter(tag => /dallas|dcl|league|logo|brand/i.test(tag))
          .concat(imgTags);

        for (const tag of preferredTags) {
          const srcMatch =
            tag.match(/\bsrc=["']([^"']+)["']/i) ||
            tag.match(/\bdata-src=["']([^"']+)["']/i);

          if (!srcMatch) continue;

          const candidate = srcMatch[1];
          if (/logo192|logo512|favicon/i.test(candidate)) continue;

          const response = await sendImage(candidate);
          if (response) return response;
        }

        // 2. Look for direct image asset references in page HTML.
        const assets = [...homeHtml.matchAll(
          /["'(]([^"'()]+\.(?:png|jpe?g|webp|svg))["')]/gi
        )].map(m => m[1]);

        assets.sort((a, b) => {
          const score = x =>
            (/dallas/i.test(x) ? 8 : 0) +
            (/dcl/i.test(x) ? 7 : 0) +
            (/logo/i.test(x) ? 6 : 0) +
            (/brand/i.test(x) ? 4 : 0) -
            (/logo192|logo512|favicon/i.test(x) ? 20 : 0);

          return score(b) - score(a);
        });

        for (const candidate of assets) {
          if (/logo192|logo512|favicon/i.test(candidate)) continue;

          const response = await sendImage(candidate);
          if (response) return response;
        }

        // 3. React sites may keep asset paths inside JS bundles.
        const scripts = [...homeHtml.matchAll(
          /<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi
        )].map(m => new URL(m[1], SITE).href);

        for (const scriptUrl of scripts.slice(-8)) {
          let js;
          try {
            js = await fetchText(scriptUrl);
          } catch {
            continue;
          }

          const jsAssets = [...js.matchAll(
            /["']([^"']*(?:dallas|dcl|logo|brand)[^"']*\.(?:png|jpe?g|webp|svg))["']/gi
          )].map(m => m[1]);

          jsAssets.sort((a, b) => {
            const score = x =>
              (/dallas/i.test(x) ? 8 : 0) +
              (/dcl/i.test(x) ? 7 : 0) +
              (/logo/i.test(x) ? 6 : 0) +
              (/brand/i.test(x) ? 4 : 0) -
              (/logo192|logo512|favicon/i.test(x) ? 20 : 0);

            return score(b) - score(a);
          });

          for (const candidate of jsAssets) {
            if (/logo192|logo512|favicon/i.test(candidate)) continue;

            const response = await sendImage(candidate);
            if (response) return response;
          }
        }
      } catch {
        // If discovery fails, return 404; the overlay keeps running.
      }

      return new Response("Current DCL website logo could not be discovered", {
        status: 404,
        headers: {
          "cache-control": "no-store",
          "access-control-allow-origin": "*"
        }
      });
    }

    /*
     * ============================================================
     * TEAM LOGO PROXY
     * ============================================================
     */
    const logoPath = url.searchParams.get("logo");

    if (logoPath) {
      if (!logoPath.startsWith("/storage/")) {
        return new Response("Invalid logo path", {
          status: 400,
          headers: {
            "access-control-allow-origin": "*"
          }
        });
      }

      const logoSources = [
        `https://dallascricket.org:3000${logoPath}`,
        `https://www.dallascricket.org${logoPath}`,
        `https://dallascricket.org${logoPath}`
      ];

      for (const logoUrl of logoSources) {
        try {
          const logoResponse = await fetch(logoUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*"
            }
          });

          if (logoResponse.ok) {
            return new Response(await logoResponse.arrayBuffer(), {
              status: 200,
              headers: {
                "content-type":
                  logoResponse.headers.get("content-type") || "image/png",
                "cache-control": "public, max-age=3600",
                "access-control-allow-origin": "*"
              }
            });
          }
        } catch {
          // Try next DCL image host.
        }
      }

      return new Response("Team logo not found", {
        status: 404,
        headers: {
          "access-control-allow-origin": "*"
        }
      });
    }

    /*
     * ============================================================
     * LIVE MATCH DATA
     * ============================================================
     */
    const match = (
      url.searchParams.get("match") || "5923"
    ).replace(/[^0-9]/g, "");

    if (!match) {
      return Response.json(
        { error: "Invalid match number" },
        {
          status: 400,
          headers: {
            "access-control-allow-origin": "*"
          }
        }
      );
    }

    const upstream = await fetch(
      `https://dallascricket.org:3000/api/getmatchdata/${match}`,
      {
        headers: {
          "Accept": "application/json,text/plain,*/*",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store, no-cache, must-revalidate",
        "access-control-allow-origin": "*"
      }
    });
  } catch (error) {
    return Response.json(
      {
        error: String(error),
        message: "Unable to retrieve Dallas Cricket League data."
      },
      {
        status: 500,
        headers: {
          "cache-control": "no-store",
          "access-control-allow-origin": "*"
        }
      }
    );
  }
}
