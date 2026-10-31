// t@g roles and flow, played like a film in the same frame as the monthly report
// (js/tagreport.js plays it). Who logs in, what each login can do, and how one
// request travels through them: raised, designed, approved, accepted, published.
// The words come from content/03 Tag Portal/roles.json.

import { A, N, esc, icon, clamp } from './tagreport.js';

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
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V12 L15 14"/>',
};
const ric = (name, cls = '') => `<svg class="rl-svg ${cls}" viewBox="0 0 24 24">${RICON[name] || RICON.person}</svg>`;
const badge = (r, cls = '') => `<span class="rl-ic ${cls}" style="--c:${r.color}">${ric(r.icon)}</span>`;
const PLATFORM = { LinkedIn: ['in', '#0A66C2'], Instagram: ['IG', '#C2367E'], YouTube: ['YT', '#E62117'], Facebook: ['f', '#1877F2'] };
const pchip = p => `<span class="tr-pf" style="background:${PLATFORM[p][1]}">${PLATFORM[p][0]}</span>`;

// A role's card in the tree: icon, name, a short line
const node = (r, sub, d, x, y, w, cls = '') => `
  <div class="rl-node ${cls}"${A('up', d, `left:${x}px;top:${y}px;width:${w}px;--c:${r.color}`)}>
    ${badge(r)}<span><b>${esc(r.name)}</b><small>${esc(sub)}</small></span>
  </div>`;

export function roleChapters(D) {
  const R = D.roles;
  const steps = D.steps;
  const X = k => 200 + k * 380;          // where each step sits on the track (1920 wide)

  return [
    /* 1 · Who logs in */
    {
      name: 'Who logs in', hold: 12,
      title: 'Who logs in',
      line: 'One owner at the top, an admin for each college, and the team under them.',
      html: `
        <div class="rl"><div class="rl-c">
          <svg class="rl-lines" viewBox="0 0 1920 1080">
            <path class="tr-draw" pathLength="1" style="--d:1s" d="M 960 196 V 270 M 440 270 H 1560 M 440 270 V 330 M 840 270 V 330 M 1240 270 V 330 M 1560 270 V 344"/>
            <path class="tr-draw" pathLength="1" style="--d:3.4s" d="M 440 430 V 560 M 840 430 V 560 M 1240 430 V 560 M 440 560 H 1440 M 480 560 V 620 M 960 560 V 620 M 1440 560 V 620"/>
          </svg>
          ${node(R.super, R.super.tag + ' · one account', .3, 730, 76, 460, 'big')}
          ${D.colleges.map((c, i) => node(R.admin, c, 2 + i * .25, 260 + i * 400, 330, 360)).join('')}
          <div class="rl-more"${A('pop', 2.8, 'left:1460px;top:344px')}>${esc(D.moreColleges)}</div>
          ${node(R.coord, 'One in every college', 4.4, 270, 620, 420)}
          ${node(R.designer, 'One shared board for all', 4.7, 750, 620, 420)}
          ${node(R.handler, 'Runs the pages', 5, 1230, 620, 420)}
          <div class="rl-counts">${D.counts.map(([v, k], i) => `<div${A('up', 6.4 + i * .2)}>${N(v, 6.6 + i * .2)}<span>${esc(k)}</span></div>`).join('')}</div>
        </div></div>`,
    },

    /* 2 · What each login can do */
    {
      name: 'What each login can do', hold: 14,
      title: 'What each login can do',
      line: 'Every role sees only what its job needs.',
      html: `
        <div class="rl"><div class="rl-c">
          <div class="rl-roles">${Object.values(R).map((r, i) => `
            <div class="rl-role"${A('rise', .3 + i * .3, `--c:${r.color}`)}>
              <div class="rl-role__top"><span class="rl-ic white">${ric(r.icon)}</span><b>${esc(r.name)}</b><small>${esc(r.tag)}</small></div>
              <ul>${r.can.map((c, j) => `<li${A('left', 2 + i * .3 + j * .45)}>${ric('check', 'tick')}${esc(c)}</li>`).join('')}</ul>
              <div class="rl-role__sees"${A('fade', 4.4 + i * .3)}>${ric('eye')}<span><small>Sees</small>${esc(r.sees)}</span></div>
            </div>`).join('')}
          </div>
          <p class="rl-note"${A('up', 7.2)}>${ric('lock')}The boundary is enforced on the server, for every single request.</p>
        </div></div>`,
    },

    /* 3 · One request, five steps */
    {
      name: 'One request, five steps', hold: 15,
      title: 'One request, five steps',
      line: 'At every moment, one named owner.',
      html: `
        <div class="rl"><div class="rl-c">
          <div class="rl-track"${A('fade', .2)}><i class="rl-track__fill"></i></div>
          ${steps.map((s, k) => {
            const r = R[s.role];
            return `
            <div class="rl-step" data-k="${k}"${A('up', .4 + k * .2, `left:${X(k) - 160}px;--c:${r.color}`)}>
              <span class="rl-step__dot">${ric(r.icon)}<em>${k + 1}</em></span>
              <small>${esc(r.name)}</small><b>${esc(s.title)}</b><i>${esc(s.text)}</i>
            </div>`;
          }).join('')}
          <div class="rl-token"${A('zoom', 1.2)}>
            <span class="rl-token__doc">${ric('log')}</span>
            <span class="rl-token__body"><b>${esc(D.request.title)}</b><small>${esc(D.request.from)} · ${esc(D.request.due)}</small></span>
            <span class="rl-token__who"><i></i><span></span></span>
          </div>
        </div></div>`,
      tick(t, el) {
        // the request rests at each step for a moment, then moves on to the next owner
        const s = clamp((t - 2) / 2.2, 0, steps.length - 1 + .001);
        const k = Math.min(steps.length - 1, Math.floor(s)), f = ease(clamp((s - k) / .45));
        const x = X(k) + (k < steps.length - 1 ? f * 380 : 0);
        const at = f > .5 && k < steps.length - 1 ? k + 1 : k;
        const tok = el.querySelector('.rl-token');
        tok.style.left = `${(x - 190).toFixed(1)}px`;
        el.querySelector('.rl-track__fill').style.width = `${((x - X(0)) / (X(4) - X(0)) * 100).toFixed(2)}%`;
        el.querySelectorAll('.rl-step').forEach((n, i) => { n.classList.toggle('on', i === at); n.classList.toggle('done', i < at); });
        const done = t > 2 + 2.2 * 4 + 1.6;
        const r = R[steps[at].role];
        const who = tok.querySelector('.rl-token__who');
        who.style.setProperty('--c', done ? '#0F9D6E' : r.color);
        who.querySelector('span').textContent = done ? 'Posted' : `With ${r.name}`;
        who.classList.toggle('posted', done);
      },
    },

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
