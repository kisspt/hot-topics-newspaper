import os
import sys
import datetime
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_data import fetch_all, DEMO_DATA


def esc(text):
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ──────────────────────────────────────────────
#  导语语料池 —— 让每条热点像被"报道"过的新闻
#  不重复标题，用采写口吻改写
# ──────────────────────────────────────────────
_LEADS = [
    "该消息今日一经公开，旋即登上各大平台热榜，引发业界与公众的广泛讨论。",
    "据公开信息，此事在短时间内迅速发酵，各方反应不一，后续进展备受瞩目。",
    "这一动向被普遍视为该领域的重要信号，多位分析人士认为其影响或将持续扩大。",
    "围绕此事的讨论在社交平台持续升温，网友纷纷发表看法，热度居高不下。",
    "该进展令不少关注者颇感意外，相关话题阅读量在短时间内快速攀升。",
    "本报注意到，此事已牵动多方神经，业内普遍预期将带来连锁反应。",
    "从曝光的信息来看，这一变化超出此前多数预测，引发外界高度关注。",
    "事件发酵之际，已有相关方陆续发声，态度与立场成为舆论聚焦的重点。",
    "作为近期最受瞩目的话题之一，其走向被认为具有较强的风向标意义。",
    "多方信源显示，相关情况仍在动态变化之中，本报将持续跟进报道。",
]

_TAILS = [
    "本报将持续关注事件的最新进展。",
    "更多细节有待进一步披露。",
    "相关各方尚未作出正式回应。",
    "此间人士提醒，理性看待方为正解。",
    "后续走向值得持续观察。",
]


def _lead(idx):
    return _LEADS[idx % len(_LEADS)]


def _feature_body(idx):
    """头条正文：两句话，采写口吻，控制版面高度。"""
    return f"{_lead(idx)}{_lead(idx + 3)}"


def _short(idx):
    """短讯导语：一句话。"""
    return _lead(idx + 1)


# ──────────────────────────────────────────────
#  VINTAGE — 版画插画引用
# ──────────────────────────────────────────────

def _illus(icon, caption, side="right"):
    cls = "v-illus left" if side == "left" else "v-illus"
    return (f'<figure class="{cls}">'
            f'<svg viewBox="0 0 64 64"><use href="#{icon}"/></svg>'
            f'<figcaption>{esc(caption)}</figcaption></figure>')


def _v_front_lead(item):
    """头版主推文：大标题 + 导语 + 插画 + 首字下沉正文。"""
    title = esc(item["title"])
    url = esc(item.get("url", "#"))
    hot = item.get("hot", "")
    heat = f'<span class="v-heat">热度 {esc(hot)}</span>' if hot else ""
    return f'''<div class="v-kicker">★ 今日头条 · Breaking ★</div>
<h2 class="v-feature-title"><a href="{url}" target="_blank">{title}</a></h2>
<div class="v-dek">{esc(_short(0))}</div>
<div class="v-byline">本报记者 ● 发自热点现场 {heat}</div>
{_illus("ic-quill", "The Daily Scoop 插画")}
<div class="v-body drop">{_feature_body(0)}</div>
<div class="v-continue">未完待续，详见本报相关版面 →</div>'''


def _v_index():
    """头版要目框：指向各版面的跳转条目。"""
    specs = [
        ("娱乐热点", "Entertainment", "1"),
        ("数码前沿", "Digital & Tech", "2"),
        ("智能时代", "Intelligence", "3"),
        ("一日要闻", "City in Brief", "4"),
    ]
    out = []
    for name, en, goto in specs:
        out.append(
            f'<li data-goto="{goto}">'
            f'<div class="v-index-head">{esc(name)}</div>'
            f'<div class="v-index-meta"><span>{esc(en)}</span><span>第 {int(goto) + 1} 版 →</span></div>'
            f'</li>'
        )
    return "\n".join(out)


def _v_section_page(items, icon, kicker, dek_seed):
    """一个版面：中心头题 + 多栏短讯流。"""
    if not items:
        return ""
    top = items[0]
    title = esc(top["title"])
    url = esc(top.get("url", "#"))
    hot = top.get("hot", "")
    heat = f'<span class="v-heat">热度 {esc(hot)}</span>' if hot else ""

    sechead = f'''<div class="v-sechead">
    <div class="v-kicker">{esc(kicker)}</div>
    <h2 class="v-feature-title"><a href="{url}" target="_blank">{title}</a></h2>
    <div class="v-sechead-dek">{esc(_short(dek_seed))}</div>
</div>
{_illus(icon, "本报插画 · Illustration", "right")}
<div class="v-byline">热点追踪 ● 现场报道 {heat}</div>
<div class="v-body drop">{_feature_body(dek_seed)}</div>'''

    news = []
    for i, it in enumerate(items[1:7], start=dek_seed + 1):
        t = esc(it["title"])
        u = esc(it.get("url", "#"))
        h = it.get("hot", "")
        meta = f'<div class="v-news-meta">{esc(h)}</div>' if h else ""
        news.append(
            f'<div class="v-news">'
            f'<div class="v-news-title"><a href="{u}" target="_blank">{t}</a></div>'
            f'<div class="v-news-body">{esc(_short(i))}</div>{meta}'
            f'</div>'
        )
    columns = '<div class="v-columns">\n' + "\n".join(news) + '\n</div>'
    return sechead + "\n" + columns


