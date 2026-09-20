import type { TopicsData } from './demo';
import DEMO_DATA from './demo';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

async function fetchJSON(url: string, init?: RequestInit, timeout = 10_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const resp = await fetch(url, { ...init, signal: ctrl.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return (await resp.json()) as any;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHTML(url: string, timeout = 10_000): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const resp = await fetch(url, { headers: HEADERS, signal: ctrl.signal, redirect: 'follow' });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ── 娱乐板块：百度热搜（带摘要） ── */
async function fetchEntertainment() {
  try {
    const data = await fetchJSON(
      'https://top.baidu.com/api/board?platform=pc&tab=realtime',
      { headers: HEADERS },
    );
    const items: TopicsData['entertainment'] = [];
    let rank = 1;
    for (const item of data?.data?.cards?.[0]?.content ?? []) {
      const word = item.word ?? '';
      if (!word) continue;
      const desc = item.desc ?? '';
      const url = item.rawUrl || item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(word)}`;
      items.push({
        rank,
        title: word,
        url,
        hot: item.hotScore ? `${Math.round(item.hotScore / 10000)}万` : '',
        summary: desc || word,
      });
      if (++rank > 10) break;
    }
    if (items.length >= 5) return items.slice(0, 10);
  } catch { /* fallback */ }
  return DEMO_DATA.entertainment;
}

/* ── 数码板块：IT之家数码热榜（HTML 解析） ── */
async function fetchDigital() {
  try {
    const html = await fetchHTML('https://www.ithome.com/block/rank.html?d=digi');
    if (!html) return DEMO_DATA.digital;

    // 数码热榜在 id="d-4" 的 tab 中
    const tabMatch = html.match(/id="d-4"[^>]*>([\s\S]*?)<\/ul>/);
    if (!tabMatch) return DEMO_DATA.digital;

    const items: TopicsData['digital'] = [];
    const linkRegex = /title="([^"]+)"[^>]*href="([^"]+)"/g;
    let match;
    let rank = 1;
    while ((match = linkRegex.exec(tabMatch[1])) !== null) {
      const [, title, rawUrl] = match;
      if (!title) continue;
      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://www.ithome.com${rawUrl}`;
      items.push({
        rank,
        title,
        url: fullUrl,
        hot: '',
      });
      if (++rank > 10) break;
    }
    if (items.length >= 3) return items.slice(0, 10);
  } catch { /* fallback */ }
  return DEMO_DATA.digital;
}

/* ── AI板块：量子位（QbitAI） ── */
async function fetchAI() {
  try {
    const data = await fetchJSON(
      'https://www.qbitai.com/wp-json/wp/v2/posts?per_page=10&_embed',
      { headers: HEADERS },
    );
    if (!Array.isArray(data)) return DEMO_DATA.ai;

    const items: TopicsData['ai'] = [];
    let rank = 1;
    for (const post of data) {
      const title = post?.title?.rendered ?? '';
      if (!title) continue;
      const link = post?.link ?? '';
      // 从 excerpt HTML 中提取纯文本摘要
      const excerptHtml = post?.excerpt?.rendered ?? '';
      const summary = excerptHtml
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      items.push({
        rank,
        title,
        url: link,
        hot: '',
        summary: summary ? (summary.length > 140 ? summary.slice(0, 137) + '...' : summary) : undefined,
      });
      if (++rank > 10) break;
    }
    if (items.length >= 3) return items.slice(0, 10);
  } catch { /* fallback */ }
  return DEMO_DATA.ai;
}

export async function fetchTopics(): Promise<TopicsData> {
  const [entertainment, digital, ai] = await Promise.all([
    fetchEntertainment(),
    fetchDigital(),
    fetchAI(),
  ]);
  return { entertainment, digital, ai };
}
