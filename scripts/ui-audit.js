/**
 * Kiểm định giao diện BeeSky trên web (MASTER.md §13): vùng chạm ≥ 44px, tương phản chữ ≥ 4.5:1,
 * chữ bị cắt, tràn ngang, con trỏ, hover, vòng focus khi duyệt Tab, trạng thái ARIA, lỗi console — ở 375/768/1024/1440px.
 *
 * Cách chạy (cần Playwright + Chromium, dev server web đang chạy):
 *   npx expo start --web --port 8081          # cửa sổ 1
 *   node scripts/ui-audit.js                  # cửa sổ 2 (BASE_URL=..., WIDTHS=375,1440 để đổi)
 * Nếu Playwright được cài global: NODE_PATH=$(npm root -g) node scripts/ui-audit.js
 * Thoát với mã 1 khi còn lỗi (trừ mục "console" chỉ để tham khảo).
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8081';
const WIDTHS = (process.env.WIDTHS || '375,768,1024,1440').split(',').map(Number);
const PUBLIC = ['/login', '/register', '/forgot-password'];
const PRIVATE = ['/', '/contracts', '/contracts/ct-001', '/payments', '/receipts', '/receipts/rc-015', '/profile', '/notifications'];

const pageAudit = () => {
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((v) => parseFloat(v)); return [p[0], p[1], p[2], p[3] ?? 1]; };
  const over = (top, bottom) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1); };
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
  // Ảnh khu đô thị có cả vùng tối (trời đêm) và vùng sáng (hoàng hôn, cửa sổ): kiểm cả hai, lấy kết quả xấu nhất.
  const IMAGE_TONES = [[38, 45, 66, 1], [253, 214, 170, 1]];
  // react-native-web vẽ ảnh của ImageBackground là một div anh em có background-image url(...)
  const hasImageSibling = (n) => [...(n.parentElement?.children ?? [])].some((c) => c !== n && /url\(/.test(getComputedStyle(c).backgroundImage))
    || [...n.children].some((c) => /url\(/.test(getComputedStyle(c).backgroundImage) && !c.contains(document.activeElement));
  // Nền hiệu dụng: chồng các nền bán trong suốt từ tổ tiên; gradient → lấy mọi điểm màu (trường hợp xấu nhất).
  // Màu gradient tại vùng của chữ: lấy mẫu 4 góc + tâm hộp chữ theo hướng gradient CSS.
  const gradientSamples = (g, el, bi) => {
    const m = bi.match(/linear-gradient\((.*)\)$/); if (!m) return null;
    const parts = m[1].split(/,(?![^(]*\))/).map((x) => x.trim());
    let angle = 180; if (/deg$/.test(parts[0])) angle = parseFloat(parts.shift());
    const stops = parts.map((p, i, arr) => { const c = parse(p); const pos = p.match(/\)\s*([\d.]+)%/); return { c, t: pos ? parseFloat(pos[1]) / 100 : i / Math.max(arr.length - 1, 1) }; }).filter((x) => x.c);
    if (!stops.length) return null;
    const R = g.getBoundingClientRect(), r = el.getBoundingClientRect();
    const a = angle * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
    const L = Math.abs(R.width * dx) + Math.abs(R.height * dy) || 1;
    const cx = R.left + R.width / 2, cy = R.top + R.height / 2;
    const at = (t) => { t = Math.min(1, Math.max(0, t)); for (let i = 0; i < stops.length - 1; i++) { const A = stops[i], B = stops[i + 1]; if (t <= B.t) { const k = B.t === A.t ? 0 : (t - A.t) / (B.t - A.t); return A.c.map((v, j) => v + (B.c[j] - v) * k); } } return t < stops[0].t ? stops[0].c : stops[stops.length - 1].c; };
    const pts = [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom], [(r.left + r.right) / 2, (r.top + r.bottom) / 2]];
    return pts.map(([x, y]) => at(((x - cx) * dx + (y - cy) * dy) / L + 0.5));
  };
  const backgrounds = (el) => {
    const layers = []; let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        const stops = gradientSamples(n, el, bi) ?? [...bi.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0]));
        layers.push(stops.length ? { stops } : { image: true });
        if (!stops.length || stops.every((s) => s[3] >= 0.999)) break;
      }
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push({ stops: [c] }); if (c[3] >= 0.999) break; }
      if (/url\(/.test(bi) || hasImageSibling(n)) { layers.push({ image: true }); break; }
      n = n.parentElement;
    }
    let results = [[255, 255, 255, 1]];
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      if (L.image) { results = IMAGE_TONES; continue; }
      const next = [];
      for (const s of L.stops) for (const r of results) next.push(over(s, r));
      results = next;
    }
    return results;
  };
  const out = { targets: [], contrast: [], clipped: [], overflow: document.documentElement.scrollWidth > innerWidth };
  // 1. Vùng chạm
  const interactive = [...document.querySelectorAll('[role=button],[role=link],[role=tab],[role=checkbox],button,a[href],input,textarea')]
    .filter((e) => visible(e) && e.getAttribute('aria-hidden') !== 'true' && !e.closest('[aria-hidden=true]') && e.getAttribute('tabindex') !== '-1');
  for (const e of interactive) {
    const r = e.getBoundingClientRect();
    if (r.width < 44 - 0.5 || r.height < 44 - 0.5) out.targets.push(`${e.getAttribute('role') || e.tagName.toLowerCase()} "${label(e)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  // 2. Tương phản chữ
  const textEls = [...document.querySelectorAll('div[dir=auto], span, input, a')].filter((e) => {
    if (!visible(e) || e.closest('[aria-hidden=true]')) return false;
    if (e.tagName === 'INPUT') return !!e.value || !!e.placeholder;
    return [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
  });
  for (const e of textEls) {
    if (e.closest('[role=img][aria-label="BeeSky"]')) continue; // logotype: miễn trừ WCAG
    if (e.closest('[aria-disabled=true]')) continue; // phần tử bị vô hiệu: miễn trừ
    if (getComputedStyle(e).fontFamily.includes('ionicons')) continue; // glyph icon, không phải chữ
    const cs = getComputedStyle(e);
    const isEmptyInput = e.tagName === 'INPUT' && !e.value;
    const fg = parse(isEmptyInput ? getComputedStyle(e, '::placeholder').color : cs.color); if (!fg) continue;
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700 || /Bold|SemiBold/.test(cs.fontFamily);
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const bgs = backgrounds(e);
    const worst = Math.min(...bgs.map((bg) => ratio(over(fg, bg), bg)));
    if (worst < need - 0.01) out.contrast.push(`"${label(e)}" ${worst.toFixed(2)}:1 (cần ${need}) fg=${cs.color} ${Math.round(size)}px`);
  }
  // 3. Chữ bị cắt
  for (const e of document.querySelectorAll('div[dir=auto]')) {
    if (!visible(e)) continue;
    const cs = getComputedStyle(e);
    const clamped = cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none';
    if (clamped && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) out.clipped.push(`"${label(e)}"`);
  }
  return out;
};

(async () => {
  const b = await chromium.launch();
  const report = {}; const consoleErrors = [];
  const record = (cat, w, path, items) => { for (const it of items) { report[cat] ??= {}; const key = it; report[cat][key] ??= new Set(); report[cat][key].add(`${w}${path}`); } };
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage();
    p.on('console', (m) => ['error', 'warning'].includes(m.type()) && consoleErrors.push(`[${w}] ${m.text().slice(0, 140)}`));
    p.on('pageerror', (e) => consoleErrors.push(`[${w}] ${e.message}`));
    const visit = async (path, extra) => {
      await p.goto(BASE + path, { waitUntil: 'networkidle', timeout: 180000 }); await p.waitForTimeout(2200);
      if (extra) await extra();
      const r = await p.evaluate(pageAudit);
      record('targets', w, path, r.targets); record('contrast', w, path, r.contrast); record('clipped', w, path, r.clipped);
      if (r.overflow) record('overflow', w, path, ['horizontal overflow']);
      // focus + hover chỉ kiểm ở desktop
      if (w === 1440) {
        const focusIssues = await p.evaluate(async () => {
          const issues = [];
          const els = [...document.querySelectorAll('[role=button],[role=link],[role=tab],[role=checkbox],[role=row][tabindex="0"],button,a[href]')].filter((e) => e.getBoundingClientRect().width > 0 && e.getAttribute('tabindex') !== '-1' && !e.closest('[aria-hidden=true]'));
          for (const e of els.slice(0, 80)) {
            const cs = getComputedStyle(e);
            if (cs.cursor !== 'pointer') issues.push(`cursor:${cs.cursor} "${(e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30)}"`);
          }
          return issues;
        });
        record('cursor', w, path, focusIssues);
        // Trạng thái ARIA: tab phải có aria-selected, checkbox phải có aria-checked (react-native-web bỏ qua accessibilityState).
        const ariaIssues = await p.evaluate(() => [
          ...[...document.querySelectorAll('[role=tab]')].filter((e) => !e.hasAttribute('aria-selected')).map((e) => `tab thiếu aria-selected "${e.textContent.trim().slice(0, 30)}"`),
          ...[...document.querySelectorAll('[role=checkbox]')].filter((e) => !e.hasAttribute('aria-checked')).map((e) => `checkbox thiếu aria-checked "${(e.getAttribute('aria-label') || '').slice(0, 30)}"`),
        ]);
        record('aria', w, path, ariaIssues);
        // Hover: phải có thay đổi nhìn thấy được (nền, viền, bóng, transform, gạch chân, opacity, màu chữ)
        const handles = await p.locator('[role=button],[role=link],[role=tab],[role=checkbox],[role=row][tabindex="0"]').elementHandles();
        for (const h of handles.slice(0, 60)) {
          const snap = () => h.evaluate((e) => { if (!e.getBoundingClientRect().width || e.closest('[aria-hidden=true]')) return null; const pick = (n) => { const c = getComputedStyle(n); return [c.backgroundColor, c.borderColor, c.boxShadow, c.transform, c.textDecorationLine, c.opacity, c.color].join('|'); }; return [e, ...e.querySelectorAll('*')].slice(0, 12).map(pick).join('#'); }).catch(() => null);
          const before = await snap(); if (before === null) continue;
          await h.scrollIntoViewIfNeeded().catch(() => {});
          const box = await h.boundingBox(); if (!box || box.y < 0 || box.y + box.height > 900) continue;
          await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(260);
          const after = await snap();
          if (before === after) record('hover', w, path, [`no hover change: ${await h.evaluate((e) => (e.getAttribute('role') || '') + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) + '"')}`]);
          await p.mouse.move(0, 0); await p.waitForTimeout(60);
        }
        // Duyệt Tab: kiểm vòng focus nhìn thấy được
        await p.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
        for (let i = 0; i < 45; i++) {
          await p.keyboard.press('Tab');
          const f = await p.evaluate(() => {
            const e = document.activeElement; if (!e || e === document.body) return null;
            const cs = getComputedStyle(e);
            const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
            const isInput = e.tagName === 'INPUT' || e.tagName === 'TEXTAREA';
            return ring || isInput ? null : `no focus ring: ${e.getAttribute('role') || e.tagName} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)}"`;
          });
          if (f) record('focus', w, path, [f]);
        }
      }
    };
    for (const path of PUBLIC) await visit(path);
    await p.goto(BASE + '/login', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.getByText('Điền nhanh').click(); await p.getByRole('textbox', { name: 'Mật khẩu', exact: true }).press('Enter'); await p.waitForTimeout(2200);
    for (const path of PRIVATE) await visit(path);
    await ctx.close();
  }
  await b.close();
  for (const [cat, items] of Object.entries(report)) {
    console.log(`\n### ${cat} (${Object.keys(items).length})`);
    for (const [k, where] of Object.entries(items)) console.log(`- ${k}  @ ${[...where].slice(0, 4).join(', ')}${where.size > 4 ? ` +${where.size - 4}` : ''}`);
  }
  if (Object.keys(report).length === 0) console.log('Không phát hiện lỗi.');
  else process.exitCode = 1;
  console.log('\n### console', consoleErrors.length ? '\n' + [...new Set(consoleErrors)].join('\n') : 'none');
})();
