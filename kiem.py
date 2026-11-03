# -*- coding: utf-8 -*-
"""Bộ kiểm trang: lỗi console, sát mép ở 390 px, số liệu tính ra, đếm hiệu ứng, ảnh chụp."""
import functools, http.server, json, pathlib, re, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent

# phải chạy qua http: mở bằng file:// thì trình duyệt coi CSS là khác nguồn,
# không đọc được cssRules nên không đếm được hiệu ứng
class Im(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Im, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
OUT = ROOT / '_kiem'
OUT.mkdir(exist_ok=True)

def main():
    loi = []
    with sync_playwright() as p:
        br = p.chromium.launch()

        # ---------- máy tính ----------
        pg = br.new_page(viewport={'width': 1440, 'height': 1000})
        msgs = []
        pg.on('console', lambda m: msgs.append((m.type, m.text)))
        pg.on('pageerror', lambda e: msgs.append(('pageerror', str(e))))
        pg.goto(URL)
        pg.wait_for_timeout(1500)
        pg.mouse.wheel(0, 20000); pg.wait_for_timeout(1200)
        pg.mouse.wheel(0, -20000); pg.wait_for_timeout(600)

        for t, txt in msgs:
            if t in ('error', 'pageerror'):
                loi.append(f'CONSOLE {t}: {txt}')

        so = pg.evaluate("""() => {
          const g = id => (document.getElementById(id)||{}).textContent;
          return {
            von: g('kVon'), thang: g('kThang'), lai: g('kLai'), hoanvon: g('kHoanVon'),
            capex: g('capexTotal'), be: (document.getElementById('beText')||{}).textContent,
            rows: document.querySelectorAll('.tbl tbody tr').length,
            inputs: document.querySelectorAll('input.inp').length,
            svg: document.querySelectorAll('#chart svg').length,
            share: document.querySelectorAll('.share-row').length,
            notes: document.querySelectorAll('#ghichu details').length,
            skeleton: document.querySelectorAll('.skeleton').length
          };
        }""")

        # hiệu ứng ĐANG CHẠY thật: gom tên animation của mọi phần tử sau khi cuộn + rê chuột
        chay = set(pg.evaluate("document.getAnimations().map(a=>a.animationName||'')"))
        for sel in ['.kpi', '#chips .chip', '#btnPdf', '#btnSave', '#ghichu summary',
                    '.share-row', '.nav-links a', '#chartBox', '.tbl .btn.mini']:
            try:
                pg.hover(sel, timeout=1500)
                pg.wait_for_timeout(250)
                chay |= set(pg.evaluate("document.getAnimations().map(a=>a.animationName||'')"))
            except Exception:
                pass
        pg.click('#btnSave'); pg.wait_for_timeout(300)
        chay |= set(pg.evaluate("document.getAnimations().map(a=>a.animationName||'')"))
        chay = sorted(x for x in chay if x)

        pg.screenshot(path=str(OUT / 'may-tinh-dau.png'))
        pg.locator('#ketqua').scroll_into_view_if_needed(); pg.wait_for_timeout(900)
        pg.screenshot(path=str(OUT / 'may-tinh-ketqua.png'))
        pg.locator('#von').scroll_into_view_if_needed(); pg.wait_for_timeout(600)
        pg.screenshot(path=str(OUT / 'may-tinh-von.png'))

        # sửa một ô → số phải đổi
        truoc = pg.evaluate("document.getElementById('kVon').textContent")
        box = pg.locator('#capexBox input.w-price').first
        box.fill('300tr'); box.dispatch_event('input'); pg.wait_for_timeout(500)
        sau = pg.evaluate("document.getElementById('kVon').textContent")
        if truoc == sau:
            loi.append(f'Sửa đơn giá 235tr→300tr mà ô "Vốn phải có" không đổi ({truoc})')
        pg.reload(); pg.wait_for_timeout(1200)

        # kịch bản xấu phải làm lãi giảm
        l1 = pg.evaluate("document.getElementById('kLai').textContent")
        pg.click('#chips .chip[data-sc="xau"]'); pg.wait_for_timeout(500)
        l2 = pg.evaluate("document.getElementById('kLai').textContent")
        if l1 == l2:
            loi.append('Bấm kịch bản xấu nhưng ô "Lãi mỗi tháng" không đổi')

        # ---------- điện thoại ----------
        mb = br.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        mb.goto(URL); mb.wait_for_timeout(1400)
        mb.mouse.wheel(0, 30000); mb.wait_for_timeout(1200)
        tran = mb.evaluate("""() => {
          const h = document.documentElement;
          const bad = [];
          document.querySelectorAll('section, .wrap, .tbl, .kpis, .chart-box, .fields').forEach(n => {
            const r = n.getBoundingClientRect();
            if (r.width > 392) bad.push(n.className + ' w=' + Math.round(r.width));
          });
          return { cuonNgang: h.scrollWidth - h.clientWidth, rong: bad.slice(0, 6) };
        }""")
        if tran['cuonNgang'] > 2:
            loi.append(f"Điện thoại bị cuộn ngang {tran['cuonNgang']} px: {tran['rong']}")

        # chữ dính mép trái (bẫy padding)
        mep = mb.evaluate("""() => {
          const out = [];
          document.querySelectorAll('h1,h2,p,.k-lbl,.mono-lbl,summary').forEach(n => {
            const r = n.getBoundingClientRect();
            if (r.width > 10 && r.left < 10) out.push(n.tagName + '.' + n.className + ' left=' + Math.round(r.left));
          });
          return out.slice(0, 8);
        }""")
        if mep:
            loi.append('Chữ sát mép trái (<10 px) trên điện thoại: ' + '; '.join(mep))

        mb.screenshot(path=str(OUT / 'dien-thoai-dau.png'))
        mb.locator('#tong').scroll_into_view_if_needed(); mb.wait_for_timeout(700)
        mb.screenshot(path=str(OUT / 'dien-thoai-tong.png'))
        mb.locator('#von').scroll_into_view_if_needed(); mb.wait_for_timeout(700)
        mb.screenshot(path=str(OUT / 'dien-thoai-von.png'))
        mb.locator('#ketqua').scroll_into_view_if_needed(); mb.wait_for_timeout(900)
        mb.screenshot(path=str(OUT / 'dien-thoai-ketqua.png'))

        # ---------- máy tắt hiệu ứng (Windows tắt hoạt ảnh) ----------
        # Bẫy đã dính 03/11: animation bị tắt mà nội dung lại chờ animation
        # mới hiện -> cả trang trắng bóc. Lượt này phải thấy chữ.
        rm = br.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        rm.goto(URL); rm.wait_for_timeout(1800)
        an = rm.evaluate("""() => {
          const bad = [];
          document.querySelectorAll('h1,h2,.kpi .k-val,#capexBox .rv-f,.tbl tbody tr,.hero-sub')
            .forEach(n => { const c = getComputedStyle(n);
              if (+c.opacity < .9 || /matrix\(1, 0, 0, 1, 0, [1-9]/.test(c.transform))
                bad.push((n.tagName + '.' + n.className).slice(0, 40) + ' op=' + c.opacity); });
          return { an: bad.slice(0, 6),
                   chu: document.body.innerText.replace(/\s+/g, ' ').length };
        }""")
        if an['an']:
            loi.append('Máy tắt hiệu ứng: còn phần tử bị ẩn — ' + '; '.join(an['an']))
        if an['chu'] < 3000:
            loi.append(f"Máy tắt hiệu ứng: trang chỉ còn {an['chu']} ký tự, nghi trắng trang")
        rm.screenshot(path=str(OUT / 'tat-hieu-ung.png'))
        rm.close()

        # ---------- bản in ----------
        pr = br.new_page()
        pr.goto(URL); pr.wait_for_timeout(1200)
        pr.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        pr.pdf(path=str(OUT / 'ban-in.pdf'), format='A4', print_background=False)
        pr.emulate_media(media='print'); pr.wait_for_timeout(300)
        pr.screenshot(path=str(OUT / 'ban-in-dau.png'))

        br.close()

    if so['skeleton']:
        loi.append(f"Còn {so['skeleton']} ô số chưa tính xong (class skeleton)")
    # đếm theo mã nguồn: tên @keyframes nào được dùng ở ít nhất một quy tắc khác
    css = ''.join((ROOT / 'assets' / f).read_text(encoding='utf-8')
                  for f in ('base.css', 'motion.css', 'print.css'))
    ten = re.findall(r'@keyframes\s+([\w-]+)', css)
    chuaGan = [t for t in ten if len(re.findall(r'(?<![\w-])' + re.escape(t) + r'(?![\w-])', css)) < 2]
    daGan = [t for t in ten if t not in chuaGan]
    if len(daGan) < 50:
        loi.append(f'Chỉ có {len(daGan)} hiệu ứng được gắn, yêu cầu >= 50. Chưa gắn: {chuaGan}')

    print(json.dumps({'so_lieu': so, 'hieu_ung': {
        'khai_bao': len(ten), 'da_gan': len(daGan), 'chua_gan': chuaGan,
        'chay_that_khi_kiem': len(chay), 'ten_chay': chay}, 'loi': loi}, ensure_ascii=False, indent=1))
    print('ĐẠT' if not loi else f'KHÔNG ĐẠT — {len(loi)} lỗi')
    return 1 if loi else 0

sys.exit(main())
