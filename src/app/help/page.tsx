'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MessageCircle, Phone, Mail, Book, 
  Shield, AlertTriangle, FileText, ChevronRight, ChevronDown,
  Zap, CheckCircle, ArrowRight, Clock, Star, Eye, BookOpen
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card, Input, Badge } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

interface HelpArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: number;
  views: number;
  helpful: number;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'check-phone',
    title: 'Cách kiểm tra số điện thoại lừa đảo',
    excerpt: 'Hướng dẫn chi tiết cách tra cứu và kiểm tra số điện thoại có bị báo cáo là lừa đảo hay không',
    content: `## Cách kiểm tra số điện thoại lừa đảo

Việc kiểm tra số điện thoại trước khi liên lạc là rất quan trọng để tránh bị lừa đảo.

### Bước 1: Truy cập công cụ kiểm tra
1. Truy cập trang chủ ScamGuard
2. Chọn tab "Kiểm tra điện thoại"
3. Nhập số điện thoại cần kiểm tra

### Bước 2: Xem kết quả
Hệ thống sẽ hiển thị:
- **Số lần báo cáo**: Số lần số này bị báo cáo là lừa đảo
- **Mức độ rủi ro**: An toàn / Nghi ngờ / Lừa đảo
- **Các vụ việc liên quan**: Chi tiết các vụ báo cáo

### Bước 3: Đánh giá và hành động
- Nếu "Lừa đảo": Không liên lạc, báo cáo ngay
- Nếu "Nghi ngờ": Cẩn trọng, tìm thêm thông tin
- Nếu "An toàn": Có thể liên lạc nhưng vẫn cần cảnh giác

### Mẹo an toàn
- Không cung cấp thông tin cá nhân cho người lạ
- Không chuyển tiền theo yêu cầu qua điện thoại
- Luôn xác minh qua kênh chính thức`,
    category: 'search',
    readTime: 3,
    views: 12500,
    helpful: 890
  },
  {
    id: 'check-bank',
    title: 'Kiểm tra tài khoản ngân hàng an toàn',
    excerpt: 'Tìm hiểu cách xác minh tài khoản ngân hàng trước khi chuyển tiền',
    content: `## Hướng dẫn kiểm tra tài khoản ngân hàng

Chuyển tiền cho người lạ là rất rủi ro. Hãy luôn kiểm tra trước.

### Tại sao cần kiểm tra?
- Tránh mất tiền vào tài khoản lừa đảo
- Xác minh người nhận tiền
- Bảo vệ bản thân và gia đình

### Cách kiểm tra
1. Nhập số tài khoản ngân hàng
2. Hệ thống sẽ kiểm tra trong cơ sở dữ liệu
3. Xem kết quả mức độ rủi ro

### Lưu ý quan trọng
- Kiểm tra cả tên người nhận
- Xác nhận qua điện thoại trước khi chuyển
- Giữ lại bằng chứng giao dịch`,
    category: 'search',
    readTime: 2,
    views: 9800,
    helpful: 654
  },
  {
    id: 'scan-website',
    title: 'Quét website bằng AI - Phát hiện lừa đảo',
    excerpt: 'Sử dụng công nghệ AI để phân tích và đánh giá độ an toàn của website',
    content: `## Quét website bằng AI

Công nghệ AI của ScamGuard giúp phát hiện website lừa đảo một cách chính xác.

### Tính năng AI
- **Phân tích nội dung**: Quét từ khóa đáng ngờ
- **Kiểm tra domain**: Tuổi domain, chứng chỉ SSL
- **So sánh mẫu**: Đối chiếu với cơ sở dữ liệu lừa đảo
- **Đánh giá rủi ro**: Cho điểm từ 0-100

### Cách sử dụng
1. Truy cập trang AI Scanner
2. Nhập URL website
3. Đợi AI phân tích (5-30 giây)
4. Xem kết quả chi tiết

### Các dấu hiệu website lừa đảo
- Domain mới tạo gần đây
- Không có chứng chỉ SSL
- Yêu cầu chuyển tiền khẩn cấp
- Lời hứa quà tặng, tiền thưởng`,
    category: 'ai',
    readTime: 4,
    views: 8700,
    helpful: 567
  },
  {
    id: 'how-to-report',
    title: 'Cách báo cáo lừa đảo chi tiết',
    excerpt: 'Hướng dẫn từng bước cách báo cáo một vụ lừa đảo để cảnh báo cộng đồng',
    content: `## Cách báo cáo lừa đảo

Báo cáo lừa đảo giúp cộng đồng an toàn hơn. Mỗi báo cáo đều có giá trị.

### Các bước báo cáo

**Bước 1: Chọn loại lừa đảo**
- Điện thoại
- Ngân hàng
- Website
- Crypto
- Mạng xã hội
- Đầu tư
- Việc làm

**Bước 2: Nhập thông tin**
- Thông tin đối tượng
- Số tiền bị mất (nếu có)
- Mô tả chi tiết

**Bước 3: Tải bằng chứng**
- Ảnh chụp màn hình
- Tin nhắn
- Ảnh chuyển khoản

**Bước 4: Gửi báo cáo**
- Xác nhận thông tin
- Gửi đi
- Nhận mã theo dõi

### Theo dõi báo cáo
Sử dụng mã báo cáo để theo dõi trạng thái.`,
    category: 'report',
    readTime: 5,
    views: 11200,
    helpful: 789
  },
  {
    id: 'report-info',
    title: 'Thông tin cần cung cấp khi báo cáo',
    excerpt: 'Danh sách đầy đủ các thông tin cần thiết để báo cáo hiệu quả',
    content: `## Thông tin cần cung cấp

Để báo cáo được xử lý nhanh và hiệu quả, hãy cung cấp đầy đủ thông tin.

### Thông tin bắt buộc
- Loại lừa đảo
- Thông tin đối tượng (số điện thoại, tài khoản, website)
- Mô tả chi tiết vụ việc

### Thông tin bổ sung
- Số tiền bị mất
- Thời gian xảy ra
- Phương thức liên lạc
- Các bước kẻ lừa đảo đã thực hiện

### Bằng chứng quan trọng
- Tin nhắn SMS, Zalo, Facebook
- Ảnh chuyển khoản
- Ghi âm cuộc gọi
- Email
- Ảnh chụp màn hình website`,
    category: 'report',
    readTime: 3,
    views: 8900,
    helpful: 543
  },
  {
    id: 'scam-signs',
    title: 'Nhận biết các dấu hiệu lừa đảo',
    excerpt: 'Tổng hợp các dấu hiệu cảnh báo lừa đảo phổ biến nhất',
    content: `## Các dấu hiệu lừa đảo

Nhận biết sớm các dấu hiệu lừa đảo giúp bạn tránh bị lừa.

### Dấu hiệu qua điện thoại
- Yêu cầu chuyển tiền khẩn cấp
- Giả danh cơ quan nhà nước
- Đe dọa, hoảng loạn
- Hứa hẹn giải thưởng

### Dấu hiệu qua tin nhắn
- Link lạ yêu cầu đăng nhập
- Mã OTPs được yêu cầu
- Tin nhắn giả mạo ngân hàng
- Thông báo trúng thưởng

### Dấu hiệu qua website
- Giao diện giả mạo
- Domain lạ hoặc sai chính tả
- Không có thông tin pháp lý
- Yêu cầu chuyển tiền trước

### Nguyên tắc phòng tránh
1. Không click link lạ
2. Không cung cấp OTP
3. Không chuyển tiền cho người lạ
4. Xác minh qua kênh chính thức`,
    category: 'safety',
    readTime: 4,
    views: 14500,
    helpful: 1023
  },
];

