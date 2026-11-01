// Digital Marketing deck: side nav + one 16:9 slide per section, in the style of the
// Torii and NGI presentations. Structure and wording come from deck.json; posters and
// videos come from whatever is in the matching content/ folder (see server.js).

import { mountHome } from './home.js';
import { mountShowcase } from './showcase.js';
import { mountStream } from './stream.js';
import { mountTag } from './tag.js';
import { mountTagHero } from './taghero.js';
import { mountTagReport } from './tagreport.js';
import { portalView, animatePortal } from './portal.js';
import { roleChapters } from './tagroles.js';

const $ = id => document.getElementById(id);
const nav = $('nav'), crumbs = $('crumbs'), frame = $('frame'), slide = $('slide'), canvas = $('canvas');

let deck, media, order = [], byId = {}, current = null, cleanup = null;
let role = null;   // 'admin' or 'presenter', from the signed-in session
const isAdmin = () => role === 'admin';

/* ---------- Icons (24×24 line icons) ---------- */
const ICONS = {
  home: '<path d="M3 11 L12 4 L21 11 V20 H14 V14 H10 V20 H3 Z"/>',
  clients: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20 C3 15.5 5.7 13 9 13 C12.3 13 15 15.5 15 20"/><circle cx="17" cy="9" r="2.5"/><path d="M16 13.3 C19 13.3 21 15.5 21 19"/>',
  brands: '<path d="M12 3 L14.6 8.6 L20.6 9.2 L16 13.2 L17.4 19.2 L12 16 L6.6 19.2 L8 13.2 L3.4 9.2 L9.4 8.6 Z"/>',
  portal: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8 H21 M8 21 H16 M12 18 V21"/><path d="M7 12 H10 M12 12 H17 M7 15 H14"/>',
  creatives: '<path d="M12 3 C7 3 3 6.6 3 11 C3 14.6 5.6 16 8 16 C9.6 16 10 17 10 18 C10 19.6 11 21 12.5 21 C17.5 21 21 17 21 12 C21 7 17 3 12 3 Z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="11" cy="7" r="1.2"/><circle cx="15.5" cy="8" r="1.2"/>',
  brand: '<path d="M3 21 H21 M5 21 V8 L12 3 L19 8 V21"/><path d="M9 21 V15 H15 V21 M9 11 H9.01 M15 11 H15.01"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="M21 15 L16 10 L5 21"/>',
  video: '<rect x="2.5" y="5" width="14" height="14" rx="2.5"/><path d="M16.5 10 L21.5 7 V17 L16.5 14"/>',
  folder: '<path d="M3 6.5 A1.5 1.5 0 0 1 4.5 5 H9.5 L11.5 7.5 H19.5 A1.5 1.5 0 0 1 21 9 V18 A1.5 1.5 0 0 1 19.5 19.5 H4.5 A1.5 1.5 0 0 1 3 18 Z"/>',
  reels: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 9.5 L14.5 12 L10.5 14.5 Z"/>',
  human: '<circle cx="12" cy="8" r="4"/><path d="M4 21 C4 16.5 7.6 14 12 14 C16.4 14 20 16.5 20 21"/>',
  ai: '<path d="M12 3 L13.8 9.2 L20 11 L13.8 12.8 L12 19 L10.2 12.8 L4 11 L10.2 9.2 Z"/><path d="M19 3 L19.7 5.3 L22 6 L19.7 6.7 L19 9 L18.3 6.7 L16 6 L18.3 5.3 Z"/>',
  upload: '<path d="M12 16 V4 M7 9 L12 4 L17 9"/><path d="M4 15 V19 A1.5 1.5 0 0 0 5.5 20.5 H18.5 A1.5 1.5 0 0 0 20 19 V15"/>',
};
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[name] || ICONS.folder}</svg>`;
const iconFor = n => n.icon || (n.type === 'brand' ? 'brand' : n.type === 'gallery' || n.type === 'stream' ? n.media : n.type === 'folder' ? 'folder' : 'folder');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// "03 - Diwali_poster.jpg" → "Diwali poster", "12 HOOT - 25,000+ Users.jpg" → "HOOT · 25,000+ Users"
const prettify = name => name.replace(/\.[^.]+$/, '').replace(/^\d+\s*[-_.)]?\s*/, '')
  .replace(/\s+-\s+/g, ' · ').replace(/(\w)-(\w)/g, '$1‑$2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || name;

/* ---------- Data ---------- */
async function load() {
  const res = await fetch('/api/deck', { cache: 'no-store' });
  if (res.status === 401) { showLogin(); throw new Error('signed out'); }
  ({ deck, media } = await res.json());
  // Pictures show their light copy; the full-screen viewer opens the large one (the original if there is none)
  Object.values(media).forEach(f => f.items.forEach(it => {
    if (it.kind !== 'image') return;
    it.full = it.large || it.url;
    if (it.thumb) it.url = it.thumb;
  }));
  order = []; byId = {};
  const walk = (n, parent, depth) => {
    n.parent = parent; n.depth = depth;
    order.push(n); byId[n.id] = n;
    (n.children || []).forEach(c => walk(c, n, depth + 1));
  };
  deck.sections.forEach(s => walk(s, null, 0));
  $('deckTitle').textContent = deck.title;
}

const itemsOf = n => n.categories
  ? n.categories.flatMap(c => c.youtube ? [{ kind: 'video', url: 'yt:' + c.youtube }] : media[c.folder]?.items || [])
  : (n.folder && media[n.folder]?.items) || [];
const logoOf = n => (n.folder && media[n.folder]?.logo) || null;
// A file under content/, e.g. "Logos/tag-portal.png"
const asset = rel => 'content/' + rel.split('/').map(encodeURIComponent).join('/');

function collect(n, kind) {
  const own = itemsOf(n).filter(i => i.kind === kind);
  return own.concat(...(n.children || []).map(c => collect(c, kind)));
}

function metaFor(n) {
  const img = collect(n, 'image').length, vid = collect(n, 'video').length;
  const parts = [];
  if (n.media !== 'video') parts.push(`${img} ${n.media === 'mixed' ? 'image' : 'design'}${img === 1 ? '' : 's'}`);
  if (n.media !== 'image') parts.push(`${vid} video${vid === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

const path = n => { const p = []; for (let x = n; x; x = x.parent) p.unshift(x); return p; };

/* ---------- Fit the 1920×1080 canvas into the frame ---------- */
const FLUID = ['gallery', 'folder', 'brand', 'portal', 'stream'];
function fit() {
  const r = frame.getBoundingClientRect();
  const pad = document.body.classList.contains('presenting') ? 0 : 14;
  const w = r.width - pad * 2, h = r.height - pad * 2;
  const s = Math.min(w / 1920, h / 1080);
  // Pages laid out edge to edge grow wider than 16:9 to fill the space; the cinematic ones keep their frame
  const cw = FLUID.includes(current?.type) ? Math.max(1920, w / s) : 1920;
  canvas.style.width = cw + 'px';
  slide.style.width = cw * s + 'px';
  slide.style.height = 1080 * s + 'px';
  slide.style.left = (r.width - cw * s) / 2 + 'px';
  slide.style.top = (r.height - 1080 * s) / 2 + 'px';
  canvas.style.setProperty('--s', s);
}
new ResizeObserver(fit).observe(frame);

/* ---------- Side nav and breadcrumb ---------- */
// The menu can fold down to its icons (the name shows on hover); the choice is remembered
const sideKey = 'dm-side-min';
let sideMin = true;
try { const v = localStorage.getItem(sideKey); if (v !== null) sideMin = v === '1'; } catch {}
document.body.classList.toggle('side-min', sideMin);
document.querySelectorAll('[data-side]').forEach(b => b.addEventListener('click', () => {
  sideMin = b.dataset.side === 'min';
  document.body.classList.toggle('side-min', sideMin);
  try { localStorage.setItem(sideKey, sideMin ? '1' : '0'); } catch {}
}));

function renderNav() {
  const trail = new Set(path(current));
  nav.innerHTML = order
    // top level and their children always; deeper levels only inside the open branch
    .filter(n => n.depth < 2 || trail.has(n.parent))
    .map(n => `<a href="#/${n.id}" class="lvl-${n.depth}${n === current ? ' on' : trail.has(n) ? ' in-path' : ''}">${icon(iconFor(n))}<span>${esc(n.title)}</span></a>`)
    .join('');
}

function renderCrumbs() {
  const p = path(current);
  crumbs.innerHTML = [`<a href="#/${order[0]?.id || ''}">${esc(deck.org)}</a>`]
    .concat(p.map((n, i) => i === p.length - 1 ? `<strong>${esc(n.title)}</strong>` : `<a href="#/${n.id}">${esc(n.title)}</a>`))
    .join('<i>›</i>');
  arrows();
}

// A slide with scenes of its own (the Showcase) can still go back while it is past its first scene
function arrows() {
  const i = order.indexOf(current);
  $('prev').disabled = i <= 0 && !(cleanup?.atStart && !cleanup.atStart());
  $('next').disabled = i >= order.length - 1 && !(cleanup?.atEnd && !cleanup.atEnd());
}

/* ---------- Followers on each social network, under a brand's logo ---------- */
// "socials" in deck.json: { "linkedin": 24206, "instagram": 0, "facebook": 0 } (0 until it is filled in)
const SOCIAL = {
  linkedin: ['LinkedIn', '#0A66C2', '<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M7.6 10.4 V16.4 M7.6 7.6 V7.7 M11.2 16.4 V10.4 M11.2 13.2 C11.2 11.4 12.4 10.3 13.9 10.3 C15.5 10.3 16.5 11.3 16.5 13.2 V16.4"/>'],
  instagram: ['Instagram', '#D6297B', '<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8 V6.9"/>'],
  facebook: ['Facebook', '#1877F2', '<circle cx="12" cy="12" r="9"/><path d="M13.2 21 V13.3 H15.6 M10.3 13.3 H13.2 M13.2 13.3 V10.4 C13.2 9.2 13.9 8.6 15 8.6 H15.9"/>'],
  youtube: ['YouTube', '#FF0000', '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.2 9.4 L14.8 12 L10.2 14.6 Z"/>'],
};
function socials(n) {
  if (!n.socials) return '';
  // a network left out of "socials" is not shown
  return `<div class="socials">${Object.entries(SOCIAL).filter(([k]) => k in n.socials).map(([k, [name, color, glyph]]) => `
    <div class="social" title="${name}">
      <svg class="social-ic" viewBox="0 0 24 24" style="color:${color}">${glyph}</svg>
      <span><b>${typeof n.socials[k] === 'string' ? esc(n.socials[k]) : Number(n.socials[k] || 0).toLocaleString('en-US')}</b><small>${name}</small></span>
    </div>`).join('')}</div>${n.socialsNote ? `<div class="socials-note">${esc(n.socialsNote)}</div>` : ''}`;
}

/* ---------- Slides ---------- */
function cardArt(n) {
  if (n.type === 'brand' && logoOf(n)) return `<img class="card-logo" src="${logoOf(n)}" alt="">`;
  // "Made with AI" holds both: its pictures if it has any, else its videos
  const kind = n.media === 'video' || (n.media === 'mixed' && !collect(n, 'image').length) ? 'video' : 'image';
  const pics = collect(n, kind).slice(0, 3);
  if (pics.length) {
    const el = i => kind === 'image'
      ? `<img src="${i.url}" alt="" loading="lazy">`
      : `<video src="${i.url}#t=1" muted preload="metadata" playsinline></video>`;
    return `<div class="fan${kind === 'video' ? ' wide' : ''}">${pics.map(el).join('')}</div>`;
  }
  if (n.type === 'brand') return `<div class="monogram">${esc(n.title)}</div>`;
  return icon(iconFor(n), 'card-icon');
}

const card = n => `
  <a class="card" href="#/${n.id}">
    <div class="card-art">${cardArt(n)}</div>
    <div class="card-foot">
      <div><div class="card-name">${esc(n.title)}</div><div class="card-meta">${metaFor(n)}</div></div>
      <span class="card-go">→</span>
    </div>
  </a>`;

const views = {
  folder: n => `
    <div class="view v-folder">
      ${n.kicker ? `<div class="kicker">${esc(n.kicker)}</div>` : ''}
      <h1 class="title">${esc(n.heading || n.title)}</h1>
      ${n.text ? `<p class="lede">${esc(n.text)}</p>` : ''}
      <div class="cards${n.children.length > 3 ? ' many' : ''}">${n.children.map(card).join('')}</div>
    </div>`,

  brand: n => `
    <div class="view v-brand${n.institutions?.length ? ' has-inst' : ''}">
      <div class="brand-left">
        <div class="kicker">${esc(n.parent?.title || '')}</div>
        <div class="brand-logo">${logoOf(n) ? `<img src="${logoOf(n)}" alt="${esc(n.title)} logo">` : `<div class="monogram">${esc(n.title)}</div>`}</div>
        <h1 class="title">${esc(n.title)}</h1>
        ${n.text ? `<p class="lede">${esc(n.text)}</p>` : ''}
        ${n.institutions?.length ? `
          <div class="inst-label">${n.institutions.length} institutions we handle</div>
          <div class="inst">
            ${n.institutions.map(i => `<div class="inst-tile" title="${esc(i.name)}"><img src="${asset(i.logo)}" alt="${esc(i.name)}"></div>`).join('')}
          </div>` : ''}
        ${socials(n)}
        ${n.parentCompany ? `<div class="parent-co"><span>Part of</span><img src="${asset(n.parentCompany.logo)}" alt="${esc(n.parentCompany.name)}"><span>${esc(n.parentCompany.name)}</span></div>` : ''}
      </div>
      <div class="cards">${n.children.map(card).join('')}</div>
    </div>`,

  gallery: n => {
    const kind = n.media;
    const items = itemsOf(n).filter(i => fits(n, i));
    const back = n.parent ? `<a class="back" href="#/${n.parent.id}">← ${esc(n.parent.title)}</a>` : '';
    const head = `
      <div class="g-head">
        ${back}
        <h1 class="title">${n.parent ? `<span class="kicker">${esc(n.parent.title)}</span>` : ''}${esc(n.title)}</h1>
        <div class="g-actions">${uploadButton(n)}</div>
      </div>`;
    if (!items.length) return `<div class="view v-gallery">${head}${empty(n)}</div>`;
    const tile = (it, i) => `
      <a class="tile" data-i="${i}">
        <div class="tile-media">
          ${isAdmin() ? `<button class="tile-del" data-name="${esc(it.name)}" title="Remove">✕</button>` : ''}
          ${it.kind === 'image'
            ? `<img src="${it.url}" alt="${esc(prettify(it.name))}" loading="lazy">`
            : `<video src="${it.url}#t=1" muted preload="metadata" playsinline></video><span class="play"></span>`}
        </div>
        <div class="tile-name">${esc(prettify(it.name))}</div>
      </a>`;
    return `
      <div class="view v-gallery">
        ${head}
        <div class="g-body"><div class="grid ${kind === 'mixed' ? 'mixed' : kind + 's'}${n.layout === 'portrait' ? ' portrait' : ''}${n.layout === 'natural' ? ' natural' : ''}">${items.map(tile).join('')}</div></div>
      </div>`;
  },

};

// A gallery shows its own kind of file; "Made with AI" ("mixed") shows pictures and videos alike
const fits = (n, i) => n.media === 'mixed' ? i.kind === 'image' || i.kind === 'video' : i.kind === n.media;

function empty(n, heading) {
  const what = n.type === 'portal' ? 'screenshots (.jpg, .png, .webp)'
    : n.media === 'mixed' ? 'images and videos made with AI (.jpg, .png, .mp4)'
    : n.media === 'video' ? 'videos (.mp4, .webm, .mov)' : 'posters and designs (.jpg, .png, .webp)';
  const none = n.media === 'mixed' ? 'Nothing made with AI yet' : n.icon === 'reels' ? 'No reels yet' : `No ${n.media === 'video' ? 'videos' : 'designs'} yet`;
  return `
    <div class="empty">
      ${icon('upload')}
      <h3>${esc(heading || none)}</h3>
      <p>${isAdmin() ? 'Use Upload, or drop' : 'Drop'} ${what} into this folder, then come back to this slide:</p>
      <code>content/${esc(n.folder)}</code>
      ${n.type === 'portal' ? uploadButton(n) : ''}
    </div>`;
}

/* ---------- Admin: upload into the slide's folder, remove from it ---------- */
function uploadButton(n) {
  if (!isAdmin()) return '';
  const videos = 'video/mp4,video/webm,video/quicktime,.mov,.m4v';
  const accept = n.media === 'video' ? videos : n.media === 'mixed' ? 'image/*,' + videos : 'image/*';
  return `<button class="upload-btn" data-upload>+ Upload</button><input type="file" data-file accept="${accept}" multiple hidden>`;
}

async function upload(n, files, btn) {
  btn.disabled = true;
  for (const [i, f] of [...files].entries()) {
    btn.textContent = `Uploading ${i + 1} / ${files.length}…`;
    const q = new URLSearchParams({ folder: n.folder, name: f.name });
    const res = await fetch('/api/media?' + q, { method: 'PUT', body: f });
    if (!res.ok) alert(`${f.name}: ${(await res.json().catch(() => ({}))).error || 'upload failed'}`);
  }
  await load();
  show(n);
}

async function remove(n, name) {
  if (!confirm(`Remove "${prettify(name)}" from this slide? The file is deleted from content/${n.folder}.`)) return;
  const q = new URLSearchParams({ folder: n.folder, name });
  const res = await fetch('/api/media?' + q, { method: 'DELETE' });
  if (!res.ok) return alert((await res.json().catch(() => ({}))).error || 'Could not remove it');
  await load();
  show(n);
}

// While a slide is up, the next one's pictures load quietly, so Next shows them at once
const warmed = new Set();
function warmNext(n) {
  const next = order[order.indexOf(n) + 1];
  if (!next) return;
  collect(next, 'image').slice(0, 30).forEach(it => {
    if (warmed.has(it.url)) return;
    warmed.add(it.url);
    const im = new Image(); im.decoding = 'async'; im.src = it.url;
  });
}

async function show(n) {
  cleanup?.(); cleanup = null;
  current = n;
  fit();
  setTimeout(() => current === n && warmNext(n), 900);
  renderNav(); renderCrumbs();
  document.title = `${n.title} · ${deck.title}`;

  if (n.type === 'home') {
    canvas.innerHTML = '';
    cleanup = await mountHome(canvas);
    return;
  }
  // Every video page plays as the NGI deck's streaming player
  const vids = n.type === 'stream' || (n.type === 'gallery' && n.media === 'video') ? itemsOf(n).filter(i => i.kind === 'video') : [];
  if (vids.length) {
    canvas.innerHTML = '<div class="view v-stream"></div>';
    const item = i => ({ src: i.url, w: i.w, h: i.h });
    const groups = n.categories
      // one card a category, its videos played in turn
      ? n.categories.map(c => c.youtube
        // streamed from YouTube rather than a file here: its picture on the card
        ? { name: c.title, lead: c.lead, poster: `https://i.ytimg.com/vi/${c.youtube}/maxresdefault.jpg`, items: [{ src: 'yt:' + c.youtube, w: 1920, h: 1080, start: c.start }] }
        : { name: c.title, lead: c.lead, items: (media[c.folder]?.items || []).filter(i => i.kind === 'video').map(i => ({ ...item(i), start: c.start })) })
      // a single folder: all its videos together, laid out like any category
      : [{ name: n.title, items: vids.map(item) }];
    const extra = document.createElement('span');
    extra.innerHTML = n.folder ? uploadButton(n) : '';
    cleanup = mountStream(canvas.firstElementChild, {
      brand: n.brand || n.parent?.title || '', kicker: n.parent?.title ? `${n.brand || n.parent.title} · ${n.title}` : n.title, groups,
    }, { onMove: arrows, extra: extra.childElementCount ? extra : null });
    const ub = extra.querySelector('[data-upload]'), ui = extra.querySelector('[data-file]');
    if (ub) { ub.addEventListener('click', () => ui.click()); ui.addEventListener('change', () => ui.files.length && upload(n, ui.files, ub)); }
    arrows();
    return;
  }
  if (n.type === 'stream') n = { ...n, type: 'gallery' };   // no videos yet: the usual empty page
  // The t@g films: the monthly report, and the roles and flow, in the same player
  if (n.type === 'tagreport' || n.type === 'tagroles') {
    canvas.innerHTML = '';
    cleanup = mountTagReport(canvas, n, asset, arrows, n.type === 'tagroles' ? roleChapters : undefined);
    arrows();
    return;
  }
  if (n.type === 'tag' || n.type === 'taghero') {
    canvas.innerHTML = '';
    cleanup = (n.type === 'tag' ? mountTag : mountTagHero)(canvas, { ...n, logo: n.logo && asset(n.logo) }, arrows);
    arrows();
    return;
  }
  if (n.type === 'showcase') {
    const scene3 = n.scene3 && { ...n.scene3, logos: (n.scene3.logos || []).map(l => ({ ...l, src: asset(l.src) })) };
    // Designs from every brand in "sources", each also known as "Brand/file name" (e.g. "TH/03 CEO Talk.jpg")
    const pool = Object.entries(n.sources || { '': n.folder }).flatMap(([brand, folder]) =>
      (media[folder]?.items || []).filter(i => i.kind === 'image').map(i => ({ ...i, key: brand ? `${brand}/${i.name}` : i.name })));
    cleanup = mountShowcase(canvas, { ...n, logo: n.logo && asset(n.logo), logo2: n.logo2 && asset(n.logo2), scene3 }, pool, openLightbox, arrows);
    arrows();
    return;
  }
  if (n.type === 'portal') {
    // the t@g platform page has a look of its own (js/portal.js)
    const shots = itemsOf(n).filter(i => i.kind === 'image').slice(0, 3);
    canvas.innerHTML = portalView(n, { asset, shots, upload: n.folder ? uploadButton(n) : '' });
    cleanup = animatePortal(canvas, i => openLightbox(shots, i));
  } else canvas.innerHTML = views[n.type](n);

  // Posters and videos open full screen; videos preview silently on hover
  const list = n.type === 'portal' ? itemsOf(n).filter(i => i.kind === 'image').slice(0, 3) : itemsOf(n).filter(i => fits(n, i));
  const btn = canvas.querySelector('[data-upload]'), input = canvas.querySelector('[data-file]');
  if (btn) {
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => input.files.length && upload(n, input.files, btn));
  }
  canvas.querySelectorAll('.tile-del').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    remove(n, b.dataset.name);
  }));
  canvas.querySelectorAll('.tile[data-i]').forEach(t => {
    t.addEventListener('click', () => openLightbox(list, +t.dataset.i));
    const v = t.querySelector('video');
    if (v) {
      t.addEventListener('mouseenter', () => { v.currentTime = 0; v.play().catch(() => {}); });
      t.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 1; });
    }
  });
}

