// The Showcase slide looks like a website but plays like a film: nothing scrolls.
//   1 · hero: one poster rises from the bottom, the rest stack behind it, the stack fans out
//   2 · Next: the hero glides away, the row folds back into a stack, the second headline
//       blurs in word by word and the stack cascades down to the right
//   3 · Next: the page glides up to "Trusted by the best." and our logos drift past, endlessly
//   4 · Next: the page glides up, posters fade in as a cascade, then settle into a grid inside
//       an app-like frame while social media icons drop in and "Our vision" blurs in
//   5 · Next: the page glides up, two rows of poster tiles flow in from below and drift past
//       endlessly along a wave, while a line about our work blurs in between them
//   6 · Next: the page glides up to "Every post we make tells a story": the headline blurs in and
//       the first row of story cards rises; Next again lifts the page to the second row
//   7 · Next: the page glides on to "A closer look at our craft" and its carousel blurs in, card by card
//   8 · Next: the page glides up to the footer, the bridge scene from the Home slide
// Each Next plays the scene on its own; once the footer is showing, Next moves to the next slide.
// Posters come from the slide's folder; deck.json's "featured" picks which ones and in what order.

import { mountHome } from './home.js';
import { brand, isBrand } from './brands.js';

const H = 1080;                // one screen, in canvas units
// The whole film runs along one number, p. Each stretch of p has its own length in seconds.
const SEGMENTS = [
  [0, 1.8, 3.6],     // hero → second section
  [1.8, 2.8, 1.25],  // glide up to "Trusted by the best."
  [2.8, 3.8, 1.25],  // glide up to the vision screen, posters fading in
  [3.8, 4.8, 4.0],   // cascade → grid, icons pour into the jar, tabs, headline
  [4.8, 5.8, 1.25],  // glide up to the wave screen, tiles flowing in
  [5.8, 6.8, 2.0],   // the line about our work blurs in
  [6.8, 7.8, 1.25],  // glide up to the story
  [7.8, 8.6, 1.8],   // story headline and first row of cards
  [8.6, 9.6, 1.4],   // lift the page to the second row
  [9.6, 10.6, 1.25], // glide on to "A closer look"
  [10.6, 11.4, 1.8], // its headline and carousel
  [11.4, 12.4, 1.25],// glide up to the footer
];
const STOPS = [0, 1.8, 2.8, 4.8, 6.8, 8.6, 9.6, 11.4, 12.4];
const STORY_H = 1640;                  // the story screen is taller than one screen: it shows in two steps
// Where the whole page moves up, and by how much: one screen, or the extra part of the story
const GLIDES = [[1.8, H], [2.8, H], [4.8, H], [6.8, H], [8.6, STORY_H - H], [9.6, H], [11.4, H]];
const FOOTER_AT = 11.4;
// The story's parts play on by themselves: after landing on one of these stops (going forward),
// hold for a moment, then carry on to the next stop without a click
const AUTO_FROM = [8.6, 9.6];
const AUTO_HOLD = 2600;   // ms to rest on each part before moving on
const WAVE_ON = [4.85, 7.85];          // the wave only runs while its screen can be seen
const speedAt = (p, dir) => {
  const s = SEGMENTS.find(([a, b]) => dir > 0 ? p >= a && p < b : p > a && p <= b) || SEGMENTS[0];
  return (s[1] - s[0]) / s[2];
};
const GAP = 232;               // centre-to-centre distance in the hero row
const TILT = [-5, 3, -2, 1, 2, -3, 5];   // a little hand-placed rotation per card in the row
const SLANT = [-3, 2, -1, 1, -2, 2, 0];  // and in the cascade
const CARD_Y = 607;            // card centre on the canvas (stage top 380 + card top 40 + half of 375)

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = t => Math.min(1, Math.max(0, t));
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] + (b[k] - a[k]) * t]));

/* ---------- Where a card sits, as numbers, so scroll can blend between layouts ---------- */
// Each card carries its own perspective, so they layer by z-index instead of cutting through each other
const tf = p => `perspective(1600px) translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${p.ry}deg) rotate(${p.r}deg) scale(${p.s})`;

// The hero row: the outer cards turn in, like the inside of a curve
function fanP(i, n) {
  const k = i - (n - 1) / 2;
  return { x: k * GAP, y: Math.abs(k) * 10, z: -Math.abs(k) * 40, ry: k * 9, r: TILT[i % TILT.length], s: 1 };
}
// A stack with the lead poster on top; dx/dy move the whole stack
function stackP(i, lead, dx, dy, s) {
  const d = lead - i;
  return { x: dx - d * 7, y: dy + d * 2, z: d ? -d * 12 : 40, ry: 0, r: -3 - d * 2.2, s };
}
// The second section: a cascade stepping down to the right, the lead poster last
function cascadeP(i) {
  return { x: 1080 + i * 118 - 960, y: 420 + i * 58 - CARD_Y, z: 0, ry: 0, r: SLANT[i % SLANT.length], s: .8 + i * .035 };
}

