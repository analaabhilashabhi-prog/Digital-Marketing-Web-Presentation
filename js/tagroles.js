// t@g roles and flow, played like a film in the same frame as the monthly report
// (js/tagreport.js plays it). Who logs in, what each login can do, and how one
// request travels through them: raised, designed, approved, accepted, published.
// The words come from content/03 Tag Portal/roles.json.

import { A, N, esc, icon, clamp } from './tagreport.js';
import { brand } from './brands.js';

const ease = t => t * t * (3 - 2 * t);

const RICON = {
  crown: '<path d="M4 17 L3 7 L8.5 11 L12 5 L15.5 11 L21 7 L20 17 Z"/><path d="M4 20.5 H20"/>',
  building: '<path d="M4 20 V8.5 L12 4 L20 8.5 V20"/><path d="M2.5 20 H21.5 M8 11 V16.5 M12 11 V16.5 M16 11 V16.5"/>',
  megaphone: '<path d="M4 10 L15 5 V19 L4 14 Z"/><path d="M15 9 A3 3 0 0 1 15 15"/><path d="M6 14.5 L7.5 20 H10 L9 15.2"/>',
  pen: '<path d="M4 20 L5.5 14.5 L15.5 4.5 L19.5 8.5 L9.5 18.5 Z"/><path d="M13.5 6.5 L17.5 10.5"/>',
  send: '<path d="M3.5 11 L20.5 4 L15.5 20 L11.5 13 Z"/><path d="M11.5 13 L20.5 4"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20 C5.6 15.8 8.4 13.9 12 13.9 C15.6 13.9 18.4 15.8 19 20"/>',
  gates: '<path d="M5 4 V20 M19 4 V20"/><path d="M8.5 12.5 L11 15 L15.5 9.5"/>',
  steps: '<path d="M4 18.5 H9 V13.5 H14 V8.5 H20"/><path d="M17 5.5 L20 8.5 L17 11.5"/>',
  log: '<path d="M6 3.5 H15 L19 7.5 V20.5 H6 Z"/><path d="M9 11 H16 M9 14.5 H16 M9 18 H13"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5 V7.5 A4 4 0 0 1 16 7.5 V10.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12 L19 4 M16 7 L18.5 9.5 M14 9.5 L16 11.5"/>',
  check: '<path d="M5 12.5 L10 17.5 L19 7"/>',
  eye: '<path d="M2.5 12 C5 7 8.5 5 12 5 C15.5 5 19 7 21.5 12 C19 17 15.5 19 12 19 C8.5 19 5 17 2.5 12 Z"/><circle cx="12" cy="12" r="3"/>',
  back: '<path d="M10 6 L4 12 L10 18"/><path d="M4 12 H14 A6 6 0 0 1 20 18"/>',
  heart: '<path d="M12 20 C4.5 14.8 3 10.4 5 7.4 C6.8 4.8 10.4 5.2 12 8 C13.6 5.2 17.2 4.8 19 7.4 C21 10.4 19.5 14.8 12 20 Z"/>',
  // the t@g console's own icons (chapter 4)
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  spark: '<path d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z"/>',
  pulse: '<path d="M3 12 H7 L10 5 L14 19 L17 12 H21"/>',
  template: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M14 14 H20 M14 18 H20"/>',
  box: '<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z"/><path d="M4 7.5 L12 12 L20 7.5 M12 12 V21"/>',
  image: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="1.8"/><path d="M4 17 L9.5 12.5 L13 15.5 L16 13 L20 16.5"/>',
  camera: '<path d="M4 8 H7.5 L9 5.5 H15 L16.5 8 H20 V19 H4 Z"/><circle cx="12" cy="13" r="3.4"/>',
  cap: '<path d="M2.5 9.5 L12 5 L21.5 9.5 L12 14 Z"/><path d="M6.5 11.5 V16 C8 17.8 16 17.8 17.5 16 V11.5"/>',
  flag: '<path d="M5 21 V4 H17 L15 8 L17 12 H5"/>',
  checksq: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12.5 L11 15.5 L16 9"/>',
  palette: '<path d="M12 3.5 C6.8 3.5 3.5 7.3 3.5 11.8 C3.5 16.6 7.4 20.5 11.6 20.5 C13 20.5 13.4 19.6 13 18.6 C12.4 17.2 13.2 16 14.8 16 H16.8 C19 16 20.5 14.4 20.5 12 C20.5 7.3 16.8 3.5 12 3.5 Z"/><circle cx="8" cy="11" r="1.1"/><circle cx="11" cy="7.5" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/>',
  chat: '<path d="M4 5 H20 V16 H10 L5.5 19.5 V16 H4 Z"/><path d="M8 9.5 H16 M8 12.5 H13"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16 L20 20"/>',
  download: '<path d="M12 4 V15 M7.5 10.5 L12 15 L16.5 10.5"/><path d="M5 19.5 H19"/>',
  trash: '<path d="M4.5 7 H19.5 M9.5 7 V4.5 H14.5 V7 M6.5 7 L7.5 20 H16.5 L17.5 7"/>',
  chev: '<path d="M7 10 L12 15 L17 10"/>',
  moon: '<path d="M19 14.5 A7.5 7.5 0 1 1 9.5 5 A6 6 0 0 0 19 14.5 Z"/>',
  bell: '<path d="M6 16.5 V11 A6 6 0 0 1 18 11 V16.5 L19.5 18 H4.5 Z"/><path d="M10 20.5 H14"/>',
  link: '<path d="M10 14 L14 10"/><path d="M9 7.5 L11 5.5 A3.5 3.5 0 0 1 18.5 13 L16.5 15"/><path d="M15 16.5 L13 18.5 A3.5 3.5 0 0 1 5.5 11 L7.5 9"/>',
  folder: '<path d="M3.5 6.5 H9.5 L11.5 8.5 H20.5 V18.5 H3.5 Z"/>',
  file: '<path d="M6.5 3.5 H14 L18 7.5 V20.5 H6.5 Z"/><path d="M14 3.5 V7.5 H18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V12 L15 14"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2.5 V6 M15 2.5 V6 M9 18 V21.5 M15 18 V21.5 M2.5 9 H6 M2.5 15 H6 M18 9 H21.5 M18 15 H21.5"/>',
  leaf: '<path d="M5 19 C5 10 10 5 20 4 C19 14 14 19 5 19 Z"/><path d="M5 19 L13 11"/>',
  briefcase: '<rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M9 7.5 V5.5 A1.5 1.5 0 0 1 10.5 4 H13.5 A1.5 1.5 0 0 1 15 5.5 V7.5 M3 13 H21"/>',
  hub: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="3.8" r="1.8"/><circle cx="4.6" cy="17" r="1.8"/><circle cx="19.4" cy="17" r="1.8"/><path d="M12 5.6 V9 M6.2 16 L9.5 13.6 M17.8 16 L14.5 13.6"/>',
};
const ric = (name, cls = '') => `<svg class="rl-svg ${cls}" viewBox="0 0 24 24">${RICON[name] || RICON.person}</svg>`;
const badge = (r, cls = '') => `<span class="rl-ic ${cls}" style="--c:${r.color}">${ric(r.icon)}</span>`;
const pchip = p => brand(p, 'tr-pf');