/* ---------- Routing ---------- */
function route() {
  if (!role) return;
  // No slide in the address: the session screen, as in the Torii and NGI decks
  if (!location.hash.startsWith('#/')) return showWelcome();
  const id = location.hash.slice(2) || 'home';
  showDeck();
  show(byId[id] || order[0]);
}
const go = step => {
  // Next / Prev play the slide's own scenes first, then move on to the next slide
  if (cleanup?.step?.(step)) return;
  const n = order[order.indexOf(current) + step];
  if (n) location.hash = '#/' + n.id;
};

$('prev').addEventListener('click', () => go(-1));
$('next').addEventListener('click', () => go(1));

/* ---------- Present (full screen, no chrome) ---------- */
$('present').addEventListener('click', () => document.documentElement.requestFullscreen?.());
document.addEventListener('fullscreenchange', () => {
  document.body.classList.toggle('presenting', !!document.fullscreenElement);
  fit();
});

/* ---------- Lightbox ---------- */
const lb = $('lightbox'), lbStage = $('lbStage'), lbCaption = $('lbCaption');
let lbList = [], lbIndex = 0;

function openLightbox(list, i) { lbList = list; lb.hidden = false; showItem(i); }
function closeLightbox() { lb.hidden = true; lbStage.innerHTML = ''; }
function showItem(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  const it = lbList[lbIndex];
  lbStage.innerHTML = it.kind === 'image'
    ? `<img src="${it.full || it.url}" alt="${esc(prettify(it.name))}">`
    : `<video src="${it.url}" controls autoplay playsinline></video>`;
  lbCaption.innerHTML = `<b>${esc(prettify(it.name))}</b>${lbIndex + 1} / ${lbList.length}`;
  $('lbPrev').hidden = $('lbNext').hidden = lbList.length < 2;
}
$('lbClose').addEventListener('click', closeLightbox);
$('lbPrev').addEventListener('click', () => showItem(lbIndex - 1));
$('lbNext').addEventListener('click', () => showItem(lbIndex + 1));
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

