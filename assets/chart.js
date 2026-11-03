/* ============================================================
   BIỂU ĐỒ TIỀN TRONG TAY QUA 24 THÁNG — SVG viết thẳng, 1 đường
   Một đường duy nhất nên không cần chú giải; hai chỗ đáng nói
   (đáy hố tiền, lúc cắt vạch 0) được ghi chữ ngay tại điểm.
   Bảng số bên dưới là bản đọc được cho ai không xem hình.
   Độ sâu mỗi tháng vẽ bằng lược vạch dọc kiểu bản vẽ kỹ thuật,
   không tô mảng xám — mảng lớn nuốt mất đường cong.
   ============================================================ */

const CHART = (function () {
  const W = 560, H = 360;
  const M = { t: 40, r: 20, b: 46, l: 78 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const FS = 16;              // cỡ chữ trong hình, đọc được khi thu nhỏ

  let cur = null;             // dữ liệu đang vẽ, cho lớp rê chuột
  let bound = false;          // chỉ gắn nghe chuột một lần

  function fmtTr(v) {
    const t = v / 1e6;
    const s = Math.abs(t) >= 100 ? t.toFixed(0) : t.toFixed(t % 1 ? 1 : 0);
    return s.replace('.', ',');
  }

  function draw(host, series, beMonth, tipEl, trailEl) {
    const vals = series.map(d => d.tien);
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const pad = (hi - lo) * 0.14 || 1;
    lo -= pad; hi += pad;

    const x = i => M.l + (i / (series.length - 1)) * iw;
    const y = v => M.t + (hi - v) / (hi - lo) * ih;
    const y0 = y(0);

    /* lưới ngang + nhãn trục dọc */
    let grid = '', labels = '';
    for (let k = 0; k <= 4; k++) {
      const v = lo + (hi - lo) * k / 4;
      const yy = y(v).toFixed(1);
      grid += `<line x1="${M.l}" y1="${yy}" x2="${W - M.r}" y2="${yy}" stroke="#d2d4d3" stroke-width="1"/>`;
      labels += `<text x="${M.l - 10}" y="${+yy + 6}" text-anchor="end" font-size="${FS}" font-weight="700" fill="#45474b">${fmtTr(v)}</text>`;
    }

    /* lược vạch dọc: mỗi tháng một vạch từ vạch 0 xuống đường tiền */
    let comb = '';
    series.forEach((d, i) => {
      comb += `<line x1="${x(i).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x(i).toFixed(1)}" y2="${y(d.tien).toFixed(1)}" stroke="#c9cbca" stroke-width="1.5"/>`;
    });

    /* vạch + nhãn trục ngang, 3 tháng một lần */
    let ticks = '';
    series.forEach((d, i) => {
      if (i % 3) return;
      ticks += `<line class="c-tick" x1="${x(i).toFixed(1)}" y1="${M.t + ih}" x2="${x(i).toFixed(1)}" y2="${M.t + ih + 7}" stroke="#000" stroke-width="2"/>`
            +  `<text x="${x(i).toFixed(1)}" y="${M.t + ih + 28}" text-anchor="middle" font-size="${FS}" font-weight="700" fill="#45474b">${d.thang}</text>`;
    });

    const pts = series.map((d, i) => `${x(i).toFixed(1)},${y(d.tien).toFixed(1)}`);
    const line = 'M' + pts.join(' L');

    /* đáy hố tiền */
    const iMin = vals.indexOf(Math.min(...vals));
    const dayRight = x(iMin) < W / 2;
    let marks = `<g class="c-mark"><rect x="${(x(iMin) - 5).toFixed(1)}" y="${(y(vals[iMin]) - 5).toFixed(1)}" width="10" height="10" fill="#000"/></g>`
      + `<text x="${(x(iMin) + (dayRight ? 12 : -12)).toFixed(1)}" y="${(y(vals[iMin]) + 22).toFixed(1)}" text-anchor="${dayRight ? 'start' : 'end'}" font-size="${FS}" font-weight="700" fill="#000">đáy ${fmtTr(vals[iMin])} tr</text>`;

    /* chỗ cắt vạch 0 */
    if (beMonth != null && beMonth <= series[series.length - 1].thang) {
      const bx = M.l + (beMonth / (series.length - 1)) * iw;
      marks += `<g class="c-mark"><circle cx="${bx.toFixed(1)}" cy="${y0.toFixed(1)}" r="7" fill="#f0a800" stroke="#000" stroke-width="2"/></g>`
        + `<text x="${(bx - 10).toFixed(1)}" y="${(y0 - 16).toFixed(1)}" text-anchor="end" font-size="${FS}" font-weight="700" fill="#000">đủ vốn ở tháng ${beMonth}</text>`;
    }

    let len = 0;
    for (let i = 1; i < series.length; i++) {
      len += Math.hypot(x(i) - x(i - 1), y(series[i].tien) - y(series[i - 1].tien));
    }
    len = Math.round(len) + 40;

    host.innerHTML =
`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tiền trong tay luỹ kế qua 24 tháng, đơn vị triệu đồng">
  <g class="g-grid">${grid}</g>
  <g class="c-area">${comb}</g>
  <line x1="${M.l}" y1="${y0.toFixed(1)}" x2="${W - M.r}" y2="${y0.toFixed(1)}" stroke="#000" stroke-width="2"/>
  <path class="c-line" style="--len:${len}" d="${line}" fill="none" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/>
  ${marks}
  <g>${ticks}</g>
  <g>${labels}</g>
  <text x="${M.l - 78}" y="20" font-size="${FS - 2}" font-weight="700" fill="#45474b">TRIỆU ĐỒNG</text>
  <text x="${W - M.r}" y="20" text-anchor="end" font-size="${FS - 2}" font-weight="700" fill="#45474b">THÁNG THỨ</text>
  <line class="cross" x1="0" y1="${M.t}" x2="0" y2="${M.t + ih}" stroke="#000" stroke-width="1" opacity="0"/>
</svg>`;

    cur = { series, x, y };
    if (!bound) { bindHover(host, tipEl, trailEl); bound = true; }
  }

  /* lớp rê chuột: vạch dọc + ô chữ + chấm sáng */
  function bindHover(host, tipEl, trailEl) {
    const box = host.parentElement;

    function at(ev) {
      if (!cur) return;
      const { series, x, y } = cur;
      const svg = host.querySelector('svg');
      const cross = svg && svg.querySelector('.cross');
      if (!cross) return;
      const r = svg.getBoundingClientRect();
      const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const i = Math.max(0, Math.min(series.length - 1,
        Math.round(((cx / r.width * W) - M.l) / iw * (series.length - 1))));
      const d = series[i];
      const px = x(i) / W * r.width;
      const py = y(d.tien) / H * r.height;

      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i));
      cross.setAttribute('opacity', '1');

      tipEl.textContent = `Tháng ${d.thang} · ${fmtTr(d.tien)} tr`;
      tipEl.classList.add('show');
      const tw = tipEl.offsetWidth || 150;
      tipEl.style.left = Math.max(4, Math.min(r.width - tw - 4, px - tw / 2)) + 'px';
      tipEl.style.top = Math.max(2, py - 46) + 'px';

      trailEl.style.left = (px - 5) + 'px';
      trailEl.style.top = (py - 5) + 'px';
      trailEl.classList.remove('go');
      void trailEl.offsetWidth;
      trailEl.classList.add('go');
    }

    function off() {
      const cross = host.querySelector('.cross');
      if (cross) cross.setAttribute('opacity', '0');
      tipEl.classList.remove('show');
    }

    box.addEventListener('mousemove', at);
    box.addEventListener('mouseleave', off);
    box.addEventListener('touchstart', at, { passive: true });
    box.addEventListener('touchmove', at, { passive: true });
    box.addEventListener('touchend', off);
  }

  return { draw, fmtTr };
})();
