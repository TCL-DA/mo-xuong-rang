/* ============================================================
   DỮ LIỆU GỐC — chi phí mở xưởng rang + quán cóc take away
   Mọi số ở đây là ƯỚC TÍNH thị trường VN tháng 11/2026.
   Ai xem web cũng sửa được trực tiếp trên trang; sửa xong lưu
   vào máy của chính người đó (localStorage) — bản gốc này
   không đổi, luôn bấm "Về số gốc" là trở lại.
   ============================================================ */

const DATA = {
  meta: {
    ten: 'Xưởng rang 6 kg + quán cóc take away',
    dienTich: 60,
    choNgoi: 5,
    capNhat: '03/11/2026'
  },

  /* Mỗi hàng: [tên, số lượng, đơn vị, đơn giá, ghi chú, VAT %]
     VAT 8% = mức đang giảm tới hết 31/12/2026. Để 0 cho khoản không có hoá đơn GTGT
     (thuê nhà của cá nhân, lương, lệ phí nhà nước, cà phê xanh mua của nông dân).
     Viễn thông KHÔNG thuộc diện giảm nên để 10%. Nước sạch 5%. */

  /* ---------- 1. VỐN ĐẦU TƯ (một lần) ---------- */
  capex: [
    {
      nhom: 'Thiết bị rang',
      ma: 'A',
      rows: [
        ['Máy rang 6 kg (gồm bộ làm nguội)', 1, 'bộ', 235000000, 'Giá đang dùng để tính', 8],
        ['Hệ tự động (nạp liệu, điều khiển mẻ)', 1, 'bộ', 55000000, 'Giá đang dùng để tính', 8],
        ['Máy tách đá (destoner)', 1, 'bộ', 35000000, 'Giá đang dùng để tính', 8],
        ['Ống khói inox + cút + giá đỡ (~8 m)', 1, 'hệ', 12000000, 'Phải có, nhà thuê hay bị bỏ quên', 8],
        ['Tủ điện + cấp nguồn 3 pha, dây, CB, công lắp', 1, 'hệ', 18000000, 'Máy 6 kg + hệ tự động nên đi 3 pha', 8],
        ['Bình gas LPG 45 kg + van, đồng hồ, ống mềm', 2, 'bình', 3000000, 'Đổi vỏ 1 lần, sau chỉ mua gas', 8],
        ['Cân điện tử 30 kg + cân sàn 150 kg', 1, 'bộ', 3500000, '', 8],
        ['Dụng cụ rang (xẻng, sàng, xô, hút bụi vỏ lụa)', 1, 'bộ', 4500000, '', 8],
        ['Máy xay công nghiệp (xay theo đơn)', 1, 'cái', 18000000, '', 8],
        ['Máy hàn miệng túi + bàn đóng gói', 1, 'bộ', 8000000, '', 8],
        ['Thùng ủ kín 20 kg (degas, trữ hàng)', 6, 'thùng', 900000, 'Rang xong phải ủ 3–7 ngày', 8]
      ]
    },
    {
      nhom: 'Quán cóc take away (5 chỗ ngồi)',
      ma: 'B',
      rows: [
        ['Máy pha espresso 2 group', 1, 'cái', 70000000, 'Mua mới hãng phổ thông; máy cũ ~35–45 tr', 8],
        ['Máy xay espresso (xay theo ly)', 1, 'cái', 15000000, '', 8],
        ['Quầy bar inox + mặt đá + chậu rửa 2 hố', 1, 'bộ', 25000000, '', 8],
        ['Tủ mát 2 cánh + tủ đông nhỏ', 1, 'bộ', 16000000, '', 8],
        ['Máy làm đá viên 50 kg/ngày', 1, 'cái', 12000000, 'Mua đá ngoài thì để 0', 8],
        ['Lọc nước RO cho máy pha', 1, 'bộ', 8000000, 'Bỏ qua là hỏng máy pha', 8],
        ['Dụng cụ bar + ly + bình ủ + đồ pha thủ công', 1, 'bộ', 8000000, '', 8],
        ['Bàn ghế 5 chỗ ngồi + 2 bàn cao đứng', 1, 'bộ', 7000000, '', 8],
        ['POS + máy in bill + ngăn kéo tiền (phần mềm năm đầu)', 1, 'bộ', 7000000, '', 8],
        ['Biển hiệu + bảng menu + đèn + decal', 1, 'hệ', 18000000, '', 8],
        ['Sửa mặt bằng: sơn, sàn, trần, điện nước, thoát nước, hút mùi', 1, 'gói', 45000000, 'Khoản dễ vỡ dự toán nhất', 8],
        ['Quạt công nghiệp / thông gió khu bar', 2, 'cái', 2000000, '', 8],
        ['Wifi + loa + camera', 1, 'hệ', 6000000, '', 8],
        ['Bình chữa cháy + nội quy, biển PCCC', 1, 'bộ', 2500000, 'Rang gas, cơ quan kiểm tra sẽ hỏi', 8]
      ]
    },
    {
      nhom: 'Thủ tục & hàng hoá lô đầu',
      ma: 'C',
      rows: [
        ['Cọc thuê mặt bằng', 2, 'tháng', 10000000, 'Chủ nhà thường lấy 2–3 tháng', 0],
        ['Tiền thuê trả trước tháng đầu', 1, 'tháng', 10000000, '', 0],
        ['Giấy phép: ĐKKD, an toàn thực phẩm, PCCC, biển hiệu', 1, 'gói', 8000000, '', 0],
        ['Cà phê xanh lô đầu', 300, 'kg', 95000, 'Trộn robusta + arabica', 0],
        ['Bao bì + tem nhãn + thùng carton lô đầu', 1, 'gói', 12000000, '', 8],
        ['Nguyên liệu quán lô đầu (sữa, đường, syrup, trà, ly, ống hút)', 1, 'gói', 10000000, '', 8],
        ['Khai trương + marketing ban đầu (ảnh, poster, voucher, ads)', 1, 'gói', 15000000, '', 8],
        ['Học rang + học pha chế', 1, 'gói', 10000000, 'Đã biết nghề thì để 0', 8]
      ]
    }
  ],

  /* ---------- 2. CHI PHÍ CỐ ĐỊNH HÀNG THÁNG ---------- */
  opex: [
    ['Thuê mặt bằng 60 m²', 1, 'tháng', 10000000, 'Giá đang dùng để tính', 0],
    ['Lương bán hàng toàn thời gian', 1, 'người', 7500000, '', 0],
    ['Lương bán hàng bán thời gian (4 h/ngày)', 1, 'người', 4500000, '', 0],
    ['BHXH + phụ cấp + cơm trưa', 1, 'gói', 2000000, '', 0],
    ['Điện quán (tủ mát, máy pha, đèn, quạt)', 1, 'tháng', 3500000, 'Điện rang tính riêng theo kg', 8],
    ['Nước', 1, 'tháng', 600000, '', 5],
    ['Internet + POS + điện thoại', 1, 'tháng', 700000, '', 10],
    ['Rác + vệ sinh', 1, 'tháng', 300000, '', 0],
    ['Marketing thường xuyên (ads, quà, mẫu thử)', 1, 'tháng', 3000000, '', 8],
    ['Bảo trì máy + vật tư thay thế', 1, 'tháng', 1500000, 'Gasket, lưới, dầu mỡ, hiệu chuẩn', 8],
    ['Kế toán + thuế khoán', 1, 'tháng', 1500000, '', 8],
    ['Lương chủ tự trả cho mình', 1, 'tháng', 0, 'Để 0 nếu chủ tự đứng quán', 0]
  ],

  /* ---------- 3. GIÁ VỐN 1 KG CÀ PHÊ RANG ---------- */
  giaVon: {
    giaXanh: 95000,          // đồng/kg cà phê xanh
    haoHut: 16,              // % khối lượng mất khi rang
    gasGia: 32000,           // đồng/kg LPG
    gasTieuThu: 0.11,        // kg LPG cho 1 kg cà phê rang
    dienRang: 0.25,          // kWh cho 1 kg rang (motor, quạt, hệ tự động)
    dienGia: 3200,           // đồng/kWh (giá kinh doanh)
    baoBi: 7000,             // đồng/kg (túi 500 g có van ×2)
    temNhan: 2000,           // đồng/kg
    congRang: 2800,          // đồng/kg (công người đứng máy)
    hongBo: 1.5              // % mẻ lỗi phải bỏ
  },

  /* ---------- 4. GIÁ VỐN 1 LY TAKE AWAY ---------- */
  giaVonLy: {
    caPheGam: 16,            // g cà phê rang cho 1 ly
    suaDuongSyrup: 3500,     // đồng/ly
    lyNapOngHut: 1800,       // đồng/ly
    daNuoc: 300              // đồng/ly
  },

  /* ---------- 5. DOANH THU ---------- */
  doanhThu: {
    siKg: 150,               // kg/tháng bán sỉ cho quán, đại lý
    siGia: 190000,           // đồng/kg
    leKg: 60,                // kg/tháng bán lẻ + online
    leGia: 290000,           // đồng/kg
    lyNgay: 55,              // ly/ngày
    ngayMo: 30,              // ngày mở/tháng
    lyGia: 25000,            // đồng/ly
    giaCongKg: 100,          // kg/tháng rang gia công cho khách
    giaCongGia: 25000        // đồng/kg tiền công rang
  },

  /* ---------- 6. THUẾ ----------
     Tra ngày 03/11/2026. Hộ kinh doanh: bỏ thuế khoán từ 01/01/2026, tự kê khai;
     ngưỡng doanh thu không phải nộp GTGT và TNCN là 1 tỷ đồng/năm
     (Nghị định 141/2026/NĐ-CP sửa Nghị định 68/2026/NĐ-CP, trước đó 500 triệu).
     Tỷ lệ % trên doanh thu theo nhóm ngành (mức quen dùng từ Thông tư 40/2021):
       · phân phối, cung cấp hàng hoá: GTGT 1% + TNCN 0,5% = 1,5%
       · dịch vụ ăn uống:              GTGT 3% + TNCN 1,5% = 4,5%
       · dịch vụ không bao thầu NVL:   GTGT 5% + TNCN 2%   = 7%
     Doanh nghiệp: GTGT 10% đang được giảm còn 8% đến hết 31/12/2026
     (Nghị quyết 204/2025/QH15), thuế TNDN 20%.
     Số nào cũng sửa được — hỏi lại cán bộ thuế quản lý trước khi tin tuyệt đối. */
  thue: {
    hinhThuc: 'ho',            // 'ho' = hộ kinh doanh · 'dn' = doanh nghiệp
    nguongMien: 1000000000,    // đồng/năm, dưới mức này hộ KD không nộp GTGT + TNCN
    truNguong: 1,              // 1 = trừ ngưỡng rồi mới tính · 0 = tính trên toàn bộ doanh thu
    hoHangHoa: 1.5,            // % doanh thu — bán cà phê rang
    hoAnUong: 4.5,             // % doanh thu — đồ uống bán tại quầy
    hoDichVu: 7,               // % doanh thu — rang gia công
    dnVatRa: 8,                // % VAT đầu ra
    dnVatVao: 8,               // % VAT đầu vào bình quân
    dnTndn: 20,                // % thuế thu nhập doanh nghiệp
    giaDaGomVat: 1,            // 1 = GIÁ BÁN đang nhập là giá khách trả (đã gồm VAT)
    muaCapexGomVat: 0,         // 0 = đơn giá ở bảng VỐN là giá chưa VAT (báo giá thiết bị thường vậy)
    muaOpexGomVat: 1,          // 1 = chi phí hàng tháng đang nhập là số tiền thực trả (đã gồm VAT)
    nlCoHoaDon: 40             // % nguyên liệu/bao bì trong giá vốn CÓ hoá đơn GTGT
  },

  /* ---------- 7. GIẢ THIẾT TÍNH TOÁN ---------- */
  giaThiet: {
    duPhong: 10,             // % dự phòng trên vốn đầu tư
    quyThang: 3,             // số tháng chi phí cố định giữ làm quỹ sống sót
    khauHaoNam: 5,           // năm khấu hao thiết bị
    thangChay1: 40,          // % công suất doanh thu tháng 1–3
    thangChay2: 70,          // % công suất tháng 4–6
    thangChay3: 100          // % công suất từ tháng 7
  }
};

