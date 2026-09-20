// 导语语料池 —— 让每条热点像被"报道"过的新闻
const LEADS = [
  '该消息今日一经公开，旋即登上各大平台热榜，引发业界与公众的广泛讨论。',
  '据公开信息，此事在短时间内迅速发酵，各方反应不一，后续进展备受瞩目。',
  '这一动向被普遍视为该领域的重要信号，多位分析人士认为其影响或将持续扩大。',
  '围绕此事的讨论在社交平台持续升温，网友纷纷发表看法，热度居高不下。',
  '该进展令不少关注者颇感意外，相关话题阅读量在短时间内快速攀升。',
  '本报注意到，此事已牵动多方神经，业内普遍预期将带来连锁反应。',
  '从曝光的信息来看，这一变化超出此前多数预测，引发外界高度关注。',
  '事件发酵之际，已有相关方陆续发声，态度与立场成为舆论聚焦的重点。',
  '作为近期最受瞩目的话题之一，其走向被认为具有较强的风向标意义。',
  '多方信源显示，相关情况仍在动态变化之中，本报将持续跟进报道。',
];

export function lead(idx: number): string {
  return LEADS[idx % LEADS.length];
}

export function featureBody(idx: number): string {
  return `${lead(idx)}${lead(idx + 3)}`;
}

export function featureBodyLong(idx: number): string {
  return `${lead(idx)}${lead(idx + 2)}${lead(idx + 4)}${lead(idx + 6)}`;
}

export function shortLead(idx: number): string {
  return lead(idx + 1);
}
