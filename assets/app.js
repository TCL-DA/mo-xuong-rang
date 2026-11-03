/* ============================================================
   TÍNH TOÁN + GIAO DIỆN
   Trang tĩnh, không máy chủ: mỗi người sửa số trên máy mình,
   lưu bằng localStorage, chia sẻ bằng link có bộ số nhúng trong
   địa chỉ. Bản gốc trong data.js không bao giờ bị ghi đè.
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'mo-xuong-rang/v1';

  // Có JS mới được phép ẩn nội dung chờ hiệu ứng (xem motion.css)
  document.documentElement.classList.add('js');
  // Máy tắt hiệu ứng thì không chờ cuộn: hiện thẳng
  const ITHIEN = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

  let S = null;          // bộ số đang dùng
  let SC = 1;            // hệ số kịch bản doanh thu
  let R = null;          // kết quả tính
  let veLaiHieuUng = true; // có chạy lại hiệu ứng vẽ biểu đồ không

  /* ---------------- số: đọc và viết ---------------- */

  // Nhận mọi cách gõ quen tay: 235tr · 235.000.000 · 235 000 000 · 1,5 tỷ · 95k
  function parseNum(raw) {
    if (raw == null) return NaN;
    let s = String(raw).toLowerCase().trim().replace(/\s|đ|vnd|₫/g, '');
    if (!s) return 0;
    let mult = 1;
    const suf = [[/(tỷ|ty|tỉ|ti|b)$/, 1e9], [/(triệu|trieu|tr|m)$/, 1e6], [/(nghìn|nghin|ngàn|ngan|ng|k)$/, 1e3]];
    for (const [re, m] of suf) { if (re.test(s)) { s = s.replace(re, ''); mult = m; break; } }
    const hasDot = s.includes('.'), hasCom = s.includes(',');
    if (hasDot && hasCom) s = s.replace(/\./g, '').replace(',', '.');
    else if (hasCom) s = s.replace(',', '.');
    else if (hasDot) s = /\.\d{3}(\D|$)/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s;
    const v = parseFloat(s);
    return isNaN(v) ? NaN : v * mult;
  }

  const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
  const money = v => nf.format(Math.round(v || 0));
  function big(v) {
    const a = Math.abs(v);
    if (a >= 1e9) return nf2.format(v / 1e9) + ' tỷ';
    if (a >= 1e6) return nf.format(Math.round(v / 1e6)) + ' tr';
    return money(v);
  }
  const pct = v => nf2.format(v) + '%';

  /* ---------------- bộ số: nạp, lưu, chia sẻ ---------------- */

  const clone = o => JSON.parse(JSON.stringify(o));

  function blank() {
    return {
      capex: DATA.capex.map(g => clone(g.rows)),
      opex: clone(DATA.opex),
      giaVon: clone(DATA.giaVon),
      giaVonLy: clone(DATA.giaVonLy),
      doanhThu: clone(DATA.doanhThu),
      giaThiet: clone(DATA.giaThiet),
      thue: clone(DATA.thue)
    };
  }

  /* Bộ số có thể tới từ link người khác gửi (#d=…), từ localStorage, hoặc từ tệp JSON —
     đều là dữ liệu NGOÀI. Dựng lại đúng khung mình biết: chỉ nhận khoá hợp lệ, ép kiểu,
     cắt chuỗi quá dài. Chặn luôn trò nhét "__proto__" vào JSON. */
  const soSach = (v, mac) => { const n = Number(v); return isFinite(n) ? n : mac; };
  const chuSach = (v, dai, mac) => (typeof v === 'string' ? v : mac == null ? '' : mac).slice(0, dai);

  function loc(o) {
    const b = blank();
    if (!o || typeof o !== 'object') return b;
    const locHang = h => Array.isArray(h)
      ? [chuSach(h[0], 160, 'Mục'), soSach(h[1], 0), chuSach(h[2], 16), soSach(h[3], 0),
         chuSach(h[4], 240), Math.min(100, Math.max(0, soSach(h[5], 0)))]
      : null;
    if (Array.isArray(o.capex)) {
      b.capex = b.capex.map((goc, i) => Array.isArray(o.capex[i])
        ? o.capex[i].slice(0, 200).map(locHang).filter(Boolean) : goc);
    }
    if (Array.isArray(o.opex)) b.opex = o.opex.slice(0, 200).map(locHang).filter(Boolean);
    if (o.thue && typeof o.thue === 'object' && o.thue.hinhThuc === 'dn') b.thue.hinhThuc = 'dn';
    ['giaVon', 'giaVonLy', 'doanhThu', 'giaThiet', 'thue'].forEach(k => {
      const src = o[k];
      if (!src || typeof src !== 'object') return;
      Object.keys(b[k]).forEach(f => {
        if (f === 'hinhThuc') return;   // khoá chữ, đã xử lý ở trên
        if (Object.prototype.hasOwnProperty.call(src, f)) b[k][f] = soSach(src[f], b[k][f]);
      });
    });
    return b;
  }

  function b64enc(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let s = ''; bytes.forEach(b => s += String.fromCharCode(b));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64dec(str) {
    const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(s, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function load() {
    const m = location.hash.match(/d=([A-Za-z0-9\-_]+)/);
    if (m) { try { return loc(b64dec(m[1])); } catch (e) { /* link hỏng thì dùng số gốc */ } }
    try { const j = localStorage.getItem(KEY); if (j) return loc(JSON.parse(j)); } catch (e) { }
    return blank();
  }

  /* ---------------- tính ---------------- */

  /* Một hàng: [tên, số lượng, đơn vị, đơn giá, ghi chú, VAT %].
     gomVat = true nghĩa là đơn giá đang nhập ĐÃ gồm VAT (bóc ngược ra);
     false nghĩa là giá chưa VAT, phải cộng thêm. */
  function tienHang(r, gomVat) {
    const tien = (+r[1] || 0) * (+r[3] || 0);
    const v = (+r[5] || 0) / 100;
    if (gomVat) { const hang = tien / (1 + v); return { hang, vat: tien - hang, tong: tien }; }
    return { hang: tien, vat: tien * v, tong: tien * (1 + v) };
  }

  function congBang(rows, gomVat) {
    return rows.reduce((a, r) => {
      const x = tienHang(r, gomVat);
      a.hang += x.hang; a.vat += x.vat; a.tong += x.tong; return a;
    }, { hang: 0, vat: 0, tong: 0 });
  }

  const gomVatCapex = () => !!(+S.thue.muaCapexGomVat);
  const gomVatOpex = () => !!(+S.thue.muaOpexGomVat);
  const gomVatCua = path => (path.split('.')[0] === 'capex' ? gomVatCapex() : gomVatOpex());
  function sumRows(rows) { return congBang(rows, false).hang; }

  function tinh() {
    const g = S.giaVon, l = S.giaVonLy, d = S.doanhThu, t = S.giaThiet;

    // vốn đầu tư — số tiền THỰC TRẢ (đã gồm VAT), kèm phần VAT tách riêng
    const bCapex = S.capex.map(r => congBang(r, gomVatCapex()));
    const nhom = bCapex.map(x => x.tong);
    const vatCapex = bCapex.reduce((a, x) => a + x.vat, 0);
    const thietBi = (nhom[0] || 0) + (nhom[1] || 0);   // phần khấu hao được
    const capexGoc = nhom.reduce((a, b) => a + b, 0);
    const duPhong = capexGoc * (+t.duPhong || 0) / 100;

    // chi phí cố định
    const bOpex = congBang(S.opex, gomVatOpex());
    const coDinh = bOpex.tong;
    const vatOpex = bOpex.vat;
    const quy = coDinh * (+t.quyThang || 0);
    const vonPhaiCo = capexGoc + duPhong + quy;

    // giá vốn 1 kg rang
    const hao = Math.min(60, Math.max(0, +g.haoHut || 0));
    const xanhCan = 1 / (1 - hao / 100);
    const cXanh = xanhCan * (+g.giaXanh || 0);
    const cGas = (+g.gasTieuThu || 0) * (+g.gasGia || 0);
    const cDien = (+g.dienRang || 0) * (+g.dienGia || 0);
    const cKhac = (+g.baoBi || 0) + (+g.temNhan || 0) + (+g.congRang || 0);
    const kgThuan = cXanh + cGas + cDien + cKhac;
    const kgLoi = kgThuan * (+g.hongBo || 0) / 100;
    const giaVonKg = kgThuan + kgLoi;

    // VAT nằm sẵn trong giá nguyên liệu (giá nhập là tiền thực trả).
    // Doanh nghiệp khấu trừ được phần này, hộ kinh doanh thì không.
    const vOf = (tien, v) => { const x = (+v || 0) / 100; return x > 0 ? tien * x / (1 + x) : 0; };
    const heSoLoi = 1 + (+g.hongBo || 0) / 100;
    const vatKg = (vOf(cXanh, g.vatXanh) + vOf(cGas, g.vatGas) + vOf(cDien, g.vatDienRang)
                 + vOf(+g.baoBi || 0, g.vatBaoBi) + vOf(+g.temNhan || 0, g.vatTem)
                 + vOf(+g.congRang || 0, g.vatCong)) * heSoLoi;
    const vatGiaCongKg = (vOf(cGas, g.vatGas) + vOf(cDien, g.vatDienRang)
                        + vOf(+g.congRang || 0, g.vatCong)) * heSoLoi;

    // giá vốn 1 ly
    const lyCaPhe = (+l.caPheGam || 0) / 1000 * giaVonKg;
    const giaVonLy = lyCaPhe + (+l.suaDuongSyrup || 0) + (+l.lyNapOngHut || 0) + (+l.daNuoc || 0);
    const vatLyDv = (+l.caPheGam || 0) / 1000 * vatKg
      + vOf(+l.suaDuongSyrup || 0, l.vatSua) + vOf(+l.lyNapOngHut || 0, l.vatLy) + vOf(+l.daNuoc || 0, l.vatDa);

    // doanh thu (có hệ số kịch bản trên LƯỢNG bán)
    const siKg = (+d.siKg || 0) * SC, leKg = (+d.leKg || 0) * SC;
    const soLy = (+d.lyNgay || 0) * (+d.ngayMo || 0) * SC;
    const gcKg = (+d.giaCongKg || 0) * SC;

    const rSi = siKg * (+d.siGia || 0);
    const rLe = leKg * (+d.leGia || 0);
    const rLy = soLy * (+d.lyGia || 0);
    const rGc = gcKg * (+d.giaCongGia || 0);
    const doanhThu = rSi + rLe + rLy + rGc;

    // giá vốn hàng bán
    const vSi = siKg * giaVonKg, vLe = leKg * giaVonKg, vLy = soLy * giaVonLy;
    const gcDonVi = (cGas + cDien + (+g.congRang || 0)) * (1 + (+g.hongBo || 0) / 100); // khách tự mang cà phê
    const vGc = gcKg * gcDonVi;
    const bienPhi = vSi + vLe + vLy + vGc;
    const vatBienPhi = (siKg + leKg) * vatKg + soLy * vatLyDv + gcKg * vatGiaCongKg;

    const laiGop = doanhThu - bienPhi;
    const khauHao = thietBi / Math.max(1, (+t.khauHaoNam || 1) * 12);

    /* ---- thuế ----
       Trình bày theo DÒNG TIỀN cho dễ hiểu: tiền khách trả − tiền thực chi − thuế nộp.
       Nên giá vốn ở trên giữ nguyên là số tiền thực trả (đã gồm VAT đầu vào),
       phần VAT đầu vào được khấu trừ đi vào số VAT phải nộp. */
    const th = S.thue;
    const laDN = th.hinhThuc === 'dn';
    let thueDT = 0, thueLai = 0, vatRa = 0, vatVao = 0, dtThuan = doanhThu;
    let dtNam = doanhThu * 12, heSoNguong = 1, vuotNguong = true;

    if (laDN) {
      const tr = (+th.dnVatRa || 0) / 100;
      dtThuan = th.giaDaGomVat ? doanhThu / (1 + tr) : doanhThu;
      vatRa = dtThuan * tr;
      // VAT đầu vào: chi phí cố định lấy theo cột VAT từng dòng,
      // nguyên liệu lấy theo VAT khai riêng cho từng khoản ở mục 04
      vatVao = vatOpex + vatBienPhi;
      thueDT = Math.max(0, vatRa - vatVao);
      const loiNhuanKT = dtThuan - (bienPhi + coDinh - vatVao) - khauHao;
      thueLai = Math.max(0, loiNhuanKT) * (+th.dnTndn || 0) / 100;
    } else {
      const nguong = +th.nguongMien || 0;
      vuotNguong = dtNam > nguong;
      heSoNguong = th.truNguong ? (vuotNguong ? (dtNam - nguong) / dtNam : 0) : (vuotNguong ? 1 : 0);
      thueDT = ((rSi + rLe) * (+th.hoHangHoa || 0)
              + rLy * (+th.hoAnUong || 0)
              + rGc * (+th.hoDichVu || 0)) / 100 * heSoNguong;
    }
    const tongThue = thueDT + thueLai;

    const laiTienMat = laiGop - coDinh - tongThue;
    const laiKeToan = laiTienMat - khauHao;

    // hoà vốn: tại điểm hoà vốn thì không có thuế trên lãi, chỉ còn thuế theo doanh thu
    const tThue = doanhThu > 0 ? thueDT / doanhThu : 0;
    const tyLeGop = doanhThu > 0 ? (laiGop - thueDT) / doanhThu : 0;
    const dtHoaVon = tyLeGop > 0 ? coDinh / tyLeGop : Infinity;

    // kg cần bán để hoà vốn nếu chỉ bán cà phê rang giá sỉ
    const gopSiKg = (+d.siGia || 0) * (1 - tThue) - giaVonKg;
    const kgHoaVon = gopSiKg > 0 ? coDinh / gopSiKg : Infinity;
    // ly cần bán mỗi ngày để hoà vốn nếu chỉ bán tại quầy
    const gopLy = (+d.lyGia || 0) * (1 - tThue) - giaVonLy;
    const lyHoaVon = gopLy > 0 && +d.ngayMo ? coDinh / gopLy / (+d.ngayMo) : Infinity;

    // dòng tiền, có nhịp chạy dần: biểu đồ vẽ 24 tháng, mốc hoàn vốn dò tới 120 tháng
    const f = [1, 2, 3].map(i => (+t['thangChay' + i] || 0) / 100);
    const series = [{ thang: 0, tien: -(capexGoc + duPhong) }];
    let cum = -(capexGoc + duPhong), beMonth = null;
    // Doanh nghiệp: VAT đã trả khi mua sắm được khấu trừ dần vào VAT phải nộp hàng tháng
    let vatDuDauTu = laDN ? vatCapex : 0;
    let thangHetVatDauTu = 0;
    for (let m = 1; m <= 120; m++) {
      const cs = m <= 3 ? f[0] : m <= 6 ? f[1] : f[2];
      const lai0 = (doanhThu - bienPhi) * cs - coDinh;
      const vatThang = thueDT * cs;
      const buTru = Math.min(vatDuDauTu, vatThang);
      vatDuDauTu -= buTru;
      if (buTru > 0) thangHetVatDauTu = m;
      cum += lai0 - (vatThang - buTru) - (lai0 > 0 ? thueLai * cs : 0);
      if (m <= 24) series.push({ thang: m, tien: cum });
      if (beMonth === null && cum >= 0) beMonth = m;
    }

    return {
      nhom, capexGoc, duPhong, quy, vonPhaiCo, thietBi, vatCapex, vatOpex, bCapex, bOpex, thangHetVatDauTu,
      coDinh, giaVonKg, giaVonLy, cXanh, cGas, cDien, cKhac, kgLoi, xanhCan, lyCaPhe,
      doanhThu, rSi, rLe, rLy, rGc, siKg, leKg, soLy, gcKg,
      bienPhi, vSi, vLe, vLy, vGc, laiGop, laiTienMat, khauHao, laiKeToan, vatKg, vatLyDv, vatBienPhi,
      laDN, thueDT, thueLai, tongThue, vatRa, vatVao, dtThuan, dtNam, vuotNguong, heSoNguong,
      tyLeGop, dtHoaVon, kgHoaVon, lyHoaVon, series, beMonth
    };
  }

  /* ---------------- vẽ bảng nhập ---------------- */

  function inpCell(val, cls, path) {
    const i = el('input', 'inp ' + (cls || ''));
    i.type = 'text';
    i.inputMode = 'decimal';
    i.value = typeof val === 'number' ? nf2.format(val) : val;
    i.dataset.path = path;
    return i;
  }

  function rowEl(r, path, onDel) {
    const tr = el('tr', 'rail');
    const gomVat = gomVatCua(path);

    const tdName = el('td');
    tdName.dataset.lbl = 'Mục';
    // tên mục: khối sửa tại chỗ (không dùng <input> vì input không xuống dòng,
    // tên dài như "Dụng cụ bar + ly + bình ủ…" bị cắt mất đuôi trên điện thoại)
    const nameIn = el('div', 'inp name');
    nameIn.contentEditable = 'true';
    nameIn.spellcheck = false;
    nameIn.textContent = r[0];
    nameIn.dataset.path = path + '.0';
    nameIn.setAttribute('role', 'textbox');
    nameIn.setAttribute('aria-label', 'Tên mục: ' + r[0]);
    tdName.appendChild(nameIn);
    if (r[4]) { const nt = el('span', 't-note'); nt.textContent = r[4]; tdName.appendChild(nt); }

    const tdQty = el('td', 'r'); tdQty.dataset.lbl = 'Số lượng';
    const q = inpCell(+r[1], 'w-qty', path + '.1');
    q.setAttribute('aria-label', r[0] + ' — số lượng');
    tdQty.appendChild(q);
    const un = el('span', 'unit'); un.textContent = ' ' + r[2]; tdQty.appendChild(un);

    const tdPrice = el('td', 'r'); tdPrice.dataset.lbl = 'Đơn giá (đồng)';
    const pr = inpCell(+r[3], 'w-price', path + '.3');
    pr.setAttribute('aria-label', r[0] + ' — đơn giá');
    tdPrice.appendChild(pr);

    const tdVat = el('td', 'r'); tdVat.dataset.lbl = 'VAT';
    const vt = inpCell(+r[5] || 0, 'w-vat', path + '.5');
    vt.setAttribute('aria-label', r[0] + ' — thuế suất VAT phần trăm');
    tdVat.appendChild(vt);
    const pc = el('span', 'unit'); pc.textContent = ' %'; tdVat.appendChild(pc);

    const x = tienHang(r, gomVat);
    const tdSum = el('td', 'r'); tdSum.dataset.lbl = 'Thành tiền';
    tdSum.appendChild(el('span', 'cell-money', money(x.tong)));
    const vn = el('span', 't-note');
    vn.textContent = x.vat ? (gomVat ? 'trong đó VAT ' : '+ VAT ') + money(x.vat) : 'không có hoá đơn VAT';
    tdSum.appendChild(vn);

    const tdDel = el('td', 'r');
    const b = el('button', 'btn mini ghost', '×');
    b.title = 'Bỏ dòng này'; b.setAttribute('aria-label', 'Bỏ dòng ' + r[0]);
    b.addEventListener('click', onDel);
    tdDel.appendChild(b);

    [tdName, tdQty, tdPrice, tdVat, tdSum, tdDel].forEach(td => tr.appendChild(td));
    return tr;
  }

  function tableFor(rows, basePath, title, onChange) {
    const gomVat = gomVatCua(basePath);
    const box = el('div', 'rv-f');
    const tbl = el('table', 'tbl');
    if (title) tbl.appendChild(el('caption', null, title));
    tbl.appendChild(el('thead', null,
      '<tr><th>Mục</th><th class="r">Số lượng</th><th class="r">Đơn giá (đồng)</th>'
      + '<th class="r">VAT</th><th class="r">Thành tiền</th><th></th></tr>'));
    const tb = el('tbody');
    rows.forEach((r, i) => tb.appendChild(rowEl(r, basePath + '.' + i, () => { rows.splice(i, 1); onChange(true); })));

    const c = congBang(rows, gomVat);
    tb.appendChild(el('tr', 'c-hang', `<td>Cộng tiền hàng (chưa VAT)</td><td></td><td></td><td></td><td class="r"><span class="num">${money(c.hang)}</span></td><td></td>`));
    tb.appendChild(el('tr', 'c-vat', `<td>Cộng VAT</td><td></td><td></td><td></td><td class="r"><span class="num">${money(c.vat)}</span></td><td></td>`));
    tb.appendChild(el('tr', 't-sum', `<td>Tổng phải trả</td><td></td><td></td><td></td><td class="r"><span class="cell-money">${money(c.tong)}</span></td><td></td>`));
    tbl.appendChild(tb);
    box.appendChild(tbl);

    const add = el('button', 'btn mini', '+ thêm dòng');
    add.style.marginTop = '12px';
    add.addEventListener('click', () => { rows.push(['Mục mới', 1, 'cái', 0, '', 8]); onChange(true); });
    box.appendChild(add);
    return box;
  }

  function fieldsFor(obj, basePath, keys) {
    const frag = document.createDocumentFragment();
    keys.forEach(k => {
      const [lbl, unit] = NHAN[k] || [k, ''];
      const f = el('div', 'field rv-f');
      f.appendChild(el('label', null, lbl));
      const row = el('div', 'row');
      const ip = inpCell(obj[k], '', basePath + '.' + k);
      ip.setAttribute('aria-label', lbl + (unit ? ' (' + unit + ')' : ''));
      row.appendChild(ip);
      const un = el('span', 'unit'); un.textContent = unit; row.appendChild(un);
      f.appendChild(row);
      frag.appendChild(f);
    });
    return frag;
  }

  /* ---------------- vẽ kết quả ---------------- */

  function setTxt(id, text) {
    const n = document.getElementById(id);
    if (!n) return;
    const old = n.textContent;
    if (old === text) return;
    n.textContent = text;
    n.classList.remove('skeleton', 'up', 'down');
    void n.offsetWidth;
    const a = parseNum(old.replace(/[^\d.,-]/g, '')), b = parseNum(text.replace(/[^\d.,-]/g, ''));
    n.classList.add(!isNaN(a) && !isNaN(b) && b < a ? 'down' : 'up');
  }

  function plRows(tbody, rows) {
    tbody.innerHTML = rows.map(r => {
      if (r === '-') return '<tr><td colspan="2" style="padding:0"><div class="hr in"></div></td></tr>';
      const cls = r[2] === 'big' ? ' class="big"' : r[2] === 'sub' ? ' class="sub"' : '';
      return `<tr${cls}><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`;
    }).join('');
  }

  function thangNam(m) {
    if (m == null) return 'trên 10 năm';
    if (m < 12) return m + ' tháng';
    const y = Math.floor(m / 12), r = m % 12;
    return y + ' năm' + (r ? ' ' + r + ' tháng' : '');
  }

  /* Mục 06 — thuế. Ô nhập đổi theo hình thức đang chọn, bảng bên phải là tiền thuế một tháng. */
  function veMucThue() {
    const th = S.thue, laDN = th.hinhThuc === 'dn';

    document.querySelectorAll('#chipsThue .chip').forEach(c =>
      c.classList.toggle('on', (c.dataset.ht === 'dn') === laDN));

    const f = document.getElementById('fThue');
    f.innerHTML = '';
    f.appendChild(fieldsFor(th, 'thue', laDN
      ? ['dnVatRa', 'dnVatVao', 'dnTndn', 'giaDaGomVat']
      : ['nguongMien', 'truNguong', 'hoHangHoa', 'hoAnUong', 'hoDichVu']));

    plRows(document.getElementById('plThue'), laDN ? [
      ['Doanh thu chưa VAT', money(R.dtThuan), 'sub'],
      ['VAT đầu ra ' + nf2.format(th.dnVatRa) + '%', money(R.vatRa), 'sub'],
      ['VAT đầu vào được khấu trừ', '− ' + money(R.vatVao), 'sub'],
      '-',
      ['VAT phải nộp', money(R.thueDT) + ' đ', 'big'],
      ['Thuế TNDN ' + nf2.format(th.dnTndn) + '% trên lãi', money(R.thueLai) + ' đ'],
      ['Tổng thuế một tháng', money(R.tongThue) + ' đ', 'big'],
      ['Một năm', money(R.tongThue * 12) + ' đ', 'sub']
    ] : [
      ['Doanh thu một năm', money(R.dtNam), 'sub'],
      ['Ngưỡng không phải nộp thuế', money(th.nguongMien), 'sub'],
      [th.truNguong ? 'Phần doanh thu bị tính thuế' : 'Doanh thu bị tính thuế',
        money(R.dtNam * R.heSoNguong) + '/năm', 'sub'],
      '-',
      ['Cà phê rang · ' + nf2.format(th.hoHangHoa) + '%', money((R.rSi + R.rLe) * th.hoHangHoa / 100 * R.heSoNguong), 'sub'],
      ['Đồ uống tại quầy · ' + nf2.format(th.hoAnUong) + '%', money(R.rLy * th.hoAnUong / 100 * R.heSoNguong), 'sub'],
      ['Rang gia công · ' + nf2.format(th.hoDichVu) + '%', money(R.rGc * th.hoDichVu / 100 * R.heSoNguong), 'sub'],
      '-',
      ['Thuế một tháng', money(R.tongThue) + ' đ', 'big'],
      ['Một năm', money(R.tongThue * 12) + ' đ', 'sub']
    ]);

    const fl = document.getElementById('thueFlag');
    fl.innerHTML = '';
    const flag = el('div', 'flag in');
    if (!laDN && !R.vuotNguong) {
      flag.textContent = 'Doanh thu năm dưới ngưỡng — hộ kinh doanh không phải nộp GTGT và TNCN.';
    } else if (!laDN && R.dtNam < (+th.nguongMien || 0) * 1.2) {
      flag.classList.add('warn');
      flag.appendChild(el('span', 'tri'));
      flag.appendChild(el('span', null,
        'Chỉ vượt ngưỡng ' + big(R.dtNam - (+th.nguongMien || 0)) + '/năm — bán nhỉnh hơn một chút là bước qua mức phải nộp thuế.'));
    } else {
      flag.textContent = 'Thuế ăn ' + pct(R.doanhThu ? R.tongThue / R.doanhThu * 100 : 0) + ' doanh thu.';
    }
    fl.appendChild(flag);
  }

  function veKetQua() {
    R = tinh();

    // --- 4 ô số lớn ---
    setTxt('kVon', big(R.vonPhaiCo));
    document.getElementById('kVonNote').textContent =
      `${big(R.capexGoc)} mua sắm + ${big(R.duPhong)} dự phòng + ${big(R.quy)} quỹ ${S.giaThiet.quyThang} tháng`;
    setTxt('kThang', big(R.coDinh + R.bienPhi + R.tongThue));
    document.getElementById('kThangNote').textContent =
      `${big(R.coDinh)} cố định + ${big(R.bienPhi)} theo hàng bán + ${big(R.tongThue)} thuế`;
    setTxt('kLai', (R.laiTienMat < 0 ? '−' : '') + big(Math.abs(R.laiTienMat)));
    document.getElementById('kLaiNote').textContent =
      R.laiKeToan >= 0 ? `Sau khấu hao vẫn lãi ${big(R.laiKeToan)}` : `Trừ khấu hao ${big(R.khauHao)} thì lỗ ${big(Math.abs(R.laiKeToan))}`;
    setTxt('kHoanVon', R.beMonth ? thangNam(R.beMonth) : 'không hoàn được');
    document.getElementById('kHoanVonNote').textContent = R.beMonth
      ? (R.beMonth <= 24 ? 'thấy rõ trên biểu đồ ở mục 06' : 'biểu đồ mục 06 chỉ vẽ 24 tháng đầu')
      : 'mỗi tháng đang âm — vốn không quay lại';

    const kp = document.getElementById('kpiPayback');
    kp.classList.toggle('warn', !R.beMonth || R.beMonth > 36);

    // --- thanh hoà vốn ---
    const p = R.dtHoaVon > 0 && isFinite(R.dtHoaVon) ? Math.min(100, R.doanhThu / R.dtHoaVon * 100) : 0;
    document.getElementById('beFill').style.width = p.toFixed(1) + '%';
    document.getElementById('beText').innerHTML = isFinite(R.dtHoaVon)
      ? `Doanh thu hoà vốn <b>${big(R.dtHoaVon)}/tháng</b>. Đang nhập <b>${big(R.doanhThu)}</b> — ${R.doanhThu >= R.dtHoaVon
        ? `vượt ${big(R.doanhThu - R.dtHoaVon)}` : `còn thiếu ${big(R.dtHoaVon - R.doanhThu)}`}.`
      : 'Giá bán chưa cao hơn giá vốn — không có điểm hoà vốn. Phải sửa giá bán hoặc giá vốn.';

    const fb = document.getElementById('flagBox');
    fb.innerHTML = '';
    const flag = el('div', 'flag in');
    if (R.laiTienMat < 0) {
      flag.classList.add('warn');
      flag.appendChild(el('span', 'tri'));
      flag.appendChild(el('span', null, `Mỗi tháng âm ${big(Math.abs(R.laiTienMat))} — quỹ ${big(R.quy)} chịu được ${Math.floor(R.quy / Math.abs(R.laiTienMat))} tháng`));
    } else {
      flag.innerHTML = `<span>Hoà vốn nếu bán ${isFinite(R.kgHoaVon) ? nf.format(Math.ceil(R.kgHoaVon)) + ' kg/tháng giá sỉ' : '—'}`
        + `, hoặc ${isFinite(R.lyHoaVon) ? nf.format(Math.ceil(R.lyHoaVon)) + ' ly/ngày' : '—'} tại quầy</span>`;
    }
    fb.appendChild(flag);

    // --- cơ cấu một tháng ---
    // tìm theo TÊN mục (người xem có thể xoá/thêm dòng nên không dựa vào số thứ tự)
    const opexCo = (re) => S.opex.reduce((a, r) => a + (re.test(r[0]) ? tienHang(r, gomVatOpex()).tong : 0), 0);
    const nhanSu = opexCo(/l[uư]ơng|bhxh|ph[uụ] c[aấ]p/i);
    const thue = opexCo(/thu[eê] m[aặ]t b[aằ]ng|thu[eê] nh[aà]/i);
    const dt = R.doanhThu || 1;
    const share = [
      ['Giá vốn hàng bán', R.bienPhi],
      ['Nhân sự', nhanSu],
      ['Thuê mặt bằng', thue],
      ['Cố định khác', Math.max(0, R.coDinh - nhanSu - thue)],
      [R.laiTienMat >= 0 ? 'Còn lại (lãi)' : 'Thiếu hụt', Math.abs(R.laiTienMat)]
    ];
    const sb = document.getElementById('shareBox');
    sb.innerHTML = '';
    share.forEach(([name, v]) => {
      const row = el('div', 'share-row');
      const w = Math.min(100, Math.abs(v) / dt * 100);
      row.innerHTML = `<div>${name}</div><div class="share-track"><div class="share-fill" style="width:${w.toFixed(1)}%"></div></div><div class="num">${pct(v / dt * 100)}</div>`;
      sb.appendChild(row);
      if (ITHIEN) row.classList.add('in'); else io.observe(row);
    });

    // --- tổng vốn + VAT đã trả khi mua sắm ---
    document.getElementById('capexTotal').textContent = money(R.vonPhaiCo);
    const vb = document.getElementById('vatCapexBox');
    vb.innerHTML = '';
    const fv = el('div', 'flag in');
    if (R.vatCapex <= 0) {
      fv.textContent = 'Không khoản mua sắm nào có hoá đơn VAT — kiểm lại cột VAT nếu mua có hoá đơn.';
    } else if (R.laDN) {
      fv.appendChild(el('span', null, `VAT đã trả khi mua sắm: ${big(R.vatCapex)} — doanh nghiệp được khấu trừ dần`
        + (R.thangHetVatDauTu ? `, bù hết VAT phải nộp tới hết tháng ${R.thangHetVatDauTu}.` : '.')));
    } else {
      fv.classList.add('warn');
      fv.appendChild(el('span', 'tri'));
      fv.appendChild(el('span', null, `VAT đã trả khi mua sắm: ${big(R.vatCapex)} — hộ kinh doanh `
        + 'không khấu trừ được, khoản này mất luôn vào vốn.'));
    }
    vb.appendChild(fv);

    // --- giá vốn 1 kg ---
    plRows(document.getElementById('plKg'), [
      ['Cà phê xanh (' + nf2.format(R.xanhCan) + ' kg xanh cho 1 kg rang)', money(R.cXanh), 'sub'],
      ['Gas LPG', money(R.cGas), 'sub'],
      ['Điện rang', money(R.cDien), 'sub'],
      ['Bao bì + tem + công đứng máy', money(R.cKhac), 'sub'],
      ['Mẻ lỗi', money(R.kgLoi), 'sub'],
      '-',
      ['Giá vốn 1 kg rang', money(R.giaVonKg) + ' đ', 'big'],
      ['Trong đó VAT đã trả', money(R.vatKg) + ' đ' + (R.laDN ? ' — khấu trừ được' : ' — không khấu trừ'), 'sub'],
      ['Lãi gộp 1 kg bán sỉ ' + money(S.doanhThu.siGia) + ' đ', money(S.doanhThu.siGia - R.giaVonKg) + ' đ'],
      ['Lãi gộp 1 kg bán lẻ ' + money(S.doanhThu.leGia) + ' đ', money(S.doanhThu.leGia - R.giaVonKg) + ' đ']
    ]);

    plRows(document.getElementById('plLy'), [
      ['Cà phê trong ly (' + nf2.format(S.giaVonLy.caPheGam) + ' g)', money(R.lyCaPhe), 'sub'],
      ['Sữa, đường, syrup', money(S.giaVonLy.suaDuongSyrup), 'sub'],
      ['Ly, nắp, ống hút', money(S.giaVonLy.lyNapOngHut), 'sub'],
      ['Đá, nước', money(S.giaVonLy.daNuoc), 'sub'],
      '-',
      ['Giá vốn 1 ly', money(R.giaVonLy) + ' đ', 'big'],
      ['Trong đó VAT đã trả', money(R.vatLyDv) + ' đ' + (R.laDN ? ' — khấu trừ được' : ' — không khấu trừ'), 'sub'],
      ['Lãi gộp 1 ly bán ' + money(S.doanhThu.lyGia) + ' đ', money(S.doanhThu.lyGia - R.giaVonLy) + ' đ'],
      ['Tỉ lệ giá vốn trên giá bán', pct(S.doanhThu.lyGia ? R.giaVonLy / S.doanhThu.lyGia * 100 : 0)]
    ]);

    // --- doanh thu ---
    plRows(document.getElementById('plRev'), [
      ['Bán sỉ · ' + nf.format(R.siKg) + ' kg', money(R.rSi), 'sub'],
      ['Bán lẻ + online · ' + nf.format(R.leKg) + ' kg', money(R.rLe), 'sub'],
      ['Quầy take away · ' + nf.format(R.soLy) + ' ly', money(R.rLy), 'sub'],
      ['Rang gia công · ' + nf.format(R.gcKg) + ' kg', money(R.rGc), 'sub'],
      '-',
      ['Doanh thu một tháng', money(R.doanhThu) + ' đ', 'big'],
      ['Tổng cà phê rang bán ra', nf.format(R.siKg + R.leKg) + ' kg/tháng'],
      ['Cà phê xanh phải mua', nf.format(Math.ceil((R.siKg + R.leKg + R.soLy * S.giaVonLy.caPheGam / 1000) * R.xanhCan)) + ' kg/tháng']
    ]);

    // --- mục thuế ---
    veMucThue();

    // --- P&L tháng ---
    plRows(document.getElementById('plMonth'), [
      ['Doanh thu', money(R.doanhThu)],
      ['Giá vốn hàng bán', '− ' + money(R.bienPhi), 'sub'],
      ['Lãi gộp (' + pct(R.doanhThu ? R.laiGop / R.doanhThu * 100 : 0) + ')', money(R.laiGop)],
      ['Chi phí cố định', '− ' + money(R.coDinh), 'sub'],
      ['Thuế (' + (R.laDN ? 'VAT + TNDN' : 'hộ kinh doanh') + ')', '− ' + money(R.tongThue), 'sub'],
      '-',
      ['Tiền thật còn lại mỗi tháng', (R.laiTienMat < 0 ? '− ' : '') + money(Math.abs(R.laiTienMat)) + ' đ', 'big'],
      ['Khấu hao thiết bị (' + S.giaThiet.khauHaoNam + ' năm)', '− ' + money(R.khauHao), 'sub'],
      ['Lãi kế toán', (R.laiKeToan < 0 ? '− ' : '') + money(Math.abs(R.laiKeToan)) + ' đ'],
      R.laDN && R.thangHetVatDauTu
        ? ['VAT mua sắm còn khấu trừ', 'hết tháng ' + R.thangHetVatDauTu, 'sub']
        : ['VAT trả khi mua sắm', big(R.vatCapex) + (R.laDN ? '' : ' — không khấu trừ'), 'sub']
    ]);

    // --- biểu đồ + bảng dòng tiền ---
    CHART.draw(document.getElementById('chart'), R.series, R.beMonth,
      document.getElementById('tip'), document.getElementById('trail'));
    // chỉ chạy lại hiệu ứng vẽ đường khi đổi kịch bản — gõ số thì cập nhật im lặng
    const hint = document.querySelector('.chart-hint');
    if (hint) hint.textContent = R.beMonth && R.beMonth <= 24
      ? `Đường đi xuống trước, chạm đáy rồi leo lên và cắt vạch 0 ở tháng ${R.beMonth} — đó là lúc lấy lại đủ vốn. Rê chuột (hoặc chạm) lên biểu đồ để xem từng tháng.`
      : R.beMonth
        ? `Trong 24 tháng đầu đường chưa chạm vạch 0: theo nhịp đang nhập thì tới tháng ${R.beMonth} mới lấy lại đủ vốn. Rê chuột (hoặc chạm) lên biểu đồ để xem từng tháng.`
        : R.laiTienMat > 0
          ? 'Mỗi tháng vẫn có lãi nhưng quá mỏng: dò tới 10 năm chưa lấy lại đủ vốn. Phải đẩy sản lượng hoặc giá bán.'
          : 'Đường đi xuống mãi — với bộ số đang nhập thì vốn không quay lại. Phải sửa giá bán, sản lượng hoặc chi phí.';

    const cb = document.getElementById('chartBox');
    if (veLaiHieuUng) { cb.classList.remove('in'); void cb.offsetWidth; cb.classList.add('in'); veLaiHieuUng = false; }
    else cb.classList.add('in');

    const pick = [3, 6, 12, 18, 24];
    plRows(document.getElementById('plCash'), pick.map(m => {
      const d = R.series[m];
      return ['Hết tháng ' + m, (d.tien < 0 ? '− ' : '') + money(Math.abs(d.tien)) + ' đ', 'sub'];
    }).concat([['Hoàn vốn', R.beMonth ? 'tháng ' + R.beMonth : 'chưa, trong 24 tháng', 'big']]));
  }

  /* ---------------- ghi chú ---------------- */

  const NOTES = [
    ['Năm khoản làm vỡ dự toán nhiều nhất', `
      <ul>
        <li><b>Sửa mặt bằng.</b> Nhà thuê 60 m² hiếm khi có sẵn thoát nước, hút mùi và điện đủ tải. Khoản 45 triệu trong bảng là mức "nhà tạm được"; nhà thô có thể gấp đôi.</li>
        <li><b>Ống khói và PCCC.</b> Rang bằng gas trong khu dân cư phải có đường khói lên cao, kẹp đúng tường nhà thuê, bình chữa cháy và hồ sơ. Nhiều người bỏ qua tới lúc bị kiểm tra.</li>
        <li><b>Điện ba pha.</b> Máy 6 kg có hệ tự động nên đi ba pha; xin hạ bình, kéo nhánh và dựng tủ là một khoản riêng, không nằm trong giá máy.</li>
        <li><b>Hao hụt rang.</b> Sai 2% hao hụt là lệch giá vốn vài nghìn đồng mỗi kg — nhân 200 kg mỗi tháng thành tiền thật.</li>
        <li><b>Đọng vốn cà phê xanh.</b> Mua rẻ theo bao lớn thì tiền nằm trong kho; bảng này chỉ tính lô đầu 300 kg.</li>
      </ul>`],
    ['Vì sao hoàn vốn lâu hơn cảm giác', `
      <p>Riêng ba món máy rang, hệ tự động và tách đá đã là 325 triệu — tài sản nặng chỉ sinh lời khi chạy nhiều mẻ.
      Máy 6 kg rang được khoảng 18 kg mỗi giờ, nên công suất không phải giới hạn; giới hạn là <b>bán được bao nhiêu</b>.</p>
      <p>Thước đo đáng tin nhất của mô hình này: <b>mỗi tháng bán được bao nhiêu kg</b>. Con số hoà vốn tính sẵn ở mục 01;
      dưới mức đó thì quán cóc chỉ đang nuôi cái xưởng.</p>`],
    ['Khói, mùi và hàng xóm', `
      <p>Quán cóc trong khu dân cư, rang vài mẻ liền là có mùi và khói. Hai cách xử lý: rang lệch giờ, hoặc lắp buồng đốt khói —
      khoản này <b>chưa nằm trong bảng</b> vì tuỳ chỗ. Nếu chủ nhà hoặc hàng xóm phản ứng thì đó là chi phí bắt buộc, cộng thêm vào mục 02.</p>`],
    ['Số nào lấy ở đâu — tra ngày 03/11/2026', `
      <ul>
        <li><b>Cà phê nhân xô robusta</b> cuối tháng 10/2026 quanh <b>89.500–93.000 đ/kg</b> tại Đắk Lắk.
        Bảng để <b>105.000</b> vì xưởng rang mua hạt sàng chọn (sàng 16/18 khoảng 100–115 k), arabica Cầu Đất
        còn cao hơn, 150 k trở lên. Mua nhân xô rang bán sỉ thì hạ ô này xuống.</li>
        <li><b>Gas LPG</b>: bình 45 kg tháng 8–10/2026 khoảng <b>2,1–2,5 triệu</b> → bảng tính <b>51.000 đ/kg</b>.
        Đây là khoản tôi đặt sai ở bản đầu (32.000) — gas đã tăng mạnh trong năm 2026.</li>
        <li><b>Điện kinh doanh</b>: giờ bình thường khoảng 2.700 đ/kWh, giờ cao điểm lên 5.000 đ/kWh;
        bảng dùng bình quân <b>3.200 đ/kWh</b>. Quán chạy nhiều vào cao điểm thì nâng lên.</li>
        <li><b>Lương</b>: tối thiểu vùng I từ 01/01/2026 là <b>5,31 triệu/tháng</b> (Nghị định 293/2025/NĐ-CP,
        tăng bình quân 7,2%). Pha chế toàn thời gian ở thành phố thực trả 7,5–9 triệu nên bảng để 8 triệu;
        bán thời gian tính ~27 k/giờ.</li>
        <li><b>Thiết bị quán</b>: máy pha 2 group hãng phổ thông mua mới 60–90 triệu (máy cũ 35–45);
        máy xay espresso 12–18; tủ mát 2 cánh 13–18 cộng tủ đông nhỏ 5–7; máy đá 50 kg/ngày 10–15.</li>
      </ul>
      <p class="tiny muted">Giá cà phê và gas đổi từng tháng. Trước khi quyết định phải lấy báo giá thật —
      bảng này chỉ cho biết độ lớn của từng khoản.</p>`],
    ['Thuế tính thế nào trong bảng này', `
      <p><b>Hộ kinh doanh</b> (mặc định): từ 01/01/2026 bỏ thuế khoán, hộ tự kê khai. Ngưỡng doanh thu
      <b>không phải nộp GTGT và thuế thu nhập là 1 tỷ đồng/năm</b> (Nghị định 141/2026/NĐ-CP sửa Nghị định
      68/2026/NĐ-CP — trước đó là 500 triệu). Vượt ngưỡng thì nộp theo phần trăm doanh thu theo nhóm ngành:
      bán hàng hoá 1% GTGT + 0,5% thuế thu nhập; dịch vụ ăn uống 3% + 1,5%; dịch vụ không bao thầu nguyên vật
      liệu 7%. Hộ kinh doanh <b>không được khấu trừ VAT đầu vào</b> — VAT nằm luôn trong giá mua.</p>
      <p>Công tắc <i>"Trừ ngưỡng rồi mới tính"</i> trong mục 06: để <b>1</b> là chỉ tính thuế trên phần doanh thu
      vượt 1 tỷ, để <b>0</b> là tính trên toàn bộ doanh thu. Hai cách cho ra số rất khác nhau khi doanh thu
      chỉ nhỉnh hơn ngưỡng — hỏi cán bộ thuế quản lý để biết nơi mình áp cách nào.</p>
      <p><b>Doanh nghiệp</b>: VAT đầu ra trừ VAT đầu vào. Thuế suất 10% đang được giảm còn <b>8% đến hết
      31/12/2026</b> (Nghị quyết 204/2025/QH15). Chỗ dễ hụt: cà phê xanh mua của nông dân thường
      <b>không có hoá đơn</b> nên không được khấu trừ — ô <i>"Chi phí có hoá đơn GTGT"</i> để mặc định 60%,
      sửa theo thực tế mua bán của mình. Thêm thuế thu nhập doanh nghiệp 20% trên lãi.</p>
      <p>Giá bán nhập ở mục 05 mặc định là <b>giá khách trả, đã gồm VAT</b>. Nếu mình báo giá sỉ chưa gồm VAT
      thì đặt ô <i>"Giá bán đã gồm VAT"</i> về 0.</p>
      <p class="tiny muted">Tra ngày 03/11/2026. Chính sách thuế đổi liên tục — trước khi quyết định phải đối
      chiếu văn bản gốc hoặc hỏi cơ quan thuế quản lý; bảng này không thay tư vấn thuế.</p>`],
    ['Những gì bảng này chưa tính', `
      <ul>
        <li>Lãi vay nếu vay vốn mua máy.</li>
        <li>Thuê mặt bằng tăng sau mỗi kỳ hạn hợp đồng.</li>
        <li>Sửa máy lớn, thay vòng bi, đại tu bếp.</li>
        <li>Phí kê khai, phần mềm hoá đơn điện tử, chữ ký số — dòng "kế toán + thuế" ở mục 03 chỉ là tiền thuê dịch vụ kế toán.</li>
        <li>Lương chủ: để 0 nghĩa là chủ đứng quán không lấy lương — nếu phải thuê người thay, cộng vào mục 02.</li>
      </ul>`],
    ['Cách kiểm lại số của riêng mình', `
      <ol>
        <li>Xin báo giá ba nơi cho từng món trên 10 triệu, điền đúng vào bảng.</li>
        <li>Đi hỏi thuê ba mặt bằng cùng khu, lấy giá và tiền cọc thật.</li>
        <li>Rang gia công hoặc bán thử một tháng trước khi mua máy — để biết thật sự bán được bao nhiêu kg.</li>
        <li>Đặt kịch bản xấu ở mục 07 rồi xem quỹ sống sót chịu được mấy tháng. Chịu dưới ba tháng là chưa nên mở.</li>
        <li>Hỏi cơ quan thuế quản lý xem hộ kinh doanh ở nơi mình tính thuế trên toàn bộ doanh thu hay chỉ phần vượt ngưỡng 1 tỷ — chênh nhau vài chục triệu một năm.</li>
      </ol>`]
  ];

  function veGhiChu() {
    const box = document.getElementById('notes');
    NOTES.forEach(([t, h], i) => {
      const d = el('details', 'rv-f');
      if (i === 0) d.open = true;
      d.innerHTML = `<summary><span>${t}</span></summary><div class="dt-body">${h}</div>`;
      box.appendChild(d);
    });
  }

  /* ---------------- hiệu ứng ---------------- */

  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

  const CHON_HIEU_UNG = '.rv,.rv-f,.rv-l,.rv-r,.rv-clip,.hr,.vr,.title-rule,.sec-rule,.kpi,'
    + '.sec-no,.m-word,.m-split,.svg-fig,.be-track,tr.rail,.chart-box,.flag,.ok-check,.share-row';

  function quetHieuUng(root) {
    (root || document).querySelectorAll(CHON_HIEU_UNG).forEach(n => {
      if (n.classList.contains('in')) return;
      if (ITHIEN) n.classList.add('in');   // tắt hiệu ứng: hiện ngay
      else io.observe(n);
    });
  }

  // Lưới an toàn: sau 1,2 giây mà KHÔNG có lấy một phần tử nào hiện ra thì
  // coi như bộ theo dõi cuộn hỏng — hiện hết. Thà mất hiệu ứng còn hơn trang trắng.
  function luoiAnToan() {
    setTimeout(() => {
      if (document.querySelector('.in')) return;
      document.querySelectorAll(CHON_HIEU_UNG).forEach(n => n.classList.add('in'));
    }, 1200);
  }

  function tachChu(node) {
    const txt = node.textContent;
    node.textContent = '';
    [...txt].forEach(c => {
      const s = el('span', 'ch', c === ' ' ? '&nbsp;' : c);
      node.appendChild(s);
    });
    node.classList.add('m-split');
  }

  function chayTicker() {
    const items = [
      'mặt bằng 60 m² · 10 triệu/tháng',
      '5 chỗ ngồi · bán mang đi',
      'máy rang 6 kg · 235 triệu',
      'hệ tự động · 55 triệu',
      'máy tách đá · 35 triệu',
      'số liệu ước tính 11/2026',
      'sửa được mọi con số',
      'lưu pdf một nút'
    ];
    const t = document.getElementById('ticker');
    const html = items.map(s => `<span>${s}</span><span>·</span>`).join('');
    t.innerHTML = html + html;
  }

  function thanhCuon() {
    const bar = document.getElementById('sbar');
    const links = [...document.querySelectorAll('.nav-links a')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href')));
    let raf = 0;
    function up() {
      raf = 0;
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.transform = `scaleX(${p})`;
      const y = h.scrollTop + 120;
      let cur = 0;
      secs.forEach((s, i) => { if (s && s.offsetTop <= y) cur = i; });
      links.forEach((a, i) => a.classList.toggle('on', i === cur));
    }
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(up); }, { passive: true });
    up();
  }

  /* ---------------- thông báo ---------------- */

  let toastT = 0;
  function toast(msg) {
    const n = document.getElementById('toast');
    n.textContent = msg;
    n.classList.remove('hide'); n.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => { n.classList.remove('show'); n.classList.add('hide'); setTimeout(() => n.className = 'toast', 260); }, 2400);
  }

  /* ---------------- gắn sự kiện sửa số ---------------- */

  function setPath(path, val) {
    const parts = path.split('.');
    let o = S;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    const last = parts[parts.length - 1];
    o[isNaN(+last) ? last : +last] = val;
  }

  let tdebounce = 0;
  function onInput(ev) {
    const i = ev.target;
    if (!i.classList.contains('inp')) return;
    const path = i.dataset.path;
    if (!path) return;

    if (i.classList.contains('name')) { setPath(path, i.textContent.trim()); return; }

    const v = parseNum(i.value);
    i.classList.remove('bad');
    if (isNaN(v)) { i.classList.add('bad'); return; }      // giữ nguyên chữ đã gõ, chỉ báo chỗ sai
    setPath(path, v);

    i.classList.remove('touched'); void i.offsetWidth; i.classList.add('touched');
    const tr = i.closest('tr');
    if (tr) {
      tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash');
      const gomVat = gomVatCua(path);
      const cell = tr.querySelector('.cell-money');
      const r = pathRow(path);
      if (cell && r) {
        const x = tienHang(r, gomVat);
        cell.textContent = money(x.tong);
        const vn = cell.parentElement.querySelector('.t-note');
        if (vn) vn.textContent = x.vat ? (gomVat ? 'trong đó VAT ' : '+ VAT ') + money(x.vat) : 'không có hoá đơn VAT';
        cell.classList.remove('bump'); void cell.offsetWidth; cell.classList.add('bump');
      }
      const body = tr.closest('tbody');
      if (body) {
        const c = congBang(pathRows(path), gomVat);
        const o1 = body.querySelector('.c-hang .num'), o2 = body.querySelector('.c-vat .num'),
              o3 = body.querySelector('.t-sum .cell-money');
        if (o1) o1.textContent = money(c.hang);
        if (o2) o2.textContent = money(c.vat);
        if (o3) o3.textContent = money(c.tong);
      }
    }

    clearTimeout(tdebounce);
    tdebounce = setTimeout(veKetQua, 160);
    document.getElementById('saveState').innerHTML = '<span class="badge pop">chưa lưu</span>';
  }

  function pathRows(path) {
    const p = path.split('.');
    return p[0] === 'capex' ? S.capex[+p[1]] : S.opex;
  }
  function pathRow(path) {
    const p = path.split('.');
    return p[0] === 'capex' ? S.capex[+p[1]][+p[2]] : S.opex[+p[1]];
  }

  /* ---------------- dựng trang ---------------- */

  function veNhapLieu(keepScroll) {
    const y = keepScroll ? scrollY : null;

    const cb = document.getElementById('capexBox');
    cb.innerHTML = '';
    DATA.capex.forEach((g, i) => {
      const wrap = el('div');
      wrap.style.marginTop = i ? '33px' : '22px';
      wrap.appendChild(tableFor(S.capex[i], 'capex.' + i, g.ma + ' — ' + g.nhom, veNhapLieu));
      cb.appendChild(wrap);
    });

    const ce = document.getElementById('capexExtra');
    ce.innerHTML = '';
    ce.appendChild(fieldsFor(S.thue, 'thue', ['muaCapexGomVat']));
    ce.appendChild(fieldsFor(S.giaThiet, 'giaThiet', ['duPhong', 'quyThang']));

    const ob = document.getElementById('opexBox');
    ob.innerHTML = '';
    ob.appendChild(tableFor(S.opex, 'opex', null, veNhapLieu));
    const oe = document.getElementById('opexExtra');
    oe.innerHTML = '';
    oe.appendChild(fieldsFor(S.thue, 'thue', ['muaOpexGomVat']));

    const f1 = document.getElementById('fGiaVon');
    f1.innerHTML = ''; f1.appendChild(fieldsFor(S.giaVon, 'giaVon', Object.keys(DATA.giaVon)));
    const f2 = document.getElementById('fGiaVonLy');
    f2.innerHTML = ''; f2.appendChild(fieldsFor(S.giaVonLy, 'giaVonLy', Object.keys(DATA.giaVonLy)));
    const f3 = document.getElementById('fDoanhThu');
    f3.innerHTML = ''; f3.appendChild(fieldsFor(S.doanhThu, 'doanhThu', Object.keys(DATA.doanhThu)));
    const f4 = document.getElementById('fGiaThiet');
    f4.innerHTML = ''; f4.appendChild(fieldsFor(S.giaThiet, 'giaThiet', ['khauHaoNam', 'thangChay1', 'thangChay2', 'thangChay3']));

    quetHieuUng();
    veKetQua();
    if (y != null) scrollTo(0, y);
  }

  /* ---------------- nút lệnh ---------------- */

  function nutLenh() {
    document.getElementById('btnPdf').addEventListener('click', () => {
      document.querySelectorAll('details').forEach(d => d.open = true);
      setTimeout(() => window.print(), 120);
    });

    document.getElementById('btnSave').addEventListener('click', () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
        document.getElementById('saveState').innerHTML =
          '<span class="badge pop">đã lưu vào máy này</span>';
        toast('Đã lưu. Mở lại trang trên máy này là thấy đúng bộ số vừa nhập.');
      } catch (e) { toast('Máy không cho lưu (chế độ riêng tư?). Dùng Xuất tệp JSON.'); }
    });

    document.getElementById('btnLink').addEventListener('click', async () => {
      const url = location.origin + location.pathname + '#d=' + b64enc(S);
      try { await navigator.clipboard.writeText(url); toast('Đã chép link vào bộ nhớ tạm — dán cho ai cũng thấy đúng số này.'); }
      catch (e) { location.hash = 'd=' + b64enc(S); toast('Link đã nằm trên thanh địa chỉ, chép lại để gửi.'); }
    });

    document.getElementById('btnExport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = el('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'chi-phi-mo-xuong-rang.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('Đã tải tệp JSON.');
    });

    const fileIn = document.getElementById('fileIn');
    document.getElementById('btnImport').addEventListener('click', () => fileIn.click());
    fileIn.addEventListener('change', () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const o = JSON.parse(rd.result);
          if (!o || !o.capex || !o.opex) throw 0;
          S = loc(o); veNhapLieu(); toast('Đã nạp bộ số từ tệp.');
        } catch (e) { toast('Tệp không đúng dạng của trang này.'); }
      };
      rd.readAsText(f);
      fileIn.value = '';
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      S = blank();
      try { localStorage.removeItem(KEY); } catch (e) { }
      if (location.hash) history.replaceState(null, '', location.pathname);
      veNhapLieu();
      document.getElementById('saveState').innerHTML = '<span class="dot"></span>&nbsp; đã về số gốc';
      toast('Đã trả mọi con số về bản gốc.');
    });

    document.querySelectorAll('#chipsThue .chip').forEach(c => {
      c.addEventListener('click', () => {
        S.thue.hinhThuc = c.dataset.ht === 'dn' ? 'dn' : 'ho';
        veKetQua();
        quetHieuUng(document.getElementById('thue'));
      });
    });

    document.querySelectorAll('#chips .chip').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('#chips .chip').forEach(x => x.classList.remove('on'));
        c.classList.add('on');
        SC = c.dataset.sc === 'xau' ? .75 : c.dataset.sc === 'tot' ? 1.25 : 1;
        veLaiHieuUng = true;
        veKetQua();
      });
    });
  }

  /* ---------------- chạy ---------------- */

  document.addEventListener('DOMContentLoaded', () => {
    S = load();   // load() đã lọc: thiếu khoá thì lấy số gốc, thừa khoá thì bỏ

    document.getElementById('footDate').textContent = DATA.meta.capNhat;
    chayTicker();
    veGhiChu();
    veNhapLieu();
    nutLenh();
    thanhCuon();
    tachChu(document.querySelector('#tong h2'));
    quetHieuUng();
    document.addEventListener('input', onInput);
    luoiAnToan();
    if (location.hash.includes('d=')) toast('Đang xem bộ số từ link chia sẻ. Bấm "Về số gốc" để bỏ.');
  });
})();