/* ---------- 4 · The vision screen: cascade → grid ---------- */
const CELL_W = 236, CELL_H = 295;
// Arriving: a cascade stepping down to the right, the info card first
const visionCascade = j => ({ x: 640 + j * 165, y: 250 + j * 62, o: 1 });
// Settled: a 3 × 2 grid inside the frame on the right; the info card slides away to the left
const visionGrid = j => j === 0
  ? { x: 420, y: 250, o: 0 }
  : { x: 1084 + ((j - 1) % 3) * (CELL_W + 22), y: 384 + Math.floor((j - 1) / 3) * (CELL_H + 22), o: 1 };
// line icons for the rest; the networks are drawn with their own logos (js/brands.js)
const ICONS = {
  pen: '<path d="M12 3 L18 10 L15 18.5 H9 L6 10 Z"/><path d="M12 3 V11"/><circle cx="12" cy="12.4" r="1.4"/><path d="M9 21 H15"/>',
  megaphone: '<path d="M4 10 V14 H7 L15 18 V6 L7 10 Z"/><path d="M18.2 9.4 C19.6 10.7 19.6 13.3 18.2 14.6"/><path d="M7.5 14 L9 19.5 H11"/>',
  chart: '<path d="M4 20 H20"/><path d="M7 16.5 V12 M12 16.5 V7 M17 16.5 V10"/>',
  hashtag: '<path d="M9.5 4 L7.5 20 M16.5 4 L14.5 20 M4.5 9 H20 M4 15 H19.5"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7 L10 4.5 H14 L15.5 7"/>',
  heart: '<path d="M12 20 C4.5 14.8 3 10.4 5 7.4 C6.8 4.8 10.4 5.2 12 8 C13.6 5.2 17.2 4.8 19 7.4 C21 10.4 19.5 14.8 12 20 Z"/>',
};
const ICON_ORDER = ['instagram', 'pen', 'facebook', 'chart', 'linkedin', 'hashtag', 'youtube', 'camera', 'megaphone', 'heart'];
// The icons pour from one spot and pile up in an invisible jar at the bottom left.
// A small physics simulation (gravity, bounces, icons knocking into each other; no spinning)
// runs once when the slide opens; the scene then plays it back frame by frame, so it is
// always exactly as smooth and plays just as well in reverse.
const JAR = { left: 110, right: 650, floor: 1010, dropX: 360, dropY: -80 };
const ICON_R = 44, ICON_GAP = 11;     // drawn radius, and the breathing room kept around each icon
const SIM = { seconds: 3, hz: 120, every: .13 };

function pourIcons(count) {
  const R = ICON_R + ICON_GAP, G = 2600, BOUNCE = .32, DT = 1 / 240;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bodies = Array.from({ length: count }, (_, i) => ({
    x: JAR.dropX + (rnd() - .5) * 50, y: JAR.dropY, vx: (rnd() - .5) * 220, vy: 0,
    start: i * SIM.every, on: false,
  }));
  const frames = [];
  const steps = SIM.seconds / DT, record = 240 / SIM.hz;
  for (let n = 0, t = 0; n <= steps; n++, t += DT) {
    for (const b of bodies) {
      if (!b.on) { if (t < b.start) continue; b.on = true; }
      b.vy += G * DT;
      b.x += b.vx * DT; b.y += b.vy * DT;
    }
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
        const A = bodies[i], B = bodies[j];
        if (!A.on || !B.on) continue;
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01;
        if (d >= 2 * R) continue;
        const nx = dx / d, ny = dy / d, push = (2 * R - d) / 2;
        A.x -= nx * push; A.y -= ny * push; B.x += nx * push; B.y += ny * push;
        const vn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (vn < 0) {
          const imp = -(1 + BOUNCE) * vn / 2;
          A.vx -= imp * nx; A.vy -= imp * ny; B.vx += imp * nx; B.vy += imp * ny;
          // a little friction as they slide past each other
          const vt = (B.vx - A.vx) * -ny + (B.vy - A.vy) * nx;
          A.vx += -ny * vt * .05; A.vy += nx * vt * .05; B.vx -= -ny * vt * .05; B.vy -= nx * vt * .05;
        }
      }
      for (const b of bodies) {
        if (!b.on) continue;
        if (b.y > JAR.floor - R) {
          b.y = JAR.floor - R;
          if (b.vy > 0) b.vy = -b.vy * BOUNCE;
          b.vx *= .97;
        }
        if (b.x < JAR.left + R) { b.x = JAR.left + R; b.vx = Math.abs(b.vx) * BOUNCE; }
        if (b.x > JAR.right - R) { b.x = JAR.right - R; b.vx = -Math.abs(b.vx) * BOUNCE; }
      }
    }
    // settle gently towards the end, so the pile comes to rest instead of jittering
    if (t > SIM.seconds - .8) bodies.forEach(b => { b.vx *= .985; b.vy *= .985; });
    if (n % record === 0) frames.push(bodies.map(b => [b.x, b.y, b.on ? 1 : 0]));
  }
  return frames;
}

