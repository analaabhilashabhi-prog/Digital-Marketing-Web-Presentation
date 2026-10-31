// The t@g opening slide, after the "Get your inbox back" poster:
// the pile of scattered requests on the left, two pipes into the t@g cube in the
// middle, and one calm card on the right with three points about the portal.
// It plays once, by itself, as the slide opens; Next while it plays shows the
// rest at once, and after that moves on.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t * t * (3 - 2 * t);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const accent = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');

const DURATION = 4.6;   // seconds for the whole entrance
const SKIP = 5;         // how much faster Next plays the rest

// Where things sit (1920×1080)
const CUBE = { x: 960, y: 640, size: 200 };
const PIPE_A = `M 520 430 C 760 430, 770 ${CUBE.y}, ${CUBE.x} ${CUBE.y}`;
const PIPE_B = `M 520 900 C 760 900, 770 ${CUBE.y}, ${CUBE.x} ${CUBE.y}`;
const PIPE_OUT = `M ${CUBE.x} ${CUBE.y} L 1268 ${CUBE.y}`;

// The scattered requests, as they used to arrive
const ASKS = [
  ['Placement poster', 'Need it by tomorrow, 9 AM please!'],
  ['Missed call (3)', 'Coordinator, about the fest banner'],
  ['Was it posted?', 'Can someone check the Insta page?'],
  ['Re: Re: Fest banner', 'Changes again, see the voice note'],
  ['Who has the hackathon post?', 'Asked twice already'],
  ['Monthly report', 'Screenshots by tonight?'],
  ['Fwd: logo_final_v3.png', 'Use this one, not the old one'],
  ['Corridor request', 'A quick standee for Monday?'],
  ['Approve this?', 'Sir said OK on the call'],
  ['LED screen content', 'For the assembly, 8 AM'],
  ['Caption for LinkedIn?', 'Same as Instagram is fine?'],
  ['Certificate design', '120 names, by Friday'],
  ['Urgent!!', 'Event moved to tomorrow'],
  ['Invitation card', 'Chief guest name changed'],
];
const TIMES = ['11:42 PM', '9:05 AM', '6:18 PM', '1:38 PM', '10:21 AM', '8:55 PM', '12:10 PM', '4:02 PM', '7:47 PM', '11:15 PM', '3:33 PM', '2:14 PM', '6:02 AM', '5:26 PM'];

// Two stacked columns, each card showing its top lines, the lowest running off the edge
const ROWS = 13, STEP = 54;
const PILE = Array.from({ length: ROWS * 2 }, (_, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const wob = Math.sin(i * 2.3) * 10;
  return {
    ask: ASKS[(i * 5) % ASKS.length], time: TIMES[(i * 3) % TIMES.length],
    x: (col ? 236 : 14) + wob, y: 316 + row * STEP + col * 27,
    r: Math.sin(i * 1.7) * 2.2, z: row * 2 + col,
  };
});