/* ---------- Keyboard: arrows move through slides, or through the open lightbox ---------- */
addEventListener('keydown', e => {
  if ($('app').hidden || e.target.matches('input, textarea')) return;
  if (!lb.hidden) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showItem(lbIndex + 1);
    if (e.key === 'ArrowLeft') showItem(lbIndex - 1);
    return;
  }
  if (['ArrowRight', 'PageDown'].includes(e.key)) go(1);
  if (['ArrowLeft', 'PageUp'].includes(e.key)) go(-1);
  // Up and Down go straight to the previous or next tab in the menu (sub-tabs included), skipping a slide's own scenes
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const n = order[order.indexOf(current) + (e.key === 'ArrowDown' ? 1 : -1)];
    if (n) location.hash = '#/' + n.id;
  }
});

/* ---------- New files show up when you come back to the deck ---------- */
addEventListener('focus', async () => {
  // Pages that play on their own are not rebuilt (a film would start again)
  if ($('app').hidden || !current || ['home', 'showcase', 'stream', 'tag', 'taghero', 'tagreport', 'tagroles', 'portal'].includes(current.type) || current.media === 'video') return;
  const id = current.id;
  await load();
  show(byId[id] || order[0]);
});

/* ---------- Screens: sign in → session → deck ---------- */
const screens = ['login', 'welcome', 'app'];
function only(id) {
  screens.forEach(s => { $(s).hidden = s !== id; });
  if (id !== 'app') { cleanup?.(); cleanup = null; current = null; }
}

