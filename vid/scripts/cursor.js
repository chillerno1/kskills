(() => {
  if (window.top !== window || window.__vid) return;
  const ID = '__vid', KEY = '__vid_xy', SVG = 'http://www.w3.org/2000/svg';
  let box, cursor, x, y;

  // Built with DOM calls, not innerHTML, because Trusted Types pages reject HTML strings.
  const el = (tag, css, ns) => {
    const e = ns ? document.createElementNS(SVG, tag) : document.createElement(tag);
    if (css) e.style.cssText = 'all:initial;position:fixed;left:0;top:0;pointer-events:none;' + css;
    return e;
  };
  const svg = (tag, attrs) => {
    const e = el(tag, null, true);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  const fade = (e, ms, from = 0, to = 1) => e.animate([{ opacity: from }, { opacity: to }], { duration: ms, fill: 'forwards' });
  const at = (dx = 2, dy = 1) => `translate(${x - dx}px, ${y - dy}px)`;
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify([x, y])); } catch {} };

  const root = () => {
    if (box?.isConnected) return box;
    if (x === undefined) {
      try { [x, y] = JSON.parse(sessionStorage.getItem(KEY)); } catch {}
      x ??= innerWidth / 2; y ??= innerHeight / 2;
    }
    box = el('div', 'right:0;bottom:0;z-index:2147483647');
    box.id = ID;
    cursor = el('div', `width:22px;height:22px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));transform:${at()}`);
    const arrow = svg('svg', { width: 22, height: 22, viewBox: '0 0 22 22' });
    arrow.append(svg('path', {
      d: 'M2 1 L2 18 L6.5 14 L9.5 20.5 L12.6 19.2 L9.7 12.8 L15.5 12.8 Z',
      fill: '#fff', stroke: '#14161c', 'stroke-width': 1.5, 'stroke-linejoin': 'round',
    }));
    cursor.append(arrow);
    box.append(cursor);
    document.documentElement.append(box);
    return box;
  };
  document.addEventListener('DOMContentLoaded', root);

  window.__vid = {
    async moveTo(tx, ty, ms = 500) {
      root();
      const from = at();
      [x, y] = [tx, ty];
      save();
      cursor.style.transform = at();
      await cursor.animate([{ transform: from }, { transform: at() }], { duration: ms, easing: 'ease-in-out' }).finished;
    },
    click() {
      const ring = el('div', 'width:40px;height:40px;box-sizing:border-box;border-radius:50%;' +
        'border:3px solid #ff8a00;box-shadow:0 0 0 1px rgba(0,0,0,.35)');
      root().append(ring);
      ring.animate([
        { transform: `${at(20, 20)} scale(.3)`, opacity: 1 },
        { transform: `${at(20, 20)} scale(1.6)`, opacity: 0 },
      ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).finished.then(() => ring.remove());
    },
    // Re-measures the target every frame, so the ring stays on it when the page scrolls or reflows.
    spot(target) {
      this.unspot();
      const p = 8, s = el('div', 'border-radius:10px;box-shadow:0 0 0 3px #ff8a00,0 0 0 200vmax rgba(0,0,0,.55);opacity:0');
      s.dataset.vid = 'spot';
      const follow = () => {
        if (!s.isConnected) return;
        const r = target.getBoundingClientRect();
        Object.assign(s.style, { left: `${r.x - p}px`, top: `${r.y - p}px`, width: `${r.width + 2 * p}px`, height: `${r.height + 2 * p}px` });
        requestAnimationFrame(follow);
      };
      root().insertBefore(s, cursor);
      follow();
      fade(s, 200);
    },
    unspot() {
      root().querySelectorAll('[data-vid=spot]').forEach(s => s.remove());
    },
    card(text) {
      const c = el('div', 'right:0;bottom:0;display:flex;align-items:center;justify-content:center;' +
        'padding:80px;box-sizing:border-box;background:rgba(11,13,20,.94);color:#f2f2f5;text-align:center;' +
        'font:600 64px/1.15 -apple-system,system-ui,"Segoe UI",sans-serif;letter-spacing:-.02em;opacity:0');
      c.dataset.vid = 'card';
      c.textContent = text;
      root().append(c);
      fade(c, 300);
    },
    uncard() {
      root().querySelectorAll('[data-vid=card]').forEach(c => {
        delete c.dataset.vid;
        fade(c, 300, 1, 0).finished.then(() => c.remove());
      });
    },
  };
})();
