/**
 * Article content extractor — fetches a URL and pulls a short summary.
 * Priority: meta description > first substantial <p> > title fallback.
 */

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const TIMEOUT = 6_000;

async function fetchHTML(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    const resp = await fetch(url, { headers: HEADERS, signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

function extractMetaDescription(html: string): string | null {
  const m = html.match(
    /<meta\s+(?:name|property)\s*=\s*["'](?:description|og:description)["']\s+content\s*=\s*["']([^"']{20,})["']/i,
  ) || html.match(
    /<meta\s+content\s*=\s*["']([^"']{20,})["']\s+(?:name|property)\s*=\s*["'](?:description|og:description)["']/i,
  );
  if (!m) return null;
  return m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').trim();
}

function extractFirstParagraph(html: string): string | null {
  // Strip <script> and <style> blocks
  const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  // Find <p> tags with meaningful text content
  const matches = cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const m of matches) {
    const text = m[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length >= 30) return text;
  }
  return null;
}

export async function extractSummary(url: string, title: string): Promise<string> {
  const html = await fetchHTML(url);
  if (!html) return title;

  // Try meta description first
  const meta = extractMetaDescription(html);
  if (meta && meta.length >= 20) {
    // Truncate to ~120 chars for newspaper layout
    return meta.length > 140 ? meta.slice(0, 137) + '...' : meta;
  }

  // Fall back to first paragraph
  const para = extractFirstParagraph(html);
  if (para) {
    return para.length > 140 ? para.slice(0, 137) + '...' : para;
  }

  return title;
}

/**
 * Batch extract summaries with concurrency control.
 */
export async function extractSummaries(
  items: { url: string; title: string }[],
): Promise<string[]> {
  const results: string[] = new Array(items.length);
  // Process in batches of 5 to avoid overwhelming servers
  const BATCH = 5;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const promises = batch.map((item, j) =>
      extractSummary(item.url, item.title).then((s) => {
        results[i + j] = s;
      }),
    );
    await Promise.allSettled(promises);
  }
  return results;
}
