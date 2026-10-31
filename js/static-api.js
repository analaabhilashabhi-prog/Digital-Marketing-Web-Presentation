// The static copy's stand-in for the server (tools/build-static.py): the deck comes
// from api/deck.json and the sign-in is answered here, in the browser. It is not a
// real lock, since everything on a static site can be read; it only keeps the usual flow.
(() => {
  const PRESENTER = { email: 'marketing@present.com', password: 'Present@123' };
  const KEY = 'dm-static-role';
  const reply = (code, body) => Promise.resolve(new Response(JSON.stringify(body), { status: code, headers: { 'Content-Type': 'application/json' } }));
  const real = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith('/api/')) return real(input, init);
    let role = null;
    try { role = sessionStorage.getItem(KEY); } catch {}
    if (url.startsWith('/api/deck')) return role ? real('api/deck.json') : reply(401, { error: 'Not signed in' });
    // the sign-in page fills the presenter login in, so visitors just press Sign in
    if (url === '/api/auth/config') return reply(200, { hint: { presenter: PRESENTER, admin: PRESENTER } });
    if (url === '/api/auth/me') return role ? reply(200, { role }) : reply(401, { error: 'Not signed in' });
    if (url === '/api/auth/logout') { try { sessionStorage.removeItem(KEY); } catch {} return reply(200, { ok: true }); }
    if (url === '/api/auth/login') {
      const b = JSON.parse(init.body || '{}');
      if ((b.email || '').trim().toLowerCase() === PRESENTER.email && b.password === PRESENTER.password) {
        try { sessionStorage.setItem(KEY, 'presenter'); } catch {}
        return reply(200, { role: 'presenter' });
      }
      return reply(401, { error: 'That email and password do not match.' });
    }
    return reply(403, { error: 'Not available in the online copy' });
  };
})();