/* ---------- 5 · The wave: tiles drifting along two curved paths ---------- */
const TILE = 132, TILE_STEP = 154, PER_ROW = 14;
const LOOP = PER_ROW * TILE_STEP;     // wider than the screen, so a tile re-enters only once it is out of sight
// The top row arches up in the middle and the bottom row dips down, framing the text like a lens.
// A slow ripple travels along both, so the rows feel like a wave rather than a rail.
const ROWS = [
  { base: 236, bend: -64, speed: -40, ripple: 0 },
  { base: 852, bend: 64, speed: 34, ripple: Math.PI },
];
const waveY = (row, x, t) =>
  row.base + row.bend * Math.cos(2 * Math.PI * (x - 960) / 2600) + 16 * Math.sin(2 * Math.PI * x / 720 + t * .9 + row.ripple);

/* ---------- 6 & 7 · The story, and a closer look ---------- */
// Out of a blur, rising a little: t runs 0 → 1
function blurIn(el, t, dx = 0, dy = 18, blur = 12) {
  el.style.opacity = t;
  el.style.filter = t < 1 ? `blur(${(1 - t) * blur}px)` : '';
  el.style.transform = `translate3d(${(1 - t) * dx}px, ${(1 - t) * dy}px, 0)`;
}
const CLOSER_CARD = 242, CLOSER_GAP = 32, CLOSER_SHOWN = 4;

/* ---------- Text ---------- */
// "Every post, a|masterpiece." → lines of words; "*& inspire*" marks words for the accent colour
function words(text, cls = '') {
  let accent = false, i = 0;
  return text.split('|').map(line => `<span class="line">${line.trim().split(/\s+/).map(w => {
    if (w.startsWith('*')) { accent = true; w = w.slice(1); }
    const on = accent;
    if (w.endsWith('*')) { accent = false; w = w.slice(0, -1); }
    return `<span class="word${on ? ' accent' : ''}${cls}" style="--d:${0.25 + i++ * 0.16}s">${esc(w)}</span>`;
  }).join(' ')}</span>`).join('');
}
const actions = n => `
  ${n.link ? `<a class="sc-btn dark" href="#/${esc(n.link)}">${esc(n.linkText || 'See all designs')}</a>` : ''}
  ${n.more ? `<a class="sc-btn" href="#/${esc(n.more)}">${esc(n.moreText || 'Read more')}</a>` : ''}`;

// Every picture on the page is dealt from all the brands in turn (NGI, Aditya,
// Torii, Technical Hub), at random within each, so each one is always on show;
// moving on to another scene fades every picture out and a fresh deal in.
const BRAND_NAME = { NGI: 'NGI', Aditya: 'Aditya University', Torii: 'Torii Minds', TH: 'Technical Hub' };
const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const brandOf = it => (it.key || '').split('/')[0];

