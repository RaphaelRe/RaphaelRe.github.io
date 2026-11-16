/* Small shared behaviours: theme switch, mail link, card glow, publication dialog. */
(() => {
  // The address is assembled here so it is not sitting in the HTML for scrapers
  for (const link of document.querySelectorAll('a[data-mail-user]')) {
    link.href = `mailto:${link.dataset.mailUser}@${link.dataset.mailDomain}`;
  }

  /* Theme: dark (default) or light (desert). Until the switch is used, the
     page follows the system setting; after that the choice is remembered.
     A one-line script in each page's <head> applies it before the first paint. */
  const root = document.documentElement;
  const toggles = document.querySelectorAll('.theme-toggle');
  const systemLight = matchMedia('(prefers-color-scheme: light)');
  const isLight = () => root.dataset.theme === 'light';

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function applyTheme(light) {
    if (light) root.dataset.theme = 'light';
    else delete root.dataset.theme;
    for (const t of toggles) t.setAttribute('aria-checked', String(light));
  }

  const preferredLight = () => {
    const stored = storedTheme();
    return stored ? stored === 'light' : systemLight.matches;
  };

  for (const toggle of toggles) {
    toggle.addEventListener('click', () => {
      const next = !isLight();
      const choose = () => {
        applyTheme(next);
        try { localStorage.setItem('theme', next ? 'light' : 'dark'); } catch (e) { /* not remembered */ }
      };
      if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        choose();
        return;
      }
      root.classList.add('theming');
      document.startViewTransition(choose)
        .finished.finally(() => root.classList.remove('theming'));
    });
  }

  // System switches light/dark while the page is open (only without a stored choice)
  systemLight.addEventListener('change', () => {
    if (!storedTheme()) applyTheme(systemLight.matches);
  });

  // The switch was used in another open tab of this site: follow it right away
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' || e.key === null) applyTheme(preferredLight());
  });

  // Pages restored with the back button keep their old state: re-apply
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) applyTheme(preferredLight());
  });

  applyTheme(isLight());

  // Glow inside cards follows the cursor (see .card::before in style.css)
  for (const el of document.querySelectorAll('.card')) {
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  }

  const cards = document.querySelectorAll('.pub');
  const dialog = document.getElementById('pub-dialog');
  if (!cards.length || !dialog) return;

  const body = dialog.querySelector('.modal-body');

  function open(card) {
    body.replaceChildren(card.querySelector('template').content.cloneNode(true));
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  for (const card of cards) {
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(card);
      }
    });
  }

  // Close on the X or on a click outside the content (Esc works natively)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('.modal-close')) dialog.close();
  });
})();