/* Nhãn hiển thị cho các ô nhập rời (không nằm trong bảng) */
const NHAN = {
  giaXanh: ['Giá cà phê xanh', 'đồng/kg'],
  haoHut: ['Hao hụt khi rang', '%'],
  gasGia: ['Giá gas LPG', 'đồng/kg'],
  gasTieuThu: ['Gas cho 1 kg rang', 'kg LPG'],
  dienRang: ['Điện cho 1 kg rang', 'kWh'],
  dienGia: ['Giá điện kinh doanh', 'đồng/kWh'],
  baoBi: ['Bao bì', 'đồng/kg'],
  temNhan: ['Tem nhãn', 'đồng/kg'],
  congRang: ['Công đứng máy', 'đồng/kg'],
  hongBo: ['Mẻ lỗi phải bỏ', '%'],

  caPheGam: ['Cà phê cho 1 ly', 'gam'],
  suaDuongSyrup: ['Sữa, đường, syrup', 'đồng/ly'],
  lyNapOngHut: ['Ly, nắp, ống hút', 'đồng/ly'],
  daNuoc: ['Đá, nước', 'đồng/ly'],

  siKg: ['Bán sỉ cho quán', 'kg/tháng'],
  siGia: ['Giá sỉ', 'đồng/kg'],
  leKg: ['Bán lẻ + online', 'kg/tháng'],
  leGia: ['Giá lẻ', 'đồng/kg'],
  lyNgay: ['Khách mua mang đi', 'ly/ngày'],
  ngayMo: ['Số ngày mở', 'ngày/tháng'],
  lyGia: ['Giá 1 ly', 'đồng/ly'],
  giaCongKg: ['Rang gia công', 'kg/tháng'],
  giaCongGia: ['Tiền công rang', 'đồng/kg'],

  nguongMien: ['Ngưỡng miễn thuế', 'đồng/năm'],
  truNguong: ['Trừ ngưỡng rồi mới tính', '1 = có, 0 = không'],
  hoHangHoa: ['Bán cà phê rang', '% doanh thu'],
  hoAnUong: ['Đồ uống tại quầy', '% doanh thu'],
  hoDichVu: ['Rang gia công', '% doanh thu'],
  dnVatRa: ['VAT đầu ra', '%'],
  dnVatVao: ['VAT đầu vào bình quân', '%'],
  dnTndn: ['Thuế TNDN', '% trên lãi'],
  giaDaGomVat: ['Giá bán đã gồm VAT', '1 = rồi, 0 = chưa'],
  muaCapexGomVat: ['Đơn giá bảng vốn đã gồm VAT', '1 = rồi, 0 = chưa'],
  muaOpexGomVat: ['Chi phí tháng đã gồm VAT', '1 = rồi, 0 = chưa'],
  nlCoHoaDon: ['Nguyên liệu có hoá đơn GTGT', '%'],

  duPhong: ['Dự phòng vốn đầu tư', '%'],
  quyThang: ['Quỹ sống sót', 'tháng'],
  khauHaoNam: ['Khấu hao thiết bị', 'năm'],
  thangChay1: ['Công suất tháng 1–3', '%'],
  thangChay2: ['Công suất tháng 4–6', '%'],
  thangChay3: ['Công suất từ tháng 7', '%']
};
