// The t@g monthly report, played like a film.
// It walks through the Branding & Marketing report t@g writes by itself: choosing
// the period, the cover, the timeline, the overview, every college side by side,
// one college's own page, then every organisation and the PDF it arrives as.
// It plays in a large rounded frame under a short heading for each part; every
// number counts up and every chart grows in. Chapters play on by themselves; Next / Prev skip between them,
// and Space pauses and carries on.
// The numbers come from content/03 Tag Portal/report.json.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 3);
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = v => Number(v).toLocaleString('en-US');

// An element that animates in when its chapter starts: kind, then delay in seconds
export const A = (kind, d, style = '') => ` data-a="${kind}" style="--d:${d}s;${style}"`;
// A number that counts up from 0 at a given second
export const N = (value, d) => `<b data-count="${esc(value)}" data-d="${d}">${esc(value)}</b>`;

import { brand } from './brands.js';

// the networks the report covers, each shown with its own logo
const PLATFORMS = ['LinkedIn', 'Instagram', 'YouTube', 'Facebook'];
const chip = name => brand(name, 'tr-pf');

const ICON = {
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19 C4 15.5 6.3 13.8 9 13.8 C11.7 13.8 14 15.5 14.5 19"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 13.9 C18.3 13.7 20.2 15.4 20.6 18"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20 C5.6 15.8 8.4 13.9 12 13.9 C15.6 13.9 18.4 15.8 19 20"/>',
  pulse: '<path d="M3 12 H7 L9.5 6 L13.5 18 L16 12 H21"/>',
  star: '<path d="M12 4 L14.3 9 L19.6 9.5 L15.6 13 L16.8 18.3 L12 15.5 L7.2 18.3 L8.4 13 L4.4 9.5 L9.7 9 Z"/>',
  layers: '<path d="M12 4 L20 8.5 L12 13 L4 8.5 Z"/><path d="M4 12.5 L12 17 L20 12.5"/>',
  share: '<circle cx="17" cy="6" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.7 10.8 L14.8 7.2 M8.7 13.2 L14.8 16.8"/>',
  check: '<path d="M5 12.5 L10 17.5 L19 7"/>',
  bulb: '<path d="M9 17 H15 M10 20 H14 M12 4 C8.7 4 6.5 6.4 6.5 9.4 C6.5 11.6 7.8 12.8 9 14 V16 H15 V14 C16.2 12.8 17.5 11.6 17.5 9.4 C17.5 6.4 15.3 4 12 4 Z"/>',
  alert: '<path d="M12 4 L21 19.5 H3 Z"/><path d="M12 10 V14 M12 16.8 V17"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10 H20 M8.5 3.5 V7 M15.5 3.5 V7"/>',
  plus: '<path d="M12 5 V19 M5 12 H19"/>',
  pdf: '<path d="M6 3.5 H14.5 L19 8 V20.5 H6 Z M14 3.5 V8.5 H19"/><path d="M9 13 H16 M9 16.5 H14"/>',
};
export const icon = (name, cls = '') => `<svg class="tr-ic ${cls}" viewBox="0 0 24 24">${ICON[name]}</svg>`;

/* ---------- The chapters ---------- */

function pageHead(L, D, title) {
  return `
    <header class="tr-head"${A('fade', 0)}>
      <img class="tr-head__ngi" src="${L(D.groupLogo)}" alt="">
      <div class="tr-head__title">${esc(title)}</div>
      <div class="tr-head__tag"><img src="${L('Logos/tag-portal.png')}" alt="t@g"><small>by Toriiminds LLP</small></div>
    </header>
    <div class="tr-rule"${A('grow', .2)}></div>`;
}

