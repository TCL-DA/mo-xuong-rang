# Chi phí mở xưởng rang + quán cóc take away

**Xem trang: https://tcl-da.github.io/mo-xuong-rang/**

Bảng tính một trang cho người đang định mở **xưởng rang cà phê máy 6 kg** kèm **quán cóc bán mang đi
5 chỗ ngồi**, mặt bằng 60 m². Trang tự tính vốn đầu tư, chi phí hàng tháng, giá vốn 1 kg cà phê rang
và 1 ly, điểm hoà vốn, thời gian hoàn vốn, và dòng tiền 24 tháng.

Mọi con số trên trang **sửa được trực tiếp** — bấm vào ô là gõ số của mình. Không có máy chủ,
không thu thập gì; số sửa xong nằm trên máy người xem.

| Nút | Làm gì |
|---|---|
| **Lưu PDF** | mở hộp in của trình duyệt, chọn "Lưu dưới dạng PDF" — bản in trắng đen, khổ A4 |
| **Lưu vào máy** | giữ bộ số vừa nhập trong trình duyệt (localStorage) |
| **Tạo link chia sẻ** | chép một đường dẫn có nhúng nguyên bộ số, gửi ai cũng thấy đúng số đó |
| **Xuất / Nhập tệp JSON** | mang bộ số sang máy khác, hoặc lưu nhiều phương án |
| **Về số gốc** | trả lại toàn bộ số mặc định |

Ô nhập nhận mọi cách gõ quen tay: `235tr`, `235.000.000`, `235 000 000`, `1,5 tỷ`, `95k`.

## Số mặc định

Ước tính thị trường Việt Nam tháng 11/2026, **không phải báo giá**. Ba món thiết bị chính
(máy rang 6 kg, hệ tự động, máy tách đá) lấy theo mức người dùng đưa vào; phần còn lại là mức
thường gặp. Giá thật phải lấy từ nhà cung cấp.

Mục *"Ghi chú & cảnh báo"* cuối trang liệt kê những khoản hay làm vỡ dự toán (sửa mặt bằng, ống khói
và PCCC, điện ba pha, hao hụt rang, đọng vốn cà phê xanh) và những gì bảng **chưa** tính
(lãi vay, tăng giá thuê, đại tu máy, thuế khi lên công ty).

## Cấu trúc

```
index.html          trang duy nhất
assets/data.js      bộ số gốc — sửa file này là đổi số mặc định của cả web
assets/app.js       tính toán, vẽ bảng, lưu/chia sẻ, hiệu ứng cuộn
assets/chart.js     biểu đồ dòng tiền 24 tháng (SVG viết thẳng, không thư viện)
assets/base.css     bố cục + kiểu chữ
assets/motion.css   62 hiệu ứng
assets/print.css    bản in / PDF, trắng đen A4
kiem.py             bộ kiểm tự động (Playwright)
```

Không dùng thư viện ngoài, trừ font Inter của Google Fonts.

## Bộ kiểm

```bash
python kiem.py
```

Tự dựng máy chủ tạm, mở trang bằng Chromium rồi kiểm: lỗi console, sửa một ô thì các số tổng có đổi
không, kịch bản xấu/tốt có ăn không, điện thoại 390 px có bị cuộn ngang hay chữ sát mép không,
số hiệu ứng đã gắn (phải ≥ 50), và xuất `_kiem/ban-in.pdf` + ảnh chụp để soi bằng mắt.

## Kiểu trình bày

teenage engineering: nền `#f6f8f7`, chữ đen, dải tối `#0f0e12`, nét kẻ hairline, **0 bo góc,
0 đổ bóng, 0 gradient**, màu duy nhất là hổ phách `#f0a800` dành cho cảnh báo.
Khác bản gốc một chỗ có chủ ý: nét chữ 500–700 thay vì 100, cỡ chữ nền 17 px — để đọc được thoải mái.
