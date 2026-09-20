import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import type { TopicsData } from '../types';
import { featureBody, featureBodyLong, shortLead } from '../data/leads';
import { SVGSprites } from './SVGSprites';

interface VintageLayoutProps {
  data: TopicsData;
  dateStr: string;
  issueNo: number;
  generatedAt: string;
}

/* ── helpers ── */
function Illustration({ icon, caption, side }: { icon: string; caption: string; side?: 'left' | 'right' }) {
  const cls = side === 'left' ? 'v-illus left' : 'v-illus';
  return (
    <figure className={cls}>
      <svg viewBox="0 0 64 64"><use href={`#${icon}`} /></svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function FrontLead({ item }: { item: TopicsData['entertainment'][0] }) {
  return (
    <>
      <div className="v-kicker">★ 今日头条 · Breaking ★</div>
      <h2 className="v-feature-title"><a href={item.url} target="_blank">{item.title}</a></h2>
      <div className="v-dek">{shortLead(0)}</div>
      <div className="v-byline">
        本报记者 ● 发自热点现场
        {item.hot && <span className="v-heat">热度 {item.hot}</span>}
      </div>
      <Illustration icon="ic-quill" caption="The Daily Scoop 插画" />
      <div className="v-body drop">{featureBodyLong(0)}</div>
      <div className="v-body">{featureBodyLong(5)}</div>
      <div className="v-continue">未完待续，详见本报相关版面 →</div>
    </>
  );
}

function SectionIndex({ onGoto }: { onGoto: (page: number) => void }) {
  const specs: [string, string, number][] = [
    ['娱乐热点', 'Entertainment', 1],
    ['数码前沿', 'Digital & Tech', 2],
    ['智能时代', 'Intelligence', 3],
    ['一日要闻', 'City in Brief', 4],
  ];
  return (
    <>
      {specs.map(([name, en, goto]) => (
        <li key={goto} data-goto={goto} onClick={() => onGoto(goto)}>
          <div className="v-index-head">{name}</div>
          <div className="v-index-meta"><span>{en}</span><span>第 {goto + 1} 版 →</span></div>
        </li>
      ))}
    </>
  );
}

function SectionPage({
  items, icon, kicker, dekSeed,
}: {
  items: TopicsData['entertainment'];
  icon: string;
  kicker: string;
  dekSeed: number;
}) {
  if (!items.length) return null;
  const top = items[0];
  return (
    <>
      <div className="v-sechead">
        <div className="v-kicker">{kicker}</div>
        <h2 className="v-feature-title"><a href={top.url} target="_blank">{top.title}</a></h2>
        <div className="v-sechead-dek">{shortLead(dekSeed)}</div>
      </div>
      <Illustration icon={icon} caption="本报插画 · Illustration" />
      <div className="v-byline">
        热点追踪 ● 现场报道
        {top.hot && <span className="v-heat">热度 {top.hot}</span>}
      </div>
      <div className="v-body drop">{featureBodyLong(dekSeed)}</div>
      <div className="v-columns">
        {items.slice(1, 10).map((it, i) => (
          <div className="v-news" key={it.rank}>
            <div className="v-news-title"><a href={it.url} target="_blank">{it.title}</a></div>
            <div className="v-news-body">{shortLead(dekSeed + i + 1)}</div>
            {it.hot && <div className="v-news-meta">{it.hot}</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function BriefPage({ ent, dig, ai }: { ent: TopicsData['entertainment']; dig: TopicsData['digital']; ai: TopicsData['ai'] }) {
  function cat(title: string, en: string, items: TopicsData['entertainment']) {
    return (
      <div className="v-brief-cat">
        <h3>{title} · {en}</h3>
        {items.map(it => (
          <div className="v-brief-item" key={it.rank}>
            <div className="v-news-title">
              <a href={it.url} target="_blank">{it.title}</a>
              {it.hot && <span style={{ color: '#8a7a66' }}> · {it.hot}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="v-brief-grid">
      {cat('娱乐', 'Entertainment', ent)}
      {cat('数码', 'Digital', dig)}
      {cat('智能', 'Intelligence', ai)}
    </div>
  );
}

/* ── Main VintageLayout ── */
export function VintageLayout({ data, dateStr, issueNo, generatedAt }: VintageLayoutProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetsRef = useRef<HTMLDivElement[]>([]);
  const [cur, setCur] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  /* Animation state — driven by React, not DOM classList */
  const [animOut, setAnimOut] = useState(-1);   // page index animating out
  const [animIn, setAnimIn] = useState(-1);     // page index animating in
  const [animDir, setAnimDir] = useState(1);    // 1 = forward, -1 = back

  const sheetCount = 5;
  const sheetNames = ['头版', '娱乐', '数码', '智能', '简讯'];

  const FIT_FLOOR = 0.5;

  /* Compute a single uniform scale that fits ALL pages → consistent size & shadow */
  const fitAll = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const availW = stage.clientWidth;
    const availH = stage.clientHeight;
    if (availW <= 0 || availH <= 0) return;

    /* All sheets are always display:flex (visibility:hidden when inactive),
       so every sheet is measurable without toggling display. */
    const measurements: { sheet: HTMLDivElement; paper: HTMLElement; natH: number }[] = [];
    for (let i = 0; i < sheetCount; i++) {
      const sheet = sheetsRef.current[i];
      if (!sheet) continue;
      const paper = sheet.querySelector('.v-paper') as HTMLElement | null;
      if (!paper) continue;
      paper.style.transform = 'none';
      paper.style.height = '';            // clear previous explicit height
      paper.style.minHeight = '';
      const natH = paper.offsetHeight;
      if (natH > 0) measurements.push({ sheet, paper, natH });
    }
    if (!measurements.length) return;

    /* One scale for every page — tallest page dictates the ceiling */
    const maxNatH = Math.max(...measurements.map(m => m.natH));
    const natW = measurements[0].paper.offsetWidth || 1;
    let s: number;
    if (availW < 640) {
      s = Math.min(1, availW / natW);
    } else {
      s = Math.min(1, availH / maxNatH, availW / natW);
      if (s < FIT_FLOOR) s = FIT_FLOOR;
    }

    /* Set explicit height = availH/s and width = availW/s so that
       layout-size × scale = stage-size exactly. This prevents
       transform:scale() from causing overflow clipping. */
    const targetH = availH / s;
    const targetW = availW / s;
    measurements.forEach(({ paper }) => {
      paper.style.width = targetW + 'px';
      paper.style.height = targetH + 'px';
      paper.style.transform = `scale(${s})`;
    });

    /* Alignment is handled by CSS (.v-sheet { align-items: center })
       so we no longer touch it here to avoid post-animation DOM churn. */
  }, []);   // no cur dependency → safe to call from go()'s stale closure

  /* Lightweight: just set alignment for the given sheet.
     Scale / width / height are already correct from the initial fitAll
     and must NOT be re-measured — clearing paper.style.height causes
     the paper to briefly expand to its natural (larger) height,
     which shifts the stage and creates visible jitter. */
  const alignSheet = useCallback((sheet: HTMLDivElement | null) => {
    if (!sheet) return;
    sheet.style.alignItems = 'center';
  }, []);

  const rafRef = useRef<number | null>(null);
  const refitSoon = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      /* Clear the minHeight lock that go() sets for page-turn stability.
         This is the ONLY place we clear it — never in done() — so that
         the stage can respond to the new viewport size. */
      const stage = stageRef.current;
      if (stage) stage.style.minHeight = '';
      /* On resize / orientation change we DO need a full re-fit
         (available dimensions changed). This is safe because it runs
         outside of any page-turn animation. */
      fitAll();
    });
  }, [fitAll]);

  useLayoutEffect(() => {
    if (busyRef.current) return;          // don't touch transforms during page-turn animation
    const el = sheetsRef.current[cur];
    if (el) alignSheet(el);
  }, [cur, alignSheet]);

  useEffect(() => {
    window.addEventListener('resize', refitSoon);
    window.addEventListener('orientationchange', refitSoon);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      ro = new ResizeObserver(refitSoon);
      ro.observe(stageRef.current);
    }
    const onLoad = () => { const el = sheetsRef.current[cur]; if (el) alignSheet(el); };
    window.addEventListener('load', onLoad);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { const el = sheetsRef.current[cur]; if (el) alignSheet(el); });
    }
    return () => {
      window.removeEventListener('resize', refitSoon);
      window.removeEventListener('orientationchange', refitSoon);
      window.removeEventListener('load', onLoad);
      ro?.disconnect();
    };
  }, [refitSoon, alignSheet, cur]);

  const go = useCallback((n: number) => {
    if (busyRef.current || n === cur || n < 0 || n >= sheetCount) return;
    busyRef.current = true;
    setBusy(true);
    const dir = n > cur ? 1 : -1;

    const stage = stageRef.current!;
    stage.style.minHeight = stage.offsetHeight + 'px';   // prevent layout shift during animation

    /* Clear inline transforms that done() sets to keep sheets on the
       compositor layer. Must happen BEFORE setting animation classes,
       otherwise the inline style would block the CSS animation. */
    const oldSheet = sheetsRef.current[cur];
    if (oldSheet) oldSheet.style.transform = '';
    const newSheet = sheetsRef.current[n];
    if (newSheet) newSheet.style.transform = '';

    /* Use React state for animation classes — NOT classList (React re-render would wipe them) */
    setAnimOut(cur);
    setAnimIn(n);
    setAnimDir(dir);
    setCur(n);

    function done() {
      /* NOTE: we intentionally do NOT clear stage.style.minHeight here.
         The minHeight lock is cleared only in refitSoon() on real resizes.
         This avoids a DOM mutation at the exact moment the animation ends,
         which was causing a subtle upward jump.

         Set translateZ(0) on the incoming sheet to keep it on its own
         compositor layer. Without this, removing the animation class
         switches the sheet from a 3D-composited render path back to
         the normal paint path, causing a sub-pixel shift at the top edge. */
      const incomingSheet = sheetsRef.current[n];
      if (incomingSheet) incomingSheet.style.transform = 'translateZ(0)';

      setAnimOut(-1);
      setAnimIn(-1);
      busyRef.current = false;
      setBusy(false);
    }

    /* Listen on the outgoing sheet's DOM node for animationend */
    const oldEl = sheetsRef.current[cur];
    if (oldEl) {
      let handled = false;
      oldEl.addEventListener('animationend', function h() { if (handled) return; handled = true; oldEl.removeEventListener('animationend', h); done(); });
      setTimeout(() => { if (!handled) { handled = true; done(); } }, 700);
    } else {
      done();
    }
  }, [cur, fitAll]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.body.className !== 'vintage') return;
      if (e.key === 'ArrowLeft') go(cur - 1);
      else if (e.key === 'ArrowRight') go(cur + 1);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cur, go]);

  /* Helper: compute className for a sheet based on React state */
  function sheetClass(i: number): string {
    const cls = ['v-sheet'];
    if (i === cur || i === animIn) cls.push('active');
    if (i === animOut) {
      cls.push('v-leaf');
      cls.push(animDir > 0 ? 'turn-out-next' : 'turn-out-prev');
    }
    if (i === animIn && animIn !== -1) {
      cls.push(animDir > 0 ? 'turn-in-next' : 'turn-in-prev');
    }
    return cls.join(' ');
  }

  const setRef = (idx: number) => (el: HTMLDivElement | null) => {
    if (el) sheetsRef.current[idx] = el;
  };

  return (
    <div className="vintage-page">
      <SVGSprites />
      <div className="v-stage" ref={stageRef}>

        {/* PAGE 1 · FRONT */}
        <section
          className={sheetClass(0)}
          data-name="头版"
          data-en="Front Page"
          ref={setRef(0)}
        >
          <div className="v-paper">
            <div className="v-topbar">
              <div className="v-topbar-left"><span>☀ Weather Edition</span><span>FINAL EDITION</span></div>
              <div className="v-topbar-right"><span>LATE CITY EDITION</span><span>{dateStr}</span></div>
            </div>
            <div className="v-masthead-rule"></div>
            <header className="v-masthead">
              <div className="v-masthead-ornament">✦ ✦ ✦</div>
              <h1 className="v-masthead-title">The Daily Scoop</h1>
              <p className="v-masthead-tagline">热点日报 · All the Hot News That's Fit to Print</p>
            </header>
            <div className="v-info-bar">
              <span>VOL. MMXXVI · NO. {issueNo}</span>
              <span className="v-date-center">{dateStr}</span>
              <span>PRICE: FREE · LATE EDITION</span>
            </div>
            <div className="v-banner"><div className="v-banner-inner"><span className="v-banner-text">Extra Extra — All the Trending News</span></div></div>
            <div className="v-banner-rule"></div>
            <div className="v-lead-grid">
              <div className="v-lead-main">
                {data.entertainment[0] && <FrontLead item={data.entertainment[0]} />}
              </div>
              <aside className="v-lead-side">
                <div className="v-box">
                  <div className="v-box-title">In This Issue · 本版要目</div>
                  <ul className="v-index">
                    <SectionIndex onGoto={(p) => go(p)} />
                  </ul>
                </div>
                <div className="v-box">
                  <div className="v-box-title">Almanac · 今日一览</div>
                  <div className="v-almanac">
                    <svg viewBox="0 0 120 24" style={{ width: '100%', height: 'auto', color: '#8a7a66' }}><use href="#ic-fleuron" /></svg>
                    <div><b>日期</b> {dateStr}</div>
                    <div><b>期号</b> 第 {issueNo} 号</div>
                    <div><b>生成</b> {generatedAt}</div>
                    <div><b>来源</b> 公开热榜 API</div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* PAGE 2 · ENTERTAINMENT */}
        <section
          className={sheetClass(1)}
          data-name="娱乐"
          data-en="Entertainment"
          ref={setRef(1)}
        >
          <div className="v-paper">
            <div className="v-runhead">
              <span className="v-runhead-name">The Daily Scoop</span>
              <span className="v-runhead-page">PAGE TWO · ENTERTAINMENT</span>
              <span>{dateStr}</span>
            </div>
            <div className="v-pagebody"><div className="v-fit">
              <SectionPage items={data.entertainment} icon="ic-masks" kicker="娱乐热点 · Entertainment & Show Business" dekSeed={1} />
            </div></div>
            <div className="v-footer"><div className="v-footer-ornament">— ✦ —</div><p>ENTERTAINMENT · 娱乐热点</p></div>
          </div>
        </section>

        {/* PAGE 3 · DIGITAL */}
        <section
          className={sheetClass(2)}
          data-name="数码"
          data-en="Digital &amp; Tech"
          ref={setRef(2)}
        >
          <div className="v-paper">
            <div className="v-runhead">
              <span className="v-runhead-name">The Daily Scoop</span>
              <span className="v-runhead-page">PAGE THREE · DIGITAL &amp; TECH</span>
              <span>{dateStr}</span>
            </div>
            <div className="v-pagebody"><div className="v-fit">
              <SectionPage items={data.digital} icon="ic-gear" kicker="数码前沿 · Digital & Tech" dekSeed={4} />
            </div></div>
            <div className="v-footer"><div className="v-footer-ornament">— ✦ —</div><p>DIGITAL · 数码前沿</p></div>
          </div>
        </section>

        {/* PAGE 4 · INTELLIGENCE */}
        <section
          className={sheetClass(3)}
          data-name="智能"
          data-en="Intelligence"
          ref={setRef(3)}
        >
          <div className="v-paper">
            <div className="v-runhead">
              <span className="v-runhead-name">The Daily Scoop</span>
              <span className="v-runhead-page">PAGE FOUR · INTELLIGENCE</span>
              <span>{dateStr}</span>
            </div>
            <div className="v-pagebody"><div className="v-fit">
              <SectionPage items={data.ai} icon="ic-brain" kicker="智能时代 · Artificial Intelligence" dekSeed={7} />
            </div></div>
            <div className="v-footer"><div className="v-footer-ornament">— ✦ —</div><p>INTELLIGENCE · 智能时代</p></div>
          </div>
        </section>

        {/* PAGE 5 · BRIEFS */}
        <section
          className={sheetClass(4)}
          data-name="简讯"
          data-en="Briefs"
          ref={setRef(4)}
        >
          <div className="v-paper">
            <div className="v-runhead">
              <span className="v-runhead-name">The Daily Scoop</span>
              <span className="v-runhead-page">PAGE FIVE · CITY IN BRIEF</span>
              <span>{dateStr}</span>
            </div>
            <div className="v-pagebody"><div className="v-fit">
              <div className="v-sechead">
                <div className="v-kicker">City in Brief · 一日要闻速览</div>
                <h2 className="v-sechead-title">今日全部热点 · 一览无余</h2>
                <div className="v-sechead-dek">以下为本日报今日收录的全部榜单要闻，供读者快速浏览。</div>
              </div>
              <BriefPage ent={data.entertainment} dig={data.digital} ai={data.ai} />
            </div></div>
            <div className="v-footer">
              <div className="v-footer-ornament">— ✦ —</div>
              <p>THE DAILY SCOOP · 热点日报 · Est. 2026</p>
              <p style={{ marginTop: 4 }}>今日热点由 API 自动获取 · 数据来源于公开接口 · 生成于 {generatedAt}</p>
            </div>
          </div>
        </section>

      </div>

      {/* page-turn navigation */}
      <nav className="v-pager" aria-label="报纸版面导航">
        <button className="nav" disabled={cur === 0 || busy} onClick={() => go(cur - 1)} aria-label="上一页">‹</button>
        <div className="v-pager-label">
          <span className="v-pager-name">{sheetNames[cur]}</span>
          <span className="v-pager-count">第 {cur + 1} 版 / 共 {sheetCount} 版</span>
        </div>
        <div className="v-dots">
          {sheetNames.map((_, i) => (
            <button key={i} className={i === cur ? 'active' : ''} onClick={() => go(i)} aria-label={`第${i + 1}版`} />
          ))}
        </div>
        <button className="nav" disabled={cur === sheetCount - 1 || busy} onClick={() => go(cur + 1)} aria-label="下一页">›</button>
      </nav>
    </div>
  );
}