const helpTopics = [
  {
    id: 'search',
    icon: Search,
    title: 'Tìm kiếm & Kiểm tra',
    description: 'Cách tìm kiếm và kiểm tra số điện thoại, tài khoản, website',
    articleCount: 8,
    color: 'blue'
  },
  {
    id: 'report',
    icon: AlertTriangle,
    title: 'Báo cáo lừa đảo',
    description: 'Hướng dẫn cách báo cáo và theo dõi báo cáo',
    articleCount: 6,
    color: 'danger'
  },
  {
    id: 'account',
    icon: FileText,
    title: 'Tài khoản',
    description: 'Quản lý tài khoản, đăng ký, cài đặt',
    articleCount: 5,
    color: 'success'
  },
  {
    id: 'safety',
    icon: Shield,
    title: 'An toàn & Bảo mật',
    description: 'Bảo vệ bản thân khỏi các thủ đoạn lừa đảo',
    articleCount: 7,
    color: 'warning'
  },
  {
    id: 'ai',
    icon: Zap,
    title: 'Tính năng AI',
    description: 'Sử dụng AI để phát hiện lừa đảo',
    articleCount: 4,
    color: 'primary'
  },
];

const quickActions = [
  { label: 'Kiểm tra điện thoại', href: '/search', icon: Search, color: 'blue' },
  { label: 'Báo cáo lừa đảo', href: '/report', icon: AlertTriangle, color: 'danger' },
  { label: 'Quét website AI', href: '/ai', icon: Zap, color: 'primary' },
  { label: 'Xem FAQ', href: '/faq', icon: BookOpen, color: 'success' },
];

