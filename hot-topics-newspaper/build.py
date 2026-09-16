import os
import sys
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_data import fetch_all, DEMO_DATA


def esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ──────────────────────────────────────────────
#  VINTAGE — article building blocks
# ──────────────────────────────────────────────

def _v_article(title, url, body, hot, css_class):
    """Single vintage article block."""
    meta = f'<div class="v-article-meta">{hot}</div>' if hot else ''
    return f'''<div class="v-article {css_class}">
    <div class="v-article-headline"><a href="{esc(url)}" target="_blank">{esc(title)}</a></div>
    <div class="v-article-body">{body}</div>
    {meta}
</div>'''


def _v_column(items):
    """Build a vintage column: first item = lead, rest secondary/tertiary."""
    if not items:
        return '<div class="v-col"></div>'
    parts = []
    for i, it in enumerate(items):
        title = it["title"]
        url = it.get("url", "#")
        hot = it.get("hot", "")
        if i == 0:
            body = f'{title}。' + (f'热度高达{hot}，引发全网广泛关注与热议。' if hot else '这一消息迅速传开，引发广泛关注与热议。')
            parts.append(_v_article(title, url, body, hot, "lead"))
        elif i <= 2:
            body = f'{title[:28]}，详情请持续关注后续报道。'
            parts.append(_v_article(title, url, body, hot, "secondary"))
        else:
            parts.append(_v_article(title, url, "", hot, "tertiary"))
    return f'<div class="v-col">\n{chr(10).join(parts)}\n</div>'


def _v_brief_col(items):
    """Build a vintage brief column (compact headline-only items)."""
    parts = []
    for it in items:
        hot = f' <span style="color:#8a7a66">· {esc(it["hot"])}</span>' if it.get("hot") else ""
        parts.append(f'''<div class="v-brief-item">
    <div class="v-article-headline"><a href="{esc(it.get('url', '#'))}" target="_blank">{esc(it["title"])}</a>{hot}</div>
</div>''')
    return f'<div class="v-col">\n{chr(10).join(parts)}\n</div>'


# ──────────────────────────────────────────────
#  MODERN — hero + cards
# ──────────────────────────────────────────────

def _m_hero(item, category):
    """Hero article block for modern theme."""
    title = esc(item["title"])
    url = esc(item.get("url", "#"))
    hot = item.get("hot", "")
    body = f'{item["title"][:50]}——这是今日最受关注的话题，引发全网热烈讨论。'
    heat = f'<div class="m-hero-heat">{hot}</div>' if hot else ''
    return f'''<div class="m-hero">
    <div class="m-hero-number">1</div>
    <div class="m-hero-content">
        <span class="m-hero-badge {category}">TOP</span>
        <div class="m-hero-title"><a href="{url}" target="_blank">{title}</a></div>
        <div class="m-hero-body">{body}</div>
        {heat}
    </div>
</div>'''


def _m_cards(items):
    """Card grid items for modern theme."""
    parts = []
    for it in items:
        hot = it.get("hot", "")
        heat = f'<div class="m-card-heat">{esc(hot)}</div>' if hot else ''
        parts.append(f'''<div class="m-card">
    <div class="m-card-num">{it['rank']}</div>
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
    ai  = data["ai"]

    now = datetime.datetime.now()
    date_str  = now.strftime("%Y-%m-%d")
    time_str  = now.strftime("%H:%M:%S")
    issue_no  = now.timetuple().tm_yday

    # ── Vintage: lead headline (top entertainment story) ──
    top = ent[0]
    hot_line = f' — {top["hot"]}' if top.get("hot") else ""
    vintage_lead = f'''<div class="v-lead">
    <div class="v-lead-kicker">★ Breaking Entertainment News ★</div>
    <div class="v-lead-headline"><a href="{esc(top.get('url', '#'))}" target="_blank">{esc(top["title"])}</a></div>
    <div class="v-lead-sub">{esc(top["title"][:40])}，引发全网热议{hot_line}</div>
</div>'''

    # ── Vintage: columns (split each category 5 + 5 into 2 cols) ──
    vintage_ent_col1 = _v_column(ent[:5])
    vintage_ent_col2 = _v_column(ent[5:])
    vintage_dig_col1 = _v_column(dig[:5])
    vintage_dig_col2 = _v_column(dig[5:])
    vintage_ai_col1  = _v_column(ai[:5])
    vintage_ai_col2  = _v_column(ai[5:])

    # ── Vintage: brief columns (mixed highlights) ──
    brief_items = [d[0] for d in [ent, dig, ai] if d]
    brief_items += [d[1] for d in [ent, dig, ai] if len(d) > 1]
    brief_items += [d[2] for d in [ent, dig, ai] if len(d) > 2]
    mid = len(brief_items) // 2 or 1
    vintage_brief_col1 = _v_brief_col(brief_items[:mid])
    vintage_brief_col2 = _v_brief_col(brief_items[mid:])

    # ── Modern: hero (top entertainment story) ──
    modern_hero = _m_hero(ent[0], "entertainment")

    # ── Modern: card grids ──
    modern_ent = _m_cards(ent)
    modern_dig = _m_cards(dig)
    modern_ai  = _m_cards(ai)

    # ── Template substitution ──
    template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template.html")
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()

    replacements = {
        "{{DATE}}":               date_str,
        "{{GENERATED_AT}}":       time_str,
        "{{ISSUE_NO}}":           str(issue_no),
        "{{VINTAGE_LEAD}}":       vintage_lead,
        "{{VINTAGE_ENT_COL1}}":   vintage_ent_col1,
        "{{VINTAGE_ENT_COL2}}":   vintage_ent_col2,
        "{{VINTAGE_DIG_COL1}}":   vintage_dig_col1,
        "{{VINTAGE_DIG_COL2}}":   vintage_dig_col2,
        "{{VINTAGE_AI_COL1}}":    vintage_ai_col1,
        "{{VINTAGE_AI_COL2}}":    vintage_ai_col2,
        "{{VINTAGE_BRIEF_COL1}}": vintage_brief_col1,
        "{{VINTAGE_BRIEF_COL2}}": vintage_brief_col2,
        "{{MODERN_HERO}}":        modern_hero,
        "{{MODERN_ENT}}":         modern_ent,
        "{{MODERN_DIG}}":         modern_dig,
        "{{MODERN_AI}}":          modern_ai,
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
