// The Home slide: Torii's search bar is the bridge between your business and your customers.
// Markup lives in home.html; mountHome() fills a slide with it and returns a cleanup.

let template = null;

/* ---------- Customer icons ---------- */
// What each customer is after, drawn white inside an orange badge centred on 0,0
const BADGES = {
  chat:  '<path d="M-7 -6 H7 A2.5 2.5 0 0 1 9.5 -3.5 V2.5 A2.5 2.5 0 0 1 7 5 H-1 L-6 9 V5 H-7 A2.5 2.5 0 0 1 -9.5 2.5 V-3.5 A2.5 2.5 0 0 1 -7 -6 Z" fill="#fff"/>',
  heart: '<path d="M0 8 C-9 2 -9 -6 -4.5 -6.5 C-2 -6.8 -0.5 -5 0 -3.5 C0.5 -5 2 -6.8 4.5 -6.5 C9 -6 9 2 0 8 Z" fill="#fff"/>',
  cart:  '<path d="M-9 -6 H-6 L-3.5 3 H6 L8.5 -3.5 H-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-2" cy="7" r="1.8" fill="#fff"/><circle cx="5" cy="7" r="1.8" fill="#fff"/>',
  star:  '<path d="M0 -8.5 L2.5 -2.8 L8.6 -2.6 L3.9 1.3 L5.5 7.4 L0 4 L-5.5 7.4 L-3.9 1.3 L-8.6 -2.6 L-2.5 -2.8 Z" fill="#fff"/>',
};

function avatar(badge) {
  return `
  <svg class="avatar" viewBox="0 0 70 100" aria-hidden="true">
    <circle cx="35" cy="40" r="17" fill="currentColor"/>
    <path d="M5 100 C5 75 18 63 35 63 C52 63 65 75 65 100 Z" fill="currentColor"/>
    <g class="badge" transform="translate(57 16)">
      <circle r="13" fill="var(--torii-orange)" stroke="#fff" stroke-width="2.5"/>
      ${BADGES[badge]}
    </g>
  </svg>`;
}

/* ---------- Search bar types by itself ---------- */
// Types a line, backspaces to the shared "Torii handles your " and types the next one
const PREFIX = 'Torii handles your ';
const LINES = [
  'LinkedIn',
  'social media activities',
  'digital marketing',
  'content',
  'poster designing',
];
const TYPE_MS = 75, ERASE_MS = 40, HOLD_MS = 1800, START_MS = 2400;

function startTyping(typed, caret) {
  let text = '';
  let alive = true;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const render = () => {
    // "Torii" in orange, the rest in the search bar's grey
    typed.innerHTML = text.startsWith('Torii') ? `<b>Torii</b>${text.slice(5)}` : `<b>${text}</b>`;
  };

  async function typeTo(target) {
    caret.classList.add('typing');
    while (alive && !target.startsWith(text)) { text = text.slice(0, -1); render(); await sleep(ERASE_MS); }
    while (alive && text !== target) { text = target.slice(0, text.length + 1); render(); await sleep(TYPE_MS); }
    caret.classList.remove('typing');
  }

  (async () => {
    await sleep(START_MS);  // let the bridge build first
    for (let i = 0; alive; i = (i + 1) % LINES.length) {
      await typeTo(PREFIX + LINES[i]);
      await sleep(HOLD_MS);
      await typeTo(PREFIX);
      await sleep(250);
    }
  })();

  return () => { alive = false; };
}

export async function mountHome(root) {
  template ??= await (await fetch('home.html')).text();
  root.innerHTML = `<div class="home">${template}</div>`;
  const home = root.firstElementChild;

  home.querySelectorAll('.customer').forEach(c => {
    c.style.left = c.dataset.x + 'px';
    c.innerHTML = avatar(c.dataset.badge);
  });

  // Headline letters: each fades in on its own delay
  const headline = home.querySelector('.headline');
  headline.innerHTML = [...headline.textContent]
    .map((ch, i) => ch === ' ' ? ' ' : `<span style="--i:${i}">${ch}</span>`)
    .join('');

  // Tooltips on the shop and the customers, positioned in canvas units
  const tip = home.querySelector('.tip');
  home.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', () => { tip.textContent = el.dataset.tip; tip.classList.add('show'); });
    el.addEventListener('mousemove', () => {
      const r = el.getBoundingClientRect();
      const hr = home.getBoundingClientRect();
      const s = hr.width / 1920;
      tip.style.left = (r.left + r.width / 2 - hr.left) / s + 'px';
      tip.style.top = (r.top - hr.top) / s + 'px';
    });
    el.addEventListener('mouseleave', () => tip.classList.remove('show'));
  });

  return startTyping(home.querySelector('.typed'), home.querySelector('.caret'));
}
