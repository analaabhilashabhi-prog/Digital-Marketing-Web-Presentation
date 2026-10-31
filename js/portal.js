// The Platform overview slide: a dark, cinematic product page for t@g.
// The headline rises out of a mask, the portal's screens arrive in a tilted 3D
// stack and take turns at the front, and a light runs along the six steps of the
// workflow, lighting each one in turn.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// "Every *campus.*": the starred words in orange
const accent = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');

const ICON = [
  '<path d="M4 10 L15 5 V19 L4 14 Z"/><path d="M15 9 A3 3 0 0 1 15 15"/>',                                   // request
  '<path d="M4 20 L5.5 14.5 L15.5 4.5 L19.5 8.5 L9.5 18.5 Z"/><path d="M13.5 6.5 L17.5 10.5"/>',             // design
  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M7.5 10.5 L9.8 12.8 L13.8 8.5"/><path d="M15.3 15.3 L20.5 20.5"/>', // review
  '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10 H20 M8.5 3.5 V7 M15.5 3.5 V7"/>',   // schedule
  '<path d="M3.5 11 L20.5 4 L15.5 20 L11.5 13 Z"/><path d="M11.5 13 L20.5 4"/>',                             // publish
  '<path d="M4 20 V4 M4 20 H20"/><path d="M7 16 L11 11 L14 13.5 L19.5 7"/>',                                  // track
];

export function portalView(n, { asset, shots, upload }) {
  const lines = n.headline || [n.heading || n.title];
  const host = (n.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `
    <div class="view pv">
      <div class="pv-glow"></div><div class="pv-grid"></div>
      <div class="pv-left">
        <div class="pv-brand pv-in" style="--d:.1s">
          ${n.logo ? `<span class="pv-logo"><img src="${asset(n.logo)}" alt="${esc(n.title)}"></span>` : ''}
          ${n.tagline ? `<span>${esc(n.tagline)}</span>` : ''}
        </div>
        <h1>${lines.map((l, i) => `<span class="pv-mask"><span style="--d:${(.35 + i * .14).toFixed(2)}s">${accent(l)}</span></span>`).join('')}</h1>
        ${n.text ? `<p class="pv-in" style="--d:.8s">${esc(n.text)}</p>` : ''}
      </div>
      <div class="pv-stage">
        ${shots.length ? shots.map((it, i) => `
          <figure class="pv-shot" data-i="${i}" data-pos="${i}">
            <div class="pv-bar"><i></i><i></i><i></i><span>${esc(host || 'tag')}</span></div>
            <img src="${it.url}" alt="">
          </figure>`).join('') : '<div class="pv-none">Add screenshots of the portal</div>'}
      </div>
      <div class="pv-flow">
        <div class="pv-rail"><i></i></div>
        ${(n.steps || []).map((s, i) => `
          <div class="pv-step" style="--d:${(1.3 + i * .1).toFixed(2)}s">
            <span class="pv-dot"><svg viewBox="0 0 24 24">${ICON[i % ICON.length]}</svg></span>
            <small>${String(i + 1).padStart(2, '0')}</small>
            <b>${esc(s.title)}</b>
            <p>${esc(s.text || '')}</p>
          </div>`).join('')}
      </div>
      ${upload ? `<div class="pv-upload">${upload}</div>` : ''}
    </div>`;
}

// The loops: the screens swap places, the light moves along the steps
export function animatePortal(root, open) {
  const el = root.querySelector('.pv');
  if (!el) return () => {};
  const shots = [...el.querySelectorAll('.pv-shot')];
  const steps = [...el.querySelectorAll('.pv-step')];
  const fill = el.querySelector('.pv-rail i');
  shots.forEach(s => s.addEventListener('click', () => open(+s.dataset.i)));

  let front = 0, at = -1;
  const swap = () => {
    if (shots.length < 2) return;
    front = (front + 1) % shots.length;
    shots.forEach((s, i) => { s.dataset.pos = String((i - front + shots.length) % shots.length); });
  };
  const light = () => {
    at = (at + 1) % steps.length;
    steps.forEach((s, i) => { s.classList.toggle('on', i === at); s.classList.toggle('done', i < at); });
    if (fill) fill.style.transform = `scaleX(${steps.length > 1 ? at / (steps.length - 1) : 1})`;
  };
  const timers = [
    setTimeout(() => { light(); timers.push(setInterval(light, 1800)); }, 2200),
    setInterval(swap, 5000),
  ];
  return () => timers.forEach(t => { clearTimeout(t); clearInterval(t); });
}
