// Animated canvas background. The mode comes from the theme's --bgmode variable.
const BG = (() => {
  const c = document.getElementById('bg'), x = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, P = [], mode = 'orbs', A = '#fff', B = '#fff', FG = '#fff', blend = 'source-over';
  let mx = 0.5, my = 0.5, rainAcc = 0;
  const R = (a, b) => a + Math.random() * (b - a);
  const GLYPHS = '01アイウエオカキクケコサシスセソ9RAYA';

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    P = [];
    const k = Math.max(0.5, (W * H) / (1280 * 720)) * (reduce ? 0.4 : 1);
    if (mode === 'orbs') {
      for (let i = 0; i < 6; i++) P.push({ t: 'o', x: R(0, W), y: R(0, H), r: R(160, 360), vx: R(-0.18, 0.18), vy: R(-0.18, 0.18), c: i % 2 ? A : B });
      for (let i = 0; i < 50 * k; i++) P.push({ t: 'd', x: R(0, W), y: R(0, H), r: R(0.6, 2), vy: R(-0.3, -0.05), p: R(0, 6.28) });
    } else if (mode === 'stars') {
      for (let i = 0; i < 150 * k; i++) P.push({ x: R(0, W), y: R(0, H), r: R(0.4, 1.8), s: R(0.5, 2.2), p: R(0, 6.28) });
    } else if (mode === 'bubbles') {
      for (let i = 0; i < 32 * k; i++) P.push({ x: R(0, W), y: R(0, H), r: R(6, 42), vy: R(0.2, 0.7), p: R(0, 6.28), c: i % 2 ? A : B });
    } else if (mode === 'rain') {
      for (let i = 0; i < Math.ceil(W / 18); i++) P.push({ y: R(-H / 18, H / 18), v: R(0.4, 1.2) });
    } else {
      for (let i = 0; i < 70 * k; i++) P.push({ x: R(0, W), y: R(0, H), r: R(0.6, 2.4), vx: R(-0.15, 0.15), vy: R(-0.2, 0.05), p: R(0, 6.28) });
    }
  }

  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    A = cs.getPropertyValue('--accent').trim();
    B = cs.getPropertyValue('--accent2').trim();
    FG = cs.getPropertyValue('--fg').trim();
    blend = cs.getPropertyValue('--blend').trim() || 'source-over';
    mode = cs.getPropertyValue('--bgmode').trim() || 'orbs';
    seed();
  }

  function draw(ts) {
    const t = ts / 1000, px = (mx - 0.5), py = (my - 0.5);
    x.clearRect(0, 0, W, H);
    x.globalCompositeOperation = blend;

    if (mode === 'orbs') {
      for (const p of P) {
        p.x += p.vx; p.y += p.vy;
        if (p.t === 'o') {
          if (p.x < -p.r) p.x = W + p.r; if (p.x > W + p.r) p.x = -p.r;
          if (p.y < -p.r) p.y = H + p.r; if (p.y > H + p.r) p.y = -p.r;
          const ox = p.x - px * 60, oy = p.y - py * 60;
          const g = x.createRadialGradient(ox, oy, 0, ox, oy, p.r);
          g.addColorStop(0, p.c); g.addColorStop(1, 'transparent');
          x.globalAlpha = 0.22; x.fillStyle = g; x.fillRect(ox - p.r, oy - p.r, p.r * 2, p.r * 2);
        } else {
          p.y += p.vy; if (p.y < -5) { p.y = H + 5; p.x = R(0, W); }
          x.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t + p.p));
          x.fillStyle = FG; x.beginPath(); x.arc(p.x - px * 25, p.y, p.r, 0, 6.283); x.fill();
        }
      }
    } else if (mode === 'stars') {
      const g = x.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, H * 0.9);
      g.addColorStop(0, B); g.addColorStop(0.5, A); g.addColorStop(1, 'transparent');
      x.globalAlpha = 0.3; x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = FG;
      for (const p of P) {
        x.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * p.s + p.p));
        x.beginPath(); x.arc(p.x - px * p.r * 14, p.y - py * p.r * 14, p.r, 0, 6.283); x.fill();
      }
    } else if (mode === 'bubbles') {
      for (const p of P) {
        p.y -= p.vy; if (p.y < -p.r * 2) { p.y = H + p.r * 2; p.x = R(0, W); }
        const bx = p.x + Math.sin(t + p.p) * 18 - px * p.r, by = p.y;
        x.globalAlpha = 0.1; x.fillStyle = p.c; x.beginPath(); x.arc(bx, by, p.r, 0, 6.283); x.fill();
        x.globalAlpha = 0.45; x.strokeStyle = p.c; x.lineWidth = 1.5; x.stroke();
        x.globalAlpha = 0.5; x.fillStyle = '#fff'; x.beginPath(); x.arc(bx - p.r * 0.35, by - p.r * 0.35, p.r * 0.14, 0, 6.283); x.fill();
      }
    } else if (mode === 'rain') {
      rainAcc += 1;
      x.font = '16px monospace';
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        p.y += p.v * 0.35;
        if (p.y * 18 > H + 14 * 18) { p.y = R(-20, 0); p.v = R(0.4, 1.2); }
        for (let j = 0; j < 14; j++) {
          const yy = (Math.floor(p.y) - j) * 18;
          if (yy < -18 || yy > H) continue;
          x.globalAlpha = (1 - j / 14) * 0.55;
          x.fillStyle = j === 0 ? '#fff' : A;
          x.fillText(GLYPHS[(i * 7 + (Math.floor(p.y) - j) * 13 + (rainAcc >> 3)) % GLYPHS.length], i * 18, yy);
        }
      }
    } else {
      x.fillStyle = A;
      for (const p of P) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        x.globalAlpha = 0.15 + 0.3 * Math.abs(Math.sin(t * 0.6 + p.p));
        x.beginPath(); x.arc(p.x - px * 20, p.y - py * 20, p.r, 0, 6.283); x.fill();
      }
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize);
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth; my = e.clientY / innerHeight;
    const s = document.documentElement.style;
    s.setProperty('--mx', e.clientX + 'px'); s.setProperty('--my', e.clientY + 'px');
  });

  readTheme(); resize(); requestAnimationFrame(draw);
  return { readTheme };
})();
