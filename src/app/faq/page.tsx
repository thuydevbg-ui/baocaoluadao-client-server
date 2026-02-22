'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronDown, ChevronUp, MessageCircle, Mail, ThumbsUp, ThumbsDown,
  HelpCircle, Clock, Eye, ArrowRight, BookOpen
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card, Input, Badge } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  relatedQuestions?: string[];
  viewCount?: number;
  helpfulCount?: number;
}

const faqData: FAQItem[] = [
  {
    category: 'General',
    question: 'ScamGuard là gì?',
    answer: 'ScamGuard là nền tảng kiểm tra lừa đảo miễn phí giúp bạn xác minh số điện thoại, tài khoản ngân hàng, website và địa chỉ ví crypto có bị báo cáo là lừa đảo hay không. Chúng tôi tổng hợp dữ liệu từ cộng đồng để bảo vệ bạn khỏi các trò lừa đảo trực tuyến.\n\n**Tính năng chính:**\n- Kiểm tra số điện thoại lừa đảo\n- Tra cứu tài khoản ngân hàng\n- Quét website độc hại\n- Phân tích tin nhắn bằng AI\n- Báo cáo và cảnh báo lừa đảo',
    relatedQuestions: ['Làm thế nào để sử dụng ScamGuard?', 'Sử dụng ScamGuard có miễn phí không?'],
    viewCount: 15420,
    helpfulCount: 892
  },
  {
    category: 'General',
    question: 'Làm thế nào để sử dụng ScamGuard?',
    answer: 'Bạn có thể sử dụng ScamGuard theo các bước sau:\n\n**Bước 1: Chọn loại tìm kiếm**\n- Truy cập trang chủ và chọn loại kiểm tra (điện thoại, ngân hàng, website, crypto)\n\n**Bước 2: Nhập thông tin**\n- Nhập số điện thoại, số tài khoản, hoặc đường dẫn website\n\n**Bước 3: Xem kết quả**\n- Hệ thống sẽ hiển thị kết quả ngay lập tức với mức độ rủi ro\n\n**Bước 4: Báo cáo nếu cần**\n- Nếu phát hiện lừa đảo, bạn có thể báo cáo ngay trên hệ thống',
    relatedQuestions: ['ScamGuard là gì?', 'Tôi có thể tìm kiếm những loại thông tin nào?'],
    viewCount: 12350,
    helpfulCount: 756
  },
  {
    category: 'General',
    question: 'Sử dụng ScamGuard có miễn phí không?',
    answer: 'Có, tất cả các tính năng cơ bản của ScamGuard đều miễn phí:\n\n✅ Tìm kiếm và kiểm tra\n✅ Xem chi tiết kết quả\n✅ Báo cáo lừa đảo\n✅ Xem cảnh báo cộng đồng\n\n**Tính năng cao cấp (có thể mất phí trong tương lai):**\n- Thông báo khi có cập nhật\n- Lưu lịch sử tìm kiếm\n- Báo cáo chi tiết hơn',
    relatedQuestions: ['ScamGuard là gì?', 'Tôi có cần đăng ký tài khoản không?'],
    viewCount: 9870,
    helpfulCount: 654
  },
  {
    category: 'Reporting',
    question: 'Làm thế nào để báo cáo một vụ lừa đảo?',
    answer: 'Để báo cáo vụ lừa đảo, bạn thực hiện các bước sau:\n\n**1. Truy cập trang báo cáo**\n- Vào trang "Báo cáo lừa đảo" hoặc "Hướng dẫn báo cáo"\n\n**2. Chọn loại lừa đảo**\n- Điện thoại, Ngân hàng, Website, Crypto, Mạng xã hội, Đầu tư, Việc làm\n\n**3. Điền thông tin**\n- Thông tin đối tượng (số điện thoại, tài khoản, website)\n- Số tiền bị mất (nếu có)\n- Mô tả chi tiết vụ việc\n\n**4. Tải bằng chứng**\n- Ảnh chụp màn hình tin nhắn\n- Ảnh chuyển khoản\n- Ghi âm cuộc gọi\n\n**5. Gửi báo cáo**\n- Xác nhận và gửi đi',
    relatedQuestions: ['Tôi cần cung cấp những thông tin gì khi báo cáo?', 'Báo cáo của tôi có được xác minh không?'],
    viewCount: 8920,
    helpfulCount: 543
  },
  {
    category: 'Reporting',
    question: 'Tôi cần cung cấp những thông tin gì khi báo cáo?',
    answer: 'Khi báo cáo, bạn nên cung cấp đầy đủ thông tin sau:\n\n**Thông tin bắt buộc:**\n- Loại lừa đảo (điện thoại, ngân hàng, website...)\n- Thông tin đối tượng (số điện thoại, tài khoản, website)\n- Mô tả chi tiết vụ việc\n\n**Thông tin khuyến khích:**\n- Số tiền bị mất (nếu có)\n- Thời gian xảy ra vụ việc\n- Phương thức liên lạc của kẻ lừa đảo\n\n**Bằng chứng (rất quan trọng):**\n- Ảnh chụp màn hình tin nhắn\n- Ảnh chuyển khoản/thanh toán\n- Ghi âm cuộc gọi\n- Email hoặc các tin nhắn khác',
    relatedQuestions: ['Làm thế nào để báo cáo một vụ lừa đảo?', 'Báo cáo của tôi có được xác minh không?'],
    viewCount: 7650,
    helpfulCount: 432
  },
  {
    category: 'Reporting',
    question: 'Báo cáo của tôi có được xác minh không?',
    answer: 'Sau khi gửi báo cáo, quy trình xử lý như sau:\n\n**1. Tiếp nhận (ngay lập tức)**\n- Báo cáo được ghi nhận vào hệ thống\n- Bạn nhận được mã theo dõi\n\n**2. Xem xét (1-3 ngày)**\n- Đội ngũ ScamGuard kiểm tra nội dung\n- Xác minh tính hợp lệ của báo cáo\n\n**3. Xác minh (3-7 ngày)**\n- Các báo cáo hợp lệ được đánh dấu "Đã xác minh"\n- Hiển thị công khai để cộng đồng tham khảo\n\n**4. Cập nhật trạng thái**\n- Bạn có thể theo dõi trạng thái qua mã báo cáo\n- Nhận thông báo khi có cập nhật',
    relatedQuestions: ['Làm thế nào để báo cáo một vụ lừa đảo?', 'Tôi cần cung cấp những thông tin gì khi báo cáo?'],
    viewCount: 6540,
    helpfulCount: 387
  },
  {
    category: 'Search',
    question: 'Làm thế nào để kiểm tra số điện thoại?',
    answer: 'Để kiểm tra số điện thoại:\n\n**Cách 1: Tìm kiếm nhanh**\n1. Nhập số điện thoại vào ô tìm kiếm trên trang chủ\n2. Nhấn "Tìm kiếm" hoặc Enter\n3. Xem kết quả ngay lập tức\n\n**Cách 2: Kiểm tra chi tiết**\n1. Truy cập trang kiểm tra điện thoại\n2. Nhập số điện thoại đầy đủ\n3. Xem chi tiết: số lần báo cáo, mức độ rủi ro, các vụ liên quan\n\n**Hiểu kết quả:**\n- 🟢 Xanh (An toàn): Chưa có báo cáo\n- 🟡 Vàng (Nghi ngờ): Có 1-2 báo cáo\n- 🔴 Đỏ (Lừa đảo): Nhiều báo cáo',
    relatedQuestions: ['Tôi có thể tìm kiếm những loại thông tin nào?', 'Kết quả tìm kiếm có chính xác không?'],
    viewCount: 11230,
    helpfulCount: 678
  },
  {
    category: 'Search',
    question: 'Tôi có thể tìm kiếm những loại thông tin nào?',
    answer: 'Hiện tại, ScamGuard hỗ trợ tìm kiếm các loại thông tin sau:\n\n**1. Số điện thoại**\n- Số di động các nhà mạng Việt Nam\n- Số cố định\n- Số quốc tế\n\n**2. Tài khoản ngân hàng**\n- Số tài khoản các ngân hàng Việt Nam\n- Số thẻ ATM\n\n**3. Website/URL**\n- Đường dẫn website\n- Domain\n- Địa chỉ IP\n\n**4. Địa chỉ Crypto**\n- Địa chỉ Bitcoin\n- Địa chỉ Ethereum\n- Các loại coin khác\n\n**Đang phát triển:**\n- Email\n- Số CMND/CCCD\n- Tên người dùng mạng xã hội',
    relatedQuestions: ['Làm thế nào để kiểm tra số điện thoại?', 'Kết quả tìm kiếm có chính xác không?'],
    viewCount: 9870,
    helpfulCount: 543
  },
  {
    category: 'Search',
    question: 'Kết quả tìm kiếm có chính xác không?',
    answer: 'Kết quả tìm kiếm dựa trên dữ liệu báo cáo từ cộng đồng. Về độ chính xác:\n\n**Ưu điểm:**\n- Dữ liệu nhật liên tục được cập từ cộng đồng\n- Quy trình xác minh nghiêm ngặt\n- Theo dõi xu hướng lừa đảo mới\n\n**Hạn chế:**\n- Không đảm bảo 100% chính xác (dữ liệu do người dùng đóng góp)\n- Có thể có báo cáo sai\n- Không thể phát hiện lừa đảo mới chưa ai báo cáo\n\n**Khuyến nghị:**\n- Sử dụng kết quả như một nguồn tham khảo\n- Kết hợp với các phương pháp khác\n- Báo cáo nếu phát hiện lừa đảo để cộng đồng được biết',
    relatedQuestions: ['Làm thế nào để kiểm tra số điện thoại?', 'Tôi có thể tìm kiếm những loại thông tin nào?'],
    viewCount: 8540,
    helpfulCount: 456
  },
  {
    category: 'Account',
    question: 'Tôi có cần đăng ký tài khoản không?',
    answer: 'Không bắt buộc! Bạn có thể sử dụng hầu hết các tính năng mà không cần đăng ký:\n\n**Sử dụng không cần đăng nhập:**\n- ✅ Tìm kiếm và kiểm tra\n- ✅ Xem chi tiết kết quả\n- ✅ Đọc bài viết cảnh báo\n- ✅ Xem FAQ\n\n**Đăng ký miễn phí để nhận thêm:**\n- 📌 Lưu lịch sử tìm kiếm\n- 🔔 Nhận thông báo khi có cập nhật\n- 📊 Xem thống kê cá nhân\n- 💬 Tham gia cộng đồng\n- 📝 Báo cáo nhanh hơn',
    relatedQuestions: ['Làm thế nào để liên hệ với ScamGuard?', 'Thông tin cá nhân của tôi có an toàn không?'],
    viewCount: 7650,
    helpfulCount: 432
  },
  {
    category: 'Account',
    question: 'Làm thế nào để liên hệ với ScamGuard?',
    answer: 'Bạn có thể liên hệ với chúng tôi qua các kênh sau:\n\n**📞 Hotline**\n- Số: 1900-xxxx\n- Hoạt động: 24/7\n- Phản hồi: Ngay lập tức\n\n**📧 Email**\n- Email: support@scamguard.vn\n- Phản hồi: Trong vòng 24 giờ\n\n**💬 Chat trực tiếp**\n- Click vào biểu tượng chat góc phải\n- Hoạt động: 8h - 22h hàng ngày\n\n**📝 Gửi yêu cầu**\n- Truy cập trang Liên hệ\n- Điền form với câu hỏi\n- Nhận phản hồi qua email',
    relatedQuestions: ['Tôi có cần đăng ký tài khoản không?', 'Thông tin cá nhân của tôi có an toàn không?'],
    viewCount: 6540,
    helpfulCount: 321
  },
  {
    category: 'Privacy',
    question: 'Thông tin cá nhân của tôi có an toàn không?',
    answer: 'Chúng tôi rất coi trọng quyền riêng tư và bảo mật thông tin của bạn:\n\n**🔐 Bảo mật dữ liệu:**\n- Mã hóa SSL/TLS cho tất cả kết nối\n- Dữ liệu được mã hóa trong database\n- Server đặt tại trung tâm dữ liệu an toàn\n\n**👤 Quyền riêng tư:**\n- Không chia sẻ thông tin cá nhân với bên thứ ba\n- Không bán hoặc kinh doanh dữ liệu người dùng\n- Chỉ thu thập thông tin cần thiết\n\n**⚙️ Quyền của bạn:**\n- Xem dữ liệu cá nhân\n- Yêu cầu xóa dữ liệu\n- Từ chối thu thập dữ liệu\n\nXem chi tiết trong [Chính sách bảo mật](/privacy)',
    relatedQuestions: ['Tôi có cần đăng ký tài khoản không?', 'Làm thế nào để liên hệ với ScamGuard?'],
    viewCount: 5430,
    helpfulCount: 287
  },
  {
    category: 'AI',
    question: 'Tính năng AI hoạt động như thế nào?',
    answer: 'Tính năng AI của ScamGuard sử dụng machine learning và phân tích ngữ nghĩa để phát hiện lừa đảo:\n\n**Quy trình hoạt động:**\n\n1. **Nhận input**\n- Tin nhắn văn bản\n- Nội dung website\n- Email\n\n2. **Phân tích**\n- Quét từ khóa đáng ngờ\n- Phân tích mẫu lừa đảo\n- Đánh giá ngữ cảnh\n- So sánh với cơ sở dữ liệu\n\n3. **Kết quả**\n- Đưa ra đánh giá rủi ro\n- Giải thích các yếu tố phát hiện\n- Đề xuất hành động\n\n**Các dấu hiệu AI phát hiện:**\n- Yêu cầu chuyển tiền khẩn cấp\n- Đường dẫn giả mạo\n- Lời hứa quà tặng, tiền thưởng\n- Đe dọa, hoảng loạn',
    relatedQuestions: ['Tôi có thể quét website bằng AI không?', 'Kết quả tìm kiếm có chính xác không?'],
    viewCount: 8760,
    helpfulCount: 498
  },
  {
    category: 'AI',
    question: 'Tôi có thể quét website bằng AI không?',
    answer: 'Có! Bạn có thể sử dụng tính năng quét website AI của chúng tôi:\n\n**Cách sử dụng:**\n1. Truy cập trang "AI" hoặc "Quét website"\n2. Nhập đường dẫn website cần quét\n3. Nhấn "Quét ngay"\n4. Đợi kết quả (thường 5-30 giây)\n\n**AI phân tích các yếu tố:**\n\n🔍 **Tuổi domain**\n- Domain mới (< 1 tháng) có nguy cơ cao hơn\n\n🔒 **Chứng chỉ SSL**\n- Kiểm tra chứng chỉ hợp lệ\n- Cảnh báo chứng chỉ tự ký\n\n📝 **Nội dung**\n- Từ khóa lừa đảo\n- Mẫu thiết kế đáng ngờ\n- Thiếu thông tin pháp lý\n\n🌐 **Liên kết**\n- Link ra ngoài đáng ngờ\n- Redirect nhiều lần\n\n📊 **Đánh giá tổng thể**\n- Điểm rủi ro từ 0-100\n- Giải thích chi tiết',
    relatedQuestions: ['Tính năng AI hoạt động như thế nào?', 'Làm thế nào để kiểm tra số điện thoại?'],
    viewCount: 7890,
    helpfulCount: 445
  }
];

