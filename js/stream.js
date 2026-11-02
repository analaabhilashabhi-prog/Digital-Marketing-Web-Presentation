// The streaming video player, ported from the NGI presentation's StreamGallery
// (frontend/src/components/StreamGallery.js) so videos here behave exactly as
// they do there:
//   - one category plays full screen, its name large at the left, letter by
//     letter out of a blur, with a dot for each page of its videos;
//   - a row of every category runs along the foot; the one playing is lit;
//   - the card under the pointer is lit and scaled up, the rest dimmed; the
//     wheel or touchpad scrolls the row, and after a moment the highlight goes
//     back to the category playing;
//   - pressing a card crossfades its category onto the big screen;
//   - a wide film plays whole, full screen, then hands on to the next page;
//     vertical reels stand side by side, the longest one moving things on;
//   - 1.5s into a film everything over it fades away; the bottom of the
//     screen, the row, or a scroll brings it back; a click on the picture hides it;
//   - Next and Prev (and the arrow keys) play the next or previous category,
//     and past either end move to the next or previous slide.
// Not carried over: the photo-wall landing, drawn figures and trailers.

const HOLD = 5000;     // how long a page with no film holds
const FADE = 1800;     // the crossfade between pages (in the stylesheet too)
const RAIL_IDLE = 2600; // how long a press with no pointer to follow shows the row
const QUIET = 1500;    // how long a film keeps the row and words over it
const PREVIEW = 1600;  // how long a scroll's highlight lasts before going back to the playing card

const isFilm = src => /^yt:|\.(mp4|webm|mov|m4v)(#|$)/i.test(src);
const isYT = src => src.startsWith('yt:');

/* A film streamed from YouTube ('yt:<id>', 2026-10-31: "play it straight from
   YouTube, like the downloaded ones"). It plays in YouTube's own player, dressed
   as the others: no controls, its titles and logo cropped away, muted until
   Sound is on, and its end moves the page on. The box answers play, pause,
   muted, rewind and stop the way the stream treats a <video>. */
let ytApi;
const loadYT = () => ytApi ||= new Promise(res => {
  if (window.YT?.Player) return res(window.YT);
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev?.(); res(window.YT); };
  document.head.append(Object.assign(document.createElement('script'), { src: 'https://www.youtube.com/iframe_api' }));
});
function ytFilm(src, cls, start = 0, solo = false) {
  const spot = document.createElement('div');
  const box = h('div', { class: `${cls} sg-yt${solo ? ' is-solo' : ''}` }, h('div', { class: 'sg-yt__frame' }, spot), solo ? null : h('i', { class: 'sg-yt__shield' }));
  if (start) box.dataset.start = start;
  // the film's still behind the player, so the box is never black while YouTube loads
  box.style.background = `#000 url(https://i.ytimg.com/vi/${src.slice(3)}/hqdefault.jpg) center / cover no-repeat`;
  let player = null, muted = !solo, want = true;
  const fire = type => box.dispatchEvent(new Event(type));
  box.play = () => { want = true; player?.playVideo?.(); return Promise.resolve(); };
  box.pause = () => { want = false; player?.pauseVideo?.(); };
  Object.defineProperty(box, 'muted', { get: () => muted, set: m => { muted = m; if (player?.mute) m ? player.mute() : player.unMute(); } });
  box.rewind = () => player?.seekTo?.(start, true);
  box.stop = () => { want = false; player?.destroy?.(); player = null; };
  box.quality = () => player?.getPlaybackQuality?.();
  /* The best the film has (2026-10-31: "play at max quality"). YouTube picks by
     the connection unless held to one level, so it is asked for the top one,
     the first it lists, as soon as it plays and again whenever it buffers. */
  const best = p => {
    const top = p.getAvailableQualityLevels?.()[0] || 'highres';
    p.setPlaybackQualityRange?.(top, top);
    p.setPlaybackQuality?.(top);
  };
  loadYT().then(YT => {
    if (!want) return;   // stopped before the player loaded
    player = new YT.Player(spot, {
      videoId: src.slice(3),
      playerVars: { vq: 'highres', autoplay: 1, mute: muted ? 1 : 0, controls: solo ? 1 : 0, start, rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: solo ? 0 : 1, fs: solo ? 1 : 0, modestbranding: 1 },
      events: {
        onReady: e => { best(e.target); muted ? e.target.mute() : e.target.unMute(); want ? e.target.playVideo() : e.target.pauseVideo(); },
        onStateChange: e => { if (e.data === 1 || e.data === 3) best(e.target); if (e.data === 0) fire('ended'); if (e.data === 1) box.classList.add('is-playing'); },
        onError: () => fire('error'),
      },
    });
  });
  return box;
}
const FILMS = 'video, .sg-yt';

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') Object.entries(v).forEach(([p, val]) => el.style.setProperty(p, val));
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  el.append(...kids.filter(x => x != null));
  return el;
}

