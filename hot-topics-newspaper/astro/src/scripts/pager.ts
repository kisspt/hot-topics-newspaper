/**
 * Vintage newspaper page-turn pager.
 * Runs client-side — imported as a <script> in the page.
 * Theme switching is handled by ThemeSwitch.astro.
 */

/* ---- Vintage page-turn pager ---- */
const stage = document.getElementById('vStage');
if (stage) {
  const sheets = Array.from(stage.querySelectorAll('.v-sheet')) as HTMLElement[];
  let cur = 0;
  let busy = false;

  const prevBtn = document.getElementById('vPrev') as HTMLButtonElement;
  const nextBtn = document.getElementById('vNext') as HTMLButtonElement;
  const nameEl = document.getElementById('vPageName')!;
  const countEl = document.getElementById('vPageCount')!;
  const dotsEl = document.getElementById('vDots')!;

  // Create dot buttons
  sheets.forEach((s, i) => {
    const d = document.createElement('button');
    d.setAttribute('aria-label', `第${i + 1}版`);
    d.addEventListener('click', () => go(i));
    dotsEl.appendChild(d);
  });
  const dots = Array.from(dotsEl.children) as HTMLElement[];

  const FIT_FLOOR = 0.5;

  function fitSheet(sheet: HTMLElement | null) {
    if (!sheet) return;
    const paper = sheet.querySelector('.v-paper') as HTMLElement | null;
    if (!paper) return;
    paper.style.transform = 'none';
    const availW = stage.clientWidth;
    const availH = stage.clientHeight;
    if (availW <= 0 || availH <= 0) return;
    const natW = paper.offsetWidth;
    const natH = paper.offsetHeight;
    if (natW <= 0 || natH <= 0) return;
    let s: number;
    if (availW < 640) {
      s = Math.min(1, availW / natW);
    } else {
      s = Math.min(1, availH / natH, availW / natW);
      if (s < FIT_FLOOR) s = FIT_FLOOR;
    }
    paper.style.transform = `scale(${s})`;
    const fits = natH * s <= availH + 1;
    stage.style.overflow = fits ? 'hidden' : 'auto';
    sheet.style.alignItems = fits ? 'center' : 'flex-start';
  }

  function sync() {
    nameEl.textContent = sheets[cur].dataset.name || '';
    countEl.textContent = `第 ${cur + 1} 版 / 共 ${sheets.length} 版`;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === sheets.length - 1;
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
    fitSheet(sheets[cur]);
  }

  function go(n: number) {
    if (busy || n === cur || n < 0 || n >= sheets.length) return;
    busy = true;
    const dir = n > cur ? 1 : -1;
    const oldEl = sheets[cur];
    const newEl = sheets[n];
    stage.style.minHeight = stage.offsetHeight + 'px';
    oldEl.classList.remove('active');
    oldEl.classList.add('v-leaf', dir > 0 ? 'turn-out-next' : 'turn-out-prev');
    newEl.classList.add('active', dir > 0 ? 'turn-in-next' : 'turn-in-prev');
    cur = n;
    sync();

    function done() {
      oldEl.classList.remove('v-leaf', 'turn-out-next', 'turn-out-prev');
      newEl.classList.remove('turn-in-next', 'turn-in-prev');
      stage.style.minHeight = '';
      busy = false;
    }

    let handled = false;
    oldEl.addEventListener('animationend', () => {
      if (handled) return;
      handled = true;
      done();
    });
    setTimeout(() => {
      if (!handled) {
        handled = true;
        done();
      }
    }, 700);
  }

  prevBtn.addEventListener('click', () => go(cur - 1));
  nextBtn.addEventListener('click', () => go(cur + 1));

  document.addEventListener('keydown', (e) => {
    if (document.body.className !== 'vintage') return;
    if (e.key === 'ArrowLeft') go(cur - 1);
    else if (e.key === 'ArrowRight') go(cur + 1);
  });

  // Index items jump to their edition page
  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => {
      const p = parseInt(el.getAttribute('data-goto')!, 10);
      if (!isNaN(p)) {
        go(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  let raf: number | null = null;
  function refitSoon() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      fitSheet(sheets[cur]);
    });
  }

  window.addEventListener('resize', refitSoon);
  window.addEventListener('orientationchange', refitSoon);

  if (typeof ResizeObserver !== 'undefined') {
    try {
      new ResizeObserver(refitSoon).observe(stage);
    } catch (_) {}
  }

  window.addEventListener('load', () => fitSheet(sheets[cur]));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitSheet(sheets[cur]));
  }

  sync();
}
