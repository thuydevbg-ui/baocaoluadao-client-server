'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, Eye, ArrowRight, Shield, AlertTriangle, 
  TrendingUp, Clock, User, Share2, MessageCircle, ThumbsUp,
  ChevronLeft, ChevronRight, Search, Tag
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  views: number;
  readTime: string;
  author: string;
  image: string;
  color: string;
  tags: string[];
  relatedPosts: number[];
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Các chiêu lừa đảo qua điện thoại phổ biến nhất 2025',
    excerpt: 'Tìm hiểu về các thủ đoạn lừa đảo qua điện thoại phổ biến nhất hiện nay và cách bảo vệ bản thân.',
    category: 'An toàn',
    date: '15/02/2025',
    views: 5234,
    readTime: '8 phút',
    author: 'Nguyễn Văn A',
    image: 'phone',
    color: 'from-blue-500 to-cyan-400',
    tags: ['lừa đảo', 'điện thoại', 'an toàn', '2025'],
    relatedPosts: [2, 4, 5],
    content: `
## Giới thiệu

Trong thời đại số hóa ngày nay, lừa đảo qua điện thoại đang trở nên phổ biến hơn bao giờ hết. Theo thống kê của ScamGuard, hơn 15.000 vụ lừa đảo qua điện thoại đã được báo cáo trong năm 2024. Bài viết này sẽ giúp bạn nhận biết và phòng tránh các thủ đoạn này.

## Các chiêu lừa đảo phổ biến

### 1. Lừa đảo "Có người cần cứu"

Đây là chiêu lừa đảo phổ biến nhất, trong đó kẻ lừa đảo giả danh người thân của bạn hoặc cơ quan chức năng, thông báo rằng người thân của bạn đang gặp nạn và cần tiền ngay lập tức.

**Dấu hiệu nhận biết:**
- Gọi điện báo tin khẩn cấp về người thân
- Yêu cầu chuyển tiền ngay lập tức
- Không cho phép bạn gọi điện xác minh
- Số điện thoại lạ hoặc ẩn danh

### 2. Lừa đảo "Giả danh công an/bộ đội"

Kẻ lừa đảo giả danh cán bộ công an, bộ đội hoặc cơ quan nhà nước, thông báo bạn liên quan đến một vụ án và cần chuyển tiền để "làm sạch tên".

**Dấu hiệu nhận biết:**
- Tự xưng là cán bộ công an, bộ đội
- Yêu cầu bạn giữ bí mật
- Đe dọa bắt giam nếu không hợp tác
- Yêu cầu chuyển tiền vào tài khoản cá nhân

### 3. Lừa đảo "Trúng thưởng"

Bạn nhận được cuộc gọi thông báo đã trúng giải thưởng hấp dẫn như xe ô tô, tiền tỷ hoặc phiếu mua hàng trị giá cao.

**Dấu hiệu nhận biết:**
- Thông báo trúng thưởng bất ngờ
- Yêu cầu đóng phí trước để nhận thưởng
- Không thể xác minh thông tin giải thưởng
- Yêu cầu cung cấp thông tin cá nhân

### 4. Lừa đảo "Mua bán cổ phiếu"

Kẻ lừa đảo mời gọi đầu tư vào cổ phiếu, tiền ảo hoặc các dự án hứa hẹn lợi nhuận cao.

**Dấu hiệu nhận biết:**
- Hứa hẹn lợi nhuận cao bất thường
- Áp lực đầu tư ngay lập tức
- Không có giấy phép kinh doanh rõ ràng
- Đánh vào lòng tham của nạn nhân

## Cách phòng tránh

### 1. Không tin tưởng cuộc gọi khẩn cấp

Khi nhận cuộc gọi thông báo người thân gặp nạn, hãy:
- Bình tĩnh và không hoảng loạn
- Gọi điện trực tiếp cho người thân để xác minh
- Không chuyển tiền cho người lạ
- Báo cho cơ quan công an nếu nghi ngờ

### 2. Xác minh danh tính người gọi

- Hỏi tên, chức vụ, đơn vị công tác
- Gọi điện xác minh lại qua đường dây nóng chính thức
- Không cung cấp thông tin cá nhân qua điện thoại

### 3. Không chuyển tiền cho người lạ

- Không bao giờ chuyển tiền theo yêu cầu qua điện thoại
- Không tin vào các "giải thưởng" yêu cầu đóng phí trước
- Kiểm tra kỹ thông tin trước khi chuyển tiền

### 4. Báo cáo kịp thời

Nếu bạn hoặc người thân là nạn nhân của lừa đảo:
- Liên hệ cơ quan công an ngay lập tức
- Lưu lại các bằng chứng (tin nhắn, ghi âm cuộc gọi)
- Báo cáo trên ScamGuard để cảnh báo cộng đồng

## Kết luận

Lừa đảo qua điện thoại ngày càng tinh vi, nhưng nếu bạn nắm vững các dấu hiệu nhận biết và cách phòng tránh, bạn hoàn toàn có thể bảo vệ bản thân và gia đình. Hãy chia sẻ bài viết này để cảnh báo nhiều người hơn!
    `
  },
  {
    id: 2,
    title: 'Cách nhận biết website lừa đảo',
    excerpt: 'Hướng dẫn chi tiết cách phân biệt website thật và giả, các dấu hiệu cần chú ý.',
    category: 'Hướng dẫn',
    date: '10/02/2025',
    views: 4521,
    readTime: '6 phút',
    author: 'Trần Thị B',
    image: 'globe',
    color: 'from-green-500 to-emerald-400',
    tags: ['website', 'lừa đảo', 'phishing', 'hướng dẫn'],
    relatedPosts: [1, 5, 6],
    content: `
## Tại sao cần nhận biết website lừa đảo?

Website lừa đảo (phishing sites) là các trang web giả mạo được tạo ra nhằm đánh cắp thông tin cá nhân, mật khẩu, số tài khoản ngân hàng của người dùng. Theo báo cáo của Group-IB, hơn 3.000 website lừa đảo đã được phát hiện tại Việt Nam trong năm 2024.

## Cách nhận biết website lừa đảo

### 1. Kiểm tra URL trang web

**Điều cần lưu ý:**
- Chú ý kỹ tên miền (domain) - kẻ lừa đảo thường sử dụng tên tên miền giống với website thật
- Kiểm tra chính tả - các website lừa đảo thường có lỗi chính tả nhỏ (ví dụ: "faceb00k.com" thay vì "facebook.com")
- Xem xét phần mở rộng - cẩn thận với các domain .xyz, .top, .club khi được sử dụng cho các thương hiệu lớn

### 2. Xác minh chứng chỉ SSL

**Cách kiểm tra:**
- Website an toàn sẽ có biểu tượng ổ khóa trong thanh địa chỉ
- Click vào biểu tượng để xem thông tin chứng chỉ
- Website lừa đảo có thể có HTTPS nhưng chứng chỉ không hợp lệ

### 3. Đánh giá thiết kế website

**Dấu hiệu cảnh báo:**
- Chất lượng thiết kế kém, hình ảnh mờ
- Lỗi chính tả và ngữ pháp
- Bố cục không chuyên nghiệp
- Thiếu thông tin liên hệ rõ ràng

### 4. Kiểm tra thông tin công ty

**Website uy tín sẽ có:**
- Thông tin đăng ký kinh doanh rõ ràng
- Địa chỉ văn phòng, số điện thoại liên hệ
- Email hỗ trợ chuyên nghiệp (@tencongty.com)
- Các trang mạng xã hội chính thức

### 5. Chú ý các dấu hiệu cảnh báo

- Yêu cầu cung cấp thông tin nhạy cảm (mật khẩu, mã OTP)
- Cửa sổ pop-up yêu cầu đăng nhập
- Ưu đãi quá hấp dẫn, giảm giá "không thể tin được"
- Áp lực thời gian ("Chỉ còn 3 người", "Hết hàng trong 5 phút")

## Công cụ hỗ trợ

### Sử dụng ScamGuard

Nhập đường dẫn website vào công cụ kiểm tra của ScamGuard để:
- Kiểm tra độ an toàn của website
- Xem lịch sử báo cáo
- Nhận cảnh báo nếu website bị nghi ngờ

### Kiểm tra qua Google

Tìm kiếm tên website + "lừa đảo" hoặc "scam" để xem có báo cáo nào từ người dùng trước đó không.

## Kết luận

Việc nhận biết website lừa đảo đòi hỏi sự cẩn thận và chú ý đến chi tiết. Hãy luôn kiểm tra kỹ trước khi nhập bất kỳ thông tin cá nhân nào trên website. Nếu nghi ngờ, hãy sử dụng công cụ kiểm tra của ScamGuard hoặc liên hệ đội ngũ hỗ trợ.
    `
  },
  {
    id: 3,
    title: 'Cảnh báo: Lừa đảo đầu tư crypto đang gia tăng',
    excerpt: 'Phân tích xu hướng lừa đảo đầu tư tiền điện tử và những dấu hiệu cảnh báo.',
    category: 'Cảnh báo',
    date: '05/02/2025',
    views: 6234,
    readTime: '7 phút',
    author: 'Lê Văn C',
    image: 'trending',
    color: 'from-orange-500 to-amber-400',
    tags: ['crypto', 'đầu tư', 'lừa đảo', 'cảnh báo'],
    relatedPosts: [1, 2, 6],
    content: `
## Tình hình lừa đảo crypto hiện nay

Thị trường tiền điện tử (cryptocurrency) đang phát triển mạnh mẽ tại Việt Nam, nhưng đi kèm với đó là sự gia tăng của các vụ lừa đảo đầu tư. Theo thống kê, thiệt hại từ lừa đảo crypto trong năm 2024 lên tới hàng trăm tỷ đồng.

## Các hình thức lừa đảo phổ biến

### 1. Sàn giao dịch lừa đảo

Các sàn giao dịch crypto giả mạo được thiết kế chuyên nghiệp, thu hút nhà đầu tư với giao diện đẹp mắt và tính năng hấp dẫn.

**Dấu hiệu nhận biết:**
- Không có giấy phép hoạt động
- Địa chỉ công ty mơ hồ hoặc không tồn tại
- Không thể rút tiền sau khi nạp
- Hỗ trợ khách hàng kém

### 2. ICO (Initial Coin Offering) lừa đảo

Các dự án ICO hứa hẹn lợi nhuận cao nhưng không có sản phẩm thực tế hoặc đội ngũ phát triển ẩn danh.

**Dấu hiệu nhận biết:**
- Whitepaper sao chép hoặc không có nội dung rõ ràng
- Đội ngũ ẩn danh hoặc thông tin giả mạo
- Không có roadmap phát triển
- Hứa hẹn lợi nhuận "100%"

### 3. Ponzi & MLM crypto

Các chương trình đa cấp biến tướng dưới hình thức đầu tư crypto, trả hoa hồng cho việc giới thiệu thành viên mới.

**Dấu hiệu nhận biết:**
- Yêu cầu tuyển thành viên mới
- Lợi nhuận đến từ tiền của thành viên mới
- Áp lực giới thiệu người thân
- Không có sản phẩm hoặc dịch vụ thực tế

### 4. Wallet giả mạo

Các ứng dụng ví tiền điện tử giả mạo được đăng trên App Store hoặc Google Play với mục đích đánh cắp seed phrase.

**Dấu hiệu nhận biết:**
- Ứng dụng mới với lượt tải ít
- Yêu cầu nhập seed phrase
- Đánh giá tiêu cực từ người dùng
- Không có trang web chính thức

## Dấu hiệu cảnh báo chung

1. **Lợi nhuận quá cao:** "Đảm bảo 30-50% mỗi tháng" là dấu hiệu rõ ràng của lừa đảo
2. **Áp lực thời gian:** "Cơ hội chỉ có hôm nay"
3. **Thiếu minh bạch:** Không có thông tin về công ty, đội ngũ
4. **Không thể rút tiền:** Nhiều nạn nhân báo cáo không thể rút tiền sau khi nạp

## Cách phòng tránh

### Nghiên cứu kỹ trước khi đầu tư
- Tìm hiểu về đội ngũ phát triển
- Kiểm tra giấy phép và đăng ký kinh doanh
- Đọc review từ cộng đồng
- Xem xét whitepaper một cách cẩn thận

### Chỉ sử dụng sàn uy tín
- Sàn đã được cấp phép
- Có lịch sử hoạt động rõ ràng
- Hỗ trợ khách hàng tốt
- Được nhiều người tin tưởng

### Bảo mật ví tiền điện tử
- Không bao giờ chia sẻ seed phrase
- Sử dụng ví cứng (hardware wallet) cho số tiền lớn
- Bật xác thực 2 yếu tố
- Kiểm tra địa chỉ website trước khi kết nối

## Kết luận

Đầu tư tiền điện tử mang lại cơ hội nhưng cũng đi kèm rủi ro cao. Hãy luôn cẩn thận, nghiên cứu kỹ và không đầu tư số tiền bạn không thể mất. Nếu phát hiện lừa đảo, hãy báo cáo ngay cho ScamGuard và cơ quan chức năng.
    `
  },
  {
    id: 4,
    title: 'Tại sao nên báo cáo khi bị lừa đảo?',
    excerpt: 'Tìm hiểu tầm quan trọng của việc báo cáo lừa đảo và cách nó giúp cộng đồng an toàn hơn.',
    category: 'Cộng đồng',
    date: '01/02/2025',
    views: 3212,
    readTime: '5 phút',
    author: 'Phạm Thị D',
    image: 'shield',
    color: 'from-purple-500 to-pink-400',
    tags: ['báo cáo', 'cộng đồng', 'an toàn'],
    relatedPosts: [1, 3, 5],
    content: `
## Tại sao việc báo cáo lừa đảo lại quan trọng?

Khi bạn trở thành nạn nhân của lừa đảo, nhiều người thường cảm thấy xấu hổ, mất tiền và không muốn nhắc lại. Tuy nhiên, việc báo cáo lừa đảo là vô cùng quan trọng và có thể giúp ích cho cả bạn lẫn cộng đồng.

## Lợi ích của việc báo cáo

### 1. Bảo vệ bản thân

- **Theo dõi vụ việc:** Báo cáo tạo hồ sơ chính thức, giúp bạn theo dõi tiến trình điều tra
- **Cơ sở pháp lý:** Có bằng chứng nếu bạn muốn theo đuổi vụ kiện
- **Khôi phục tài sản:** Trong một số trường hợp, cơ quan chức năng có thể giúp thu hồi tài sản

### 2. Bảo vệ người khác

- **Cảnh báo cộng đồng:** Báo cáo của bạn giúp ScamGuard cập nhật cơ sở dữ liệu, cảnh báo những người khác
- **Ngăn chặn nạn nhân tiếp theo:** Kẻ lừa đảo sẽ bị vô hiệu hóa nếu có đủ báo cáo
- **Xây dựng cộng đồng an toàn:** Mỗi báo cáo đóng góp vào cơ sở dữ liệu chung

### 3. Giúp cơ quan chức năng

- **Bằng chứng điều tra:** Các báo cáo giúp cơ quan công an phát hiện và điều tra các đường dây lừa đảo
- **Xu hướng phân tích:** Dữ liệu tổng hợp giúp nhận diện các thủ đoạn mới
- **Hợp tác quốc tế:** Hỗ trợ điều tra các vụ lừa đảo xuyên biên giới

## Quy trình báo cáo trên ScamGuard

### Bước 1: Truy cập trang báo cáo
Truy cập https://scamguard.vn/report hoặc chọn "Báo cáo lừa đảo" trong menu.

### Bước 2: Chọn loại lừa đảo
Chọn loại hình lừa đảo phù hợp:
- Lừa đảo qua điện thoại
- Lừa đảo ngân hàng
- Lừa đảo website
- Lừa đảo crypto
- Lừa đảo mạng xã hội
- Lừa đảo đầu tư
- Lừa đảo việc làm

### Bước 3: Điền thông tin
Cung cấp càng nhiều thông tin càng tốt:
- Số điện thoại, tài khoản ngân hàng
- Tên người/website lừa đảo
- Số tiền thiệt hại (nếu có)
- Mô tả chi tiết vụ việc
- Bằng chứng (tin nhắn, ảnh chụp màn hình)

### Bước 4: Gửi báo cáo
Sau khi điền đầy đủ thông tin, nhấn "Gửi báo cáo". Bạn sẽ nhận được mã báo cáo để theo dõi.

## Điều gì xảy ra sau khi báo cáo?

1. **Xác nhận:** Bạn nhận được email xác nhận đã tiếp nhận báo cáo
2. **Kiểm tra:** Đội ngũ ScamGuard xác minh thông tin
3. **Cập nhật:** Thông tin được cập nhật vào cơ sở dữ liệu
4. **Cảnh báo:** Người dùng khác được cảnh báo khi tìm kiếm thông tin tương tự

## Kết luận

Đừng im lặng khi trở thành nạn nhân. Mỗi báo cáo đều có giá trị và có thể cứu vô số người khác khỏi bị lừa đảo. Hãy cùng xây dựng cộng đồng an toàn hơn!
    `
  },
  {
    id: 5,
    title: 'Mua sắm online an toàn: Những điều cần nhớ',
    excerpt: 'Hướng dẫn mua sắm an toàn trên các sàn thương mại điện tử lớn tại Việt Nam.',
    category: 'Hướng dẫn',
    date: '28/01/2025',
    views: 7845,
    readTime: '6 phút',
    author: 'Nguyễn Văn A',
    image: 'shopping',
    color: 'from-pink-500 to-rose-400',
    tags: ['mua sắm', 'online', 'thương mại điện tử', 'an toàn'],
    relatedPosts: [2, 4, 1],
    content: `
## Tình hình mua sắm online tại Việt Nam

Thương mại điện tử tại Việt Nam đang tăng trưởng mạnh mẽ với doanh thu ước tính đạt 25 tỷ USD trong năm 2024. Tuy nhiên, đi kèm với sự tiện lợi là những rủi ro từ các trang web lừa đảo, shop giả mạo.

## Nguyên tắc mua sắm an toàn

### 1. Chỉ mua từ nguồn uy tín

**Nên mua từ:**
- Các sàn thương mại điện tử lớn: Shopee, Lazada, TikTok Shop
- Website chính thức của thương hiệu
- Shop có đánh giá tốt và lịch sử hoạt động lâu năm

**Tránh:**
- Mua qua các đường link facebook, zalo lạ
- Shop mới với đánh giá rất ít
- Sản phẩm có giá "quá rẻ" so với thị trường

### 2. Kiểm tra thông tin shop

**Trước khi mua hãy:**
- Xem đánh giá từ người mua trước
- Kiểm tra số điện thoại, địa chỉ shop
- Xem thời gian shop hoạt động
- Đọc các bình luận từ khách hàng

### 3. Bảo mật thanh toán

**Các phương thức an toàn:**
- Thanh toán qua cổng thanh toán của sàn (ShopeePay, Lazada Wallet)
- Sử dụng thẻ tín dụng với bảo hiệu
- Thanh toán khi nhận hàng (COD)

**Không nên:**
- Chuyển khoản trực tiếp cho người lạ
- Cung cấp mã OTP cho bất kỳ ai
- Thanh toán qua link lạ

### 4. Kiểm tra sản phẩm khi nhận

**Quy trình nhận hàng:**
- Kiểm tra kỹ bao bì trước khi nhận
- Quay video quá trình mở hàng
- Kiểm tra sản phẩm có đúng mô tả không
- Test sản phẩm điện tử ngay tại chỗ

### 5. Giữ bằng chứng

**Lưu trữ:**
- Ảnh chụp sản phẩm, mô tả
- Tin nhắn với shop
- Hóa đơn, biên nhận
- Video quá trình mở hàng

## Nhận biết shop lừa đảo

### Dấu hiệu cảnh báo:

1. **Giá quá rẻ:** Giảm giá 70-90% là dấu hiệu đáng ngờ
2. **Bình luận tích cực giả:** Đánh giá5 sao với n ội dung chung chung
3. **Áp lực mua ngay:** "Còn 3 sản phẩm", "Hết hàng trong 1 giờ"
4. **Liên hệ qua mạng xã hội:** Yêu cầu chat riêng qua Zalo, Facebook
5. **Thanh toán trước:** Yêu cầu chuyển tiền trước khi giao hàng

## Khi gặp vấn đề

### Liên hệ hỗ trợ:

1. **Khiếu nại với sàn:** Mở app/trang web, vào mục "Khiếu nại"
2. **Báo cáo ScamGuard:** Giúp cảnh báo cộng đồng
3. **Công an:** Nếu thiệt hại lớn, liên hệ cơ quan chức năng

## Kết luận

Mua sắm online mang lại nhiều tiện ích nhưng cần cẩn thận. Hãy áp dụng các nguyên tắc trên để đảm bảo an toàn cho bản thân và tài chính.
    `
  },
  {
    id: 6,
    title: 'AI trong phát hiện lừa đảo: Công nghệ tiên tiến',
    excerpt: 'Khám phá cách trí tuệ nhân tạo giúp phát hiện và ngăn chặn các vụ lừa đảo.',
    category: 'Công nghệ',
    date: '20/01/2025',
    views: 4567,
    readTime: '7 phút',
    author: 'Trần Thị B',
    image: 'ai',
    color: 'from-indigo-500 to-blue-400',
    tags: ['AI', 'trí tuệ nhân tạo', 'công nghệ', 'phát hiện'],
    relatedPosts: [2, 3, 1],
    content: `
## Trí tuệ nhân tạo trong chống lừa đảo

ScamGuard sử dụng công nghệ AI tiên tiến để phát hiện và ngăn chặn các vụ lừa đảo. Bài viết này sẽ giải thích cách AI hoạt động và mang lại hiệu quả cao trong việc bảo vệ người dùng.

## Công nghệ AI của ScamGuard

### 1. Học máy (Machine Learning)

**Nguyên lý hoạt động:**
- AI phân tích hàng triệu dữ liệu về các vụ lừa đảo
- Nhận diện các mẫu (patterns) và đặc điểm chung của lừa đảo
- Liên tục học và cải thiện từ dữ liệu mới

**Ứng dụng:**
- Phát hiện số điện thoại lừa đảo
- Nhận diện website giả mạo
- Phân tích mẫu tin nhắn lừa đảo

### 2. Xử lý ngôn ngữ tự nhiên (NLP)

**Khả năng:**
- Phân tích nội dung tin nhắn SMS, email
- Nhận diện từ khóa và cụm từ đáng ngờ
- Đánh giá ngữ cảnh và ý định lừa đảo

**Ví dụ:**
- Nhận diện các cụm từ như "chuyển tiền ngay", "tài khoản bị khóa"
- Phát hiện ngữ điệu khẩn cấp, đe dọa
- Đánh giá mức độ đáng ngờ của nội dung

### 3. Phân tích hành vi

**Theo dõi:**
- Mẫu hành vi của kẻ lừa đảo
- Tần suất hoạt động đáng ngờ
- Kết nối giữa các tài khoản, số điện thoại

**Phát hiện:**
- Đường dây lừa đảo liên quan
- Các tài khoản cùng mạng lưới
- Hoạt động bất thường

## Tính năng AI của ScamGuard

### 1. Kiểm tra tin nhắn

**Cách sử dụng:**
- Copy tin nhắn nghi ngờ
- Dán vào công cụ phân tích của ScamGuard
- Nhận kết quả phân tích trong vài giây

**Kết quả bao gồm:**
- Điểm rủi ro (0-100%)
- Các dấu hiệu lừa đảo được phát hiện
- Khuyến nghị hành động

### 2. Quét website

**Quy trình:**
- Nhập URL website cần kiểm tra
- AI phân tích các yếu tố:
  - Tuổi domain
  - Chứng chỉ SSL
  - Nội dung trang web
  - Lịch sử báo cáo
  - Các liên kết đáng ngờ

### 3. Phân tích số điện thoại

**Thông tin cung cấp:**
- Số lần báo cáo
- Mức độ rủi ro
- Mẫu tin nhắn lừa đảo liên quan
- Khuyến nghị

## Độ chính xác của AI

### Thống kê hiệu quả:

- **Độ chính xác:** 99.9% trong việc phát hiện các mẫu lừa đảo đã biết
- **Phát hiện mới:** 87% các vụ lừa đảo mới được phát hiện trong vòng 24 giờ
- **Giảm thiệt hại:** 73% người dùng tránh được lừa đảo nhờ cảnh báo sớm

### Hạn chế:

- Không thể phát hiện 100% các vụ lừa đảo mới
- Cần sự kết hợp với đánh giá của con người
- Cập nhật liên tục để theo kịp thủ đoạn mới

## Tương lai của AI trong chống lừa đảo

### Xu hướng phát triển:

1. **Tích hợp sâu hơn:** AI sẽ được tích hợp vào nhiều nền tảng hơn
2. **Phản ứng nhanh:** Thời gian phát hiện sẽ được rút xuống chỉ còn vài phút
3. **Dự đoán:** AI sẽ có khả năng dự đoán các vụ lừa đảo trước khi chúng xảy ra
4. **Cá nhân hóa:** Cảnh báo sẽ được cá nhân hóa theo từng người dùng

## Kết luận

Trí tuệ nhân tạo đang cách mạng hóa cách chúng ta phát hiện và ngăn chặn lừa đảo. Với độ chính xác cao và khả năng học liên tục, AI là vũ khí quan trọng trong cuộc chiến chống tội phạm mạng. Hãy sử dụng các công cụ AI của ScamGuard để bảo vệ bản thân và cộng đồng!
    `
  }
];