// block: { brand, kicker, groups: [{ name, kicker, lead, items: [{ src, w, h }] }] }
export function mountStream(host, block, { onMove = () => {}, extra = null } = {}) {
  const groups = (block.groups || []).filter(g => g.name && g.items?.length);
  const arOf = it => (it.w && it.h ? it.w / it.h : 16 / 9);
  const tall = it => arOf(it) < 1;
  const root = h('div', { class: 'sg-root is-nobars' });
  host.appendChild(root);
  let sound = false;
  if (!groups.length) return Object.assign(() => {}, { step: () => false });

  /* Pages: vertical reels four to a row; horizontal films stacked one above
     another, up to three; a horizontal film on its own plays full screen.
     (2026-10-30: "all of four in a row… for the horizontal videos stack them
     vertically".) A category's vertical videos are gathered into rows and its
     horizontal ones into stacks, whichever kind comes first leading. */
  // "single" (Technical Hub, 2026-11-02): every horizontal film plays on its own, full screen, one after another
  const MAX_REELS = 4, MAX_STACK = block.single ? 1 : 3;
  const chunk = (list, n) => list.reduce((pages, it, i) => (i % n ? pages[pages.length - 1].push(it) : pages.push([it]), pages), []);
  function pack(items) {
    const reels = chunk(items.filter(tall), MAX_REELS);
    const wide = chunk(items.filter(it => !tall(it)), MAX_STACK);
    return items.length && tall(items[0]) ? [...reels, ...wide] : [...wide, ...reels];
  }
  const pageCache = new Map();
  const pagesOf = g => {
    if (!pageCache.has(g)) pageCache.set(g, pack(g.items));
    return pageCache.get(g);
  };
  const firstAt = (g, i) => pagesOf(g)[i][0];
  const filmAt = (g, i) => { const p = pagesOf(g)[i]; return p.length === 1 && isFilm(p[0].src) && !tall(p[0]); };
  const reelsAt = (g, i) => { const p = pagesOf(g)[i]; return tall(p[0]) && p.some(it => isFilm(it.src)); };
  const stackAt = (g, i) => { const p = pagesOf(g)[i]; return p.length > 1 && !tall(p[0]) && p.some(it => isFilm(it.src)); };
  // several films on one page play together; the longest one moves things on
  const manyAt = (g, i) => reelsAt(g, i) || stackAt(g, i);
  const isRows = g => pagesOf(g).some((p, i) => !filmAt(g, i));

  const stage = h('div', { class: 'sg-stage', 'aria-hidden': 'true' });
  const info = h('div', { class: 'sg-info' });
  const count = h('span', { class: 'sg-count' });
  const soundBtn = h('button', { type: 'button', class: 'sg-sound' });
  const track = h('div', { class: 'sg-track' });
  const rail = h('div', { class: 'sg-rail' }, track);

  root.append(stage,
    h('div', { class: 'sg-grade', 'aria-hidden': 'true' }),
    h('div', { class: 'ch-grain', 'aria-hidden': 'true' }),
    h('div', { class: 'ch-bar ch-bar--top', 'aria-hidden': 'true' }),
    h('div', { class: 'ch-bar ch-bar--bottom', 'aria-hidden': 'true' }),
    h('div', { class: 'sg-top' },
      h('p', { class: 'sg-brand', text: block.brand || '' }),
      h('div', { class: 'sg-tools' }, extra, soundBtn, count)),
    info, rail);

  /* Sound: off at the start (a browser refuses to start a film with sound by itself) */
  const SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path d="M16.5 8.5 C18.5 10.5 18.5 13.5 16.5 15.5 M19 6 C22.3 9.3 22.3 14.7 19 18"/></svg>';
  const SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path d="M17 9.5 L22 14.5 M22 9.5 L17 14.5"/></svg>';
  const paintSound = () => { soundBtn.innerHTML = (sound ? SOUND_ON : SOUND_OFF) + `<span>${sound ? 'Sound on' : 'Sound off'}</span>`; };
  paintSound();
  // With several reels side by side only the first one speaks
  const applySound = () => stage.querySelectorAll('.sg-layer.is-on :is(video, .sg-yt)').forEach((v, i) => { v.muted = !sound || i > 0; });
  soundBtn.addEventListener('click', e => { e.stopPropagation(); sound = !sound; paintSound(); applySound(); });

  let current = 0, item = 0, layer = null, timer = 0;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  function video(src, cls, attrs = {}, start = 0) {
    if (isYT(src)) return ytFilm(src, cls, start);
    const v = h('video', { class: cls, src, autoplay: true, playsinline: true, preload: 'auto', ...attrs });
    v.muted = true;
    if (start) {
      v.dataset.start = start;
      v.addEventListener('loadedmetadata', () => { if (v.duration > start + 5) v.currentTime = start; }, { once: true });
    }
    return v;
  }
  // back to where a film begins: its start, if it has one
  const rewind = v => { if (v.rewind) v.rewind(); else v.currentTime = +v.dataset.start || 0; };

  /* Horizontal films as full-width bands stacked top to bottom, edge to edge
     (2026-10-30, to a reference: each film the whole width and an equal share
     of the height, cropped to its band, no gaps). */
  function stagger(list) {
    const bandH = 900 / list.length;
    return list.map((_, k) => ({ left: '0px', top: `${(k * bandH).toFixed(1)}px`, width: '100%', height: `${bandH.toFixed(1)}px` }));
  }

  function page(list) {
    if (list.length > 1 && !tall(list[0])) {
      const boxes = stagger(list);
      return h('div', { class: 'sg-page sg-page--stagger' },
        ...list.map((it, k) => h('figure', { class: `sg-shot${isFilm(it.src) ? ' is-reel' : ''}`, style: { ...boxes[k], '--k': String(k) } },
          isFilm(it.src) ? openable(video(it.src, '', {}, it.start), it.src) : h('img', { src: it.src, alt: '', decoding: 'async' }))));
    }
    const sum = list.reduce((n, it) => n + arOf(it), 0);
    return h('div', { class: 'sg-page' },
      h('div', { class: 'sg-page__row', style: { '--sum': sum.toFixed(4), '--n': String(list.length) } },
        ...list.map((it, k) => h('figure', { class: `sg-shot${isFilm(it.src) ? ' is-reel' : ''}`, style: { '--ar': arOf(it).toFixed(4), '--k': String(k) } },
          isFilm(it.src) ? openable(video(it.src, '', {}, it.start), it.src) : h('img', { src: it.src, alt: '', decoding: 'async' })))));
  }

  function paint() {
    const g = groups[current];
    const first = firstAt(g, item);
    const film = filmAt(g, item);
    let m;
    if (film) m = openable(video(first.src, 'sg-layer__media', {}, first.start), first.src);
    else if (isRows(g)) m = h('div', { class: 'sg-layer__media sg-layer__rows' }, page(pagesOf(g)[item]));
    else m = h('img', { class: 'sg-layer__media', src: first.src, alt: '', decoding: 'async' });
    // a film far from 16:9 plays whole rather than cropped
    const whole = film && Math.abs(arOf(first) - 16 / 9) > 0.25;
    const next = h('div', { class: `sg-layer${film ? ' is-film' : ''}${whole ? ' is-whole' : ''}` }, m);
    const mine = { current, item };
    const onward = () => {
      if (!root.isConnected || layer !== next || mine.current !== current || mine.item !== item) return;
      advance();
      tick();
    };
    if (film) {
      m.addEventListener('ended', onward);
      m.addEventListener('error', () => later(onward, HOLD));
      m.play?.().catch(() => {});
    }
    if (manyAt(g, item)) {
      /* Reels side by side: the shorter ones loop while the longest plays,
         and the longest ending moves the gallery on. */
      const vids = [...m.querySelectorAll('video')];
      let known = 0;
      vids.forEach(v => v.addEventListener('loadedmetadata', () => {
        if (++known < vids.length) return;
        const longest = vids.reduce((a, b) => (b.duration > a.duration ? b : a));
        vids.forEach(v2 => { if (v2 !== longest) v2.addEventListener('ended', () => { rewind(v2); v2.play?.().catch(() => {}); }); });
        longest.addEventListener('ended', onward);
      }, { once: true }));
      vids.forEach(v => { v.addEventListener('error', () => later(onward, HOLD)); v.play?.().catch(() => {}); });
    }
    stage.appendChild(next);
    requestAnimationFrame(() => requestAnimationFrame(() => { next.classList.add('is-on'); applySound(); }));
    const old = layer;
    layer = next;
    if (old) later(() => { old.querySelectorAll(FILMS).forEach(stop); old.remove(); }, FADE + 80);
    info.querySelectorAll('.sg-dot').forEach((s, n) => s.classList.toggle('is-on', n === item));
    root.classList.toggle('is-reels', reelsAt(g, item));
    root.classList.toggle('is-stack', stackAt(g, item));
    root.classList.toggle('is-filmpage', film || manyAt(g, item));
    if (film || manyAt(g, item)) { wake(); settle(); } else settle();
  }

  function advance() {
    const g = groups[current];
    const n = pagesOf(g).length;
    if (n > 1) { item = (item + 1) % n; paint(); }
    else if (manyAt(g, 0)) layer?.querySelectorAll(FILMS).forEach(v => { rewind(v); v.play?.().catch(() => {}); });
    else if (filmAt(g, 0) && block.single && groups.length > 1) play((current + 1) % groups.length);
    else if (filmAt(g, 0)) {
      /* A lone film plays again, from its start. */
      const v = layer?.querySelector(FILMS);
      if (v) { rewind(v); v.play?.().catch(() => {}); }
    }
  }

  /* A page with no film holds for HOLD; a film moves on from its own `ended`. */
  function tick() {
    clearTimeout(timer);
    if (filmAt(groups[current], item) || manyAt(groups[current], item)) return;
    timer = later(() => { if (root.isConnected) { advance(); tick(); } }, HOLD);
  }

  /* The name as letters in words (a word never breaks), each letter rising out of a blur. */
  let firstWords = true;
  function lettered(name) {
    const chars = [...name];
    const step = Math.min(0.07, 1.3 / Math.max(1, chars.length));
    let c = 0;
    const out = [];
    name.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { out.push(' '); c += part.length; return; }
      out.push(h('span', { class: 'sg-title__word' },
        ...[...part].map(ch => h('span', { class: 'sg-title__ch', 'aria-hidden': 'true', text: ch, style: { '--d': `${(c++ * step).toFixed(3)}s` } }))));
    });
    return out;
  }

  function words() {
    const g = groups[current];
    info.style.setProperty('--sg-t0', firstWords ? '1.1s' : '0.25s');
    firstWords = false;
    const n = pagesOf(g).length;
    root.classList.toggle('is-rows', isRows(g));
    info.replaceChildren(...[
      h('p', { class: 'sg-kicker', text: g.kicker || block.kicker || '' }),
      h('h2', { class: 'sg-title', 'aria-label': g.name }, ...lettered(g.name)),
      g.lead ? h('p', { class: 'sg-lead', text: g.lead }) : null,
      n > 1 ? h('div', { class: 'sg-dots', 'aria-hidden': 'true' }, ...pagesOf(g).map((_, i) => h('span', { class: `sg-dot${i === item ? ' is-on' : ''}` }))) : null,
    ].filter(Boolean));
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(groups.length).padStart(2, '0')}`;
  }

  /* A card shows a still, never a playing film: a frame a third of the way in. */
  function still(g) {
    const it = g.poster ? { src: g.poster } : g.items[0];
    if (!isFilm(it.src)) {
      const img = h('img', { class: 'sg-card__media', src: it.src, alt: '', decoding: 'async' });
      // not every YouTube film has a full-size picture: YouTube's small grey stand-in means take the standard one
      if (it.src.includes('/maxresdefault.')) {
        const std = () => { img.src = it.src.replace('/maxresdefault.', '/hqdefault.'); };
        img.addEventListener('load', () => { if (img.naturalWidth <= 120) std(); }, { once: true });
        img.addEventListener('error', std, { once: true });
      }
      return img;
    }
    const v = h('video', { class: 'sg-card__media', src: it.src, preload: 'metadata', playsinline: true });
    v.muted = true;
    v.addEventListener('loadedmetadata', () => { v.currentTime = Math.min(v.duration * 0.3, 20); }, { once: true });
    return v;
  }

  const cards = groups.map((g, j) => {
    const card = h('button', { type: 'button', class: 'sg-card', 'aria-label': g.name, style: { '--i': String(j) } },
      still(g),
      h('span', { class: 'sg-card__shade' }),
      h('span', { class: 'sg-card__text' }, h('span', { class: 'sg-card__name', text: g.name })));
    card.addEventListener('click', () => play(j));
    return card;
  });
  track.append(...cards);

  /* Which card is lit: a pointer over a card wins; after a scroll, the card
     nearest the middle of the row; at rest, the category playing. */
  let focusJ = -1, hoverJ = -1, scrolled = false, previewTimer = 0;
  function updateFocus() {
    if (!rail.clientWidth || !cards.length) return;
    let want = hoverJ;
    if (want < 0 && !scrolled) want = current;
    if (want < 0 && scrolled) {
      const first = cards[0].offsetLeft + cards[0].offsetWidth / 2;
      const last = cards[cards.length - 1].offsetLeft + cards[cards.length - 1].offsetWidth / 2;
      const span = maxOffset();
      const mid = span > 0 ? first + (offset / span) * (last - first) : first;
      let best = -1, bestD = Infinity, curD = Infinity;
      cards.forEach((c, j) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = j; }
        if (j === focusJ) curD = d;
      });
      want = focusJ >= 0 && curD - bestD < 14 ? focusJ : best;
    }
    if (want === focusJ) return;
    if (focusJ >= 0) cards[focusJ]?.classList.remove('is-focus');
    focusJ = want;
    if (focusJ >= 0) cards[focusJ]?.classList.add('is-focus');
    rail.classList.toggle('has-focus', focusJ >= 0);
  }

  let offset = 0;
  const maxOffset = () => Math.max(0, track.scrollWidth - rail.clientWidth);
  const setOffset = x => {
    offset = Math.max(0, Math.min(maxOffset(), x));
    track.style.transform = `translate3d(${-offset}px,0,0)`;
    updateFocus();
  };
  const backToPlaying = () => {
    clearTimeout(previewTimer);
    previewTimer = later(() => {
      if (!root.isConnected || hoverJ >= 0) return;
      scrolled = false;
      reveal(current);
      updateFocus();
    }, PREVIEW);
  };
  const scrollRow = dx => { scrolled = true; hoverJ = -1; setOffset(offset + dx); backToPlaying(); };
  rail.addEventListener('pointermove', e => {
    const j = cards.indexOf(e.target.closest?.('.sg-card'));
    if (j !== hoverJ) { hoverJ = j; updateFocus(); }
  });
  rail.addEventListener('pointerleave', () => { hoverJ = -1; updateFocus(); if (scrolled) backToPlaying(); });
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateFocus()) : null;
  ro?.observe(rail);
  function reveal(j) {
    const c = cards[j];
    if (!c) return;
    const AIR = 28;   // a lit card is scaled up: keep it clear of the row's edge
    const left = c.offsetLeft - AIR, right = c.offsetLeft + c.offsetWidth + AIR;
    if (left < offset) setOffset(left);
    else if (right > offset + rail.clientWidth) setOffset(right - rail.clientWidth);
  }
  rail.addEventListener('wheel', e => {
    e.preventDefault();
    scrollRow(Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
  }, { passive: false });

  /* The row and the words fade while a film plays, and come back at once for
     the bottom band, the row, or a scroll; a click on the picture hides them. */
  let railTimer = 0, overRail = false, quietTimer = 0, inBand = false;
  const showRail = () => { clearTimeout(railTimer); root.classList.add('is-rail'); };
  const hideRail = () => { clearTimeout(railTimer); root.classList.remove('is-rail'); };
  const wake = () => { clearTimeout(quietTimer); root.classList.remove('is-quiet'); };
  const settle = () => {
    clearTimeout(quietTimer);
    quietTimer = later(() => { if (root.isConnected && !overRail && !inBand) root.classList.add('is-quiet'); }, QUIET);
  };
  const hush = () => { clearTimeout(quietTimer); root.classList.add('is-quiet'); };
  root.addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    const band = inBand ? y > 0.7 : y > 0.8;   // in below 80%, out above 70%: no flicker on the edge
    if (band || overRail) showRail(); else if (root.classList.contains('is-rail')) hideRail();
    const was = inBand;
    inBand = band || overRail;
    if (inBand && !was) wake();
    else if (!inBand && was) settle();
  });
  root.addEventListener('wheel', e => {
    if (rail.contains(e.target)) return;
    e.preventDefault();
    wake();
    scrollRow(Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    if (!inBand) settle();
  }, { passive: false });
  root.addEventListener('click', e => {
    if (e.target.closest('button, a, input, .sg-rail, .sg-card, .sg-dots, [role="button"]')) return;
    if (root.classList.contains('is-quiet')) return;
    hush();
  });
  root.addEventListener('pointerleave', () => { overRail = false; inBand = false; hideRail(); settle(); });
  rail.addEventListener('pointerenter', () => { overRail = true; inBand = true; showRail(); wake(); });
  rail.addEventListener('pointerleave', e => {
    overRail = false;
    const r = root.getBoundingClientRect();
    if ((e.clientY - r.top) / r.height <= 0.8) { inBand = false; hideRail(); settle(); }
  });

  /* A category to the big screen, as a crossfade; its card lights and comes into view. */
  function play(gi) {
    if (!overRail) {
      showRail();
      railTimer = later(() => { if (root.isConnected && !overRail) root.classList.remove('is-rail'); }, RAIL_IDLE);
    }
    wake();
    clearTimeout(previewTimer);
    scrolled = false;
    if (gi === current && layer) { reveal(gi); updateFocus(); settle(); return; }
    current = gi;
    item = 0;
    words();
    paint();
    tick();
    reveal(gi);
    updateFocus();
    onMove();
  }

  words(); paint(); tick();
  requestAnimationFrame(updateFocus);

  function stop(v) { if (v.stop) return v.stop(); v.pause(); v.removeAttribute('src'); v.load(); }

  /* Click a film and it opens on its own, large, with sound and controls; the
     page under it waits. Back, Esc or the film ending returns to it. */
  let solo = null;
  function openable(v, src) {
    v.classList.add('is-openable');
    v.addEventListener('click', e => { e.stopPropagation(); openSolo(src, +v.dataset.start || 0); });
    return v;
  }
  function openSolo(src, start = 0) {
    closeSolo(false);
    clearTimeout(timer);
    stage.querySelectorAll(FILMS).forEach(v => v.pause());
    const v = isYT(src) ? ytFilm(src, 'sg-solo__video', start, true) : h('video', { class: 'sg-solo__video', src, controls: true, autoplay: true, playsinline: true, preload: 'auto' });
    if (start && !isYT(src)) v.addEventListener('loadedmetadata', () => { if (v.duration > start + 5) v.currentTime = start; }, { once: true });
    v.muted = false;
    v.play?.().catch(() => { v.muted = true; v.play?.().catch(() => {}); });
    const back = h('button', { type: 'button', class: 'sg-solo__back', 'aria-label': 'Back', title: 'Back (Esc)' });
    back.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 12 H5 M11 6 L5 12 L11 18"/></svg>';
    back.addEventListener('click', e => { e.stopPropagation(); closeSolo(true); });
    v.addEventListener('ended', () => closeSolo(true));
    solo = h('div', { class: 'sg-solo' }, v, back);
    solo.addEventListener('click', e => e.stopPropagation());
    root.appendChild(solo);
    root.classList.add('is-solo');
    // the whole screen, not just the slide (2026-10-30); the click is the gesture a browser asks for
    solo.requestFullscreen?.().catch(() => {});
  }
  function closeSolo(resume) {
    if (!solo) return;
    const s = solo;
    solo = null;
    root.classList.remove('is-solo');
    if (document.fullscreenElement === s) document.exitFullscreen().catch(() => {});
    s.classList.add('is-leaving');
    later(() => { s.querySelectorAll(FILMS).forEach(stop); s.remove(); }, 320);
    if (resume) {
      stage.querySelectorAll(`.sg-layer.is-on :is(${FILMS})`).forEach(v => v.play?.().catch(() => {}));
      tick();
      wake(); settle();
    }
  }
  const onKey = e => { if (e.key === 'Escape' && solo) { e.stopPropagation(); closeSolo(true); } };
  addEventListener('keydown', onKey, true);
  // Esc in full screen is taken by the browser: leaving full screen closes the film too
  const onFull = () => { if (solo && document.fullscreenElement !== solo && solo.dataset.full) closeSolo(true); else if (solo && document.fullscreenElement === solo) solo.dataset.full = '1'; };
  document.addEventListener('fullscreenchange', onFull);
  const cleanup = () => {
    removeEventListener('keydown', onKey, true);
    document.removeEventListener('fullscreenchange', onFull);
    timers.forEach(clearTimeout); timers.clear();
    clearTimeout(timer); clearTimeout(quietTimer); clearTimeout(railTimer); clearTimeout(previewTimer);
    ro?.disconnect();
    root.querySelectorAll(FILMS).forEach(stop);
  };
  /* Next and Prev play the next or previous category; past either end the deck moves on. */
  cleanup.step = dir => {
    closeSolo(false);
    const next = current + (dir > 0 ? 1 : -1);
    if (next < 0 || next >= groups.length) return false;
    play(next);
    return true;
  };
  cleanup.atStart = () => current === 0;
  cleanup.atEnd = () => current === groups.length - 1;
  return cleanup;
}