let hint = null, pickedRole = 'presenter';
function pickRole(r) {
  pickedRole = r;
  document.querySelectorAll('.role').forEach(b => b.classList.toggle('on', b.dataset.role === r));
  if (hint) {
    $('email').value = hint[r].email;
    $('password').value = hint[r].password;
  }
}

async function showLogin() {
  role = null;
  if (location.hash) history.replaceState(null, '', location.pathname);
  only('login');
  document.title = 'Sign in · Digital Marketing';
  if (hint === null) {
    hint = (await (await fetch('/api/auth/config')).json()).hint || false;
    $('loginHelp').textContent = hint
      ? "The presenter's details are filled in — press Sign in to open the deck. Switch to Admin and its details are filled in too."
      : 'Sign in with your email and password.';
  }
  pickRole(pickedRole);
  $('loginError').textContent = '';
}

function showWelcome() {
  only('welcome');
  document.title = 'Digital Marketing · Torii Minds';
  $('welcome').classList.toggle('admin', isAdmin());
  $('sessionLabel').textContent = isAdmin() ? 'Admin session' : 'Presenter session';
}

function showDeck() {
  if (!$('app').hidden) return;
  only('app');
  $('mode').textContent = isAdmin() ? 'Admin' : 'Presenting';
  $('mode').classList.toggle('admin', isAdmin());
  fit();
}

