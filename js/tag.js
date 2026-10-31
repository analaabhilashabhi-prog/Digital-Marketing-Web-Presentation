// The t@g landing slide: the journey of one request, told one step at a time.
// It all plays by itself as the slide opens, one thing after another:
//   the headline settles in; a thin line draws on from step to step and each
//   card arrives in turn (Raise, Design, Approve, Accept, Publish, each with its
//   owner); then three numbers settle in under the headline.
// Next while it plays shows the rest at once; after that Next moves on.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const OPENING = 2.2;   // seconds for the headline to settle
const SCENE = 1.25;    // seconds for each step after it
const SKIP = 6;        // how much faster Next plays the rest

// The five cards (1920×1080), zig-zagging gently down the right half
const CARD = { w: 440, h: 128 };
const SPOTS = [[880, 140], [1380, 310], [900, 480], [1380, 650], [920, 820]];

// Each step's icon, a single orange stroke
const ICON = {
  raise: '<path d="M4 10 L15 5 V19 L4 14 Z"/><path d="M15 9 A3 3 0 0 1 15 15"/><path d="M6 14.5 L7.5 20 H10 L9 15.2"/>',
  design: '<path d="M4 20 L5.5 14.5 L15.5 4.5 L19.5 8.5 L9.5 18.5 Z"/><path d="M13.5 6.5 L17.5 10.5"/>',
  approve: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M7.5 10.5 L9.8 12.8 L13.8 8.5"/><path d="M15.3 15.3 L20.5 20.5"/>',
  accept: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2 L10.8 15 L16.2 9.4"/>',
  publish: '<path d="M3.5 11 L20.5 4 L15.5 20 L11.5 13 Z"/><path d="M11.5 13 L20.5 4"/>',
  track: '<path d="M4 20 V4 M4 20 H20"/><path d="M7 16 L11 11 L14 13.5 L19.5 7"/>',
};