/* ---------- 1 · The hierarchy, left to right ----------
   University Admin → its schools → the Digital Marketing Manager → the team the
   manager assigns (2026-11-01: "try the horizontal way", then "just normal lines
   ... everything normal, minimal"). Each column slides in and plain links draw
   across; every card looks alike. Hovering a card lights its path and says what it does. */
const COL = { top: [40, 330], org: [510, 330], mgr: [980, 450], team: [1570, 350] };   // left, width
const ROWS = [345, 505, 665];                        // centres of the three stacked cards
const MID = 505;                                     // the admin and the manager sit on the middle row
const CARD_H = { top: 104, org: 92, mgr: 112, team: 92 };
const curve = (x0, y0, x1, y1) => { const m = (x0 + x1) / 2; return [x0, y0, m, y0, m, y1, x1, y1]; };

function hierarchy(D, R) {
  const H = D.hierarchy;
  const right = k => COL[k][0] + COL[k][1];
  const nodes = [
    { id: 'top', col: 'top', y: MID, name: R.super.name, icon: R.super.icon, color: R.super.color, tip: H.top.tip, d: .3 },
    ...H.orgs.map((o, i) => ({ id: `o${i}`, col: 'org', y: ROWS[i], name: o.name, icon: o.icon, color: o.color, tip: o.tip, d: 1.3 + i * .15 })),
    { id: 'mgr', col: 'mgr', y: MID, name: H.manager.name, icon: H.manager.icon, color: H.manager.color, tip: H.manager.tip, d: 2.6 },
    ...H.team.map((m, i) => ({ id: `t${i}`, col: 'team', y: ROWS[i], name: R[m.role].name, icon: R[m.role].icon, color: R[m.role].color, tip: m.tip, d: 3.9 + i * .15 })),
  ];
  const links = [
    ...H.orgs.map((o, i) => ({ from: 'top', to: `o${i}`, c: curve(right('top'), MID, COL.org[0], ROWS[i]), d: 1, step: 0, color: o.color })),
    ...H.orgs.map((o, i) => ({ from: `o${i}`, to: 'mgr', c: curve(right('org'), ROWS[i], COL.mgr[0], MID), d: 2.3, step: 1, color: o.color })),
    ...H.team.map((m, i) => ({ from: 'mgr', to: `t${i}`, c: curve(right('mgr'), MID, COL.team[0], ROWS[i]), d: 3.6, step: 2, color: R[m.role].color })),
  ];
  const d = l => `M ${l.c[0]} ${l.c[1]} C ${l.c.slice(2).join(' ')}`;
  const heads = [['Leadership', 'top', .2], ['Schools', 'org', 1.2], ['Manager', 'mgr', 2.5], ['Team', 'team', 3.8]];
  return {
    links,
    html: `
      <div class="rl-h">
        ${heads.map(([t, k, s]) => `<span class="rl-h-head"${A('fade', s, `left:${COL[k][0]}px;width:${COL[k][1]}px`)}>${esc(t)}</span>`).join('')}
        <svg class="rl-lines rl-h-svg" viewBox="0 0 1920 1080">
          ${links.map((l, i) => `<path class="tr-draw rl-h-link" data-i="${i}" pathLength="1" style="--d:${l.d}s;--c:${l.color}" d="${d(l)}"/>`).join('')}
        </svg>
        ${nodes.map(n => `
          <div class="rl-h-node c-${n.col}" data-node="${n.id}"${A('left', n.d, `left:${COL[n.col][0]}px;top:${n.y - CARD_H[n.col] / 2}px;width:${COL[n.col][1]}px;height:${CARD_H[n.col]}px;--c:${n.color}`)}>
            <div class="rl-h-card"><span class="rl-h-ic">${ric(n.icon)}</span><b>${esc(n.name)}</b></div>
            <div class="rl-h-tip">${esc(n.tip)}</div>
          </div>`).join('')}
      </div>`,
  };
}

/* ---------- 3 · One request, five steps, told with one real poster ----------
   (2026-11-01: "use this image and explain this entire process ... the photo should
   carry on till the end"). NGI's National Farmer's Day poster goes the whole way: the
   coordinator types the brief, the designer builds it piece by piece, the admin checks
   and approves it, the coordinator accepts it, and the handler posts it on every page
   with words written for each. One poster travels between the screens. Everything is
   worked out from the chapter's clock, so Prev, Next and pause always land on the
   right frame. */
const SEG = [0, 10.5, 21, 27.5, 32, 44];            // when each step starts, and the chapter ends
const PLACE = {                                     // where the poster sits in each step: left, top, width (4:5)
  0: [1220, 236, 430], 1: [700, 282, 500], 2: [470, 222, 520], 3: [560, 240, 480], 4: [140, 264, 380],
};
// the poster's parts as boxes on the image (left, right, top, bottom, in %), in the order the designer adds them
const LAYERS = [
  ['Date · 23rd dec', 2, 16, 2.5, 8.5, 12.6],
  ['NGI logo', 75, 98, 2, 15, 13.6],
  ['Wheat', 8, 41, 24, 78, 14.8],
  ['Farmer illustration', 30, 82, 17, 80, 16],
  ['Headline', 21, 79, 76, 82.5, 17.4],
  ['Tagline', 24, 77, 83, 93, 18.6],
];
const onPoster = (fx, fy) => [PLACE[1][0] + PLACE[1][2] * fx / 100, PLACE[1][1] + PLACE[1][2] * 1.25 * fy / 100];
// the cursor: where it arrives, and when (it glides there over the 0.7 s before)
const CURSOR = [
  [1.2, 650, 366], [3.4, 650, 466], [7.5, 560, 670], [8.2, 560, 764], [9.3, 1004, 854],
  [11, 1100, 640],
  ...LAYERS.map(([, x0, x1, y0, y1, at]) => [at - .25, ...onPoster((x0 + x1) / 2, (y0 + y1) / 2)]),
  [20, 1545, 222],
  [22.3, 1200, 361], [23.1, 1200, 423], [23.9, 1200, 485], [24.7, 1200, 547], [25.5, 1455, 630],
  [28.6, 1300, 470], [29.5, 1485, 572],
];
const CLICKS = [9.4, 20.1, 25.6, 29.6];
const MOVE = .7;

