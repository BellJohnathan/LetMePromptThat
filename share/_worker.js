/**
 * Cloudflare Worker for lmpt.io
 * Injects Open Graph meta tags for bland Slack/social previews,
 * then serves the static animation page.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve static assets directly
    if (url.pathname.match(/\.(css|js|png|jpg|ico|svg|woff2?)$/)) {
      return env.ASSETS.fetch(request);
    }

    // For the root path with no encoded content, serve normally
    if (url.pathname === '/' || url.pathname === '') {
      return env.ASSETS.fetch(request);
    }

    // For any encoded path, serve index.html with OG tags injected
    const asset = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    let html = await asset.text();

    // Replace existing OG tags to ensure they're correct
    // (They're already in the HTML as fallback, but the worker ensures consistency)
    const ogTags = `
    <meta property="og:title" content="Shared with you">
    <meta property="og:description" content="Someone sent you something">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url.origin}${url.pathname}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Shared with you">
    <meta name="twitter:description" content="Someone sent you something">
    <meta name="robots" content="noindex">`;

    // Inject OG tags (replace the existing ones in <head>)
    html = html.replace(
      /<meta property="og:title"[^>]*>[\s\S]*?<meta property="og:type"[^>]*>/,
      ogTags
    );

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  },
};