export function mountTagHero(root, n, onScene = () => {}) {
  const h = n.hero || {};
  const points = (n.points || []).slice(0, 3);

  root.innerHTML = `
    <div class="tag-hero">
      <div class="th-head">
        <h1 class="th-in">${accent(h.title || 'Get your *workflow* back.')}</h1>
        ${h.text ? `<p class="th-in">${esc(h.text)}</p>` : ''}
      </div>

      <svg class="th-pipes" viewBox="0 0 1920 1080" aria-hidden="true">
        ${[PIPE_A, PIPE_B, PIPE_OUT].map(d => `
          <g class="th-pipe">
            <path class="th-pipe__shade" d="${d}"/>
            <path class="th-pipe__body" d="${d}"/>
            <path class="th-pipe__shine" d="${d}"/>
            <path class="th-pipe__flow" d="${d}"/>
          </g>`).join('')}
        <path class="th-arrow" d="M 1262 ${CUBE.y - 24} L 1296 ${CUBE.y} L 1262 ${CUBE.y + 24} Z"/>
      </svg>

      <div class="th-pile">${PILE.map(c => `
        <div class="th-ask" style="z-index:${c.z}"><div class="th-ask__in" style="transform:rotate(${c.r.toFixed(2)}deg)">
          <span class="th-ask__body"><b>${esc(c.ask[0])}</b><i>${esc(c.ask[1])}</i></span>
          <span class="th-ask__side"><small>${c.time}</small><s></s></span>
        </div></div>`).join('')}
      </div>

      <div class="th-cube">
        <div class="th-cube__glass">${n.logo ? `<img src="${esc(n.logo)}" alt="t@g">` : '<strong>t@g</strong>'}</div>
        ${h.tagline ? `<div class="th-cube__line">${esc(h.tagline)}</div>` : ''}
      </div>

      <div class="th-card">
        <div class="th-card__head">${esc(h.card || 'Today')}</div>
        ${points.map((pt, i) => `
          <div class="th-card__row">
            <b>${String(i + 1).padStart(2, '0')}</b>
            <span><strong>${esc(pt.title)}</strong>${pt.text ? `<i>${esc(pt.text)}</i>` : ''}</span>
          </div>`).join('')}
        <div class="th-card__foot"><span class="th-tick"><svg viewBox="0 0 24 24"><path d="M6 12.5 L10.5 17 L18 8"/></svg></span></div>
      </div>

      <div class="th-strip"><span>${esc(h.strip || 'Digital Pulse of NGI')}</span></div>
    </div>`;

  const el = root.firstElementChild;
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const heads = $$('.th-in'), asks = $$('.th-ask'), pipes = $$('.th-pipe');
  const arrow = $('.th-arrow'), cube = $('.th-cube'), card = $('.th-card');
  const rows = $$('.th-card__row'), tick = $('.th-tick'), strip = $('.th-strip span');
  el.querySelectorAll('img').forEach(img => img.decode?.().catch(() => {}));

  const lens = pipes.map(g => g.querySelector('.th-pipe__body').getTotalLength());
  pipes.forEach((g, i) => g.querySelectorAll('path:not(.th-pipe__flow)').forEach(p => { p.style.strokeDasharray = `${lens[i]} ${lens[i]}`; }));

  // Every frame is drawn from p (0 → 1), the whole entrance
  function update(p) {
    heads.forEach((w, i) => {
      const k = ease(clamp((p - i * .06) / .22));
      w.style.opacity = k;
      w.style.filter = k > 0 && k < 1 ? `blur(${((1 - k) * 8).toFixed(1)}px)` : '';
      w.style.transform = `translate3d(0, ${((1 - k) * 22).toFixed(1)}px, 0)`;
    });
    // the pile rises from the bottom, lowest cards first
    PILE.forEach((c, i) => {
      const k = ease(clamp((p - .1 - (ROWS - 1 - Math.floor(i / 2)) * .012 - (i % 2) * .02) / .3));
      asks[i].style.transform = `translate3d(${c.x.toFixed(1)}px, ${(c.y + (1 - k) * 760).toFixed(1)}px, 0)`;
    });
    // the pipes draw in, then the cube, the arrow and the card
    const d = [ease(clamp((p - .46) / .2)), ease(clamp((p - .5) / .2)), ease(clamp((p - .7) / .1))];
    pipes.forEach((g, i) => {
      g.querySelectorAll('path:not(.th-pipe__flow)').forEach(path => { path.style.strokeDashoffset = lens[i] * (1 - d[i]); });
      g.classList.toggle('is-flowing', p > .9);
    });
    arrow.style.opacity = clamp((p - .78) / .04);
    const c = ease(clamp((p - .6) / .14));
    cube.style.opacity = c;
    cube.style.transform = `translate3d(0, ${((1 - c) * 24).toFixed(1)}px, 0) scale(${(.9 + .1 * c).toFixed(3)})`;
    const b = ease(clamp((p - .76) / .14));
    card.style.opacity = b;
    card.style.transform = `translate3d(${((1 - b) * 40).toFixed(1)}px, 0, 0)`;
    rows.forEach((r, i) => {
      const k = ease(clamp((p - .84 - i * .04) / .1));
      r.style.opacity = k;
      r.style.transform = `translate3d(${((1 - k) * 16).toFixed(1)}px, 0, 0)`;
    });
    tick.classList.toggle('on', p > .97);
    strip.style.opacity = ease(clamp((p - .3) / .2));
  }

  let p = 0, last = performance.now(), raf = 0, rush = 1, paused = false;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    if (!paused) p = Math.min(1, p + rush * dt / DURATION);
    update(p);
    raf = p === 1 ? 0 : requestAnimationFrame(frame);
  }
  update(0);
  raf = requestAnimationFrame(frame);

  // Space pauses the entrance where it is; Space again carries on
  const setPaused = v => { paused = v; el.classList.toggle('paused', v); };
  const onKey = e => {
    if (e.key !== ' ' || e.repeat || e.target.matches?.('input, textarea')) return;
    e.preventDefault();
    document.activeElement?.blur?.();
    setPaused(!paused);
  };
  addEventListener('keydown', onKey, true);

  const cleanup = () => { cancelAnimationFrame(raf); removeEventListener('keydown', onKey, true); };
  // Next while it plays: show the rest quickly (even from a pause); once it has played, the deck moves on
  cleanup.step = dir => {
    if (dir > 0 && p < 1) { setPaused(false); rush = SKIP; onScene(); return true; }
    return false;
  };
  return cleanup;
}