function story(D, R, L) {
  const S = D.story, steps = D.steps, img = L(S.poster);
  const actor = t => R[steps[Math.max(0, SEG.findIndex((s, i) => t >= s && t < SEG[i + 1]))]?.role || 'handler'];
  const at = (v, extra = '') => ` data-at="${v}"${extra}`;
  const typed = (a, b, text) => `<span data-type-at="${a},${b}" data-text="${esc(text)}"></span>`;
  const btns = (no, yes, when) => `<div class="fl-btns"><span>${esc(no)}</span><span class="ok"${at(when)}>${ric('check')}${esc(yes)}</span></div>`;
  return {
    name: 'One request, five steps', hold: SEG[5],
    title: 'One request, five steps',
    line: 'Follow one real poster, from the brief to the feed.',
    html: `
      <div class="rl"><div class="rl-c"><div class="fl" data-step="0">
        <div class="fl-steps"><i class="fl-track"><b></b></i>${steps.map((s, i) => `
          <div class="fl-step" style="left:${560 + i * 200}px;--c:${R[s.role].color}"><span class="fl-dot">${ric(R[s.role].icon)}</span><small>${esc(R[s.role].name)}</small><b>${esc(s.title)}</b></div>`).join('')}
        </div>

        <!-- everything below the steps, drawn a size larger so it fills the frame -->
        <div class="fl-stage">
        <div class="fl-panel fl-p0 fl-form">
          <div class="fl-head">${badge(R.coord)}<span><b>New request</b><small>${esc(R.coord.name)} · ${esc(S.college)}</small></span></div>
          <label style="top:114px">Title</label><div class="fl-field" style="top:136px;height:60px">${typed(1.4, 3.2, S.title)}</div>
          <label style="top:216px">Brief</label><div class="fl-field area" style="top:238px;height:160px">${typed(3.5, 7.3, S.brief)}</div>
          <label style="top:418px">Needed by</label><div class="fl-field" style="top:440px;height:60px;right:auto;width:360px">${typed(7.6, 8.1, S.due)}</div>
          <label style="top:520px">Post on</label>
          <div class="fl-chips">${S.posts.map(([p], i) => `<span${at((8.2 + i * .18).toFixed(2))}>${brand(p)}${esc(p)}</span>`).join('')}</div>
          <div class="fl-btn"${at(9.4)}>Raise request</div>
          <div class="fl-toast"${at(9.75)}>${ric('check')}Sent to the designers' board</div>
        </div>

        <div class="fl-panel fl-p1 fl-editor">
          <div class="fl-bar">${badge(R.designer)}<b>Design studio</b><span>${esc(S.title)}</span><div class="fl-btn"${at(20.1)}>Send for approval</div></div>
          <div class="fl-layers"><small>Layers</small>
            ${[['Canvas · 1080 × 1350', 11.2], ...LAYERS.map(l => [l[0], l[5]])].map(([n, a]) => `<div${at(a)}>${ric('check')}${esc(n)}</div>`).join('')}
          </div>
          <div class="fl-brief"><small>Brief from ${esc(S.college)}</small><p>${esc(S.brief)}</p><i>${esc(S.due)}</i></div>
          <div class="fl-toast"${at(20.4)}>${ric('check')}Sent to the admin</div>
        </div>

        <div class="fl-panel fl-p2 fl-review">
          <div class="fl-head">${badge(R.admin)}<span><b>Admin review</b><small>${esc(S.title)}</small></span></div>
          ${S.checks.map((c, i) => `<div class="fl-check"${at((22.4 + i * .8).toFixed(1))}>${ric('check')}${esc(c)}</div>`).join('')}
          ${btns('Send back', 'Approve', 25.6)}
        </div>

        <div class="fl-panel fl-p3 fl-accept">
          <div class="fl-head">${badge(R.coord)}<span><b>${esc(R.coord.name)}</b><small>${esc(S.college)}</small></span></div>
          <p>Is this what we asked for?</p>
          ${btns('Decline', 'Accept', 29.6)}
        </div>

        <div class="fl-panel fl-p4">${S.posts.map(([p, text, likes], i) => `
          <div class="fl-post"${at((32.4 + i * .25).toFixed(2), ` style="left:${140 + i * 420}px"`)}>
            <div class="fl-post__head">${brand(p)}<span><b>Nagarjuna Group of Institutions</b><small>${esc(p)} · just now</small></span></div>
            <div class="fl-post__img">${i ? `<img src="${img}" alt="">` : ''}</div>
            <p>${typed(33.4 + i * .6, 36 + i * .6, text)}</p>
            <div class="fl-post__foot"><span>${ric('heart')}<b data-count-to="37.8,41.5,${likes}">0</b></span><em${at((37.4 + i * .25).toFixed(2))}>${ric('check')}Posted</em></div>
          </div>`).join('')}
        </div>

        <div class="fl-poster">
          <div class="fl-canvas">
            <i class="fl-ph">${ric('pen')}Waiting for a designer</i>
            ${LAYERS.map(([, x0, x1, y0, y1, a]) => `<img class="fl-layer"${at(a)} src="${img}" alt="" style="--t:${y0}%;--b:${100 - y1}%;--l:${x0}%;--r0:${100 - x0}%;--r1:${100 - x1}%">`).join('')}
            <img class="fl-full"${at(19.4)} src="${img}" alt="">
            <i class="fl-sel"></i>
          </div>
          <div class="fl-stamp"${at(26)}>${ric('check')}Approved by Admin</div>
          <div class="fl-ok"${at(30)}>${ric('check')}Accepted by ${esc(S.college)}</div>
        </div>

        <div class="fl-cursor"><svg viewBox="0 0 24 24"><path d="M5 2.5 V19 L9.2 15 L12.2 21.5 L14.8 20.3 L11.9 14 L17.8 13.8 Z"/></svg><em></em></div>
        </div>
      </div></div></div>`,

    tick(t, el) {
      const root = el.querySelector('.fl');
      const k = Math.max(0, SEG.findIndex((s, i) => t >= s && t < SEG[i + 1]));
      const step = t >= SEG[4] ? 4 : k;
      if (root.dataset.step !== String(step)) root.dataset.step = step;
      // the steps along the top
      root.querySelectorAll('.fl-step').forEach((n, i) => { n.classList.toggle('on', i === step); n.classList.toggle('done', i < step); });
      root.querySelector('.fl-track b').style.width = `${(clamp(step + (t - SEG[step]) / (SEG[step + 1] - SEG[step]), 0, 4) / 4 * 100).toFixed(2)}%`;
      // things that happen at a moment, words being typed, numbers counting up
      root.querySelectorAll('[data-at]').forEach(e => e.classList.toggle('on', t >= +e.dataset.at));
      root.querySelectorAll('[data-type-at]').forEach(e => {
        const [a, b] = e.dataset.typeAt.split(',').map(Number), s = e.dataset.text;
        const n = Math.round(s.length * clamp((t - a) / (b - a)));
        if (e.dataset.n !== String(n)) { e.textContent = s.slice(0, n); e.dataset.n = n; }
        e.classList.toggle('typing', t > a - .4 && t < b + .3);
      });
      root.querySelectorAll('[data-count-to]').forEach(e => {
        const [a, b, to] = e.dataset.countTo.split(',').map(Number);
        e.textContent = Math.round(to * ease(clamp((t - a) / (b - a)))).toLocaleString('en-US');
      });
      // the designer's selection box, around the part being placed
      const sel = root.querySelector('.fl-sel'), cur = LAYERS.find(l => t >= l[5] - .3 && t < l[5] + 1.1);
      sel.classList.toggle('on', !!cur);
      if (cur) Object.assign(sel.style, { left: `${cur[1]}%`, top: `${cur[3]}%`, width: `${cur[2] - cur[1]}%`, height: `${cur[4] - cur[3]}%` });
      // the cursor, with the name of whoever is working
      const c = root.querySelector('.fl-cursor');
      let x = CURSOR[0][1], y = CURSOR[0][2];
      for (let j = 1; j < CURSOR.length; j++) {
        const [ta, tx, ty] = CURSOR[j], [, px, py] = CURSOR[j - 1];
        if (t < ta - MOVE) break;
        const f = ease(clamp((t - (ta - MOVE)) / MOVE));
        x = px + (tx - px) * f; y = py + (ty - py) * f;
      }
      c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      c.classList.toggle('on', t > .8 && t < 30.8);
      c.classList.toggle('click', CLICKS.some(s => t >= s && t < s + .35));
      const r = actor(t);
      if (c.dataset.who !== r.name) { c.dataset.who = r.name; c.querySelector('em').textContent = r.name; c.style.setProperty('--c', r.color); }
    },
  };
}