document.querySelectorAll('.role').forEach(b => b.addEventListener('click', () => pickRole(b.dataset.role)));

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.login-btn');
  btn.disabled = true;
  $('loginError').textContent = '';
  const res = await fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: $('email').value, password: $('password').value }),
  });
  btn.disabled = false;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { $('loginError').textContent = body.error || 'Could not sign in.'; return; }
  role = body.role;
  await load();
  showWelcome();
});

$('startBtn').addEventListener('click', () => { location.hash = '#/' + order[0].id; });

// Signing out asks first
const confirmBox = $('confirm');
const closeConfirm = () => { confirmBox.hidden = true; };
document.querySelectorAll('[data-signout]').forEach(b => b.addEventListener('click', () => {
  confirmBox.hidden = false;
  $('confirmNo').focus();
}));
$('confirmNo').addEventListener('click', closeConfirm);
confirmBox.addEventListener('click', e => { if (e.target === confirmBox) closeConfirm(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !confirmBox.hidden) { e.stopPropagation(); closeConfirm(); } }, true);
$('confirmYes').addEventListener('click', async () => {
  closeConfirm();
  if (document.fullscreenElement) document.exitFullscreen();
  await fetch('/api/auth/logout', { method: 'POST' });
  showLogin();
});

/* Social platforms circling the session screen, like the partner logos on Torii's */
const PLATFORMS = [
  '<rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/><path d="M7 10 V17 M7 7 V7.1 M11 17 V10 M11 13.5 A3 3 0 0 1 17 13.5 V17" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  '<defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEC053"/><stop offset=".5" stop-color="#F2203E"/><stop offset="1" stop-color="#5258CF"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3.5" stroke="#fff" stroke-width="1.8" fill="none"/><circle cx="12" cy="12" r="2.6" stroke="#fff" stroke-width="1.8" fill="none"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/>',
  '<rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0000"/><path d="M10 9 L15.5 12 L10 15 Z" fill="#fff"/>',
  '<circle cx="12" cy="12" r="10" fill="#1877F2"/><path d="M13.2 21.5 V14 H15.6 L16 11.2 H13.2 V9.6 C13.2 8.8 13.5 8.2 14.6 8.2 H16.1 V5.7 C15.8 5.7 14.9 5.6 13.9 5.6 C11.8 5.6 10.3 6.9 10.3 9.3 V11.2 H8 V14 H10.3 V21.5 Z" fill="#fff"/>',
  '<path d="M21.6 12.2 C21.6 11.5 21.5 10.8 21.4 10.2 H12 V14 H17.4 C17.2 15.2 16.5 16.3 15.4 17 V19.5 H18.6 C20.5 17.7 21.6 15.2 21.6 12.2 Z" fill="#4285F4"/><path d="M12 22 C14.7 22 17 21.1 18.6 19.5 L15.4 17 C14.5 17.6 13.3 18 12 18 C9.4 18 7.2 16.3 6.4 13.9 H3.1 V16.4 C4.8 19.7 8.1 22 12 22 Z" fill="#34A853"/><path d="M6.4 13.9 C6.2 13.3 6.1 12.7 6.1 12 C6.1 11.3 6.2 10.7 6.4 10.1 V7.6 H3.1 C2.4 8.9 2 10.4 2 12 C2 13.6 2.4 15.1 3.1 16.4 Z" fill="#FBBC05"/><path d="M12 6 C13.5 6 14.8 6.5 15.8 7.5 L18.7 4.6 C17 3 14.7 2 12 2 C8.1 2 4.8 4.3 3.1 7.6 L6.4 10.1 C7.2 7.7 9.4 6 12 6 Z" fill="#EA4335"/>',
  '<rect x="2" y="2" width="20" height="20" rx="5" fill="#111"/><path d="M7 7 L17 17 M17 7 L7 17" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  '<circle cx="12" cy="12" r="10" fill="#25D366"/><path d="M8.5 7.5 C8 8 7.6 8.8 7.9 9.9 C8.6 12.3 11.1 15.2 13.8 16 C14.9 16.4 15.8 16 16.3 15.4 L16.6 14.6 L14.6 13.5 L13.7 14.4 C12.3 13.8 10.9 12.4 10.2 11 L11.1 10 L10 8 Z" fill="#fff"/>',
  '<rect x="2" y="2" width="20" height="20" rx="5" fill="#F05D29"/><path d="M7 17 V13 M12 17 V8 M17 17 V11" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
];
$('orbit').innerHTML =
  [520, 820, 1140].map(d => `<div class="ring" style="width:${d}px;height:${d}px"></div>`).join('') +
  PLATFORMS.map((svg, i) => {
    // alternate between the middle and outer ring, spread around the circle
    const r = i % 2 ? 570 : 410, a = (i / PLATFORMS.length) * Math.PI * 2 + .35;
    return `<div class="chip" style="--i:${i};left:calc(50% + ${Math.round(Math.cos(a) * r)}px);top:calc(50% + ${Math.round(Math.sin(a) * r * .78)}px)"><svg viewBox="0 0 24 24">${svg}</svg></div>`;
  }).join('');

addEventListener('hashchange', route);

// Already signed in (a refresh keeps you where you were), or show the sign-in page
const me = await fetch('/api/auth/me');
if (me.ok) {
  role = (await me.json()).role;
  await load();
  route();
} else {
  showLogin();
}

