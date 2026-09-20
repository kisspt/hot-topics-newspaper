import type { TopicsData } from './demo';

type TopicItem = TopicsData['entertainment'][number];

/**
 * Scan top headlines and pick the most relevant SVG icon id.
 * Falls back to `fallback` when no keyword cluster matches.
 */
export function pickIcon(items: TopicItem[], fallback: string): string {
  const text = items
    .slice(0, 5)
    .map((it) => `${it.title} ${it.summary ?? ''}`)
    .join(' ');

  if (!text.trim()) return fallback;

  // ── Sports ──
  if (/冠[军亚]|世[界杯]|奥[运运会]|NBA|足球|篮球|乒乓|羽毛球|网球|赛[事季场点]|夺[冠金]|破纪[录]|决胜|总决赛|联赛/.test(text))
    return 'ic-trophy';

  // ── Music / Audio ──
  if (/歌[曲手]|专辑|演唱会|音乐[节会]?|MV|说唱|乐队|作曲|作词|单曲/.test(text))
    return 'ic-music';

  // ── AI / Machine Learning (check before tech products) ──
  if (/AI|人工智能|大模型|大语言|GPT|LLM|深度学习|机器学习|神经网络|智能体|AIGC|算法|模型训练|OpenAI|Claude|Gemini|通义|文心一言|智谱|百川|讯飞|Sora|Agent/.test(text))
    return 'ic-brain';

  // ── Automotive ──
  if (/汽车|新能源[车]?|试驾|车企|比亚迪|特斯拉|蔚来|小鹏|理想汽车|大众汽车|丰田|宝马|奔驰|奥迪|本田|充电[桩站]|续航|电动车/.test(text))
    return 'ic-car';

  // ── Finance / Economy ──
  if (/股[市价东]|基金|房[价地产市]|GDP|经[济]|金融|银[行]|央行|利率|汇率|投[资融]|理财|通胀|消费|出口|进口|贸易/.test(text))
    return 'ic-chart';

  // ── Celebrity / Entertainment ──
  if (/明[星]|偶[像]|艺[人]|网[红]|流量|粉丝|追[星]|八卦|CP|磕|甜[蜜]?|恋[爱情]|婚[礼后]|分[手]|出[轨]|绯闻|代言|综艺|选秀|真人秀/.test(text))
    return 'ic-star';

  // ── Tech products (phones, chips, devices) ──
  if (/iPhone|安卓|手机|平板|iPad|华为|小米|OPPO|vivo|三星|折叠[屏]?|芯片|处理器|显卡|GPU|CPU|内存|SSD|硬盘/.test(text))
    return 'ic-phone';

  // ── Trending / Viral (hot controversy) ──
  if (/热[搜议议]|爆[红]|翻[车]|塌[房]|翻[红]|争议|网[友暴]|怒[怼]|道歉|回应|反转|打[假脸]|辟[谣]|曝光|举报|投诉/.test(text))
    return 'ic-flame';

  return fallback;
}