const notesCards = (notes, d0, cls = '') => [
  ['positives', 'Positives', 'check', 'good'], ['improvements', 'Improvements', 'bulb', 'warn'], ['critical', 'Critical', 'alert', 'bad'],
].map(([key, title, ic, tone], i) => `
  <div class="tr-note ${tone} ${cls}"${A('up', d0 + i * .25)}>
    <h4>${icon(ic)}${title}</h4>
    <ul>${(notes[key] || []).map((t, j) => `<li${A('left', d0 + .5 + i * .25 + j * .3)}>${esc(t)}</li>`).join('')}</ul>
  </div>`).join('');

function chapters(D, L) {
  const F = D.focus;
  const ncet = D.colleges.find(c => c.name === F.name) || D.colleges[0];
  const maxAudience = Math.max(...D.colleges.map(c => c.followers));
  const maxLikes = Math.max(...D.colleges.map(c => c.likes));
  const maxCell = Math.max(...D.colleges.flatMap(c => Object.values(c.platforms)));

  return [
    /* 1 · Set the timeline, one click */
    {
      name: 'Set the timeline', hold: 11,
      title: 'Set the timeline',
      line: 'Choose the dates and the colleges. Click once.',
      html: `
        <div class="tr-gen">
          <div class="tr-form"${A('zoom', .1)}>
            <div class="tr-form__head">
              <img src="${L('Logos/tag-portal.png')}" alt="t@g">
              <div><h3>Branding &amp; Marketing report</h3><p>Choose what the report covers</p></div>
            </div>
            <label${A('up', .5)}>Report period</label>
            <div class="tr-dates"${A('up', .6)}>
              <div class="tr-input">${icon('calendar')}<span data-type="${esc(D.from)}" data-d="1"></span><i class="tr-caret"></i></div>
              <em>→</em>
              <div class="tr-input">${icon('calendar')}<span data-type="${esc(D.to)}" data-d="1.9"></span></div>
            </div>
            <label${A('up', 2.7)}>Organisations</label>
            <div class="tr-chips">${D.colleges.map((c, i) => `<span class="tr-pick"${A('pop', 3 + i * .17)}>${icon('check')}${esc(c.name)}</span>`).join('')}</div>
            <label${A('up', 4.2)}>Social media</label>
            <div class="tr-chips">${PLATFORMS.map((p, i) => `<span class="tr-pick"${A('pop', 4.4 + i * .15)}>${chip(p)}${p}</span>`).join('')}</div>
            <button class="tr-go"${A('up', 5)}><span class="a">Generate report</span><span class="b">Reading live data…</span><span class="c">${icon('check')}Report ready</span><i></i></button>
          </div>
          <svg class="tr-cursor" viewBox="0 0 24 24"><path d="M5 3 L5 19 L9.4 15 L12.4 21.5 L15 20.3 L12 14 L18 14 Z"/></svg>
        </div>`,
      tick(t, el) {
        const go = el.querySelector('.tr-go');
        go.classList.toggle('is-press', t > 6.2 && t < 6.45);
        go.classList.toggle('is-busy', t >= 6.45 && t < 8.9);
        go.classList.toggle('is-done', t >= 8.9);
        go.querySelector('i').style.transform = `scaleX(${clamp((t - 6.45) / 2.4).toFixed(3)})`;
      },
    },

    /* 2 · The cover */
    {
      name: 'The cover', hold: 10,
      title: 'The cover',
      line: 'The period, and the four numbers that matter most.',
      html: `
        <div class="tr-cover">
          <div class="tr-cover__top"${A('fade', 0)}>
            <img class="ngi" src="${L(D.groupLogo)}" alt="NGI">
            <div class="tag"><img src="${L('Logos/tag-portal.png')}" alt="t@g"><small>by Toriiminds LLP</small><b>Confidential</b><span>For institutional use only</span></div>
          </div>
          <div class="tr-cover__body">
            <i class="tr-orb a"></i><i class="tr-orb b"></i>
            <div class="tr-cover__kicker"${A('left', .4)}>Performance review</div>
            <h1><span${A('up', .6)}>Branding &amp;</span><span${A('up', .8)}>Marketing</span><span class="lt"${A('up', 1)}>Report</span></h1>
            <div class="tr-cover__pill"${A('up', 1.5)}>${esc(D.period)}</div>
            <div class="tr-cover__meta"${A('fade', 1.8)}>${D.days} days · ${D.colleges.length} institutions · All social media accounts</div>
            <div class="tr-cover__bars">${[52, 100, 34, 40, 74].map((h, i) => `<span class="tr-bar v${i === 1 ? ' hot' : ''}"><i style="--h:${h}%;--d:${(1.2 + i * .15).toFixed(2)}s"></i></span>`).join('')}</div>
            <div class="tr-cover__glance">
              <div class="tr-cover__label"${A('fade', 3.6)}>At a glance</div>
              <div class="row">${D.glance.map((g, i) => `
                <div class="tr-gl"${A('up', 3.8 + i * .2, `--c:${g.color}`)}>${N(g.value, 4 + i * .2)}<span>${esc(g.label)}</span></div>`).join('')}
              </div>
            </div>
            <div class="tr-cover__scope">
              <div class="tr-cover__label"${A('fade', 5.4)}>Institutions in scope</div>
              <div class="chips">${D.colleges.map((c, i) => `<span${A('pop', 5.6 + i * .14)}>${esc(c.name)}</span>`).join('')}</div>
            </div>
          </div>
        </div>`,
    },

    /* 3 · The timeline */
    {
      name: 'The timeline', hold: 10.5,
      title: 'Week by week',
      line: 'What was asked for, delivered and posted, every week.',
      html: `
        <div class="tr-page">
          ${pageHead(L, D, 'Branding & Marketing Report')}
          <div class="tr-meta">${[['Report period', `${D.from} – ${D.to}`], ['Organisation', 'All organisations'], ['Social media', 'All accounts'], ['Institutions in scope', D.colleges.length]].map(([k, v], i) => `
            <div${A('up', .3 + i * .12)}><small>${k}</small><b>${esc(v)}</b></div>`).join('')}
          </div>
          <h2 class="tr-h2"${A('left', .8)}>Report timeline</h2>
          <p class="tr-sub"${A('fade', 1)}>What happened in each week of ${esc(D.from)} to ${esc(D.to)} (${D.days} days).</p>
          <div class="tr-charts">${D.timeline.map((s, i) => {
            const max = Math.max(...s.values), top = s.values.indexOf(max);
            return `
            <div class="tr-card tr-tl"${A('up', 1.2 + i * .25, `--c:${s.color}`)}>
              <small>${esc(s.label)}</small>
              <div class="tr-tl__total">${N(s.total, 1.6 + i * .25)}<span>in this period</span></div>
              <div class="tr-tl__bars">${s.values.map((v, j) => `
                <div class="tr-tl__col"><em${A('fade', 2.2 + i * .25 + j * .1)}>${v}</em>
                  <span class="tr-bar v"><i style="--h:${Math.max(2, v / max * 100).toFixed(1)}%;--d:${(1.9 + i * .25 + j * .1).toFixed(2)}s;background:${j === top ? s.color : s.soft}"></i></span>
                  <label>${esc(D.weeks[j]).replace('–', '–<br>')}</label></div>`).join('')}
              </div>
            </div>`;
          }).join('')}
          </div>
        </div>`,
    },

    /* 4 · The overview */
    {
      name: 'The overview', hold: 12,
      title: 'The overview',
      line: 'Every number in one place, with advice written for you.',
      html: `
        <div class="tr-page">
          ${pageHead(L, D, 'Branding & Marketing Report')}
          <h2 class="tr-h2"${A('left', .3)}>Overview</h2>
          <p class="tr-sub"${A('fade', .5)}>${esc(D.glance[0].value)} posts published and ${esc(D.overview[1].value)} designs completed across ${D.colleges.length} institutions this period.</p>
          <div class="tr-tiles">${D.overview.map((o, i) => `
            <div class="tr-tile"${A('up', .7 + i * .12, `--c:${o.color}`)}>${N(o.value, .9 + i * .12)}<span>${esc(o.label)}</span></div>`).join('')}
          </div>
          <div class="tr-notes">${notesCards(D.notes, 4.6)}</div>
        </div>`,
    },

    /* 5 · Every college side by side */
    {
      name: 'All colleges', hold: 13,
      title: 'All colleges',
      line: 'Compare audience, posts, likes and reach side by side.',
      html: `
        <div class="tr-page">
          ${pageHead(L, D, 'All Colleges at a Glance')}
          <div class="tr-grid2">
            <div class="tr-card"${A('up', .3)}>
              <h4>Audience by college <small>followers</small></h4>
              <div class="tr-aud">${D.colleges.map((c, i) => `
                <div class="tr-aud__col"><em${A('fade', 1.2 + i * .12)}>${fmt(c.followers)}</em>
                  <span class="tr-bar v"><i style="--h:${Math.max(2, c.followers / maxAudience * 100).toFixed(1)}%;--d:${(.9 + i * .12).toFixed(2)}s;background:${i % 2 ? '#2B7BDB' : '#F5822A'}"></i></span>
                  <label>${esc(c.name)}</label></div>`).join('')}
              </div>
            </div>
            <div class="tr-card"${A('up', 2.6)}>
              <h4>Posts by college and platform <small>darker = more posts</small></h4>
              <table class="tr-heat">
                <tr><th></th>${PLATFORMS.map(p => `<th>${chip(p)}${p}</th>`).join('')}<th>Total</th></tr>
                ${D.colleges.map((c, i) => `<tr><td>${esc(c.name)}</td>${PLATFORMS.map((p, j) => {
                  const v = c.platforms[p] || 0, a = v ? .14 + .8 * v / maxCell : 0;
                  return `<td><span class="${a > .5 ? 'dk' : ''}"${A('pop', 3 + i * .12 + j * .05, `background:${v ? `rgba(245,130,42,${a.toFixed(2)})` : '#EEF1F6'}`)}>${v || '–'}</span></td>`;
                }).join('')}<td><b>${c.posts}</b></td></tr>`).join('')}
              </table>
            </div>
            <div class="tr-card"${A('up', 6.4)}>
              <h4>Ranked by likes</h4>
              <div class="tr-rank">${[...D.colleges].sort((a, b) => b.likes - a.likes).map((c, i) => `
                <div class="tr-rank__row"><span>#${i + 1} ${esc(c.name)}</span>
                  <span class="tr-bar h"><i style="--w:${Math.max(1, c.likes / maxLikes * 100).toFixed(1)}%;--d:${(6.8 + i * .12).toFixed(2)}s;background:${i ? '#2B7BDB' : '#F5822A'}"></i></span>
                  ${N(fmt(c.likes), 6.8 + i * .12)}</div>`).join('')}
              </div>
            </div>
            <div class="tr-card"${A('up', 7.8)}>
              <h4>Reach by platform <small>share of total reach</small></h4>
              <div class="tr-reach">${D.reach.map((r, i) => `
                <div class="tr-reach__box">
                  <div class="tr-reach__top">${chip(r.name)}<span>${esc(r.name)}</span><em>${r.share}%</em></div>
                  <div class="tr-reach__num">${N(fmt(r.people), 8.2 + i * .2)}<small>people reached</small></div>
                  <span class="tr-bar h"><i style="--w:${r.share}%;--d:${(8.4 + i * .2).toFixed(2)}s;background:${r.color}"></i></span>
                </div>`).join('')}
              </div>
              <p class="tr-paid"${A('fade', 9.4)}><b>Paid ads</b> Rs 0 spent · 0 reach · no paid activity recorded this period.</p>
            </div>
          </div>
        </div>`,
    },

    /* 6 · One college's own page */
    {
      name: `${ncet.name}'s page`, hold: 15,
      title: 'Every college, its own page',
      line: 'Followers, activity, best posts and design work.',
      html: (() => {
        const W = 620, H = 170, top = Math.max(...F.raised, ...F.completed, ...ncet.activity);
        const x = j => 30 + j * (W - 60) / 7, y = v => H - 8 - v / top * (H - 30);
        const line = ncet.activity.map((v, j) => `${j ? 'L' : 'M'} ${x(j).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
        return `
        <div class="tr-page">
          ${pageHead(L, D, `${ncet.name} · college report`)}
          <div class="tr-band"${A('left', .3)}>
            ${ncet.logo ? `<span class="tr-band__logo"><img src="${L(ncet.logo)}" alt=""></span>` : ''}
            <h2>${esc(ncet.name)}</h2>
            <div><b>${esc(F.rank)}</b><small>by followers</small></div>
            <div>${N(fmt(ncet.followers), .8)}<small>followers</small></div>
          </div>
          <div class="tr-col3">
            <div class="col a">
              <div class="tr-card"${A('up', 1)}>
                <h4>${icon('people')}Social media</h4>
                <div class="tr-stats5">${[[fmt(ncet.followers), 'Followers'], ['+' + fmt(ncet.growth), 'Follower growth', 'hot'], [ncet.posts, 'Posts'], [fmt(ncet.reach), 'Reach'], [fmt(ncet.likes), 'Likes']].map(([v, k, c], i) => `
                  <div class="${c || ''}">${N(v, 1.3 + i * .15)}<span>${k}</span></div>`).join('')}</div>
              </div>
              <div class="tr-card"${A('up', 3.2)}>
                <h4>${icon('pulse')}Activity over the period</h4>
                <div class="tr-legend"><i style="background:#0F9D6E"></i>Posts published<i style="background:#F5822A"></i>Requests raised<i style="background:#2B7BDB"></i>Designs completed</div>
                <svg class="tr-act" viewBox="0 0 ${W} ${H + 26}">
                  ${[0, .5, 1].map(f => `<line x1="20" x2="${W - 10}" y1="${(8 + f * (H - 16)).toFixed(1)}" y2="${(8 + f * (H - 16)).toFixed(1)}" class="grid"/>`).join('')}
                  ${F.raised.map((v, j) => `<rect class="tr-sbar" x="${(x(j) - 15).toFixed(1)}" y="${y(v).toFixed(1)}" width="13" height="${(H - 8 - y(v)).toFixed(1)}" rx="2" fill="#F5822A" style="--d:${(3.6 + j * .1).toFixed(2)}s"/>
                    <rect class="tr-sbar" x="${(x(j) + 2).toFixed(1)}" y="${y(F.completed[j]).toFixed(1)}" width="13" height="${(H - 8 - y(F.completed[j])).toFixed(1)}" rx="2" fill="#2B7BDB" style="--d:${(3.7 + j * .1).toFixed(2)}s"/>`).join('')}
                  <path class="tr-draw" pathLength="1" d="${line}" style="--d:4.4s"/>
                  ${ncet.activity.map((v, j) => `<g${A('pop', 4.6 + j * .14)}><circle cx="${x(j).toFixed(1)}" cy="${y(v).toFixed(1)}" r="12" class="dot"/><text x="${x(j).toFixed(1)}" y="${(y(v) + 4.5).toFixed(1)}">${v}</text></g>`).join('')}
                  ${D.weeks.map((w, j) => `<text class="wk" x="${x(j).toFixed(1)}" y="${H + 20}">${esc(w.split('–')[0])}</text>`).join('')}
                </svg>
              </div>
              <div class="tr-card"${A('up', 8.6)}>
                <h4>${icon('layers')}Design work</h4>
                <div class="tr-stats4">${[[F.design.raised, 'requests raised'], [F.design.completed, 'designs completed'], [F.design.onTime, 'on time'], [F.design.firstPass, 'first-pass approval']].map(([v, k], i) => `
                  <div>${N(v, 8.9 + i * .15)}<span>${k}</span></div>`).join('')}</div>
                <div class="tr-status">${F.design.status.map(([k, v, pct], i) => `
                  <div><span>${esc(k)}</span><span class="tr-bar h"><i style="--w:${pct}%;--d:${(9.4 + i * .12).toFixed(2)}s;background:${i ? '#2B7BDB' : '#F5822A'}"></i></span><b>${v}</b><em>${pct}%</em></div>`).join('')}
                </div>
              </div>
            </div>
            <div class="col b">
              <div class="tr-card tr-plat"${A('up', 6.8)}>
                <h4>${icon('share')}Platform by platform</h4>
                <table>
                  <tr><th>Platform</th><th>Posts</th><th>Impr.</th><th class="hl">Likes</th><th>Followers</th><th>Growth</th></tr>
                  ${F.platforms.map((r, i) => `<tr${A('left', 7.1 + i * .15)}><td>${chip(r[0])}${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="hl"><b>${r[3]}</b></td><td>${r[4]}</td><td class="${r[5] !== '+0' ? 'up' : ''}">${r[5]}</td></tr>`).join('')}
                </table>
              </div>
              <div class="tr-card"${A('up', 7.8)}>
                <h4>${icon('star')}Best posts this period</h4>
                <div class="tr-best">${F.best.map(([t, p, likes, reach], i) => `
                  <div${A('left', 8.1 + i * .2)}><i>${i + 1}</i><span><b>${esc(t)}</b><small>${chip(p)}${esc(ncet.name)}, ${p}</small></span><em>${N(likes, 8.3 + i * .2)}<small>likes · ${esc(reach)}</small></em></div>`).join('')}
                </div>
              </div>
              <div class="tr-card"${A('up', 1.8)}>
                <h4>${icon('person')}Coordinators <small class="r">raised · completed</small></h4>
                <div class="tr-coord">${F.coordinators.slice(0, 4).map(([nm, r, c], i) => `
                  <div${A('left', 2.1 + i * .12)}><span>${esc(nm)}</span><b>${r}</b><b>${c}</b></div>`).join('')}
                </div>
              </div>
            </div>
            <div class="col c">${notesCards(F.notes, 10.6, 'tall')}</div>
          </div>
        </div>`;
      })(),
    },

    /* 7 · As many organisations as you need */
    {
      name: 'Every organisation', hold: 12,
      title: 'Add your organisations',
      line: 'Add a group and its institutions. Each gets a page.',
      html: `
        <div class="tr-orgs">
          <h2${A('up', .2)}>One page for every organisation</h2>
          <p${A('up', .4)}>Add the group, then as many institutions under it as you need.</p>
          <div class="tr-root"${A('zoom', .9)}><img src="${L(D.groupLogo)}" alt=""><span><b>${esc(D.group)}</b><small>Organisation · ${D.colleges.length} institutions</small></span></div>
          <svg class="tr-tree" viewBox="0 0 1920 120">
            <path class="tr-draw" pathLength="1" style="--d:1.6s" d="M 960 0 V 50 M 280 50 H 1640 M 280 50 V 110 M 733 50 V 110 M 1187 50 V 110 M 1640 50 V 110"/>
          </svg>
          <div class="tr-minis">${D.colleges.map((c, i) => {
            const rank = 1 + D.colleges.filter(o => o.followers > c.followers).length;
            const mx = Math.max(1, ...c.activity);
            const pts = c.activity.map((v, j) => `${j ? 'L' : 'M'} ${(6 + j * 44).toFixed(1)} ${(46 - v / mx * 40).toFixed(1)}`).join(' ');
            const d = 2.6 + i * .45;
            return `
            <div class="tr-mini"${A('rise', d)}>
              <div class="tr-mini__band">
                ${c.logo ? `<span class="lg"><img src="${L(c.logo)}" alt=""></span>` : `<span class="lg mono">${esc(c.name[0])}</span>`}
                <b>${esc(c.name)}</b><em>#${rank}</em>
              </div>
              <div class="tr-mini__stats">
                <div>${N(fmt(c.followers), d + .3)}<span>followers</span></div>
                <div>${N(c.posts, d + .35)}<span>posts</span></div>
                <div>${N(fmt(c.likes), d + .4)}<span>likes</span></div>
              </div>
              <svg class="tr-mini__spark" viewBox="0 0 320 50" preserveAspectRatio="none"><path class="tr-draw" pathLength="1" style="--d:${(d + .4).toFixed(2)}s" d="${pts}"/></svg>
            </div>`;
          }).join('')}
            <div class="tr-mini add"${A('rise', 2.6 + D.colleges.length * .45 + .3)}>
              <span class="plus">${icon('plus')}</span><b>Add organisation</b><small>Its own page, from the next report</small>
            </div>
          </div>
        </div>`,
    },

    /* 8 · Delivered */
    {
      name: 'Delivered', hold: 10,
      title: 'Delivered as a PDF',
      line: 'Sent every month, automatically.',
      html: `
        <div class="tr-done">
          <div class="tr-stack">${['College page', 'All colleges', 'Overview', 'Cover'].map((t, i) => `
            <div class="tr-sheet s${i}"${A('rise', .2 + i * .25)}><i></i><i></i><i></i><span>${t}</span></div>`).join('')}
            <span class="tr-pdf"${A('pop', 1.4)}>${icon('pdf')}PDF</span>
          </div>
          <div class="tr-done__text">
            <img src="${L('Logos/tag-portal.png')}" alt="t@g"${A('fade', .4)}>
            <h2${A('up', .6)}>Delivered as a<br><em>branded PDF.</em></h2>
            <ul>${['Any period, any colleges', 'Charts, not tables', 'Advice written from the numbers', 'Sent every month, automatically'].map((t, i) => `
              <li${A('left', 1.4 + i * .3)}>${icon('check')}${t}</li>`).join('')}</ul>
            <span class="tr-dl"${A('up', 3)}>${icon('pdf')}Download report</span>
          </div>
        </div>`,
    },
  ];
}

/* ---------- The player ---------- */
// Also plays other films in the same frame (js/tagroles.js): "build" turns the
// slide's data into its chapters.

export function mountTagReport(root, n, L, onScene = () => {}, build = chapters) {
  root.innerHTML = '<div class="tag-report"><div class="tr-loading">Loading the report…</div></div>';
  const el = root.firstElementChild;
  let alive = true, raf = 0, api = null;
  let onKey = null;
  const cleanup = () => { alive = false; cancelAnimationFrame(raf); if (onKey) removeEventListener('keydown', onKey, true); };
  cleanup.step = dir => api ? api.step(dir) : true;
  cleanup.atStart = () => !api || api.at === 0;
  cleanup.atEnd = () => !!api && api.at === api.count - 1;

  fetch(L(n.data)).then(r => r.ok ? r.json() : Promise.reject(new Error('report.json'))).then(D => {
    if (!alive) return;
    const list = build(D, L);
    el.innerHTML = `
      <header class="tr-top"><small></small><h2></h2><p></p></header>
      <div class="tr-screen">
        <div class="tr-paused">Paused · Space to carry on</div>
        <div class="tr-stage">${list.map((c, i) => `<section class="tr-scene" data-i="${i}">${c.html}</section>`).join('')}</div>
        <div class="tr-tab"><img src="${L('Logos/tag-portal.png')}" alt="t@g"></div>
      </div>`;
    el.querySelectorAll('img').forEach(img => img.decode?.().catch(() => {}));
    const scenes = [...el.querySelectorAll('.tr-scene')];
    const top = el.querySelector('.tr-top');

    // The heading above the film says which part this is
    function tell(c, i) {
      top.querySelector('small').textContent = `${D.kicker || 'The t@g monthly report'} · ${i + 1} of ${list.length}`;
      top.querySelector('h2').textContent = c.title;
      top.querySelector('p').textContent = c.line;
      top.classList.remove('in'); void top.offsetWidth; top.classList.add('in');
    }

    let at = -1, t = 0, last = performance.now(), paused = false;
    let counters = [], typers = [];

    function show(i) {
      if (i === at) return;
      const old = scenes[at];
      if (old) { old.classList.remove('show'); setTimeout(() => old !== scenes[at] && old.classList.remove('on'), 700); }
      at = i; t = 0;
      const s = scenes[i];
      s.style.setProperty('--t0', '0s');
      s.classList.remove('on'); void s.offsetWidth;            // start its animations again from the top
      s.classList.add('show', 'on');
      counters = [...s.querySelectorAll('[data-count]')].map(b => ({ b, to: b.dataset.count, d: +b.dataset.d || 0 }));
      typers = [...s.querySelectorAll('[data-type]')].map(e => ({ e, to: e.dataset.type, d: +e.dataset.d || 0 }));
      counters.forEach(c => { c.b.textContent = countText(c.to, 0); });
      typers.forEach(c => { c.e.textContent = ''; });
      tell(list[i], i);
      api.at = i;
      onScene();
    }

    // Jump to a moment inside the chapter: its entrance animations restart as if
    // they had been playing since the chapter began
    function seek(to) {
      t = to;
      const s = scenes[at];
      s.style.setProperty('--t0', `${to}s`);
      s.classList.remove('on'); void s.offsetWidth;
      s.classList.add('on');
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      if (!paused) t += dt;
      const c = list[at];
      counters.forEach(k => { k.b.textContent = countText(k.to, ease(clamp((t - k.d) / 1.3))); });
      typers.forEach(k => { k.e.textContent = k.to.slice(0, Math.round(k.to.length * clamp((t - k.d) / .8))); });
      c.tick?.(t, scenes[at]);
      if (!paused && t >= c.hold && at < list.length - 1) show(at + 1);
      raf = requestAnimationFrame(frame);
    }

    // Space pauses everything where it is; Space again carries on
    const setPaused = v => { paused = v; el.classList.toggle('paused', v); };
    onKey = e => {
      if (e.key !== ' ' || e.repeat || e.target.matches?.('input, textarea')) return;
      e.preventDefault();
      document.activeElement?.blur?.();   // so Space never presses the Next button clicked last
      setPaused(!paused);
    };
    addEventListener('keydown', onKey, true);

    api = {
      at: 0, count: list.length,
      // Next / Prev (and the arrow keys) play the next or previous chapter, even
      // from a pause; past either end the deck moves on. A chapter with "marks"
      // (the moments its parts begin) is stepped through part by part first.
      step(dir) {
        const marks = list[at].marks;
        if (marks) {
          const cur = marks.reduce((k, m, j) => t >= m ? j : k, 0), j = cur + dir;
          if (j >= 0 && j < marks.length) { setPaused(false); seek(marks[j]); return true; }
        }
        const i = at + dir;
        if (i < 0 || i >= list.length) return false;
        setPaused(false);
        show(i);
        return true;
      },
    };
    show(0);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }).catch(() => { if (alive) el.innerHTML = '<div class="tr-loading">The report data (report.json) could not be read.</div>'; });

  return cleanup;
}

// "58,517" at a fraction of the way up, keeping its prefix, commas, decimals and suffix
function countText(to, k) {
  const m = String(to).match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return to;
  const [, pre, num, post] = m;
  const n = parseFloat(num.replace(/,/g, '')), dec = (num.split('.')[1] || '').length;
  const v = n * k;
  const s = dec ? v.toFixed(dec) : num.includes(',') ? Math.round(v).toLocaleString('en-US') : String(Math.round(v));
  return pre + s + post;
}
