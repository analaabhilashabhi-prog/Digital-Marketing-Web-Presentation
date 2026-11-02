// A PDF shown on its slide, to read through in front of everyone (2026-11-02: the t@g
// Branding & Marketing report, "the PDF should open… with an option to zoom in and zoom out").
// Pages are drawn by PDF.js, one under another on a grey desk; a bar above them zooms
// (− / + / the percentage back to a whole page, also Ctrl + wheel and the + − 0 keys),
// tells the page being read, goes full screen and downloads the file.
// Each page is drawn again at the new size once a zoom settles, so it stays sharp.

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let lib;
const loadLib = () => lib ||= new Promise((res, rej) => {
  if (window.pdfjsLib) return res(window.pdfjsLib);
  const s = Object.assign(document.createElement('script'), { src: PDFJS + 'pdf.min.js' });
  s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; res(window.pdfjsLib); };
  s.onerror = rej;
  document.head.append(s);
});

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ICON = {
  minus: '<path d="M5 12 H19"/>',
  plus: '<path d="M5 12 H19 M12 5 V19"/>',
  full: '<path d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"/>',
  down: '<path d="M12 4 V15 M7 10 L12 15 L17 10 M5 20 H19"/>',
};
const icon = k => `<svg viewBox="0 0 24 24">${ICON[k]}</svg>`;

const ZMIN = 0.5, ZMAX = 4, STEP = 1.25;

export function mountPdf(canvas, n, url) {
  canvas.innerHTML = `
    <div class="view v-pdf">
      <header class="pdf-head">
        <div class="pdf-titles">
          ${n.kicker ? `<p class="pdf-kicker">${esc(n.kicker)}</p>` : ''}
          <h1 class="pdf-title">${esc(n.heading || n.title)}</h1>
          ${n.text ? `<p class="pdf-sub">${esc(n.text)}</p>` : ''}
        </div>
        <div class="pdf-bar">
          <button type="button" class="pdf-btn" data-z="-1" aria-label="Zoom out" title="Zoom out (−)">${icon('minus')}</button>
          <button type="button" class="pdf-zoom" data-z="0" title="Whole page (0)">100%</button>
          <button type="button" class="pdf-btn" data-z="1" aria-label="Zoom in" title="Zoom in (+)">${icon('plus')}</button>
          <span class="pdf-sep"></span>
          <span class="pdf-page">Page <b>1</b> / <span>…</span></span>
          <span class="pdf-sep"></span>
          <button type="button" class="pdf-btn" data-full aria-label="Full screen" title="Full screen">${icon('full')}</button>
          <a class="pdf-btn" href="${esc(url)}" download aria-label="Download" title="Download the PDF">${icon('down')}</a>
        </div>
      </header>
      <div class="pdf-desk"><div class="pdf-pages"><p class="pdf-wait">Opening the report…</p></div></div>
    </div>`;
  const root = canvas.querySelector('.v-pdf');
  const desk = root.querySelector('.pdf-desk');
  const holder = root.querySelector('.pdf-pages');
  const zoomLabel = root.querySelector('.pdf-zoom');
  const pageNow = root.querySelector('.pdf-page b'), pageAll = root.querySelector('.pdf-page span');

  let doc = null, pages = [], zoom = 1, alive = true, redraw = 0, job = 0;

  // Zoom 100% shows a whole page in the desk; a page's width follows from its shape
  const baseW = p => (desk.clientHeight - 48) * p.w / p.h;
  // screen pixels per layout pixel: the slide is scaled to the window, full screen is not
  const ratio = () => (root.getBoundingClientRect().width / root.offsetWidth || 1) * (devicePixelRatio || 1);

  function layout() {
    pages.forEach(p => {
      const w = baseW(p) * zoom;
      p.el.style.width = w + 'px';
      p.el.style.height = w * p.h / p.w + 'px';
    });
    zoomLabel.textContent = Math.round(zoom * 100) + '%';
  }

  async function draw() {
    const mine = ++job;
    for (const p of pages) {
      if (!alive || mine !== job) return;
      const px = Math.min(4096, parseFloat(p.el.style.width) * ratio());
      const vp = p.page.getViewport({ scale: px / p.w });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      await p.page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      if (!alive || mine !== job) return;
      p.el.replaceChildren(c);
    }
  }

  // zoom about the middle of what is in view, then sharpen once it settles
  function setZoom(z) {
    z = Math.min(ZMAX, Math.max(ZMIN, z));
    if (z === zoom || !pages.length) return;
    const fy = (desk.scrollTop + desk.clientHeight / 2) / desk.scrollHeight;
    const fx = (desk.scrollLeft + desk.clientWidth / 2) / desk.scrollWidth;
    zoom = z;
    layout();
    desk.scrollTop = fy * desk.scrollHeight - desk.clientHeight / 2;
    desk.scrollLeft = fx * desk.scrollWidth - desk.clientWidth / 2;
    clearTimeout(redraw);
    redraw = setTimeout(draw, 220);
  }
  const zoomBy = d => setZoom(d === 0 ? 1 : zoom * (d > 0 ? STEP : 1 / STEP));

  root.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => zoomBy(+b.dataset.z)));
  root.querySelector('[data-full]').addEventListener('click', () => {
    if (document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
    else root.requestFullscreen?.().catch(() => {});
  });
  const onFull = () => { if (!alive) return; layout(); clearTimeout(redraw); redraw = setTimeout(draw, 220); };
  document.addEventListener('fullscreenchange', onFull);

  desk.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });
  const onKey = e => {
    if (e.target.matches?.('input, textarea')) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(-1); }
    else if (e.key === '0') { e.preventDefault(); zoomBy(0); }
  };
  addEventListener('keydown', onKey);

  // the page whose middle is nearest the middle of the desk
  desk.addEventListener('scroll', () => {
    const mid = desk.scrollTop + desk.clientHeight / 2;
    let best = 0, bestD = Infinity;
    pages.forEach((p, i) => { const d = Math.abs(p.el.offsetTop + p.el.offsetHeight / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
    pageNow.textContent = best + 1;
  }, { passive: true });

  loadLib()
    .then(pdfjs => pdfjs.getDocument(url).promise)
    .then(async d => {
      if (!alive) return d.destroy();
      doc = d;
      pageAll.textContent = d.numPages;
      for (let i = 1; i <= d.numPages; i++) {
        const page = await d.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        pages.push({ page, w: vp.width, h: vp.height, el: Object.assign(document.createElement('div'), { className: 'pdf-sheet' }) });
      }
      if (!alive) return;
      holder.replaceChildren(...pages.map(p => p.el));
      layout();
      draw();
    })
    .catch(() => { if (alive) holder.innerHTML = `<p class="pdf-wait">The report could not be opened here. <a href="${esc(url)}" target="_blank" rel="noopener">Open the PDF</a></p>`; });

  return () => {
    alive = false;
    clearTimeout(redraw);
    removeEventListener('keydown', onKey);
    document.removeEventListener('fullscreenchange', onFull);
    if (document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
    doc?.destroy();
  };
}