const categories = ['Tất cả', 'An toàn', 'Hướng dẫn', 'Cảnh báo', 'Cộng đồng', 'Công nghệ'];

function BlogPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === 'Tất cả' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts[0];

  const getIcon = (image: string) => {
    switch (image) {
      case 'phone': return Shield;
      case 'globe': return AlertTriangle;
      case 'trending': return TrendingUp;
      case 'shield': return Shield;
      case 'shopping': return AlertTriangle;
      case 'ai': return TrendingUp;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'An toàn': return 'bg-blue-500';
      case 'Hướng dẫn': return 'bg-green-500';
      case 'Cảnh báo': return 'bg-red-500';
      case 'Cộng đồng': return 'bg-purple-500';
      case 'Công nghệ': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-primary/10 border-b border-bg-border">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Blog ScamGuard
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Cập nhật tin tức, hướng dẫn và kiến thức về an toàn trực tuyến
              </p>
              
              {/* Search */}
              <div className="max-w-md mx-auto mt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-secondary hover:bg-bg-cardHover'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          {!searchQuery && activeCategory === 'Tất cả' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <Card hover className="overflow-hidden cursor-pointer" onClick={() => setSelectedPost(featuredPost)}>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className={`bg-gradient-to-br ${featuredPost.color} p-8 flex items-center justify-center min-h-[200px]`}>
                    {React.createElement(getIcon(featuredPost.image), { className: "w-20 h-20 text-white opacity-80" })}
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="primary">{featuredPost.category}</Badge>
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${getCategoryColor(featuredPost.category)}`}>
                        Nổi bật
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-text-main mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-text-secondary mb-4 line-clamp-2">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-muted mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {featuredPost.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {featuredPost.views} lượt xem
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <span className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                      Đọc tiếp <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full flex flex-col cursor-pointer" onClick={() => setSelectedPost(post)}>
                  <div className={`h-32 bg-gradient-to-br ${post.color} flex items-center justify-center`}>
                    {React.createElement(getIcon(post.image), { className: "w-12 h-12 text-white opacity-80" })}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-text-muted">{post.readTime}</span>
                    </div>
                    <h3 className="font-semibold text-text-main mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">Không tìm thấy bài viết nào</p>
            </Card>
          )}
        </div>
      </main>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
            onClick={() => setSelectedPost(null)}
          >
            <div className="min-h-screen py-8 px-4" onClick={(e) => e.stopPropagation()}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="max-w-4xl mx-auto bg-bg-card rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className={`h-48 bg-gradient-to-br ${selectedPost.color} flex items-center justify-center relative`}>
                  {React.createElement(getIcon(selectedPost.image), { className: "w-24 h-24 text-white opacity-80" })}
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="primary">{selectedPost.category}</Badge>
                    <span className="text-sm text-text-muted">{selectedPost.readTime}</span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold text-text-main mb-4">
                    {selectedPost.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-8 pb-8 border-b border-bg-border">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedPost.views} lượt xem
                    </span>
                  </div>

                  {/* Article Content */}
                  <div className="prose prose-invert max-w-none">
                    {selectedPost.content.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold text-text-main mt-8 mb-4">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-lg font-semibold text-text-main mt-6 mb-3">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('**')) {
                        return <p key={i} className="font-semibold text-text-main mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.trim() === '') {
                        return <br key={i} />;
                      }
                      return <p key={i} className="text-text-secondary mb-3 leading-relaxed">{line}</p>;
                    })}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-bg-border">
                    <span className="text-sm text-text-muted mr-2">Tags:</span>
                    {selectedPost.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-bg-cardHover rounded-full text-xs text-text-secondary">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-8">
                    <Button variant="secondary" size="sm">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Hữu ích
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Chia sẻ
                    </Button>
                    <Button variant="secondary" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Bình luận
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <MobileNav />
    </div>
  );
}

export default BlogPage;
