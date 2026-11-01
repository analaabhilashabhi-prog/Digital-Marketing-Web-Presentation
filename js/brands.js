// The social networks' own logos, in their own colours: one set for the whole deck
// (2026-11-01: "wherever we are talking about social media icons, use the original icons").
// brand('LinkedIn', 'cls') gives an inline <svg>; names are matched loosely ("YouTube", "youtube").
// Every logo sits in a <g stroke="none">, so a line-icon style around it never outlines it.

let uid = 0;   // each Instagram logo needs its own gradient id

const LOGO = {
  linkedin: () => '<rect width="24" height="24" rx="5" fill="#0A66C2"/><path fill="#fff" d="M5.2 9.4h2.9V19H5.2zM6.65 4.8a1.68 1.68 0 1 1 0 3.36 1.68 1.68 0 0 1 0-3.36zM9.9 9.4h2.78v1.3h.04c.39-.73 1.33-1.5 2.74-1.5 2.93 0 3.47 1.93 3.47 4.43V19h-2.9v-4.7c0-1.12-.02-2.56-1.56-2.56-1.56 0-1.8 1.22-1.8 2.48V19H9.9z"/>',
  instagram: () => {
    const id = `brand-ig-${++uid}`;
    return `<defs><radialGradient id="${id}" cx="28%" cy="108%" r="140%"><stop offset="0" stop-color="#FFD776"/><stop offset=".12" stop-color="#FFD776"/><stop offset=".42" stop-color="#F3612C"/><stop offset=".62" stop-color="#D6297B"/><stop offset=".95" stop-color="#5B4FE9"/></radialGradient></defs>`
      + `<rect width="24" height="24" rx="6.5" fill="url(#${id})"/><rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="16.25" cy="7.75" r="1" fill="#fff"/>`;
  },
  facebook: () => '<circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M13.5 24v-8.6h2.9l.44-3.4H13.5V9.85c0-.98.28-1.65 1.68-1.65h1.78V5.17A24 24 0 0 0 14.36 5c-2.58 0-4.34 1.57-4.34 4.46V12H7.1v3.4h2.92V24z"/>',
  youtube: () => '<rect y="3.5" width="24" height="17" rx="5" fill="#FF0000"/><path fill="#fff" d="M9.7 8.4v7.2l6.2-3.6z"/>',
  x: () => '<rect width="24" height="24" rx="5.5" fill="#000"/><path fill="#fff" transform="translate(5.2 5.4) scale(.565)" d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.6 20.64h2.04L6.49 3.24H4.3z"/>',
  whatsapp: () => '<circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" d="M12 4.8a7.2 7.2 0 0 0-6.2 10.86L4.9 19.1l3.55-.93A7.2 7.2 0 1 0 12 4.8z"/><path fill="#fff" d="M9.35 8.1c-.4.4-.72 1.05-.5 1.9.55 2 2.6 4.35 4.8 5 .9.3 1.6 0 2-.48l.25-.65-1.6-.9-.75.72c-1.1-.5-2.25-1.62-2.8-2.75l.72-.8-.9-1.6z"/>',
};

export function brand(name, cls = '') {
  const key = String(name).toLowerCase().replace(/[^a-z]/g, '');
  const logo = LOGO[key === 'twitter' ? 'x' : key];
  return logo ? `<svg class="brand ${cls}" viewBox="0 0 24 24" role="img" aria-label="${name}"><g stroke="none">${logo()}</g></svg>` : '';
}

export const isBrand = name => !!brand(name);
