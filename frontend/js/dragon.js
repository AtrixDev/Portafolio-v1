// js/dragon.js — El dragón de código, dibujado en canvas:
// se decodifica al entrar, algunos caracteres cambian solos y el cursor lo ilumina y lo revuelve.
import { DRAGON } from './dragon-data.js';

const GLIFOS = '01{}[]<>=;:$#/\\*+-_|&%ABCDEFabcdef0123456789';
const rnd = () => GLIFOS[(Math.random() * GLIFOS.length) | 0];
const VB = { x: 0, y: 72, w: 480, h: 330 };   // recorte del lienzo original (480×480)
const PASO = 5.42;                           // ancho de un carácter mono a 9px

export function montarDragon(canvas) {
  const ctx = canvas.getContext('2d');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Cada carácter con su posición, su glifo real y su estado
  const cs = [];
  DRAGON.forEach(([x, y, t], ln) => [...t].forEach((c, i) => { if (c.trim()) cs.push({ ln, x: x + i * PASO, y, c, v: quieto ? c : rnd(), listo: quieto, t0: 0, luz: 0, dx: 0, dy: 0, vx: 0, vy: 0 }); }));
  // Glitch por línea, como el dragón original: cada línea tiene 3,5% de chance por cuadro (~15 fps) de revolverse 2 a 5 cuadros
  const glitch = new Array(DRAGON.length).fill(0); let ultimoCuadro = 0, chance = .035;
  const cx = VB.x + VB.w / 2, cy = VB.y + VB.h / 2;
  cs.forEach(k => { k.t0 = Math.hypot(k.x - cx, (k.y - cy) * 1.4) * 4 + Math.random() * 380; });

  let colA = '#ffe14a', colB = '#818189', colHi = '#ffffff', colGlow = '#ffe14a', esc = 1, dpr = 1, mx = -999, my = -999, gx = -999, gy = -999, inicio = performance.now(), visible = true;
  const ondas = [];   // clic: anillos que se expanden y revuelven el código
  function colores() {
    const st = getComputedStyle(document.documentElement);
    colA = st.getPropertyValue('--dragon-a').trim() || colA;
    colB = st.getPropertyValue('--dragon-b').trim() || colB;
    colHi = st.getPropertyValue('--text').trim() || colHi;
    colGlow = st.getPropertyValue('--accent').trim() || colGlow;
  }
  function medir() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.width * VB.h / VB.w * dpr);
    canvas.style.height = (r.width * VB.h / VB.w) + 'px';
    esc = canvas.width / VB.w;
    dibujar(performance.now());
  }
  function dibujar(ahora) {
    const t = ahora - inicio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(esc, 0, 0, esc, -VB.x * esc, -VB.y * esc);
    ctx.font = '500 9px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'alphabetic';
    const grad = ctx.createLinearGradient(VB.x, VB.y, VB.x + VB.w, VB.y + VB.h);
    grad.addColorStop(0, colA); grad.addColorStop(.6, colA); grad.addColorStop(1, colB);
    // Halo que sigue al cursor con retraso suave
    if (mx > -900) { gx += (mx - gx) * .14; gy += (my - gy) * .14; }
    if (gx > -900 && mx > -900) {
      const h = ctx.createRadialGradient(gx, gy, 0, gx, gy, 90);
      h.addColorStop(0, hexA(colGlow, .26)); h.addColorStop(1, hexA(colGlow, 0));
      ctx.fillStyle = h; ctx.fillRect(gx - 90, gy - 90, 180, 180);
    }
    const cuadro = t - ultimoCuadro >= 66;
    if (cuadro) { ultimoCuadro = t; for (let i = 0; i < glitch.length; i++) { if (glitch[i] > 0) glitch[i]--; else if (!quieto && Math.random() < chance) glitch[i] = 2 + ((Math.random() * 4) | 0); } }
    for (let i = ondas.length - 1; i >= 0; i--) { ondas[i].r += 6; if (ondas[i].r > 420) ondas.splice(i, 1); }
    for (const k of cs) {
      if (!k.listo) { if (t > k.t0) { k.listo = true; k.v = k.c; } else if (Math.random() < .35) k.v = rnd(); }
      else if (glitch[k.ln] > 0) { if (cuadro) k.v = rnd(); }
      else if (k.vuelve && t > k.vuelve) { k.v = k.c; k.vuelve = 0; }
      else if (!k.vuelve && k.v !== k.c) k.v = k.c;
      // Imán: el cursor empuja los caracteres y vuelven con resorte
      const ex = k.x - mx, ey = k.y - my, d = Math.hypot(ex, ey);
      let fx = 0, fy = 0;
      if (d < 80 && d > .1) { const f = (1 - d / 80) ** 2 * 14; fx = ex / d * f; fy = ey / d * f; }
      k.vx = (k.vx + (fx - k.dx) * .16) * .78; k.vy = (k.vy + (fy - k.dy) * .16) * .78;
      k.dx += k.vx; k.dy += k.vy;
      const objetivo = d < 80 ? 1 - d / 80 : 0;
      k.luz += (objetivo - k.luz) * .15;
      if (k.luz > .5 && Math.random() < .08) { k.v = rnd(); k.vuelve = t + 110; }
      for (const o of ondas) { const dd = Math.hypot(k.x - o.x, k.y - o.y); if (Math.abs(dd - o.r) < 7) { k.v = rnd(); k.vuelve = t + 180; k.luz = Math.max(k.luz, .9); } }
      if (k.luz > .05) { ctx.globalAlpha = .6 + k.luz * .4; ctx.fillStyle = k.luz > .55 ? colHi : colA; }
      else { ctx.globalAlpha = k.listo ? .92 : .45; ctx.fillStyle = grad; }
      ctx.fillText(k.v, k.x + k.dx, k.y + k.dy);
    }
    ctx.globalAlpha = 1;
  }
  function hexA(c, a) { const m = c.match(/^#([0-9a-f]{6})$/i); if (!m) return `rgba(255,225,74,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function bucle(ahora) { if (visible) dibujar(ahora); requestAnimationFrame(bucle); }

  colores(); medir();
  new ResizeObserver(medir).observe(canvas);
  new MutationObserver(() => { colores(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', colores);
  if (quieto) return;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mx = VB.x + (e.clientX - r.left) / r.width * VB.w; my = VB.y + (e.clientY - r.top) / r.height * VB.h;
  });
  canvas.addEventListener('pointerenter', () => { chance = .12; });
  canvas.addEventListener('pointerleave', () => { mx = my = -999; gx = gy = -999; chance = .035; });
  canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); ondas.push({ x: VB.x + (e.clientX - r.left) / r.width * VB.w, y: VB.y + (e.clientY - r.top) / r.height * VB.h, r: 0 }); });
  requestAnimationFrame(bucle);
}