// A smooth line through the middle of every card (Catmull-Rom, as Béziers)
function through(pts) {
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d.push(`C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(' ');
}

export function mountTag(root, n, onScene = () => {}) {
  const steps = (n.journey || []).slice(0, SPOTS.length);
  const stats = (n.stats || []).slice(0, 3);
  const h = n.hero || {};
  const centres = steps.map((_, i) => [SPOTS[i][0] + CARD.w / 2, SPOTS[i][1] + CARD.h / 2]);
  const LAST = 1 + steps.length + (stats.length ? 1 : 0);   // the final stop

  root.innerHTML = `
    <div class="tag-land">
      <header class="tl-top">
        ${n.logo ? `<img class="tl-logo" src="${esc(n.logo)}" alt="t@g">` : '<strong class="tl-logo">t@g</strong>'}
        <span>${esc(n.tagline || 'Digital Pulse of NGI')}</span>
      </header>

      <div class="tl-hero">
        ${h.kicker ? `<div class="tl-in tl-kicker">${esc(h.kicker)}</div>` : ''}
        <h1><span class="tl-in">${esc(h.title || 'Request')}</span><span class="tl-in em">${esc(h.accent || 'Journey')}<i>.</i></span></h1>
        <p class="tl-in">${esc(h.text || '')}</p>
        <div class="tl-stats">${stats.map(s => `
          <div class="tl-stat"><b data-to="${esc(s.value)}">${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}
        </div>
      </div>

      <svg class="tl-line" viewBox="0 0 1920 1080" aria-hidden="true">
        <defs>
          <linearGradient id="tlLine" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="900">
            <stop offset="0" stop-color="#F7A27F"/><stop offset="1" stop-color="#F05D29"/>
          </linearGradient>
          <filter id="tlGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        <path class="tl-line__glow" d="${through(centres)}" filter="url(#tlGlow)"/>
        <path class="tl-line__body" d="${through(centres)}"/>
      </svg>

      <div class="tl-steps">${steps.map((s, i) => `
        <div class="tl-card" style="left:${SPOTS[i][0]}px;top:${SPOTS[i][1]}px">
          <span class="tl-card__icon"><svg viewBox="0 0 24 24">${ICON[s.icon] || ICON.raise}</svg></span>
          <span class="tl-card__body">
            <small>${String(i + 1).padStart(2, '0')} · ${esc(s.role)}</small>
            <b>${esc(s.title)}</b>
            <i>${esc(s.text)}</i>
          </span>
        </div>`).join('')}
      </div>
    </div>`;

  const el = root.firstElementChild;
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const ins = $$('.tl-hero .tl-in'), top = $('.tl-top');
  const cards = $$('.tl-card'), lines = $$('.tl-line path'), path = $('.tl-line__body');
  const statEls = $$('.tl-stat');
  el.querySelectorAll('img').forEach(img => img.decode?.().catch(() => {}));

  // How far along the line each card sits (the first at 0, the last at the end)
  const len = path.getTotalLength();
  lines.forEach(l => { l.style.strokeDasharray = `${len} ${len}`; });
  const samples = Array.from({ length: 401 }, (_, k) => path.getPointAtLength(len * k / 400));
  const cardAt = centres.map(([cx, cy]) => {
    let best = 0, d = Infinity;
    samples.forEach((pt, k) => { const e = Math.hypot(pt.x - cx, pt.y - cy); if (e < d) { d = e; best = k; } });
    return best / 400;
  });

  /* ---------- Every frame is drawn from p alone ---------- */
  // p: 0 → 1 the opening; 1 + k brings card k; LAST brings the numbers
  function update(p) {
    const q = clamp(p);
    top.style.opacity = ease(clamp((q - .1) / .5));
    ins.forEach((w, i) => settle(w, clamp((q - i * .16) / .6)));

    // the line runs from one card to the next, then the card arrives
    const s = clamp(p - 1, 0, steps.length);           // 0 … 5
    const k = Math.floor(s), f = s - k;
    const reach = k >= steps.length ? 1 : k === 0 ? 0 : lerp(cardAt[k - 1], cardAt[k], ease(clamp(f / .6)));
    lines.forEach(l => { l.style.strokeDashoffset = len * (1 - reach); });
    cards.forEach((c, i) => {
      // card i arrives in scene i + 1, once its stretch of line is drawn
      const t = ease(clamp((s - i - (i ? .45 : 0)) / (i ? .55 : 1)));
      c.style.opacity = t;
      c.style.transform = `translate3d(0, ${((1 - t) * 26).toFixed(1)}px, 0)`;
      c.classList.toggle('is-now', i === Math.round(s) - 1 && p < LAST - .5);
    });

    // the numbers, last of all
    const n3 = clamp(p - (1 + steps.length));
    statEls.forEach((st, i) => {
      const t = ease(clamp((n3 - i * .12) / .6));
      st.style.opacity = t;
      st.style.transform = `translate3d(0, ${((1 - t) * 20).toFixed(1)}px, 0)`;
      countUp(st.querySelector('b'), clamp((n3 - i * .12) / .7));
    });
  }
  function settle(w, t) {
    const k = ease(t);
    w.style.opacity = k;
    w.style.filter = k < 1 && k > 0 ? `blur(${((1 - k) * 8).toFixed(1)}px)` : '';
    w.style.transform = `translate3d(0, ${((1 - k) * 28).toFixed(1)}px, 0)`;
  }
  // "58,517" counts up from 0, keeping its commas and percent sign
  function countUp(b, t) {
    const to = b.dataset.to, m = to.match(/[\d,]+/);
    if (!m) return;
    const v = Math.round(parseInt(m[0].replace(/,/g, ''), 10) * ease(t));
    b.textContent = to.replace(m[0], m[0].includes(',') ? v.toLocaleString('en-IN') : String(v));
  }

  /* ---------- The player: glides p to the next stop, slowly ---------- */
  /* ---------- The player: plays straight through, once ---------- */
  let p = 0, last = performance.now(), raf = 0, rush = 1;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    p = Math.min(LAST, p + (p < 1 ? 1 / OPENING : 1 / SCENE) * rush * dt);
    update(p);
    raf = p === LAST ? 0 : requestAnimationFrame(frame);
  }
  update(0);
  raf = requestAnimationFrame(frame);

  // Next while it plays: show the rest quickly; once it has played, the deck moves on
  function step(dir) {
    if (dir > 0 && p < LAST) { rush = SKIP; onScene(); return true; }
    return false;
  }

  const cleanup = () => cancelAnimationFrame(raf);
  cleanup.step = step;
  return cleanup;
}