def _v_brief_page(ent, dig, ai):
    """简讯版：三栏分类速览，标题 + 热度。"""
    def cat(title, en, items):
        rows = []
        for it in items:
            t = esc(it["title"])
            u = esc(it.get("url", "#"))
            h = it.get("hot", "")
            hot = f' <span style="color:#8a7a66">· {esc(h)}</span>' if h else ""
            rows.append(
                f'<div class="v-brief-item">'
                f'<div class="v-news-title"><a href="{u}" target="_blank">{t}</a>{hot}</div>'
                f'</div>'
            )
        return (f'<div class="v-brief-cat"><h3>{esc(title)} · {esc(en)}</h3>'
                + "\n".join(rows) + "</div>")

    return ('<div class="v-brief-grid">'
            + cat("娱乐", "Entertainment", ent)
            + cat("数码", "Digital", dig)
            + cat("智能", "Intelligence", ai)
            + "</div>")


# ──────────────────────────────────────────────
#  MODERN — hero + cards
# ──────────────────────────────────────────────

def _m_hero(item, category):
    cat_label = {"entertainment": "娱乐", "digital": "数码", "ai": "AI"}.get(category, "热点")
    title = esc(item["title"])
    url = esc(item.get("url", "#"))
    hot = item.get("hot", "")
    body = f'{item["title"][:50]}——这是今日最受关注的话题，引发全网热烈讨论。'
    heat = f'<div class="m-hero-heat">{esc(hot)}</div>' if hot else ''
    return f'''<div class="m-hero">
    <div class="m-hero-number">01</div>
    <div class="m-hero-content">
        <span class="m-hero-badge {category}">{cat_label} · TOP</span>
        <div class="m-hero-title"><a href="{url}" target="_blank">{title}</a></div>
        <div class="m-hero-body">{body}</div>
        {heat}
    </div>
</div>'''


def _m_cards(items):
    parts = []
    for it in items:
        hot = it.get("hot", "")
        heat = f'<div class="m-card-heat">{esc(hot)}</div>' if hot else ''
        rank = it.get("rank", 0)
        rank_cls = f" rank-top{rank}" if 1 <= rank <= 3 else ""
        parts.append(f'''<div class="m-card{rank_cls}">
    <div class="m-card-num">{rank}</div>
    <div class="m-card-body">
        <div class="m-card-title"><a href="{esc(it.get('url', '#'))}" target="_blank">{esc(it["title"])}</a></div>
        {heat}
    </div>
</div>''')
    return "\n".join(parts)


# ──────────────────────────────────────────────
#  MAIN BUILD
# ──────────────────────────────────────────────

def build():
    demo_mode = "--demo" in sys.argv

    if demo_mode:
        data = DEMO_DATA
        print("[demo mode] Using embedded demo data")
    else:
        print("Fetching hot topics...")
        data = fetch_all()
        for cat, items in data.items():
            print(f"  {cat}: {len(items)} items")

    ent = data["entertainment"]
    dig = data["digital"]
    ai = data["ai"]

    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    issue_no = now.timetuple().tm_yday

    # vintage pages
    v_front_lead = _v_front_lead(ent[0]) if ent else ""
    v_front_index = _v_index()
    v_ent_page = _v_section_page(ent, "ic-masks", "娱乐热点 · Entertainment & Show Business", 1)
    v_dig_page = _v_section_page(dig, "ic-gear", "数码前沿 · Digital & Tech", 4)
    v_ai_page = _v_section_page(ai, "ic-brain", "智能时代 · Artificial Intelligence", 7)
    v_brief_page = _v_brief_page(ent, dig, ai)

    # modern
    modern_hero = _m_hero(ent[0], "entertainment") if ent else ""
    modern_ent = _m_cards(ent)
    modern_dig = _m_cards(dig)
    modern_ai = _m_cards(ai)

    template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template.html")
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()

    replacements = {
        "{{DATE}}": date_str,
        "{{GENERATED_AT}}": time_str,
        "{{ISSUE_NO}}": str(issue_no),
        "{{V_FRONT_LEAD}}": v_front_lead,
        "{{V_FRONT_INDEX}}": v_front_index,
        "{{V_ENT_PAGE}}": v_ent_page,
        "{{V_DIG_PAGE}}": v_dig_page,
        "{{V_AI_PAGE}}": v_ai_page,
        "{{V_BRIEF_PAGE}}": v_brief_page,
        "{{MODERN_HERO}}": modern_hero,
        "{{MODERN_ENT}}": modern_ent,
        "{{MODERN_DIG}}": modern_dig,
        "{{MODERN_AI}}": modern_ai,
    }
    for placeholder, value in replacements.items():
        html = html.replace(placeholder, value)

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "index.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nNewspaper generated: {output_path}")
    print(f"Date: {date_str} | Issue No. {issue_no}")


if __name__ == "__main__":
    build()
