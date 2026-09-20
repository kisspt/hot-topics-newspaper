import type { TopicsData } from './demo';
import DEMO_DATA from './demo';
import { extractSummaries } from './extract';

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

async function fetchEntertainment() {
  try {
    const data = await fetchJSON('https://weibo.com/ajax/side/hotSearch', {
      headers: { ...HEADERS, Referer: 'https://weibo.com/' },
    });
    const items: TopicsData['entertainment'] = [];
    let rank = 1;
    for (const item of data?.data?.realtime ?? []) {
      const word = item.word ?? '';
      if (!word) continue;
      items.push({
        rank,
        title: word,
        url: `https://s.weibo.com/weibo?q=%23${encodeURIComponent(word)}%23`,
        hot: String(item.num ?? ''),
      });
      if (++rank > 10) break;
    }
    if (items.length >= 5) return items.slice(0, 10);
  } catch { /* fallback */ }
  return DEMO_DATA.entertainment;
}

async function fetchDigital() {
  try {
    const data = await fetchJSON(
      'https://m.ithome.com/api/news/newslistpageget?catename=%E6%95%B0%E7%A0%81&pagesize=15',
      { headers: HEADERS },
    );
    const items: TopicsData['digital'] = [];
    let rank = 1;
    for (const item of data?.Result ?? []) {
      const title = item.title ?? '';
      if (!title) continue;
      // Use the description from API directly as summary
      const desc = item.description ?? '';
      const itemUrl = item.url ?? '';
      const fullUrl = itemUrl.startsWith('http') ? itemUrl : `https://www.ithome.com${itemUrl}`;
      items.push({
        rank,
        title,
        url: fullUrl,
        hot: '',
        summary: desc || undefined,
      });
      if (++rank > 10) break;
    }
    if (items.length >= 3) return items.slice(0, 10);
  } catch { /* fallback */ }
  return DEMO_DATA.digital;
}

async function fetchAI() {
  try {
    const since = Math.floor(Date.now() / 1000) - 604800;
    const data = await fetchJSON(
      `https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=20&numericFilters=created_at_i>${since}`,
      { headers: HEADERS },
    );
    const items: TopicsData['ai'] = [];
    let rank = 1;
    for (const hit of data?.hits ?? []) {
      const title = hit.title ?? '';
      if (!title) continue;
      items.push({
        rank,
        title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        hot: hit.points ? `${hit.points} pts` : '',
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

  // Extract real summaries from article pages (batched, concurrent)
  const allItems = [...entertainment, ...digital, ...ai];
  const summaries = await extractSummaries(allItems);
  let idx = 0;
  for (const arr of [entertainment, digital, ai]) {
    for (const item of arr) {
      item.summary = summaries[idx++];
    }
  }

  return { entertainment, digital, ai };
}
