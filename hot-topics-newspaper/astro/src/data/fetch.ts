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

/* ── 翻译：英文 → 中文（MyMemory 免费 API） ── */
async function translateToChinese(text: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
    const data = await fetchJSON(url, undefined, 5_000);
    const translated = data?.responseData?.translatedText;
    if (translated && translated !== text) return translated;
  } catch { /* fallback */ }
  return text;
}

async function fetchEntertainment() {
  try {
    const data = await fetchJSON('https://weibo.com/ajax/side/hotSearch', {
      headers: { ...HEADERS, Referer: 'https://weibo.com/' },
    });
    const items: TopicsData['entertainment'] = [];
    let rank = 1;
    for (const item of data?.data?.realtime ?? []) {
      // 跳过广告
      if (item.is_ad) continue;
      const word = item.word ?? '';
      if (!word) continue;
      items.push({
        rank,
        title: word,
        url: `https://s.weibo.com/weibo?q=%23${encodeURIComponent(word)}%23`,
        hot: String(item.num ?? ''),
        // 微博热搜关键词本身就是描述性句子，直接作为摘要
        summary: word,
      });
      if (++rank > 10) break;
    }
    if (items.length >= 5) return items.slice(0, 10);
  } catch { /* fallback */ }
  return DEMO_DATA.entertainment;
}

async function fetchDigital() {
  try {
    // 使用 hot 分类获取热榜新闻（而非最新新闻）
    const data = await fetchJSON(
      'https://m.ithome.com/api/news/newslistpageget?catename=hot&pagesize=20',
      { headers: HEADERS },
    );
    const items: TopicsData['digital'] = [];
    let rank = 1;
    for (const item of data?.Result ?? []) {
      const title = item.title ?? '';
      if (!title) continue;
      // 跳过广告
      if (item.NewsTips?.some((t: any) => t.TipName === '广告')) continue;
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
    const raw: { title: string; url: string; hot: string }[] = [];
    let rank = 1;
    for (const hit of data?.hits ?? []) {
      const title = hit.title ?? '';
      if (!title) continue;
      raw.push({
        title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        hot: hit.points ? `${hit.points} pts` : '',
      });
      if (++rank > 11) break;
    }
    if (raw.length < 3) return DEMO_DATA.ai;

    // 顺序翻译标题，避免触发限流（MyMemory 免费额度 ~1000 词/天）
    const items: TopicsData['ai'] = [];
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const r = raw[i];
      const zhTitle = await translateToChinese(r.title);
      items.push({ rank: i + 1, title: zhTitle, url: r.url, hot: r.hot });
      if (i < raw.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
    return items;
  } catch { /* fallback */ }
  return DEMO_DATA.ai;
}

export async function fetchTopics(): Promise<TopicsData> {
  const [entertainment, digital, ai] = await Promise.all([
    fetchEntertainment(),
    fetchDigital(),
    fetchAI(),
  ]);

  // 只为数码板块提取页面摘要（IT之家 API 已自带 description，跳过重复提取）
  // 微博已在 fetchEntertainment 中设置 summary，AI 已翻译
  // 不再需要 extractSummaries

  return { entertainment, digital, ai };
}
