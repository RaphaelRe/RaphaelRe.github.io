/* Particle network background.
 *
 * Small self-contained replacement for particles.js: drifting hexagons that
 * link to their neighbours, reach for the cursor, and multiply on click.
 * No external dependency. Tweak the look in CFG.
 *
 * The field is a pure function of the clock (fixed seed + current time), so
 * every page shows the same particles at the same moment: navigating does not
 * reset it, and nothing has to be stored in the browser.
 */
(() => {
  const canvas = document.getElementById('particles');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const CFG = {
    density: 1 / 180000, // particles per px² of viewport
    minCount: 10,
    maxCount: 40,
    linkDist: 450,      // max length of a link between two particles (px)
    grabDist: 350,      // reach of the cursor (px)
    speed: 30,          // px per second for the nearest particles
    maxExtra: 12,       // particles added by clicks (the oldest retire)
    seed: 20261116,     // change for a different (but again shared) field
  };

  // Colours come from the theme tokens in style.css
  const theme = { base: '255, 255, 255', accent: '177, 156, 217', strength: 1 };
  function readTheme() {
    const css = getComputedStyle(document.documentElement);
    theme.base = css.getPropertyValue('--particle-rgb').trim() || theme.base;
    theme.accent = css.getPropertyValue('--accent-rgb').trim() || theme.accent;
    theme.strength = parseFloat(css.getPropertyValue('--particle-strength')) || 1;
  }

  const TAU = Math.PI * 2;
  const MARGIN = 30; // particles turn around slightly outside the viewport
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let linkDist = CFG.linkDist;
  let particles = []; // clock-driven field, followed by click extras
  let extras = [];
  const pointer = { x: 0, y: 0, active: false };

  // Small seeded random generator (mulberry32): same seed, same field everywhere
  function seeded(a) {
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createParticle(random, x = 0, y = 0) {
    const z = 0.35 + random() * 0.65; // depth: far particles are smaller, dimmer, slower
    const dir = random() * TAU;
    return {
      x,
      y,
      z,
      vx: Math.cos(dir) * CFG.speed * z,
      vy: Math.sin(dir) * CFG.speed * z,
      rot: random() * TAU,
      spin: random() * 0.6 - 0.3,
      accent: random() < 0.15,
      fx: random(), // start position as a fraction of the viewport (field only)
      fy: random(),
    };
  }

  const field = (() => {
    const random = seeded(CFG.seed);
    return Array.from({ length: CFG.maxCount }, () => ({ ...createParticle(random), clock: true }));
  })();

  const now = () => (performance.timeOrigin + performance.now()) / 1000;

  // Position after bouncing back and forth between -MARGIN and size + MARGIN
  function bounce(fraction, v, t, size) {
    const span = size + 2 * MARGIN;
    let u = (fraction * span + v * t) % (2 * span);
    if (u < 0) u += 2 * span;
    return (u <= span ? u : 2 * span - u) - MARGIN;
  }

  const targetCount = () =>
    Math.max(CFG.minCount, Math.min(CFG.maxCount, Math.round(w * h * CFG.density)));

  const rebuild = () => { particles = field.slice(0, targetCount()).concat(extras); };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    linkDist = Math.max(140, Math.min(CFG.linkDist, Math.max(w, h) * 0.22));
    rebuild();
    if (reduceMotion) render();
  }

  function step(dt, t) {
    for (const p of particles) {
      if (p.clock) {
        p.x = bounce(p.fx, p.vx, t, w);
        p.y = bounce(p.fy, p.vy, t, h);
        p.rot = p.spin * t;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (p.x < -MARGIN) { p.x = -MARGIN; p.vx = Math.abs(p.vx); }
      else if (p.x > w + MARGIN) { p.x = w + MARGIN; p.vx = -Math.abs(p.vx); }
      if (p.y < -MARGIN) { p.y = -MARGIN; p.vy = Math.abs(p.vy); }
      else if (p.y > h + MARGIN) { p.y = h + MARGIN; p.vy = -Math.abs(p.vy); }
    }
  }

  function line(x1, y1, x2, y2, color, alpha, width) {
    ctx.strokeStyle = `rgba(${color}, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Links between neighbours, fading with distance
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d >= linkDist) continue;
        const depth = Math.min(a.z, b.z);
        const alpha = Math.min(1, (1 - d / linkDist) * 0.32 * theme.strength);
        line(a.x, a.y, b.x, b.y, theme.base, alpha, 0.6 + depth * 1.2);
      }
    }

    // Links to the cursor
    if (pointer.active) {
      for (const p of particles) {
        const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
        if (d < CFG.grabDist) {
          line(p.x, p.y, pointer.x, pointer.y, theme.accent, (1 - d / CFG.grabDist) * 0.9, 1.4);
        }
      }
    }

    // Hexagons
    for (const p of particles) {
      const r = 3 + p.z * 7;
      const alpha = Math.min(1, (0.12 + p.z * 0.2) * theme.strength);
      ctx.fillStyle = `rgba(${p.accent ? theme.accent : theme.base}, ${alpha})`;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const angle = p.rot + (k * TAU) / 6;
        ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  // Single still frame (reduced motion)
  function render() {
    step(0, now());
    draw();
  }

  let last = performance.now();
  function frame(ms) {
    const dt = Math.min(Math.max((ms - last) / 1000, 0), 0.05);
    last = ms;
    step(dt, (performance.timeOrigin + ms) / 1000);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  });
  document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') pointer.active = false;
  });

  // Click on empty space: a few new particles (they live on this page only)
  window.addEventListener('click', (e) => {
    if (e.target.closest('a, button, dialog, .card, .topnav')) return;
    for (let i = 0; i < 3; i++) extras.push(createParticle(Math.random, e.clientX, e.clientY));
    if (extras.length > CFG.maxExtra) extras.splice(0, extras.length - CFG.maxExtra);
    rebuild();
    if (reduceMotion) render();
  });

  window.addEventListener('resize', resize);

  // Follow theme switches (js/site.js sets data-theme on <html>)
  new MutationObserver(() => {
    readTheme();
    if (reduceMotion) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  readTheme();
  resize();
  if (!reduceMotion) requestAnimationFrame(frame);
})();