/* ---------- 4 · Everything in one place: the Content tab ----------
   (2026-11-01: "recreate how t@g looks when we log in ... the organization entering,
   going to Content, clicking Templates ... zoom in on a template, it comes to life",
   then "after templates, assets", then the brand library). First the old way, the same
   file hunted for across computers; then t@g's admin console, recreated: Overview, a
   click on Content → Templates, one template opened with its PSD layers and downloaded;
   then Assets, one college logo opened as a brand kit; then Brand Library, the brand
   film opened, played and its link copied to share.
   Everything is worked out from the chapter's clock, like the poster story.
   Positions are on the 1920×1080 stage; the console window sits at WIN. */
const WIN = [90, 50];
const SIDE = [
  ['ov', 'Overview', 'grid'], ['tago', 'Tago AI', 'spark'],
  'Administration', ['org', 'Organizations', 'building'], ['users', 'User Management', 'person'], ['logs', 'Activity Logs', 'pulse'],
  'Content', ['tpl', 'Templates', 'template'], ['assets', 'Assets', 'box'], ['brand', 'Brand Library', 'image'], ['events', 'Events', 'camera'],
  ['people', 'People Directory', 'cap'], ['sign', 'Signage', 'flag'],
  'Workflow', ['appr', 'Approvals', 'checksq'], ['todo', 'Designs to be Done', 'palette'], ['post', 'To Be Posted', 'send'],
  ['work', 'Assigned Work', 'briefcase'], ['req', 'College Requests', 'chat'],
];
const sideTop = {};                                  // each nav row's top, inside the window
{ let y = 118; for (const s of SIDE) { if (typeof s === 'string') { sideTop[s] = y + 12; y += 42; } else { sideTop[s[0]] = y; y += 44; } } }
// the two repositories: picture, name, category, format, whose, whose colour
const TEMPLATES = [
  ['03 Tag Portal/library/tpl-placement-training.jpg', 'torii placement training', 'Placement', 'PNG', 'ToriiMinds', '#F5822A'],
  ['03 Tag Portal/library/tpl-childrens-day.jpg', 'ncet childrens day', 'Celebrations', 'JPG', 'NCET', '#4B5BA8'],
  ['03 Tag Portal/library/tpl-guru-purnima.jpg', 'torii guru purnima', 'Festivals', 'PSD', 'ToriiMinds', '#F5822A'],
  ['03 Tag Portal/library/tpl-7th-anniversary.jpg', 'hub 7th anniversary', 'Milestones', 'PNG', 'Technical Hub', '#2BA84A'],
  ['03 Tag Portal/library/tpl-vlsi-launch.jpg', 'vlsi program launch', 'Workshops', 'PSD', 'ToriiMinds', '#F5822A'],
  ['03 Tag Portal/library/tpl-farmers-day.jpg', 'ngi farmers day', 'Events', 'JPG', 'NGI', '#138A8A'],
  ['03 Tag Portal/library/tpl-youth-day.jpg', 'Youth day', 'Celebrations', 'PNG', 'Shared', '#6A7286'],
  ['03 Tag Portal/library/tpl-claude-partner.jpg', 'claude partner network', 'Partnerships', 'PSD', 'Shared', '#6A7286'],
];
const ASSETS = [
  ['Logos/NGI Institutions/01 Nagarjuna College of Engineering & Technology.png', 'NCET logo', 'Logos', 'PNG', 'NCET', '#4B5BA8'],
  ['Logos/ngi-group-of-institutions.png', 'NGI logo', 'Logos', 'PNG', 'NGI', '#138A8A'],
  ['Logos/NGI Institutions/02 Nagarjuna College of Management Studies.png', 'NCMS logo', 'Logos', 'SVG', 'NCMS', '#2BA84A'],
  ['Logos/technical-hub-mark.png', 'Technical Hub mark', 'Logos', 'AI', 'Technical Hub', '#2BA84A'],
  ['Logos/NGI Institutions/03 Nagarjuna Degree College.png', 'Degree College logo', 'Logos', 'PNG', 'NDC', '#E0294A'],
  ['Logos/aditya-university.png', 'Aditya University logo', 'Logos', 'SVG', 'Aditya', '#6C5CE7'],
  ['Logos/NGI Institutions/04 Nagarjuna Pre-University College.png', 'PU College logo', 'Logos', 'PNG', 'NPUC', '#F5822A'],
  ['Logos/NGI Institutions/05 Nagarjuna Vidyaniketan.png', 'Vidyaniketan logo', 'Logos', 'JPEG', 'NVN', '#138A8A'],
];
const LIBRARY = [
  ['03 Tag Portal/library/ad-ai-ready-engineer.jpg', 'news paper ad', 'Print Ad', 'Shared', '#6A7286'],
  ['03 Tag Portal/library/torii-brand-film.jpg', 'Torii brand film', 'Branding Video', 'ToriiMinds', '#F5822A', true],
  ['03 Tag Portal/library/life-at-ncet.jpg', 'Life at NCET', 'Branding Video', 'Shared', '#6A7286', true],
  ['03 Tag Portal/library/ncet-x-torii.jpg', 'NCET Collaboration with ToriiMinds', 'Branding Video', 'Shared', '#6A7286', true],
  ['03 Tag Portal/library/ad-decade-of-innovation.jpg', 'A decade of innovation', 'Print Ad', 'Technical Hub', '#2BA84A'],
  ['03 Tag Portal/library/placement-story.jpg', 'Placement success story', 'Branding Video', 'ToriiMinds', '#F5822A', true],
];
const FILM = '02 Our Own Brands/Torii Minds/Videos/04 Brand Films/02 Torii Brand Film 2.mp4';
const CARD3 = i => [290 + (i % 3) * 481, 244 + Math.floor(i / 3) * 394, 457, 260];
// the film: opened, played from a few seconds in, its link copied
const BL = { card: 1, open: 34.2, play: 36.1, from: 10, length: 79.3, copy: 40.2, close: 42.6 };
// a card's picture, inside the window: the grid starts at 290, 244; cards 337 wide, 24 apart
const CARD = i => [290 + (i % 4) * 361, 244 + Math.floor(i / 4) * 356, 337, 236];
const W2S = ([x, y]) => [x + WIN[0], y + WIN[1]];
// the two things opened: which card, and when it opens, picks a format, downloads and closes
const OPENS = [
  { k: 'tpl', card: 2, fmt: [1, 0], open: 10.9, pick: 15.2, dl: [16.45, 17.7], close: 19.2,
    say: ['Download PNG · 6 MB', 'Download PSD · 48 MB', 'Downloaded · ready to edit'] },
  { k: 'kit', card: 1, fmt: [0, 2], open: 23.3, pick: 26.4, dl: [27.5, 28.6], close: 30.2,
    say: ['Download PNG · 1 MB', 'Download brand kit · 12 MB', 'Downloaded · every version inside'] },
];
const PAGES = [[0, 'ov'], [7.3, 'tpl'], [20.3, 'assets'], [31.3, 'brand']];
const LIB_CURSOR = [
  [5, 1300, 640],
  [6.6, ...W2S([130, sideTop.tpl + 21])],
  [9.8, ...W2S([CARD(2)[0] + 168, CARD(2)[1] + 118])],
  [12.4, 1290, 560],
  [15, ...W2S([1040, 662])],                         // PSD
  [16.3, ...W2S([1200, 744])],                       // Download
  [18.4, 1500, 700],
  [20, ...W2S([130, sideTop.assets + 21])],
  [22.4, ...W2S([CARD(1)[0] + 168, CARD(1)[1] + 118])],
  [24.8, 1290, 560],
  [26.2, ...W2S([1344, 662])],                       // Brand kit
  [27.3, ...W2S([1200, 744])],                       // Download
  [29.2, 1500, 700],
  [31, ...W2S([130, sideTop.brand + 21])],
  [33.6, ...W2S([CARD3(BL.card)[0] + 228, CARD3(BL.card)[1] + 130])],
  [35.9, ...W2S([710, 365])],                        // play
  [37.8, 1385, 460],
  [40, ...W2S([1295, 704])],                         // Copy link
  [41.4, 1600, 780],
];
const LIB_CLICKS = [7.2, 10.8, 15.2, 16.4, 20.2, 23.2, 26.4, 27.4, 31.2, 34.1, 36, 40.2];
const LIB_END = 43.4;

