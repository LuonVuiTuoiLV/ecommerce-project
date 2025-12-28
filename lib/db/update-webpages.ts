import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { connectToDatabase } from './index'
import WebPage from './models/web-page.model'

const webPagesVi = [
  {
    slug: 'about-us',
    title: 'Về chúng tôi',
    content: `Chào mừng bạn đến với ShopVN, điểm đến tin cậy của bạn cho các sản phẩm chất lượng và dịch vụ xuất sắc.

Hành trình của chúng tôi bắt đầu với sứ mệnh mang đến cho bạn trải nghiệm mua sắm tốt nhất bằng cách cung cấp đa dạng các sản phẩm với giá cả cạnh tranh, tất cả trong một nền tảng tiện lợi.

Tại ShopVN, chúng tôi ưu tiên sự hài lòng của khách hàng và đổi mới. Đội ngũ của chúng tôi làm việc không ngừng để tuyển chọn các sản phẩm đa dạng, từ nhu yếu phẩm hàng ngày đến các ưu đãi độc quyền, đảm bảo có thứ gì đó cho tất cả mọi người.

Chúng tôi cũng nỗ lực để làm cho trải nghiệm mua sắm của bạn trở nên liền mạch với giao hàng nhanh, thanh toán an toàn và hỗ trợ khách hàng xuất sắc.

Khi chúng tôi tiếp tục phát triển, cam kết của chúng tôi về chất lượng và dịch vụ vẫn không thay đổi. Cảm ơn bạn đã chọn ShopVN - chúng tôi mong muốn được đồng hành cùng bạn trong hành trình mua sắm.`,
    isPublished: true,
  },
  {
    slug: 'careers',
    title: 'Tuyển dụng',
    content: `Gia nhập đội ngũ ShopVN!

Chúng tôi luôn tìm kiếm những tài năng đam mê để cùng xây dựng trải nghiệm mua sắm tốt nhất cho khách hàng.

Các vị trí đang tuyển:
- Nhân viên chăm sóc khách hàng
- Chuyên viên Marketing
- Lập trình viên Web
- Nhân viên kho vận

Quyền lợi:
- Lương cạnh tranh
- Bảo hiểm đầy đủ
- Môi trường làm việc năng động
- Cơ hội phát triển nghề nghiệp

Gửi CV về email: careers@shopvn.com`,
    isPublished: true,
  },
  {
    slug: 'blog',
    title: 'Blog',
    content: `Chào mừng đến với Blog ShopVN!

Nơi chúng tôi chia sẻ những thông tin hữu ích về:
- Xu hướng thời trang mới nhất
- Mẹo mua sắm thông minh
- Đánh giá sản phẩm
- Tin tức khuyến mãi

Hãy theo dõi để không bỏ lỡ những bài viết hay!`,
    isPublished: true,
  },
  {
    slug: 'sell',
    title: 'Bán hàng trên ShopVN',
    content: `Trở thành đối tác bán hàng của ShopVN!

Lợi ích khi bán hàng trên ShopVN:
- Tiếp cận hàng triệu khách hàng
- Hệ thống quản lý đơn hàng dễ sử dụng
- Hỗ trợ marketing và quảng cáo
- Thanh toán nhanh chóng và an toàn

Đăng ký ngay hôm nay để bắt đầu kinh doanh!

Liên hệ: seller@shopvn.com`,
    isPublished: true,
  },
  {
    slug: 'become-affiliate',
    title: 'Trở thành đối tác',
    content: `Chương trình Affiliate ShopVN

Kiếm tiền bằng cách giới thiệu sản phẩm ShopVN!

Cách thức hoạt động:
1. Đăng ký tài khoản Affiliate
2. Nhận link giới thiệu độc quyền
3. Chia sẻ link trên website, mạng xã hội
4. Nhận hoa hồng cho mỗi đơn hàng thành công

Hoa hồng lên đến 10% giá trị đơn hàng!

Đăng ký: affiliate@shopvn.com`,
    isPublished: true,
  },
  {
    slug: 'advertise',
    title: 'Quảng cáo sản phẩm',
    content: `Quảng cáo trên ShopVN

Đưa sản phẩm của bạn đến với hàng triệu khách hàng tiềm năng!

Các hình thức quảng cáo:
- Banner trang chủ
- Sản phẩm nổi bật
- Email marketing
- Quảng cáo tìm kiếm

Liên hệ để nhận báo giá: ads@shopvn.com`,
    isPublished: true,
  },
  {
    slug: 'shipping',
    title: 'Phí & Chính sách vận chuyển',
    content: `Chính sách vận chuyển ShopVN

Phí vận chuyển:
- Giao nhanh (1 ngày): 50.000đ
- Giao tiêu chuẩn (3 ngày): 30.000đ
- Giao tiết kiệm (5 ngày): 15.000đ

Miễn phí vận chuyển cho đơn hàng từ 500.000đ

Khu vực giao hàng:
- Toàn quốc 63 tỉnh thành
- Giao hàng tận nơi

Theo dõi đơn hàng:
Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi"`,
    isPublished: true,
  },
  {
    slug: 'returns-policy',
    title: 'Đổi trả & Hoàn tiền',
    content: `Chính sách đổi trả ShopVN

Thời gian đổi trả: 7 ngày kể từ ngày nhận hàng

Điều kiện đổi trả:
- Sản phẩm còn nguyên tem, nhãn mác
- Chưa qua sử dụng
- Còn đầy đủ phụ kiện đi kèm

Quy trình đổi trả:
1. Liên hệ hotline: 1900 1234
2. Đóng gói sản phẩm cẩn thận
3. Gửi hàng về địa chỉ kho
4. Nhận hàng mới hoặc hoàn tiền trong 3-5 ngày

Hoàn tiền:
- Hoàn tiền qua tài khoản ngân hàng
- Thời gian xử lý: 3-5 ngày làm việc`,
    isPublished: true,
  },
  {
    slug: 'help',
    title: 'Trợ giúp',
    content: `Trung tâm trợ giúp ShopVN

Câu hỏi thường gặp:

1. Làm sao để đặt hàng?
- Chọn sản phẩm → Thêm vào giỏ → Thanh toán

2. Phương thức thanh toán?
- Thanh toán khi nhận hàng (COD)
- Chuyển khoản ngân hàng
- Thẻ tín dụng/ghi nợ
- Ví điện tử

3. Làm sao để theo dõi đơn hàng?
- Đăng nhập → Đơn hàng của tôi → Xem chi tiết

Liên hệ hỗ trợ:
- Hotline: 1900 1234 (8h-22h)
- Email: support@shopvn.com
- Chat trực tuyến trên website`,
    isPublished: true,
  },
  {
    slug: 'conditions-of-use',
    title: 'Điều khoản sử dụng',
    content: `Điều khoản sử dụng ShopVN

Bằng việc truy cập và sử dụng website ShopVN, bạn đồng ý tuân thủ các điều khoản sau:

1. Tài khoản người dùng
- Bạn chịu trách nhiệm bảo mật thông tin tài khoản
- Không chia sẻ tài khoản cho người khác

2. Đặt hàng và thanh toán
- Giá sản phẩm có thể thay đổi mà không báo trước
- Đơn hàng chỉ được xác nhận khi thanh toán thành công

3. Quyền sở hữu trí tuệ
- Tất cả nội dung trên website thuộc quyền sở hữu của ShopVN
- Không sao chép, phân phối nội dung khi chưa được phép

4. Giới hạn trách nhiệm
- ShopVN không chịu trách nhiệm cho các thiệt hại gián tiếp

Cập nhật lần cuối: Tháng 12/2024`,
    isPublished: true,
  },
  {
    slug: 'privacy-policy',
    title: 'Chính sách bảo mật',
    content: `Chính sách bảo mật ShopVN

Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn.

1. Thông tin thu thập
- Họ tên, email, số điện thoại
- Địa chỉ giao hàng
- Lịch sử mua hàng

2. Mục đích sử dụng
- Xử lý đơn hàng
- Gửi thông tin khuyến mãi (nếu đồng ý)
- Cải thiện dịch vụ

3. Bảo mật thông tin
- Mã hóa SSL cho tất cả giao dịch
- Không chia sẻ thông tin cho bên thứ ba

4. Quyền của bạn
- Yêu cầu xem, sửa, xóa thông tin cá nhân
- Từ chối nhận email marketing

Liên hệ: privacy@shopvn.com`,
    isPublished: true,
  },
]

async function updateWebPages() {
  try {
    await connectToDatabase()

    for (const page of webPagesVi) {
      await WebPage.findOneAndUpdate(
        { slug: page.slug },
        page,
        { upsert: true, new: true }
      )
      console.log(`✅ Updated: ${page.slug}`)
    }

    console.log('\n✅ All web pages updated successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating web pages:', error)
    process.exit(1)
  }
}

updateWebPages()
