// MakerNest Diwali sky: fireworks + sparklers. Deterministic: drawAt(t) loops every P seconds.
// Usage: const sky = MNSky(canvas, {spots:[[x,y],...], sparklers:[{x,y,ang,len}], scale}); sky.drawAt(t); or sky.play().
window.MNSky = function (cv, opt) {
  opt = opt || {};
  const P = 6, cx = cv.getContext('2d');
  const cols = ['#F4B223', '#E8702B', '#2C7DC4', '#8f7cf0', '#FBF9F3', '#ffd36b'];
  let W, H, D, bursts = [], stars = [], sparklers = [];
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function hash(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
  function setup() {
    D = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * D; cv.height = H * D; cx.setTransform(D, 0, 0, D, 0, 0);
    const r = rnd(11), sc = opt.scale || 1;
    const spots = opt.spots || [[.82,.12],[.64,.05],[.95,.32],[.18,.08],[.08,.36],[.40,.04],[.90,.62],[.30,.20]];
    bursts = spots.map((s, i) => ({ x: s[0] * W, y: s[1] * H, t0: (i * 0.77) % P, col: cols[i % cols.length], col2: cols[(i + 2) % cols.length],
      n: 60 + Math.floor(r() * 26), v: Math.min(W, H) * (0.16 + r() * 0.09) * sc, rot: r() * 6.28 }));
    stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: r() * W, y: r() * H * .85, s: .5 + r() * 1.4, ph: r() * 6.28 }));
    sparklers = (opt.sparklers || []).map(s => ({ x: s.x * W, y: s.y * H, ang: s.ang, len: s.len * Math.min(W, H) }));
  }
  function sparkler(sp, t, k) {
    // stick
    const tx = sp.x + Math.cos(sp.ang) * sp.len, ty = sp.y + Math.sin(sp.ang) * sp.len;
    cx.strokeStyle = '#6d6a63'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(sp.x, sp.y); cx.lineTo(tx, ty); cx.stroke();
    const g = cx.createRadialGradient(tx, ty, 0, tx, ty, sp.len * .32);
    g.addColorStop(0, 'rgba(255,236,170,.95)'); g.addColorStop(.25, 'rgba(255,190,80,.45)'); g.addColorStop(1, 'rgba(255,170,60,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(tx, ty, sp.len * .32, 0, 6.28); cx.fill();
    const N = 70, T = 0.45;
    for (let j = 0; j < N; j++) {
      const off = hash(j + k * 100) * T, c = Math.floor((t + off) / T), ph = ((t + off) % T) / T;
      const a = hash(j * 3.1 + c * 7.7 + k) * 6.283, L = sp.len * (0.12 + 0.42 * hash(j * 1.7 + c * 2.3 + k));
      const d = L * ph, x = tx + Math.cos(a) * d, y = ty + Math.sin(a) * d + 18 * ph * ph;
      const x0 = tx + Math.cos(a) * d * .55, y0 = ty + Math.sin(a) * d * .55;
      cx.globalAlpha = (1 - ph); cx.strokeStyle = j % 4 ? '#ffe39a' : '#FBF9F3'; cx.lineWidth = 1.6;
      cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x, y); cx.stroke();
      if (j % 5 === 0 && ph > .55) { // little forks at the ends
        cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(a + .9) * 7, y + Math.sin(a + .9) * 7);
        cx.moveTo(x, y); cx.lineTo(x + Math.cos(a - .9) * 7, y + Math.sin(a - .9) * 7); cx.stroke();
      }
    }
    cx.globalAlpha = 1;
  }
  function drawAt(t) {
    cx.clearRect(0, 0, W, H);
    for (const s of stars) { const a = .2 + .35 * (0.5 + 0.5 * Math.sin(t * 2 + s.ph)); cx.fillStyle = 'rgba(251,249,243,' + a + ')'; cx.beginPath(); cx.arc(s.x, s.y, s.s, 0, 6.28); cx.fill(); }
    cx.globalCompositeOperation = 'lighter';
    for (const b of bursts) {
      let age = ((t - b.t0) % P + P) % P;
      const rise = 0.6, life = 2.4;
      if (age < rise) {
        const k = age / rise, y = H + 20 - (H + 20 - b.y) * (1 - Math.pow(1 - k, 2));
        const g = cx.createLinearGradient(b.x, y, b.x, y + 60); g.addColorStop(0, b.col); g.addColorStop(1, 'rgba(0,0,0,0)');
        cx.strokeStyle = g; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(b.x, y); cx.lineTo(b.x, y + 60); cx.stroke();
        continue;
      }
      age -= rise; if (age > life) continue;
      const k = age / life, fade = Math.pow(1 - k, 1.6);
      const glow = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.v * .9);
      glow.addColorStop(0, b.col + Math.round(fade * 110).toString(16).padStart(2, '0')); glow.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = glow; cx.beginPath(); cx.arc(b.x, b.y, b.v * .9, 0, 6.28); cx.fill();
      for (let i = 0; i < b.n; i++) {
        const a = b.rot + i / b.n * 6.283, sp = b.v * (0.75 + 0.25 * Math.sin(i * 7.1));
        const d = sp * (1 - Math.pow(1 - Math.min(age / 1.1, 1), 3)), drop = 34 * age * age;
        const x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d + drop;
        const d0 = Math.max(0, d - sp * .24), x0 = b.x + Math.cos(a) * d0, y0 = b.y + Math.sin(a) * d0 + drop * .8;
        cx.strokeStyle = (i % 3 ? b.col : b.col2); cx.globalAlpha = Math.min(1, fade * 1.1); cx.lineWidth = 3.4 * (1 - k * .5);
        cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x, y); cx.stroke();
        cx.fillStyle = '#FBF9F3'; cx.globalAlpha = fade * (0.5 + 0.5 * Math.sin(age * 30 + i)); cx.beginPath(); cx.arc(x, y, 2.2, 0, 6.28); cx.fill();
      }
      cx.globalAlpha = 1;
    }
    sparklers.forEach((s, k) => sparkler(s, t, k + 1));
    cx.globalCompositeOperation = 'source-over';
  }
  setup();
  let raf = 0, t0 = 0;
  return {
    drawAt, setup,
    play() {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { drawAt(2.2); return; }
      const loop = ts => { if (!t0) t0 = ts; drawAt((ts - t0) / 1000); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      window.addEventListener('resize', () => setup());
    },
    stop() { cancelAnimationFrame(raf); }
  };
};
