# 01 — Phân tích yêu cầu: Website bán quần áo thời trang "MỘC Studio"

## 1. Mục tiêu
- Bán quần áo & phụ kiện thời trang trực tuyến cho khách hàng tại Việt Nam.
- Trải nghiệm mua sắm nhanh, rõ ràng trên cả điện thoại và máy tính.
- Quản trị viên quản lý sản phẩm, tồn kho, đơn hàng, khuyến mãi.

## 2. Tác nhân (Actors)
| Tác nhân | Mô tả |
|---|---|
| Khách vãng lai | Xem, tìm kiếm, lọc sản phẩm, thêm vào giỏ hàng |
| Khách hàng (đã đăng ký) | Đặt hàng, quản lý địa chỉ, xem lịch sử đơn, yêu thích, đánh giá |
| Quản trị viên (Admin) | Quản lý danh mục, sản phẩm, biến thể, tồn kho, đơn hàng, mã giảm giá, người dùng |

## 3. Yêu cầu chức năng

### 3.1 Phía khách hàng
| Mã | Chức năng | Ưu tiên |
|---|---|---|
| F01 | Trang chủ: banner, danh mục nổi bật, sản phẩm mới / bán chạy | Cao |
| F02 | Danh sách sản phẩm theo danh mục (Nữ, Nam, Phụ kiện) | Cao |
| F03 | Lọc theo danh mục, kích cỡ, màu sắc, khoảng giá; sắp xếp (mới nhất, giá tăng/giảm) | Cao |
| F04 | Tìm kiếm sản phẩm theo tên | Cao |
| F05 | Chi tiết sản phẩm: ảnh, giá, giá khuyến mãi, chọn màu/size, tồn kho, mô tả, chất liệu, hướng dẫn chọn size | Cao |
| F06 | Giỏ hàng: thêm / sửa số lượng / xoá, tính tạm tính | Cao |
| F07 | Thanh toán: thông tin giao hàng, phương thức (COD, chuyển khoản, ví điện tử), mã giảm giá | Cao |
| F08 | Đăng ký / đăng nhập bằng email + mật khẩu | Cao |
| F09 | Tài khoản: thông tin cá nhân, sổ địa chỉ, lịch sử & trạng thái đơn hàng | Trung bình |
| F10 | Danh sách yêu thích | Trung bình |
| F11 | Đánh giá sản phẩm (1–5 sao) sau khi mua | Thấp |

### 3.2 Phía quản trị
| Mã | Chức năng | Ưu tiên |
|---|---|---|
| A01 | CRUD danh mục (hỗ trợ danh mục cha – con) | Cao |
| A02 | CRUD sản phẩm, ảnh, biến thể (màu × size), SKU, tồn kho | Cao |
| A03 | Quản lý đơn hàng: xem, cập nhật trạng thái (chờ xác nhận → đang giao → hoàn tất / huỷ) | Cao |
| A04 | Quản lý mã giảm giá (phần trăm / số tiền cố định, thời hạn, lượt dùng) | Trung bình |
| A05 | Thống kê doanh thu, sản phẩm bán chạy | Thấp |

## 4. Yêu cầu phi chức năng
- **Hiệu năng:** trang tải < 2.5s (LCP), ảnh tối ưu bằng `next/image`.
- **Responsive:** mobile-first, hiển thị tốt từ 360px trở lên.
- **Bảo mật:** mật khẩu được băm, phiên đăng nhập an toàn (cookie HttpOnly), truy vấn tham số hoá chống SQL injection, kiểm tra giá & số lượng phía server khi đặt hàng.
- **Khả năng truy cập:** HTML ngữ nghĩa, alt cho ảnh, điều hướng bằng bàn phím.
- **SEO:** metadata từng trang, URL thân thiện (`/san-pham/ao-so-mi-linen`).

## 5. Quy trình nghiệp vụ chính (Đặt hàng)
1. Khách chọn sản phẩm → chọn màu, size → thêm vào giỏ.
2. Vào giỏ hàng → điều chỉnh số lượng → "Thanh toán".
3. Nhập thông tin giao hàng, chọn phương thức thanh toán, nhập mã giảm giá (nếu có).
4. Server kiểm tra lại tồn kho, giá, mã giảm giá → tạo đơn `pending`, trừ tồn kho.
5. Admin xác nhận → `confirmed` → `shipping` → `completed` (hoặc `cancelled`, hoàn tồn kho).

## 6. Sơ đồ trang (Sitemap)
```
/                     Trang chủ
/san-pham             Danh sách sản phẩm (lọc, sắp xếp, tìm kiếm ?q=)
/san-pham/[slug]      Chi tiết sản phẩm
/gio-hang             Giỏ hàng
/thanh-toan           Thanh toán
/dang-nhap            Đăng nhập / Đăng ký
/tai-khoan            Tài khoản (giai đoạn 2)
/admin/*              Quản trị (giai đoạn 3)
```

## 7. Lộ trình
- **Giai đoạn 1 (hiện tại):** Phân tích yêu cầu, thiết kế CSDL, thiết kế UI/UX & dựng giao diện với dữ liệu mẫu.
- **Giai đoạn 2:** Kết nối CSDL Neon Postgres, đăng nhập (Better Auth), giỏ hàng & đặt hàng thật.
- **Giai đoạn 3:** Trang quản trị, thanh toán online, thống kê.
