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

    /* 4 · The approval loop */
    {
      name: 'The approval loop', hold: 13,
      title: 'The approval loop',
      line: 'Changes are written as a checklist, not an argument.',
      html: `
        <div class="rl"><div class="rl-c">
          <div class="rl-poster"${A('up', .3)}>
            <div class="rl-poster__head">${badge(R.designer)}<span><b>${esc(R.designer.name)}</b><small class="ver"><i>Version 1</i><i>Version 2</i></small></span></div>
            <div class="rl-poster__art"><i></i><i></i><i></i><i></i><span>${esc(D.request.title)}</span></div>
            <div class="rl-stamp">${ric('check')}Approved</div>
          </div>
          <svg class="rl-lines" viewBox="0 0 1920 1080">
            <path class="tr-draw rl-arrow" pathLength="1" style="--d:1.2s" d="M 640 420 H 730"/>
            <path class="tr-draw rl-arrow back" pathLength="1" style="--d:5.4s" d="M 960 840 C 960 930, 400 930, 400 850"/>
          </svg>
          <div class="rl-review"${A('up', 1.4)}>
            <div class="rl-review__head">${badge(R.admin)}<span><b>Admin review</b><small>Round <em class="r1">1</em><em class="r2">2</em></small></span></div>
            ${D.changes.map(([k, v], i) => `
              <div class="rl-change k${i}"${A('left', 2.2 + i * .6)}><span>${esc(k)}</span><b>${esc(v)}</b>${ric('check', 'fix')}</div>`).join('')}
            <div class="rl-review__btns"${A('up', 4.2)}><span class="send">${ric('back')}Send back</span><span class="ok">${ric('check')}Approve</span></div>
          </div>
          <div class="rl-round"${A('fade', 5.8)}>Round 2: the designer fixes each point</div>
          <div class="rl-learn"${A('up', 9.6)}>
            <small>Because every round is counted</small>
            <div><b>Right first time?</b><span>Measured for every design</span></div>
            <div><b>What keeps recurring?</b><span>Image, content or other</span></div>
            <div><b>How long, end to end?</b><span>From raised to delivered</span></div>
          </div>
        </div></div>`,
      tick(t, el) {
        el.querySelector('.rl-poster').classList.toggle('v2', t > 6.4);
        el.querySelector('.rl-review').classList.toggle('r2', t > 6.4);
        el.querySelectorAll('.rl-change').forEach((c, i) => c.classList.toggle('fixed', t > 6.8 + i * .5));
        el.querySelector('.rl-review__btns').classList.toggle('sent', t > 4.8 && t < 6.4);
        el.querySelector('.rl-review__btns').classList.toggle('approved', t > 8.6);
        el.querySelector('.rl-stamp').classList.toggle('on', t > 8.9);
      },
    },

    /* 5 · Accept, then the fork */
    {
      name: 'Accept, then the fork', hold: 12,
      title: 'Accept, then the fork',
      line: 'Approved is not finished. The college that asked has the final say.',
      html: `
        <div class="rl"><div class="rl-c">
          <div class="rl-accept"${A('up', .3)}>
            <div class="rl-accept__head">${badge(R.coord)}<span><b>${esc(R.coord.name)}</b><small>${esc(D.request.from)}</small></span></div>
            <p>Is this what we asked for?</p>
            <div class="rl-accept__btns"><span>Decline</span><span class="yes">${ric('check')}Accept</span></div>
          </div>
          <svg class="rl-lines" viewBox="0 0 1920 1080">
            <path class="tr-draw rl-arrow" pathLength="1" style="--d:3.2s" d="M 660 500 H 820 C 940 500, 940 300, 1080 300"/>
            <path class="tr-draw rl-arrow" pathLength="1" style="--d:3.6s" d="M 820 500 C 940 500, 940 700, 1080 700"/>
          </svg>
          <div class="rl-dest d1"${A('left', 4.4, `--c:${R.handler.color}`)}>
            <small>Goes to a page</small>
            <div>${badge(R.handler)}<span><b>${esc(D.fork.social.title)}</b><i>${esc(D.fork.social.text)}</i></span></div>
          </div>
          <div class="rl-dest d2"${A('left', 5.4, `--c:${R.coord.color}`)}>
            <small>Has no page</small>
            <div><span class="rl-ic" style="--c:#0F9D6E">${ric('check')}</span><span><b>${esc(D.fork.other.title)}</b><i>${esc(D.fork.other.text)}</i></span></div>
          </div>
          <p class="rl-note"${A('up', 7.6)}>${ric('clock')}A coordinator can't raise a new request while finished work waits on them.</p>
        </div></div>`,
      tick(t, el) { el.querySelector('.rl-accept').classList.toggle('yes', t > 2.4); },
    },

    /* 6 · Publish, or schedule */
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

    /* 7 · The rules */
    {
      name: 'The rules', hold: 12,
      title: 'The rules that keep it honest',
      line: 'Built so nothing goes unaccounted for.',
      html: `
        <div class="rl"><div class="rl-c">
          <div class="rl-rules">${D.rules.map(([ic, title, text], i) => `
            <div class="rl-rule"${A('rise', .3 + i * .35)}>
              <span class="rl-ic" style="--c:${['#F5822A', '#4B5BA8', '#6C5CE7', '#138A8A', '#141E3C', '#E0294A'][i % 6]}">${ric(ic)}</span>
              <b>${esc(title)}</b><p>${esc(text)}</p>
            </div>`).join('')}
          </div>
        </div></div>`,
    },
  ];
}