export default function HelpPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !selectedTopic || article.category === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const getTopicColor = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-500/10 text-blue-500',
      danger: 'bg-danger/10 text-danger',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      primary: 'bg-primary/10 text-primary'
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-primary/10 border-b border-bg-border">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Book className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Trung tâm hỗ trợ
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Chúng tôi có thể giúp gì?
              </h1>
              <p className="text-text-secondary mb-8">
                Tìm câu trả lời nhanh chóng hoặc liên hệ hỗ trợ trực tiếp
              </p>
              
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Thao tác nhanh
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card hover className="p-4 text-center h-full border-2 border-transparent hover:border-primary/30">
                    <div className={`w-12 h-12 rounded-xl ${getTopicColor(action.color)} flex items-center justify-center mx-auto mb-3`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-text-main text-sm">{action.label}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Topics */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Chủ đề hỗ trợ
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
              {helpTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    selectedTopic === topic.id 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-bg-card border-bg-border hover:border-primary/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${getTopicColor(topic.color)} flex items-center justify-center mb-3`}>
                    <topic.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-text-main text-sm mb-1">{topic.title}</h3>
                  <p className="text-xs text-text-muted">{topic.articleCount} bài viết</p>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Articles */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                Bài viết phổ biến
              </h2>
              {selectedTopic && (
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="text-sm text-primary hover:underline"
                >
                  Xem tất cả
                </button>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {filteredArticles.slice(0, 6).map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    hover 
                    className={`p-5 h-full transition-all ${
                      expandedArticle === article.id ? 'ring-2 ring-primary/30' : ''
                    }`}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Badge variant="default" className={`text-xs ${getTopicColor(article.category === 'ai' ? 'primary' : article.category === 'safety' ? 'warning' : article.category === 'report' ? 'danger' : 'blue')}`}>
                          {helpTopics.find(t => t.id === article.category)?.title || article.category}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime} phút
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.views}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-text-main mb-2">{article.title}</h3>
                      <p className="text-sm text-text-secondary line-clamp-2">{article.excerpt}</p>
                    </div>
                    
                    <AnimatePresence>
                      {expandedArticle === article.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-4 pt-4 border-t border-bg-border"
                        >
                          <div className="text-sm text-text-secondary whitespace-pre-line">
                            {article.content}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-text-muted">
                              <CheckCircle className="w-4 h-4 text-success" />
                              {article.helpful} người thấy hữu ích
                            </div>
                            <Link href={`/help/${article.id}`}>
                              <Button variant="secondary" size="sm">
                                Đọc tiếp
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {expandedArticle !== article.id && (
                      <button
                        onClick={() => setExpandedArticle(article.id)}
                        className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        Xem chi tiết
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* No results */}
          {filteredArticles.length === 0 && (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-2">Không tìm thấy bài viết phù hợp</p>
              <p className="text-text-muted text-sm mb-4">Thử tìm kiếm với từ khóa khác</p>
              <div className="flex gap-3 justify-center">
                <Link href="/faq">
                  <Button variant="secondary" size="sm">
                    Xem FAQ
                  </Button>
                </Link>
                <Link href="/feedback">
                  <Button variant="primary" size="sm">
                    Liên hệ hỗ trợ
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Contact Section */}
          <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
            <div className="p-8">
              <h2 className="text-xl font-bold text-text-main mb-6 text-center">
                Vẫn cần hỗ trợ?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-main mb-1">Chat trực tiếp</h3>
                  <p className="text-sm text-text-secondary mb-3">Phản hồi nhanh chóng</p>
                  <Button variant="primary" size="sm">Bắt đầu chat</Button>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-main mb-1">Gửi email</h3>
                  <p className="text-sm text-text-secondary mb-3">support@scamguard.vn</p>
                  <Link href="/feedback">
                    <Button variant="secondary" size="sm">Gửi email</Button>
                  </Link>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-main mb-1">Gọi điện</h3>
                  <p className="text-sm text-text-secondary mb-3">1900-xxxx (24/7)</p>
                  <Button variant="secondary" size="sm">Gọi ngay</Button>
                </div>
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