const categories = ['All', 'General', 'Reporting', 'Search', 'Account', 'Privacy', 'AI'];

function FAQPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: number]: 'yes' | 'no' | null }>({});
  const [showThankYou, setShowThankYou] = useState<number | null>(null);

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleVote = (index: number, vote: 'yes' | 'no') => {
    if (helpfulVotes[index] === null) {
      setHelpfulVotes({ ...helpfulVotes, [index]: vote });
      setShowThankYou(index);
      setTimeout(() => setShowThankYou(null), 3000);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'All': 'Tất cả',
      'General': 'Chung',
      'Reporting': 'Báo cáo',
      'Search': 'Tìm kiếm',
      'Account': 'Tài khoản',
      'Privacy': 'Bảo mật',
      'AI': 'AI'
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-primary/10 border-b border-bg-border">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Hỗ trợ 24/7
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                {t('footer.faq')}
              </h1>
              <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
                Tìm câu trả lời nhanh cho các câu hỏi thường gặp. Nếu không tìm thấy, hãy liên hệ hỗ trợ
              </p>
              
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base"
                  />
                </div>
                <p className="text-xs text-text-muted mt-2 text-left">
                  💡 Gợi ý: Thử các từ khóa như "kiểm tra", "báo cáo", "tài khoản"
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-bg-card rounded-xl p-4 text-center border border-bg-border">
              <div className="text-2xl font-bold text-primary">{faqData.length}+</div>
              <div className="text-xs text-text-muted">Câu hỏi</div>
            </div>
            <div className="bg-bg-card rounded-xl p-4 text-center border border-bg-border">
              <div className="text-2xl font-bold text-success">6</div>
              <div className="text-xs text-text-muted">Chủ đề</div>
            </div>
            <div className="bg-bg-card rounded-xl p-4 text-center border border-bg-border">
              <div className="text-2xl font-bold text-warning">24/7</div>
              <div className="text-xs text-text-muted">Hỗ trợ</div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-secondary hover:bg-bg-cardHover border border-bg-border'
                }`}
              >
                {getCategoryLabel(category)}
                {category !== 'All' && (
                  <span className="ml-1 text-xs opacity-70">
                    ({faqData.filter(f => f.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    hover 
                    className={`cursor-pointer overflow-hidden transition-all ${
                      openItems.includes(index) ? 'ring-2 ring-primary/30' : ''
                    }`}
                    onClick={() => toggleItem(index)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {getCategoryLabel(faq.category)}
                            </Badge>
                            {faq.viewCount && (
                              <span className="flex items-center gap-1 text-xs text-text-muted">
                                <Eye className="w-3 h-3" />
                                {faq.viewCount}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-text-main text-lg">{faq.question}</h3>
                        </div>
                        {openItems.includes(index) ? (
                          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {openItems.includes(index) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-bg-border">
                              <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                                {faq.answer}
                              </div>
                              
                              {/* Related Questions */}
                              {faq.relatedQuestions && faq.relatedQuestions.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-bg-border">
                                  <h4 className="text-sm font-medium text-text-main mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    Câu hỏi liên quan
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {faq.relatedQuestions.map((rq, rqIndex) => (
                                      <button
                                        key={rqIndex}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const targetIndex = faqData.findIndex(f => f.question === rq);
                                          if (targetIndex !== -1) {
                                            setOpenItems([targetIndex]);
                                          }
                                        }}
                                        className="text-sm text-primary hover:text-primary/80 bg-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                        {rq}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Voting */}
                              <div className="mt-6 pt-4 border-t border-bg-border">
                                {showThankYou === index ? (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-2 bg-success/10 rounded-lg"
                                  >
                                    <span className="text-success font-medium">✅ Cảm ơn phản hồi của bạn!</span>
                                  </motion.div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-muted">
                                      Câu trả lời này có hữu ích không?
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVote(index, 'yes');
                                        }}
                                        disabled={helpfulVotes[index] !== null}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                          helpfulVotes[index] === 'yes'
                                            ? 'bg-success text-white'
                                            : 'bg-bg-cardHover text-text-secondary hover:bg-success/10 hover:text-success'
                                        }`}
                                      >
                                        <ThumbsUp className="w-4 h-4" />
                                        Hữu ích
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVote(index, 'no');
                                        }}
                                        disabled={helpfulVotes[index] !== null}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                          helpfulVotes[index] === 'no'
                                            ? 'bg-danger text-white'
                                            : 'bg-bg-cardHover text-text-secondary hover:bg-danger/10 hover:text-danger'
                                        }`}
                                      >
                                        <ThumbsDown className="w-4 h-4" />
                                        Không
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {faq.helpfulCount && helpfulVotes[index] === null && (
                                  <p className="text-xs text-text-muted mt-2 text-right">
                                    {faq.helpfulCount} người thấy hữu ích
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="text-center py-12">
                <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary mb-2">Không tìm thấy câu hỏi phù hợp</p>
                <p className="text-text-muted text-sm mb-4">Thử tìm kiếm với từ khóa khác</p>
                <Link href="/help">
                  <Button variant="secondary" size="sm">
                    Xem tất cả câu hỏi
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Contact CTA */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
            <div className="text-center py-8">
              <h3 className="text-xl font-bold text-text-main mb-3">
                Vẫn cần hỗ trợ?
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Nếu bạn không tìm thấy câu trả lời, đội ngũ hỗ trợ của chúng tôi sẽ giúp bạn
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/help">
                  <Button variant="primary">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Trung tâm hỗ trợ
                  </Button>
                </Link>
                <Link href="/feedback">
                  <Button variant="secondary">
                    <Mail className="w-4 h-4 mr-2" />
                    Gửi phản hồi
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

export default FAQPage;
