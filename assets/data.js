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

  /* ---------- 1. VỐN ĐẦU TƯ (một lần) ---------- */
  capex: [
    {
      nhom: 'Thiết bị rang',
      ma: 'A',
      rows: [
        ['Máy rang 6 kg (gồm bộ làm nguội)', 1, 'bộ', 235000000, 'Giá đang dùng để tính'],
        ['Hệ tự động (nạp liệu, điều khiển mẻ)', 1, 'bộ', 55000000, 'Giá đang dùng để tính'],
        ['Máy tách đá (destoner)', 1, 'bộ', 35000000, 'Giá đang dùng để tính'],
        ['Ống khói inox + cút + giá đỡ (~8 m)', 1, 'hệ', 12000000, 'Phải có, nhà thuê hay bị bỏ quên'],
        ['Tủ điện + cấp nguồn 3 pha, dây, CB, công lắp', 1, 'hệ', 18000000, 'Máy 6 kg + hệ tự động nên đi 3 pha'],
        ['Bình gas LPG 45 kg + van, đồng hồ, ống mềm', 2, 'bình', 3000000, 'Đổi vỏ 1 lần, sau chỉ mua gas'],
        ['Cân điện tử 30 kg + cân sàn 150 kg', 1, 'bộ', 3500000, ''],
        ['Dụng cụ rang (xẻng, sàng, xô, hút bụi vỏ lụa)', 1, 'bộ', 4500000, ''],
        ['Máy xay công nghiệp (xay theo đơn)', 1, 'cái', 18000000, ''],
        ['Máy hàn miệng túi + bàn đóng gói', 1, 'bộ', 8000000, ''],
        ['Thùng ủ kín 20 kg (degas, trữ hàng)', 6, 'thùng', 900000, 'Rang xong phải ủ 3–7 ngày']
      ]
    },
    {
      nhom: 'Quán cóc take away (5 chỗ ngồi)',
      ma: 'B',
      rows: [
        ['Máy pha espresso 2 group', 1, 'cái', 70000000, 'Mua mới hãng phổ thông; máy cũ ~35–45 tr'],
        ['Máy xay espresso (xay theo ly)', 1, 'cái', 15000000, ''],
        ['Quầy bar inox + mặt đá + chậu rửa 2 hố', 1, 'bộ', 25000000, ''],
        ['Tủ mát 2 cánh + tủ đông nhỏ', 1, 'bộ', 16000000, ''],
        ['Máy làm đá viên 50 kg/ngày', 1, 'cái', 12000000, 'Mua đá ngoài thì để 0'],
        ['Lọc nước RO cho máy pha', 1, 'bộ', 8000000, 'Bỏ qua là hỏng máy pha'],
        ['Dụng cụ bar + ly + bình ủ + đồ pha thủ công', 1, 'bộ', 8000000, ''],
        ['Bàn ghế 5 chỗ ngồi + 2 bàn cao đứng', 1, 'bộ', 7000000, ''],
        ['POS + máy in bill + ngăn kéo tiền (phần mềm năm đầu)', 1, 'bộ', 7000000, ''],
        ['Biển hiệu + bảng menu + đèn + decal', 1, 'hệ', 18000000, ''],
        ['Sửa mặt bằng: sơn, sàn, trần, điện nước, thoát nước, hút mùi', 1, 'gói', 45000000, 'Khoản dễ vỡ dự toán nhất'],
        ['Quạt công nghiệp / thông gió khu bar', 2, 'cái', 2000000, ''],
        ['Wifi + loa + camera', 1, 'hệ', 6000000, ''],
        ['Bình chữa cháy + nội quy, biển PCCC', 1, 'bộ', 2500000, 'Rang gas, cơ quan kiểm tra sẽ hỏi']
      ]
    },
    {
      nhom: 'Thủ tục & hàng hoá lô đầu',
      ma: 'C',
      rows: [
        ['Cọc thuê mặt bằng', 2, 'tháng', 10000000, 'Chủ nhà thường lấy 2–3 tháng'],
        ['Tiền thuê trả trước tháng đầu', 1, 'tháng', 10000000, ''],
        ['Giấy phép: ĐKKD, an toàn thực phẩm, PCCC, biển hiệu', 1, 'gói', 8000000, ''],
        ['Cà phê xanh lô đầu', 300, 'kg', 95000, 'Trộn robusta + arabica'],
        ['Bao bì + tem nhãn + thùng carton lô đầu', 1, 'gói', 12000000, ''],
        ['Nguyên liệu quán lô đầu (sữa, đường, syrup, trà, ly, ống hút)', 1, 'gói', 10000000, ''],
        ['Khai trương + marketing ban đầu (ảnh, poster, voucher, ads)', 1, 'gói', 15000000, ''],
        ['Học rang + học pha chế', 1, 'gói', 10000000, 'Đã biết nghề thì để 0']
      ]
    }
  ],

  /* ---------- 2. CHI PHÍ CỐ ĐỊNH HÀNG THÁNG ---------- */
  opex: [
    ['Thuê mặt bằng 60 m²', 1, 'tháng', 10000000, 'Giá đang dùng để tính'],
    ['Lương bán hàng toàn thời gian', 1, 'người', 7500000, ''],
    ['Lương bán hàng bán thời gian (4 h/ngày)', 1, 'người', 4500000, ''],
    ['BHXH + phụ cấp + cơm trưa', 1, 'gói', 2000000, ''],
    ['Điện quán (tủ mát, máy pha, đèn, quạt)', 1, 'tháng', 3500000, 'Điện rang tính riêng theo kg'],
    ['Nước', 1, 'tháng', 600000, ''],
    ['Internet + POS + điện thoại', 1, 'tháng', 700000, ''],
    ['Rác + vệ sinh', 1, 'tháng', 300000, ''],
    ['Marketing thường xuyên (ads, quà, mẫu thử)', 1, 'tháng', 3000000, ''],
    ['Bảo trì máy + vật tư thay thế', 1, 'tháng', 1500000, 'Gasket, lưới, dầu mỡ, hiệu chuẩn'],
    ['Kế toán + thuế khoán', 1, 'tháng', 1500000, ''],
    ['Lương chủ tự trả cho mình', 1, 'tháng', 0, 'Để 0 nếu chủ tự đứng quán']
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

  /* ---------- 6. GIẢ THIẾT TÍNH TOÁN ---------- */
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

  duPhong: ['Dự phòng vốn đầu tư', '%'],
  quyThang: ['Quỹ sống sót', 'tháng'],
  khauHaoNam: ['Khấu hao thiết bị', 'năm'],
  thangChay1: ['Công suất tháng 1–3', '%'],
  thangChay2: ['Công suất tháng 4–6', '%'],
  thangChay3: ['Công suất từ tháng 7', '%']
};
