/* Typing animation on the landing page.
 *
 * Arriving from outside the site: "Welcome!" -> name -> first subline.
 * Coming back from another page of the site skips the intro (decided from
 * document.referrer, so nothing is stored in the browser).
 * Afterwards the subline keeps cycling through SUBLINES.
 * The final texts are already in the HTML, so the page also reads fine
 * without JavaScript or with reduced motion.
 */
(() => {
  const title = document.getElementById('typed-title');
  const sub = document.getElementById('typed-sub');
  if (!title || !sub) return;

  const GREETING = 'Welcome!';
  const TITLE = 'My name is Raphael';
  const SUBLINES = [
    'I am a postdoc at TUM.',
    'I work on Bayesian deep learning.',
    'I work on uncertainty quantification.',
    'I work on tabular foundation models.',
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const textNode = (el) => el.querySelector('.typed-text');

  /* Move the blinking cursor to one line */
  function activate(el) {
    for (const line of [title, sub]) line.classList.toggle('is-active', line === el);
  }

  /* Erase back to the part both texts share, then type the rest */
  async function retype(el, target, typeMs = 85, eraseMs = 40) {
    const node = textNode(el);
    let text = node.textContent;
    let keep = 0;
    while (keep < text.length && keep < target.length && text[keep] === target[keep]) keep++;

    while (text.length > keep) {
      text = text.slice(0, -1);
      node.textContent = text;
      await sleep(eraseMs);
    }
    for (const char of target.slice(keep)) {
      text += char;
      node.textContent = text;
      await sleep(typeMs + Math.random() * 50);
    }
  }

  function cameFromThisSite() {
    try {
      return !!document.referrer && new URL(document.referrer).origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  async function run() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!cameFromThisSite()) {
      textNode(title).textContent = '';
      textNode(sub).textContent = '';
      activate(title);
      await sleep(900);
      await retype(title, GREETING, 120);
      await sleep(1400);
      await retype(title, TITLE, 100);
      await sleep(600);
      activate(sub);
      await sleep(400);
      await retype(sub, SUBLINES[0]);
    } else {
      activate(sub);
    }

    for (let i = 1; ; i = (i + 1) % SUBLINES.length) {
      await sleep(3500);
      await retype(sub, SUBLINES[i]);
    }
  }

  run();
})();