export function mountShowcase(root, n, items, open, onScene = () => {}) {
  // A design is named by its file name, or as "Brand/file name" when it comes from another brand's folder
  const byName = name => items.find(it => it.key === name || it.name === name);
  const pools = {};
  items.forEach(it => { (pools[brandOf(it)] ||= []).push(it); });
  const brands = Object.keys(pools);
  // k pictures, one from each brand in turn (a fresh order every round), none repeated in one deal
  function deal(k) {
    const decks = Object.fromEntries(brands.map(b => [b, shuffle(pools[b])]));
    const out = [];
    while (out.length < k && brands.some(b => decks[b].length)) {
      for (const b of shuffle(brands)) { if (out.length < k && decks[b].length) out.push(decks[b].pop()); }
    }
    while (out.length < k && items.length) out.push(items[out.length % items.length]);
    return out;
  }
  const cards = deal(7);
  const lead = cards.length - 1;   // the poster that rises first ends up on the right, as in the reference
  const two = n.scene2 || {};
  const three = n.scene3 || {};
  const four = n.scene4 || {};
  const five = n.scene5 || {};
  const six = n.scene6 || {}, closerData = six.closer || {};
  const img = (name, cls = '') => { const it = byName(name); return it ? `<img class="${cls}" src="${esc(it.url)}" alt="" draggable="false">` : ''; };
  const [c1, c2, c3, c4] = (six.cards || []).map(c => c && { ...c });
  { const d = deal(6); if (c1) c1.images = d.slice(0, 3).map(it => it.key); [c2, c3, c4].forEach((c, i) => { if (c) c.image = d[3 + i].key; }); }
  const link = (c, cls) => c?.button ? `<a class="${cls}" href="#/${esc(c.link || '')}">${esc(c.button)}</a>` : '';
  // the closer look: one card a picture, captioned with the brand it was made for
  const closerItems = deal((closerData.items || []).length || 7).map(it => ({ title: BRAND_NAME[brandOf(it)] || brandOf(it), image: it.key }));
  const waveItems = deal(PER_ROW * 2);
  const visionPosters = deal(6);
  // The logo row is drawn twice back to back, so sliding it by exactly one copy loops without a seam
  const logoSet = (three.logos || []).map(l =>
    `<span class="sc-brand"><img src="${esc(l.src)}" alt="${esc(l.name)}" title="${esc(l.name)}" draggable="false"${l.height ? ` style="height:${+l.height}px"` : ''}></span>`).join('');

  root.innerHTML = `
  <div class="showcase locked">
      <div class="sc-pin">
        <div class="sc-hero">
          <div class="sc-top">
            ${n.logo ? `<img class="sc-logo" src="${esc(n.logo)}" alt="">` : ''}
            ${n.logo2 ? `<img class="sc-logo sc-logo2" src="${esc(n.logo2)}" alt="">` : ''}
            <span class="sc-kicker">${esc(n.kicker || '')}</span>
          </div>
          <h1 class="sc-head">${words(n.heading || n.title)}</h1>
          <p class="sc-text">${esc(n.text || '')}</p>
          <div class="sc-actions">${actions(n)}</div>
        </div>

        <div class="sc-two">
          <span class="sc-kicker2 sc-in">${esc(two.kicker || '')}</span>
          <h2 class="sc-head2">${words(two.heading || '', ' sc-in')}</h2>
          <p class="sc-text2 sc-in">${esc(two.text || '')}</p>
          <div class="sc-actions2 sc-in">${actions(two)}</div>
        </div>

        <div class="sc-stage">
          ${cards.map((it, i) => `
            <a class="sc-card" data-i="${i}">
              <span class="sc-face"><img src="${esc(it.url)}" alt="" draggable="false"></span>
            </a>`).join('')}
        </div>
        <div class="sc-tags hero">${(n.tags || []).map((t, i) => `<span class="sc-tag t${i}">${esc(t)}</span>`).join('')}</div>
        <div class="sc-tags two">${(two.tags || []).map((t, i) => `<span class="sc-tag t${i}">${esc(t)}</span>`).join('')}</div>

      </div>
    <section class="sc-trust">
      <h2 class="sc-head3">${words(three.heading || '')}</h2>
      <p class="sc-text3">${esc(three.text || '')}</p>
      <div class="sc-marquee"><div class="sc-marquee-track">
        <div class="sc-marquee-set">${logoSet}</div><div class="sc-marquee-set" aria-hidden="true">${logoSet}</div>
      </div></div>
    </section>
    <section class="sc-vision">
      <span class="sc-eye v-in"><svg viewBox="0 0 24 24"><path d="M2.5 12 C5 7.5 8.3 5.5 12 5.5 C15.7 5.5 19 7.5 21.5 12 C19 16.5 15.7 18.5 12 18.5 C8.3 18.5 5 16.5 2.5 12 Z"/><circle cx="12" cy="12" r="3"/></svg></span>
      <h2 class="sc-head4">${words(four.heading || '', ' v-in')}</h2>
      <p class="sc-text4 v-in">${esc(four.text || '')}</p>

      <div class="v-tab back"><span>${esc((four.tabs || [])[0] || '')}</span><b>${esc(four.button || '')}</b></div>
      <div class="v-tab front"><span>${esc((four.tabs || [])[1] || '')}</span></div>

      <div class="v-card info">
        <span class="v-info-mark"></span>
        <strong>${esc(four.card?.title || '')}</strong>
        <small>${esc(four.card?.kicker || '')}</small>
        <p>${esc(four.card?.text || '')}</p>
      </div>
      ${visionPosters.map((it, i) => `<a class="v-card" data-v="${i}"><img src="${esc(it.url)}" alt="" draggable="false"></a>`).join('')}

      ${ICON_ORDER.map(k => `<span class="v-icon" title="${k}">${isBrand(k) ? brand(k) : `<svg viewBox="0 0 24 24">${ICONS[k]}</svg>`}</span>`).join('')}
    </section>
    <section class="sc-wave">
      ${waveItems.map((it, i) => `<a class="w-tile" data-w="${i}"><img src="${esc(it.url)}" alt="" draggable="false"></a>`).join('')}
      <span class="w-mark w-in"><svg viewBox="0 0 24 24"><path d="M12 3 L13.8 9.2 L20 11 L13.8 12.8 L12 19 L10.2 12.8 L4 11 L10.2 9.2 Z"/></svg></span>
      <h2 class="sc-head5">${words(five.heading || '', ' w-in')}</h2>
      <p class="sc-text5 w-in">${esc(five.text || '')}</p>
    </section>
    <section class="sc-story" style="height:${STORY_H}px">
      <span class="st-kicker s-in">${words(six.kicker || '')}</span>
      <h2 class="st-head">${words(six.heading || '', ' s-in')}</h2>

      <article class="st-card light c1">
        <span class="st-chip"><svg viewBox="0 0 24 24"><path d="M8 5 L19 12 L8 19 Z"/></svg>${esc(c1?.chip || '')}</span>
        <div class="st-stack">${(c1?.images || []).slice(0, 3).map((name, i) => `<span class="st-mini m${i}">${img(name)}</span>`).join('')}</div>
        ${c1?.tag ? `<span class="st-tag">${esc(c1.tag)}</span>` : ''}
        <div class="st-copy"><h3>${esc(c1?.title || '')}</h3><p>${esc(c1?.text || '')}</p>${link(c1, 'st-btn')}</div>
      </article>
      <article class="st-card photo c2">
        <div class="st-photo">${img(c2?.image)}</div>
        <div class="st-copy"><h3>${esc(c2?.title || '')}</h3><p>${esc(c2?.text || '')}</p>${link(c2, 'st-link')}</div>
      </article>
      <article class="st-card photo c3">
        <div class="st-photo">${img(c3?.image)}</div>
        <div class="st-copy"><h3>${esc(c3?.title || '')}</h3><p>${esc(c3?.text || '')}</p>${link(c3, 'st-link')}</div>
      </article>
      <article class="st-card light c4">
        <span class="st-round"><svg viewBox="0 0 24 24"><path d="M12 3 L18 10 L15 18.5 H9 L6 10 Z"/><path d="M12 3 V11"/><circle cx="12" cy="12.4" r="1.4"/></svg></span>
        <div class="st-phone">${img(c4?.image)}<span class="st-phone-copy"><small>${esc(c4?.kicker || '')}</small><b>${esc(c4?.title || '')}</b><em>${esc(c4?.text || '')}</em></span></div>
      </article>
    </section>

    <section class="sc-closer">
      <span class="cl-kicker c-in">${words(closerData.kicker || '')}</span>
      <h2 class="cl-head">${words(closerData.heading || '', ' c-in')}</h2>
      <p class="cl-text c-in">${esc(closerData.text || '')}</p>
      <div class="cl-arrows c-in">
        <button data-cl="-1" title="Previous"><svg viewBox="0 0 24 24"><path d="M15 6 L9 12 L15 18"/></svg></button>
        <button data-cl="1" title="Next"><svg viewBox="0 0 24 24"><path d="M9 6 L15 12 L9 18"/></svg></button>
      </div>
      ${closerData.link ? `<a class="cl-all c-in" href="#/${esc(closerData.link)}">${esc(closerData.linkText || 'View all')}</a>` : ''}
      <div class="cl-window"><div class="cl-track">
        ${closerItems.map((it, i) => `<a class="cl-card" data-c="${i}">${img(it.image)}<span>${esc(it.title)}</span></a>`).join('')}
      </div></div>
      <div class="cl-progress c-in"><i></i></div>
    </section>
    <section class="sc-footer"></section>
    <div class="sc-steps">
      <button data-step="-1" title="Previous scene"><svg viewBox="0 0 24 24"><path d="M6 15 L12 9 L18 15"/></svg></button>
      <button data-step="1" title="Next scene"><svg viewBox="0 0 24 24"><path d="M6 9 L12 15 L18 9"/></svg></button>
    </div>
  </div>`;

  const el = root.firstElementChild;
  const $ = s => el.querySelector(s);
  const nodes = [...el.querySelectorAll('.sc-card')];
  const pin = $('.sc-pin'), trust = $('.sc-trust'), vision = $('.sc-vision'), footer = $('.sc-footer'), steps = $('.sc-steps');
  const vCards = [...vision.querySelectorAll('.v-card')], vIcons = [...vision.querySelectorAll('.v-icon')];
  const vTabs = [...vision.querySelectorAll('.v-tab')], vText = [...vision.querySelectorAll('.v-in')];
  const pour = pourIcons(vIcons.length);
  const story = $('.sc-story'), closer = $('.sc-closer');
  const sText = [...story.querySelectorAll('.s-in')], sRow1 = [...story.querySelectorAll('.c1, .c2')], sRow2 = [...story.querySelectorAll('.c3, .c4')];
  const sMinis = [...story.querySelectorAll('.st-mini')], sTag = story.querySelector('.st-tag');
  const cText = [...closer.querySelectorAll('.c-in')], cCards = [...closer.querySelectorAll('.cl-card')];
  const cTrack = closer.querySelector('.cl-track'), cBar = closer.querySelector('.cl-progress i');
  const closerPics = closerItems.map(it => byName(it.image));
  cCards.forEach(c => c.addEventListener('click', () => open(closerPics, +c.dataset.c)));
  // The carousel's own arrows slide it one card at a time
  let cIndex = 0;
  const cMax = Math.max(0, cCards.length - CLOSER_SHOWN);
  const slideCloser = d => {
    cIndex = Math.min(cMax, Math.max(0, cIndex + d));
    cTrack.style.transform = `translate3d(${-cIndex * (CLOSER_CARD + CLOSER_GAP)}px, 0, 0)`;
    cBar.style.transform = `translate3d(${cMax ? cIndex / cMax * 300 : 0}%, 0, 0)`;
  };
  closer.querySelectorAll('[data-cl]').forEach(b => b.addEventListener('click', () => slideCloser(+b.dataset.cl)));
  const wave = $('.sc-wave'), wTiles = [...wave.querySelectorAll('.w-tile')], wText = [...wave.querySelectorAll('.w-in')];
  wTiles.forEach(c => c.addEventListener('click', () => open(waveItems, +c.dataset.w)));
  vision.querySelectorAll('.v-card[data-v]').forEach(c => c.addEventListener('click', () => open(visionPosters, +c.dataset.v)));
  const hero = $('.sc-hero'), heroTags = $('.sc-tags.hero'), twoTags = $('.sc-tags.two'), twoText = $('.sc-two');
  const reveal = [...el.querySelectorAll('.sc-in')];
  nodes.forEach(c => c.addEventListener('click', () => open(cards, +c.dataset.i)));
  // Decode every poster and logo now, so no frame stalls on one when its scene arrives
  el.querySelectorAll('img').forEach(img => img.decode?.().catch(() => {}));

  /* ---------- 1 · Intro: rise, stack, fan out ---------- */
  const timers = [], anims = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  // While the intro plays, draw the later screens once, invisibly, so the browser has them ready
  // and their first appearance never costs a frame
  const later = [trust, vision, wave, story, closer];
  const homeTop = later.map(s => s.style.top);
  later.forEach(s => { s.style.top = '0px'; s.style.opacity = '.002'; });
  at(450, () => { story.style.top = `${H - STORY_H}px`; });   // the story is taller than a screen: draw its lower part too
  [...vCards, ...vIcons, ...wTiles, ...sRow1, ...sRow2, ...cCards].forEach(c => { c.style.opacity = 1; });
  at(900, () => {
    later.forEach((s, i) => { s.style.top = homeTop[i]; s.style.opacity = ''; });
    wTiles.forEach(c => { c.style.opacity = 0; });
    lastS = -1; updateStory(6.8);
    updateVision(STOPS[2] + .001);
  });
  const animate = (node, frames, opts) => anims.push(node.animate(frames, { fill: 'forwards', ...opts }));
  const fanZ = i => i === lead ? 20 : 10 - Math.abs(i - 3);

  const rise = { x: 0, y: 760, z: 40, ry: 0, r: 32, s: .95 };
  nodes.forEach((c, i) => {
    c.style.zIndex = 10 + i;
    c.style.transform = tf(i === lead ? rise : stackP(lead, lead, 0, 0, .86));
    c.style.opacity = i === lead ? 1 : 0;
  });
  animate(nodes[lead], [{ transform: tf(rise) }, { transform: tf({ ...rise, y: 30, r: -14, s: .86 }) }],
    { duration: 1500, delay: 150, easing: 'cubic-bezier(.16,.8,.24,1)' });

  at(1500, () => {
    animate(nodes[lead], [{ transform: tf(stackP(lead, lead, 0, 0, .86)) }], { duration: 650, easing: 'cubic-bezier(.3,.7,.3,1)' });
    nodes.forEach((c, i) => {
      if (i === lead) return;
      animate(c, [{ opacity: 0 }, { opacity: 1, transform: tf(stackP(i, lead, 0, 0, .86)) }],
        { duration: 500, delay: 120 + (lead - i) * 45, easing: 'ease-out' });
    });
  });

  at(2450, () => {
    nodes.forEach((c, i) => {
      c.style.zIndex = fanZ(i);
      animate(c, [{ opacity: 1, transform: tf(fanP(i, nodes.length)) }],
        { duration: 1150, delay: Math.abs(i - lead) * 35, easing: 'cubic-bezier(.65,0,.2,1)' });
    });
    el.classList.add('fanned');   // hero text, buttons and tags follow in CSS
  });

  // Intro done: hand the cards over to the player
  let ready = false;
  at(3900, () => {
    nodes.forEach(c => { c.style.opacity = 1; });
    update(0);
    anims.forEach(a => a.cancel());
    el.classList.remove('locked');
    ready = true;
  });

  /* ---------- 2 · Scenes: fold, move, cascade, glide to the footer ---------- */
  let footerCleanup = null, footerMounting = false, alive = true, lastQ = -1, lastV = -1;

  function update(p) {
    // Past the second section, each glide moves the whole page up one screen
    const shift = GLIDES.reduce((s, [g, d]) => s + ease(clamp(p - g)) * d, 0);
    const move = shift ? `translate3d(0, ${-shift}px, 0)` : '';
    [pin, trust, vision, wave, story, closer, footer].forEach(s => { s.style.transform = move; });
    trust.classList.toggle('on', p > 2.35);   // headline blurs in, logos start drifting
    steps.classList.toggle('away', p > FOOTER_AT + .5);  // the bridge footer has its own look

    updateVision(p);
    updateWave(p);
    updateStory(p);
    mountFooter(p);

    // The posters only change up to the second section; skip that work while the page glides
    const q = Math.min(p, STOPS[1]);
    if (q === lastQ) return;
    lastQ = q;
    p = q;

    hero.style.transform = `translate3d(0, ${-p * 700}px, 0)`;
    hero.style.opacity = clamp(1 - p / .4);
    hero.style.pointerEvents = p < .3 ? '' : 'none';
    heroTags.style.opacity = clamp(1 - p / .15);

    const a = ease(clamp(p / .5));             // row → stack
    const b = ease(clamp((p - .45) / .5));     // stack moves right
    nodes.forEach((c, i) => {
      const k = ease(clamp((p - 1 - (lead - i) * .05) / .45));   // stack → cascade, one card after another
      let P = mix(fanP(i, nodes.length), stackP(i, lead, 0, 60, .86), a);
      P = mix(P, stackP(i, lead, 170, 70, .78), b);
      P = mix(P, cascadeP(i), k);
      c.style.transform = tf(P);
      c.style.zIndex = p < .25 ? fanZ(i) : 10 + i;
    });

    // Second headline, then its text and buttons, each out of a blur as you scroll
    reveal.forEach((w, i) => {
      const t = clamp((p - (.5 + i * .06)) / .14);
      w.style.opacity = t;
      w.style.filter = t < 1 ? `blur(${(1 - t) * 12}px)` : '';
      w.style.transform = `translate3d(0, ${(1 - t) * 18}px, 0)`;
    });
    twoText.style.pointerEvents = p > 1 ? 'auto' : 'none';
    twoTags.classList.toggle('on', p > 1.55);

  }

  // 4 · the vision screen, driven by the stretch of p from 2.8 to 4.8
  function updateVision(p) {
    const v = Math.min(Math.max(p, 2.8), 4.8);
    if (v === lastV) return;
    lastV = v;
    const arrive = clamp((v - 3.1) / .7);   // posters fade in as the screen glides up
    const s = clamp(v - 3.8);               // then the scene itself, 0 → 1

    vCards.forEach((c, j) => {
      const k = ease(clamp((s - j * .025) / .4));   // each card leaves the cascade a moment after the last
      const A = visionCascade(j), B = visionGrid(j);
      const x = A.x + (B.x - A.x) * k, y = A.y + (B.y - A.y) * k;
      c.style.transform = `translate3d(${x}px, ${y + (1 - arrive) * 60}px, 0) scale(${.94 + .06 * k})`;
      c.style.opacity = clamp((arrive - j * .08) / .5) * (A.o + (B.o - A.o) * k);
    });

    // The frame's two tabs slide down behind the grid
    vTabs.forEach((t, i) => {
      const k = ease(clamp((s - .3 - (1 - i) * .08) / .3));
      t.style.opacity = k;
      t.style.transform = `translate3d(0, ${(1 - k) * 50}px, 0)`;
    });

    // Icons pour into the jar: play the recorded simulation, blending between its frames
    const f = clamp((s - .2) / .78) * (pour.length - 1);
    const f0 = Math.floor(f), f1 = Math.min(pour.length - 1, f0 + 1), u = f - f0;
    vIcons.forEach((ic, i) => {
      const A = pour[f0][i], B = pour[f1][i];
      if (!A[2] && !B[2]) { ic.style.opacity = 0; return; }
      const x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u;
      ic.style.transform = `translate3d(${x - ICON_R}px, ${y - ICON_R}px, 0)`;   // always upright, never spinning
      ic.style.opacity = 1;
    });

    // Headline and text, out of a blur
    vText.forEach((w, i) => {
      const t = clamp((s - (.5 + i * .05)) / .18);
      w.style.opacity = t;
      w.style.filter = t < 1 ? `blur(${(1 - t) * 12}px)` : '';
      w.style.transform = `translate3d(0, ${(1 - t) * 18}px, 0)`;
    });
  }

  // 5 · the wave screen: its text follows p; the tiles drift on their own clock (see waveFrame)
  let waveP = 0, waveRaf = 0;
  function updateWave(p) {
    waveP = p;
    if (p > WAVE_ON[0] && p < WAVE_ON[1] && !waveRaf) waveRaf = requestAnimationFrame(waveFrame);
    if (p < 5.3 || p > 7) return;
    wText.forEach((w, i) => {
      const t = clamp((p - (5.55 + i * .07)) / .25);
      w.style.opacity = t;
      w.style.filter = t < 1 ? `blur(${(1 - t) * 12}px)` : '';
      w.style.transform = `translate3d(0, ${(1 - t) * 18}px, 0)`;
    });
  }
  function waveFrame(now) {
    if (!alive || waveP <= WAVE_ON[0] || waveP >= WAVE_ON[1]) { waveRaf = 0; return; }
    const t = now / 1000;
    wTiles.forEach((c, i) => {
      const row = ROWS[i % 2], k = Math.floor(i / 2);
      const x = (((k * TILE_STEP + row.speed * t) % LOOP) + LOOP) % LOOP - TILE_STEP;
      // Tiles rise into place from below as the screen arrives, left to right
      const enter = ease(clamp((waveP - 5.1 - (x / 1920) * .3) / .45));
      const y = waveY(row, x + TILE / 2, t) + (1 - enter) * 320;
      c.style.transform = `translate3d(${x}px, ${y - TILE / 2}px, 0)`;
      c.style.opacity = enter;
    });
    waveRaf = requestAnimationFrame(waveFrame);
  }

  // 6 & 7 · the story and the closer look, driven by p from 6.8 to 11.4
  let lastS = -1;
  function updateStory(p) {
    const q = Math.min(Math.max(p, 6.8), 11.4);
    if (q === lastS) return;
    lastS = q;
    sText.forEach((w, i) => blurIn(w, clamp((q - (7.35 + i * .07)) / .3)));
    sRow1.forEach((c, j) => riseIn(c, ease(clamp((q - 7.55 - j * .14) / .55))));
    sRow2.forEach((c, j) => riseIn(c, ease(clamp((q - 8.75 - j * .14) / .6))));
    // the little stack inside the first card fans out once the card has landed
    const f = ease(clamp((q - 8.0) / .45));
    sMinis.forEach((m, i) => { m.style.transform = `translate3d(${(i - 1) * 78 * f}px, ${Math.abs(i - 1) * 10 * f}px, 0) rotate(${(i - 1) * 9 * f}deg)`; });
    sTag?.classList.toggle('on', q > 8.3);

    cText.forEach((w, i) => blurIn(w, clamp((q - (10.35 + i * .06)) / .3)));
    cCards.forEach((c, j) => blurIn(c, clamp((q - (10.55 + j * .1)) / .35), 90, 0, 0));   // slide and fade only: blurring photos costs frames
  }
  function riseIn(el, k) {
    el.style.opacity = k;
    el.style.transform = `translate3d(0, ${(1 - k) * 180}px, 0) scale(${.96 + .04 * k})`;
  }

  // The footer's own entrance plays when it comes into view
  function mountFooter(p) {
    if (p > FOOTER_AT + .05 && !footerCleanup && !footerMounting) {
      footerMounting = true;
      mountHome(footer).then(c => { if (alive) footerCleanup = c; else c?.(); });
    }
  }

  /* ---------- The player: glides p to the next stop, one frame at a time ---------- */
  let p = 0, target = 0, raf = 0, last = 0, lastDir = 1, autoTimer = 0;
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000);   // a dropped frame never makes it jump
    last = now;
    const dir = target > p ? 1 : -1;
    const speed = speedAt(p, dir);
    p = dir > 0 ? Math.min(target, p + speed * dt) : Math.max(target, p - speed * dt);
    update(p);
    raf = p === target ? 0 : requestAnimationFrame(tick);
    if (!raf && lastDir > 0 && AUTO_FROM.includes(target)) autoTimer = setTimeout(() => step(1), AUTO_HOLD);
  }
  // true when the scene changed; false lets the deck move to the next or previous slide
  function step(dir) {
    if (!ready) return true;   // the intro is still playing: let it finish
    clearTimeout(autoTimer);   // a click always wins over the automatic carry-on
    const next = STOPS[STOPS.indexOf(target) + dir];
    if (next === undefined) return false;
    target = next;
    lastDir = dir;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    reshuffle();
    onScene();
    return true;
  }

  // A fresh deal for every picture: each fades out, its new poster is decoded, then fades in
  const groups = [
    [nodes.map(c => c.querySelector('img')), cards],
    [vision.querySelectorAll('.v-card[data-v] img'), visionPosters],
    [wTiles.map(c => c.querySelector('img')), waveItems],
    [cCards.map(c => c.querySelector('img')), closerPics, cCards.map(c => c.querySelector('span'))],
    [story.querySelectorAll('.st-mini img, .st-photo img, .st-phone img'), []],
  ];
  let dealt = 0;
  function reshuffle() {
    const turn = ++dealt;
    groups.forEach(([imgs, list, labels]) => {
      imgs = [...imgs];
      const fresh = deal(imgs.length);
      imgs.forEach((im, i) => {
        if (!im) return;
        const it = fresh[i];
        im.style.transition = 'opacity .45s ease';
        im.style.opacity = '0';
        const pre = new Image();
        pre.src = it.url;
        const show = () => {
          if (!alive || turn !== dealt) return;
          im.src = it.url;
          if (labels?.[i]) labels[i].textContent = BRAND_NAME[brandOf(it)] || brandOf(it);
          if (list) list[i] = it;   // a click opens the picture now showing
          requestAnimationFrame(() => { im.style.opacity = '1'; });
        };
        Promise.all([pre.decode?.().catch(() => {}), new Promise(r => setTimeout(r, 450))]).then(show);
      });
    });
  }
  el.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
  // Space plays the next scene too (Right and Left come through the deck's Next and Prev; Up and Down change tab)
  const onKey = e => {
    if (document.querySelector('#lightbox:not([hidden])')) return;
    if (e.key === ' ') { e.preventDefault(); step(1); }
  };
  addEventListener('keydown', onKey);

  const cleanup = () => {
    alive = false;
    cancelAnimationFrame(raf); cancelAnimationFrame(waveRaf); clearTimeout(autoTimer);
    timers.forEach(clearTimeout); anims.forEach(a => a.cancel());
    removeEventListener('keydown', onKey);
    footerCleanup?.();
  };
  cleanup.step = step;
  cleanup.atStart = () => target === STOPS[0];
  cleanup.atEnd = () => target === STOPS[STOPS.length - 1];
  return cleanup;
}