function library(L) {
  const at = (a, b) => ` data-at="${a}"${b != null ? ` data-off="${b}"` : ''}`;
  const explorer = (cls, title, path, rows, gx, gy, d) => `
    <div class="ct-fx ${cls}"${at(d, 3.3)} style="--gx:${gx}px;--gy:${gy}px">
      <div class="ct-fx__bar">${ric('folder')}<b>${esc(title)}</b><i>—</i><i>☐</i><i>✕</i></div>
      <div class="ct-fx__path"><span>${path.map(esc).join(' <em>›</em> ')}</span><div class="ct-fx__find">${ric('search')}guru purnima<i class="spin"></i></div></div>
      ${rows.length ? rows.map(([n, m]) => `<div class="ct-fx__row">${ric('file')}<span>${esc(n)}</span><small>${esc(m)}</small></div>`).join('') : '<p>This folder is empty.</p>'}
    </div>`;
  // a repository page: its heading, tools and grid of cards
  const repo = (k, title, sub, what, items, t0, hero, logo) => `
    <div class="ct-page ${k}">
      <div class="ct-tp-head"><i></i><b>${esc(title)}</b><p>${esc(sub)}</p><span class="ct-up">+ Upload ${what}</span></div>
      <div class="ct-tp-tools"><div class="ct-search">${ric('search')}Search ${what.toLowerCase()}s...</div><span>All colleges${ric('chev')}</span><span>All Categories${ric('chev')}</span><span class="ct-view">${ric('grid')}</span></div>
      ${items.map(([src, name, cat, fmt, who, c], i) => { const [x, y] = CARD(i); return `
        <div class="ct-card${logo ? ' logo' : ''}${i === hero ? ' hero' : ''}"${A('up', (t0 + i * .09).toFixed(2), `left:${x - 260}px;top:${y - 64}px`)}><div class="ct-card__in">
          <div class="ct-card__img"><img src="${L(src)}" alt=""><span class="fmt">${fmt}</span><span class="who" style="--c:${c}"><i></i>${esc(who)}</span></div>
          <b>${esc(name)}</b><small>${esc(cat)}</small>
          <div class="ct-card__foot"><span>SA</span>${logo ? '07 Sep 2026' : '22 Aug 2026'}${ric('pen')}${ric('trash')}</div>
        </div></div>`; }).join('')}
    </div>`;
  // one thing opened: the dimmed console, the panel, the picture that zooms up from its card
  const opened = (o, body, zoom, fmts, toast) => {
    const [x, y, w, h] = CARD(o.card);
    return `
      <div class="ct-open ${o.k}" data-k="${o.k}">
        <i class="ct-dim"${at(o.open, o.close)}></i>
        <div class="ct-modal"${at(o.open + .15, o.close)}>
          <div class="ct-info">${body}
            <label class="f">Download as</label>
            <div class="ct-fmts">${fmts.map(([f, n]) => `<span data-f="${f}">${n}</span>`).join('')}</div>
            <div class="ct-dl">${ric('download')}<span>${esc(o.say[0])}</span></div>
          </div>
        </div>
        <div class="ct-zoom" style="--x:${x}px;--y:${y}px;--w:${w}px;--h:${h}px">${zoom}</div>
        <div class="ct-toast"${at(o.dl[1] + .2, o.close)}>${ric('check')}${esc(toast)}</div>
      </div>`;
  };
  const tpl = TEMPLATES[OPENS[0].card], kit = ASSETS[OPENS[1].card];
  const rows = (names, t0, mark) => names.map((n, i) => `<div class="ct-layer"${at((t0 + i * .32).toFixed(2))}>${ric(mark ? mark(i) : 'eye')}<i style="--k:${i}"></i><span>${esc(n)}</span>${!mark && (i === 1 || i === 2) ? '<em>T</em>' : ''}</div>`).join('');
  return {
    name: 'Everything in one place', hold: 48,
    title: 'Everything in one place',
    line: 'One Content tab for every college: its templates, its logos, its films.',
    html: `
      <div class="rl"><div class="rl-c"><div class="ct" data-page="ov">

        <!-- before: one file, hunted for across computers -->
        ${explorer('w1', 'Lab PC 03', ['This PC', 'D:', 'Marketing', 'old', 'New folder (2)'], [['poster_new (1).png', '12 Jul 2025'], ['guru_FINAL_v3.jpg', '03 Jul 2025'], ['final final 2.psd', '28 Jun 2025']], 260, 200, .3)}
        ${explorer('w2', "Designer's laptop", ['Downloads', 'WhatsApp Images'], [['IMG-20250712-WA0031.jpg', '12 Jul 2025'], ['IMG-20250712-WA0032.jpg', '12 Jul 2025'], ['guru purnima (copy).png', '10 Jul 2025']], -300, 200, .55)}
        ${explorer('w3', 'Pen drive (E:)', ['E:', 'backup 2024', 'misc'], [], 0, -160, .8)}
        <div class="ct-q"${at(1.3, 3.3)}><b>Where is last year's Guru Purnima file?</b><span>Lab PC 03? The designer's laptop? A pen drive?</span></div>

        <!-- t@g, as it looks once signed in -->
        <div class="ct-win"${at(3.7)}>
          <div class="ct-side">
            <div class="ct-logo">t<i>@</i>g<small>Digital pulse of NGI — admin</small></div>
            <i class="ct-group"${at(5.5, 8)} style="top:${sideTop.tpl - 6}px;height:${4 * 44 + 8}px"></i>
            ${SIDE.map(s => typeof s === 'string'
              ? `<span class="ct-lab" style="top:${sideTop[s]}px">${esc(s)}</span>`
              : `<div class="ct-nav" data-k="${s[0]}" style="top:${sideTop[s[0]]}px">${ric(s[2])}${esc(s[1])}</div>`).join('')}
          </div>
          <div class="ct-top">
            <span class="ct-pill">Administrator Console</span>
            <span class="ct-ai">${ric('spark')}Tago AI</span><span class="ct-tic">${ric('moon')}</span><span class="ct-tic bell">${ric('bell')}<i>9+</i></span>
            <span class="ct-me"><b>SA</b><span>Super Admin<small>Super Admin</small></span></span>
          </div>
          <div class="ct-main">
            <div class="ct-page ov">
              <div class="ct-hero">
                <small>Sunday, 1 November</small><b>Good afternoon, Super 👋</b><p>Platform-wide administration overview.</p>
                <span class="ct-sel">ToriiMinds${ric('chev')}</span>
              </div>
              <div class="ct-read">
                <div class="ct-read__head"><span class="ct-spark">${ric('spark')}</span><span><b>Tago's read on your numbers</b><small>AI insight from your live analytics</small></span><em>Refresh</em></div>
                <div class="ct-read__body">
                  <div class="ct-total">
                    <small>${ric('person')}Total followers</small>
                    <b data-count-to="4.2,5.8,4496">0</b>
                    <p>across 3 platforms <em>↑ +138 in 28 days</em></p>
                    ${[['LinkedIn', '4,014', '+135'], ['Instagram', '342', '—'], ['YouTube', '140', '+3']].map(([p, n, d]) => `<div>${brand(p)}<span>${p}</span><b>${n}</b><em>${d}</em></div>`).join('')}
                  </div>
                  <div class="ct-insight"><span>${brand('LinkedIn')}LinkedIn</span><p>ToriiMinds is excelling, especially on LinkedIn, while there is room for growth on YouTube.</p></div>
                </div>
                <div class="ct-aud"><small>Audience by platform</small>
                  ${[['LinkedIn', '4,014', '+135', 100, '#0A66C2'], ['Instagram', '342', 'no change', 9, '#E1306C'], ['YouTube', '140', '+3', 4, '#FF0000']].map(([p, n, d, w, c]) => `
                    <div class="ct-bar"><span>${brand(p)}${p}</span><b>${n}</b><em>${d}</em><i${at(4.6)} style="--w:${w}%;--c:${c}"></i></div>`).join('')}
                </div>
              </div>
            </div>
            ${repo('tpl', 'Template Repository', 'Reusable marketing templates for every campaign. Anyone can upload; only the super admin can remove.', 'Template', TEMPLATES, 7.6, OPENS[0].card)}
            <div class="ct-page brand">
              <div class="ct-tp-head"><i></i><b>Brand Library</b><p>Brand films, ads and videos, ready to share. Anyone can add; only the super admin can remove.</p><span class="ct-up">+ Add to Library</span></div>
              <div class="ct-tp-tools"><div class="ct-search">${ric('search')}Search the library...</div><span>All colleges${ric('chev')}</span><span>All types${ric('chev')}</span><span class="ct-view">${ric('grid')}</span></div>
              ${LIBRARY.map(([src, name, kind, who, c, film], i) => { const [x, y] = CARD3(i); return `
                <div class="ct-card bl${i === BL.card ? ' hero' : ''}"${A('up', (31.5 + i * .09).toFixed(2), `left:${x - 260}px;top:${y - 64}px`)}><div class="ct-card__in">
                  <div class="ct-card__img"><img src="${L(src)}" alt=""><span class="kind">${esc(kind)}</span>${film ? '<span class="fmt">VIDEO</span><i class="ct-play"></i>' : ''}<span class="who" style="--c:${c}"><i></i>${esc(who)}</span></div>
                  <b>${esc(name)}</b>
                  <div class="ct-bl-foot"><span>${ric(film ? 'link' : 'download')}${film ? 'Open link' : 'View / download'}</span>${ric('trash')}</div>
                </div></div>`; }).join('')}
            </div>
            ${repo('assets', 'Asset Repository', 'Reusable branding assets and brand kit. Anyone can upload; only the super admin can remove.', 'Asset', ASSETS, 20.5, OPENS[1].card, true)}
          </div>

          <!-- a template, opened: it comes to life, its layers listed, its PSD downloaded -->
          ${opened(OPENS[0], `
            <div class="ct-chips"><span class="fmt">PSD · layered</span><span class="who"><i></i>${esc(tpl[4])}</span></div>
            <b>Guru Purnima</b>
            <small>${esc(tpl[2])} · uploaded by Super Admin · 22 Aug 2026</small>
            <label>Layers</label>
            ${rows(['Torii logo', 'GURU · headline', 'Purnima · script', 'Guru silhouette', 'Full moon', 'Background · temple at dusk'], 12.1)}`,
            `<img src="${L(tpl[0])}" alt="">`,
            [['psd', 'PSD'], ['png', 'PNG'], ['jpg', 'JPG']],
            'guru-purnima.psd saved: open it, change the date, done.')}

          <!-- a logo, opened as a brand kit: on light, on dark, in one colour -->
          ${opened(OPENS[1], `
            <div class="ct-chips"><span class="fmt">PNG · transparent</span><span class="who" style="--c:${kit[5]}"><i></i>${esc(kit[4])}</span></div>
            <b>NGI logo</b>
            <small>Logos · uploaded by Super Admin · 07 Sep 2026</small>
            <label>In the brand kit</label>
            ${rows(['Full colour · PNG', 'White · for dark backgrounds', 'One colour · for print', 'Vector · SVG and AI', 'Clear space and sizes · PDF'], 24.6, () => 'check')}`,
            `<div class="k-main"><img src="${L(kit[0])}" alt=""></div>
             <div class="k-tile dark"${at(24.5)}><img src="${L(kit[0])}" alt=""><small>White</small></div>
             <div class="k-tile mono"${at(24.75)}><img src="${L(kit[0])}" alt=""><small>One colour</small></div>`,
            [['png', 'PNG'], ['svg', 'SVG'], ['zip', 'Brand kit']],
            'ngi-brand-kit.zip saved: the right logo, every time.')}

          <!-- the brand film, opened: it plays, then its link is copied to share -->
          ${(() => { const [x, y, w, h] = CARD3(BL.card), f = LIBRARY[BL.card]; return `
          <div class="ct-open vid">
            <i class="ct-dim"${at(BL.open, BL.close)}></i>
            <div class="ct-modal"${at(BL.open + .15, BL.close)}>
              <div class="ct-player-bar"><i><b></b></i><span>0:00 / 1:19</span></div>
              <div class="ct-ready"><small>Ready for</small>${['LinkedIn', 'Instagram', 'YouTube', 'Facebook'].map((p, i) => `<span${at((36.6 + i * .15).toFixed(2))}>${brand(p)}${p}</span>`).join('')}<span${at(37.2)}>${ric('grid')}Website</span><span${at(37.35)}>${ric('camera')}Event screens</span></div>
              <div class="ct-info">
                <div class="ct-chips"><span class="fmt">Branding Video</span><span class="who" style="--c:${f[4]}"><i></i>${esc(f[3])}</span></div>
                <b>${esc(f[1])}</b>
                <small>Brand films · added by Super Admin · 1080p</small>
                <label>Use it for</label>
                ${['Admissions and open days', 'College websites', 'Pitches to companies', 'Every social page'].map((n, i) => `<div class="ct-layer"${at((37 + i * .32).toFixed(2))}>${ric('check')}<span>${esc(n)}</span></div>`).join('')}
                <div class="ct-mp4">${ric('download')}Download MP4</div>
                <div class="ct-dl ct-copy">${ric('link')}<span>Copy link</span></div>
              </div>
            </div>
            <div class="ct-zoom film" style="--x:${x}px;--y:${y}px;--w:${w}px;--h:${h}px">
              <video src="${L(FILM)}" muted playsinline preload="auto"></video><img src="${L(f[0])}" alt=""><i class="ct-play"></i>
            </div>
            <div class="ct-toast"${at(BL.copy + .2, BL.close)}>${ric('check')}Link copied: paste it on the website, in a mail, anywhere.</div>
          </div>`; })()}

          <!-- the point of it -->
          <i class="ct-dim end"${at(LIB_END)}></i>
          <div class="ct-end"${at(LIB_END + .2)}>
            <b>Every template, logo and film, in one place.</b>
            <p>No more searching five computers for one file.</p>
            <div>${['Templates', 'Assets', 'Brand Library', 'Events'].map((n, i) => `<span class="${i < 3 ? 'seen' : ''}"${at((LIB_END + .8 + i * .15).toFixed(2))}>${ric(['template', 'box', 'image', 'camera'][i])}${n}</span>`).join('')}</div>
          </div>
        </div>

        <div class="fl-cursor ct-cursor" style="--c:#F5822A"><svg viewBox="0 0 24 24"><path d="M5 2.5 V19 L9.2 15 L12.2 21.5 L14.8 20.3 L11.9 14 L17.8 13.8 Z"/></svg><em>ToriiMinds</em></div>
      </div></div></div>`,

    tick(t, el) {
      const root = el.querySelector('.ct');
      const page = PAGES.filter(([s]) => t >= s).pop()[1];
      if (root.dataset.page !== page) root.dataset.page = page;
      root.querySelectorAll('[data-at]').forEach(e => e.classList.toggle('on', t >= +e.dataset.at && !(e.dataset.off && t >= +e.dataset.off)));
      root.querySelectorAll('[data-off]').forEach(e => e.classList.toggle('off', t >= +e.dataset.off));
      root.querySelectorAll('[data-count-to]').forEach(e => {
        const [a, b, to] = e.dataset.countTo.split(',').map(Number);
        e.textContent = Math.round(to * ease(clamp((t - a) / (b - a)))).toLocaleString('en-US');
      });
      // the sidebar follows the page; the next tab lights as the cursor reaches it
      root.querySelectorAll('.ct-nav').forEach(n => {
        n.classList.toggle('act', n.dataset.k === page);
        n.classList.toggle('hov', (n.dataset.k === 'tpl' && t > 6.5 && t < 7.3) || (n.dataset.k === 'assets' && t > 19.9 && t < 20.3) || (n.dataset.k === 'brand' && t > 30.9 && t < 31.3));
      });
      // each opened thing: its card lifts, its picture zooms up, a format is picked, it downloads
      OPENS.forEach(o => {
        const box = root.querySelector(`.ct-open.${o.k}`);
        root.querySelector(`.ct-page.${o.k === 'tpl' ? 'tpl' : 'assets'} .ct-card.hero`).classList.toggle('hov', t > o.open - 1.3 && t < o.open);
        const z = box.querySelector('.ct-zoom');
        z.classList.toggle('on', t >= o.open && t < o.close + .7);
        z.classList.toggle('big', t >= o.open + .05 && t < o.close);
        z.classList.toggle('live', t >= o.open + .9 && t < o.close);
        const f = o.fmt[t >= o.pick ? 1 : 0];
        box.querySelectorAll('.ct-fmts span').forEach((s, i) => s.classList.toggle('sel', i === f));
        const dl = box.querySelector('.ct-dl'), [d0, d1] = o.dl, p = clamp((t - d0) / (d1 - d0));
        dl.style.setProperty('--p', `${(p * 100).toFixed(1)}%`);
        dl.classList.toggle('done', t >= d1);
        const label = t >= d1 ? o.say[2] : t >= d0 ? `Downloading… ${Math.round(p * 100)}%` : o.say[t >= o.pick ? 1 : 0];
        const sp = dl.querySelector('span');
        if (sp.textContent !== label) sp.textContent = label;
      });
      // the film: its card lifts, it zooms up, plays in time with the clock, its link is copied
      const vb = root.querySelector('.ct-open.vid'), fz = vb.querySelector('.ct-zoom'), v = fz.querySelector('video');
      root.querySelector('.ct-card.bl.hero').classList.toggle('hov', t > BL.open - 1.3 && t < BL.open);
      fz.classList.toggle('on', t >= BL.open && t < BL.close + .7);
      fz.classList.toggle('big', t >= BL.open + .05 && t < BL.close);
      fz.classList.toggle('live', t >= BL.open + .9 && t < BL.play);
      const playing = t >= BL.play && t < BL.close;
      fz.classList.toggle('playing', playing);
      if (playing) {
        const want = BL.from + t - BL.play;
        if (Math.abs(v.currentTime - want) > .8) v.currentTime = want;
        if (v.paused) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
      const pos = playing ? BL.from + t - BL.play : 0, mmss = n => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
      vb.querySelector('.ct-player-bar b').style.width = `${(pos / BL.length * 100).toFixed(2)}%`;
      const tl = `${mmss(pos)} / ${mmss(BL.length)}`, ts = vb.querySelector('.ct-player-bar span');
      if (ts.textContent !== tl) ts.textContent = tl;
      const cp = vb.querySelector('.ct-copy');
      cp.classList.toggle('done', t >= BL.copy);
      const cl = t >= BL.copy ? 'Link copied' : 'Copy link';
      if (cp.querySelector('span').textContent !== cl) cp.querySelector('span').textContent = cl;
      // the cursor
      const c = root.querySelector('.ct-cursor');
      let x = LIB_CURSOR[0][1], y = LIB_CURSOR[0][2];
      for (let j = 1; j < LIB_CURSOR.length; j++) {
        const [ta, tx, ty] = LIB_CURSOR[j], [, px, py] = LIB_CURSOR[j - 1];
        if (t < ta - MOVE) break;
        const k = ease(clamp((t - (ta - MOVE)) / MOVE));
        x = px + (tx - px) * k; y = py + (ty - py) * k;
      }
      c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      c.classList.toggle('on', t > 4.8 && t < 41.6);
      c.classList.toggle('click', LIB_CLICKS.some(s => t >= s && t < s + .35));
    },
  };
}

export function roleChapters(D, L) {
  const R = D.roles;
  const steps = D.steps;
  const tree = hierarchy(D, R);

  return [
    /* 1 · Who logs in */
    {
      name: 'Who logs in', hold: 12,
      title: 'Who logs in',
      line: 'One admin, three schools, one manager, and the team they assign.',
      html: `<div class="rl"><div class="rl-c">${tree.html}</div></div>`,
      tick(t, el) {
        const root = el.querySelector('.rl-h');
        if (root.dataset.wired) return;
        root.dataset.wired = '1';
        // hover a card: its whole path stays lit, everything else steps back
        const up = id => tree.links.filter(l => l.to === id).flatMap(l => [l, ...up(l.from)]);
        const down = id => tree.links.filter(l => l.from === id).flatMap(l => [l, ...down(l.to)]);
        const lit = root.querySelectorAll('.rl-h-link');
        root.addEventListener('mouseover', e => {
          const n = e.target.closest('[data-node]');
          if (!n) return;
          const line = [...up(n.dataset.node), ...down(n.dataset.node)];
          const ids = new Set([n.dataset.node, ...line.flatMap(l => [l.from, l.to])]);
          root.classList.add('focus');
          root.querySelectorAll('[data-node]').forEach(x => { x.classList.toggle('hot', ids.has(x.dataset.node)); x.classList.toggle('me', x === n); });
          lit.forEach(p => p.classList.toggle('hot', line.includes(tree.links[+p.dataset.i])));
        });
        root.addEventListener('mouseleave', () => {
          root.classList.remove('focus');
          root.querySelectorAll('.hot, .me').forEach(x => x.classList.remove('hot', 'me'));
        });
      },
    },

    /* 2 · What each login can do: one phone a role, showing what it sees once signed in
       (2026-11-01: "more premium ... a new design"). A spotlight walks from role to role;
       hovering a phone holds the spotlight on it. */
    {
      name: 'What each login can do', hold: 14,
      title: 'What each login can do',
      line: 'Every role sees only what its job needs.',
      html: `
        <div class="rl"><div class="rl-c"><div class="lg">
          ${Object.values(R).map((r, i) => `
            <div class="lg-phone" data-i="${i}"${A('rise', .3 + i * .18, `left:${100 + i * 350}px;--c:${r.color}`)}>
              <div class="lg-body"><div class="lg-screen">
                <div class="lg-status"><b>9:41</b><i></i><span>t@g</span></div>
                <div class="lg-top">
                  <span class="lg-av">${ric(r.icon)}</span>
                  <small>Signed in as</small>
                  <b>${esc(r.name)}</b>
                  <em>${esc(r.tag)}</em>
                </div>
                <div class="lg-can"><small>You can</small>
                  ${r.can.map(c => `<div>${ric('check')}<span>${esc(c)}</span><i>›</i></div>`).join('')}
                </div>
                <div class="lg-sees">${ric('eye')}<span><small>You see</small>${esc(r.sees)}</span></div>
                <div class="lg-lock">${ric('lock')}Everything else stays locked</div>
              </div></div>
            </div>`).join('')}
          <p class="rl-note"${A('up', 3.4)}>${ric('lock')}The boundary is enforced on the server, for every single request.</p>
        </div></div></div>`,
      tick(t, el) {
        const root = el.querySelector('.lg');
        if (!root.dataset.wired) {
          root.dataset.wired = '1';
          root.addEventListener('mouseover', e => { const p = e.target.closest('.lg-phone'); if (p) root.dataset.pin = p.dataset.i; });
          root.addEventListener('mouseleave', () => { delete root.dataset.pin; });
        }
        const n = Object.keys(R).length;
        const at = root.dataset.pin != null ? +root.dataset.pin : t < 2.8 ? -1 : Math.floor((t - 2.8) / 2.2) % n;
        root.classList.toggle('spot', at >= 0);
        root.querySelectorAll('.lg-phone').forEach((p, i) => p.classList.toggle('on', i === at));
      },
    },

    /* 3 · One request, five steps: one real poster, from the brief to the feed */
    story(D, R, L),

    /* 4 · Everything in one place: t@g's Content tab, Templates opened */
    library(L),

    /* 5 · Publish, or schedule */
    {
      name: 'Publish, or schedule', hold: 13,
      title: 'Publish, or schedule',
      line: 'One piece of work, written separately for every channel.',
      html: `
        <div class="rl"><div class="rl-c">
          <div class="rl-handler"${A('up', .3)}>
            ${badge(R.handler, 'big')}<b>${esc(R.handler.name)}</b><small>Writes the copy, then puts it out</small>
            <p${A('fade', 5.6)}>${ric('gates')}The copy is cleared twice too: by the group, then the college.</p>
          </div>
          <div class="rl-channels">${D.channels.map(([p, text], i) => `
            <div class="rl-chan"${A('up', .8 + i * .35)}>
              <div>${pchip(p)}<b>${p}</b></div>
              <p data-type="${esc(text)}" data-d="${(1.4 + i * 1).toFixed(1)}"></p>
            </div>`).join('')}
          </div>
          <div class="rl-when"${A('up', 6)}>
            <span class="now">Publish now</span>
            <span class="later">${ric('clock')}Schedule · Sun, 9:00 PM</span>
            <span class="rl-posted">${ric('check')}Posted · goes out by itself, on time</span>
          </div>
        </div></div>`,
      tick(t, el) {
        el.querySelector('.rl-when').classList.toggle('picked', t > 7.2);
        el.querySelector('.rl-when').classList.toggle('posted', t > 9);
      },
    },
  ];
}
