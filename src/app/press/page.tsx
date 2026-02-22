'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, Mail, Phone, Download, ExternalLink, Calendar, Eye,
  Users, Shield, TrendingUp, Globe, MapPin, MessageCircle,
  Play, FileText, Image, CheckCircle, Send, ChevronRight,
  Twitter, Linkedin, Facebook, Youtube, Instagram, Clock
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

// Press releases data
const pressReleases = [
  {
    id: 1,
    title: 'ScamGuard ra mắt tính năng AI phát hiện lừa đảo',
    date: '15/02/2025',
    excerpt: 'Công nghệ AI tiên tiến giúp phát hiện các tin nhắn và website lừa đảo với độ chính xác 99%.',
    category: 'Sản phẩm',
    readTime: '3 phút',
    views: 4521
  },
  {
    id: 2,
    title: 'ScamGuard đạt mốc 100,000 người dùng',
    date: '10/01/2025',
    excerpt: 'Nền tảng kiểm tra lừa đảo hàng đầu Việt Nam đánh dấu cột mốc quan trọng trong việc bảo vệ cộng đồng khỏi lừa đảo trực tuyến.',
    category: 'Công ty',
    readTime: '2 phút',
    views: 6234
  },
  {
    id: 3,
    title: 'Hợp tác với các cơ quan chức năng chống lừa đảo',
    date: '05/12/2024',
    excerpt: 'ScamGuard ký kết MOU với Cục An ninh mạng và Phòng Cảnh sát hình sự để chia sẻ dữ liệu và phối hợp điều tra.',
    category: 'Đối tác',
    readTime: '4 phút',
    views: 3892
  },
  {
    id: 4,
    title: 'ScamGuard giới thiệu tính năng bản đồ lừa đảo toàn cầu',
    date: '20/11/2024',
    excerpt: 'Công cụ tương tác mới cho phép người dùng xem mật độ lừa đảo theo khu vực trên toàn thế giới.',
    category: 'Sản phẩm',
    readTime: '3 phút',
    views: 5123
  },
  {
    id: 5,
    title: 'ScamGuard gọi vốn thành công 5 triệu USD',
    date: '15/10/2024',
    excerpt: 'Vòng gọi vốn Series A do Quỹ Vietnamese Ventures dẫn đầu để mở rộng nền tảng chống lừa đảo.',
    category: 'Công ty',
    readTime: '4 phút',
    views: 8945
  },
];

// Media assets categories
const mediaAssets = [
  {
    category: 'Logo & Brand',
    items: [
      { name: 'Logo chính thức', type: 'PNG, SVG', size: '2 MB', description: 'Logo đầy đủ màu' },
      { name: 'Logo ngang', type: 'PNG, SVG', size: '1.5 MB', description: 'Logo phiên bản ngang' },
      { name: 'Logo icon', type: 'PNG, SVG', size: '500 KB', description: 'Biểu tượng logo' },
      { name: 'Brand Guidelines', type: 'PDF', size: '3 MB', description: 'Hướng dẫn sử dụng thương hiệu' },
    ]
  },
  {
    category: 'Hình ảnh',
    items: [
      { name: 'Ảnh đội ngũ sáng lập', type: 'JPG', size: '5 MB', description: 'Ảnh chân dung 4 thành viên' },
      { name: 'Ảnh sản phẩm', type: 'JPG, PNG', size: '10 MB', description: 'Giao diện ứng dụng' },
      { name: 'Ảnh văn phòng', type: 'JPG', size: '8 MB', description: 'Không gian làm việc' },
      { name: 'Sự kiện', type: 'JPG', size: '12 MB', description: 'Ảnh các sự kiện' },
    ]
  },
  {
    category: 'Video',
    items: [
      { name: 'Video giới thiệu', type: 'MP4', size: '25 MB', description: 'Video 60 giây' },
      { name: 'Demo sản phẩm', type: 'MP4', size: '35 MB', description: 'Hướng dẫn sử dụng' },
    ]
  }
];

// Executive team
const executives = [
  {
    name: 'Nguyễn Văn A',
    position: 'CEO & Founder',
    bio: 'Hơn 15 năm kinh nghiệm trong lĩnh vực công nghệ và an ninh mạng. Từng làm việc tại nhiều công ty công nghệ lớn.',
    image: 'NVA',
    linkedin: '#'
  },
  {
    name: 'Trần Thị B',
    position: 'CTO',
    bio: 'Chuyên gia AI với 10 năm kinh nghiệm. Thạc sĩ Khoa học Máy tính tại ĐH Stanford.',
    image: 'TTB',
    linkedin: '#'
  },
  {
    name: 'Lê Văn C',
    position: 'COO',
    bio: 'Hơn 12 năm kinh nghiệm quản lý vận hành. Từng làm Director tại các công ty startup công nghệ.',
    image: 'LVC',
    linkedin: '#'
  },
  {
    name: 'Phạm Thị D',
    position: 'VP of Product',
    bio: 'Chuyên gia product với 8 năm kinh nghiệm. Đã xây dựng nhiều sản phẩm thành công.',
    image: 'PTD',
    linkedin: '#'
  }
];

// Media coverage
const mediaCoverage = [
  { outlet: 'VietnamPlus', title: 'ScamGuard - Giải pháp chống lừa đảo trực tuyến', date: '10/02/2025', link: '#' },
  { outlet: 'VTV', title: 'Phóng sự về nền tảng chống lừa đảo ScamGuard', date: '05/02/2025', link: '#' },
  { outlet: 'Tuổi Trẻ', title: 'Startup Việt giúp người dùng tránh lừa đảo online', date: '28/01/2025', link: '#' },
  { outlet: 'ICTNews', title: 'ScamGuard hợp tác với cơ quan chức năng', date: '15/12/2024', link: '#' },
  { outlet: 'TechCrunch', title: 'Vietnamese startup tackles online fraud', date: '10/12/2024', link: '#' },
];

// Company stats
const stats = [
  { value: '100,000+', label: 'Người dùng', icon: Users },
  { value: '50,000+', label: 'Báo cáo lừa đảo', icon: Shield },
  { value: '99.9%', label: 'Độ chính xác', icon: TrendingUp },
  { value: '10+', label: 'Đối tác', icon: Globe },
];

// FAQ for media
const mediaFAQs = [
  {
    question: 'ScamGuard là gì?',
    answer: 'ScamGuard là nền tảng kiểm tra lừa đảo trực tuyến hàng đầu Việt Nam, giúp người dùng xác minh số điện thoại, tài khoản ngân hàng, website và địa chỉ ví crypto có bị báo cáo là lừa đảo hay không.'
  },
  {
    question: 'Làm thế nào để liên hệ hợp tác truyền thông?',
    answer: 'Bạn có thể gửi email đến press@scamguard.vn hoặc điền form liên hệ bên dưới. Đội ngũ truyền thông sẽ phản hồi trong vòng 24 giờ.'
  },
  {
    question: 'ScamGuard có những đối tác nào?',
    answer: 'Chúng tôi hợp tác với Cục An ninh mạng, Phòng Cảnh sát hình sự, và nhiều tổ chức khác trong việc chia sẻ dữ liệu và phối hợp chống lừa đảo.'
  },
  {
    question: 'Tôi có thể sử dụng logo ScamGuard cho bài viết không?',
    answer: 'Có, bạn có thể tải logo và brand assets từ mục Tài nguyên truyền thông. Vui lòng tuân theo Brand Guidelines khi sử dụng.'
  }
];

export default function PressPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [selectedRelease, setSelectedRelease] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    media: '',
    message: ''
  });

  const categories = ['Tất cả', 'Sản phẩm', 'Công ty', 'Đối tác'];

  const filteredReleases = activeCategory === 'Tất cả' 
    ? pressReleases 
    : pressReleases.filter(r => r.category === activeCategory);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cảm ơn liên hệ của bạn! Chúng tôi sẽ phản hồi sớm.');
    setContactForm({ name: '', email: '', media: '', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-primary/10 border-b border-bg-border">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Badge variant="primary" className="mb-4">Media Center</Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-text-main mb-4">
                Trang <span className="text-primary">Báo chí</span>
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto mb-8">
                Tin tức, thông cáo và tài nguyên truyền thông về ScamGuard
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-bg-card/50 backdrop-blur-sm rounded-xl p-4">
                    <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-text-main">{stat.value}</p>
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Quick Contact Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card hover className="p-6 text-center">
              <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-text-main mb-1">Email</h3>
              <p className="text-sm text-text-muted mb-3">press@scamguard.vn</p>
              <a href="mailto:press@scamguard.vn">
                <Button variant="secondary" size="sm" className="w-full">Gửi email</Button>
              </a>
            </Card>
            <Card hover className="p-6 text-center">
              <Phone className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-text-main mb-1">Hotline</h3>
              <p className="text-sm text-text-muted mb-3">1900-xxxx (24/7)</p>
              <Button variant="secondary" size="sm" className="w-full">Gọi ngay</Button>
            </Card>
            <Card hover className="p-6 text-center">
              <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-text-main mb-1">Zalo</h3>
              <p className="text-sm text-text-muted mb-3">ScamGuard Official</p>
              <Button variant="secondary" size="sm" className="w-full">Liên hệ</Button>
            </Card>
          </div>

          {/* Press Releases Section */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-text-main">
                Thông cáo báo chí <span className="text-text-muted font-normal">({pressReleases.length})</span>
              </h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-bg-card text-text-secondary hover:bg-bg-cardHover'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    hover 
                    className={`p-6 ${selectedRelease === release.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedRelease(selectedRelease === release.id ? null : release.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="primary">{release.category}</Badge>
                          <span className="text-sm text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {release.date}
                          </span>
                          <span className="text-sm text-text-muted flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {release.views}
                          </span>
                          <span className="text-sm text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {release.readTime}
                          </span>
                        </div>
                        <h3 className="font-semibold text-text-main text-lg mb-2">{release.title}</h3>
                        <AnimatePresence>
                          {selectedRelease === release.id ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <p className="text-text-secondary pt-2 border-t border-bg-border">
                                {release.excerpt}
                              </p>
                              <p className="text-text-secondary mt-3">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                              </p>
                            </motion.div>
                          ) : (
                            <p className="text-text-secondary line-clamp-2">{release.excerpt}</p>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Đọc chi tiết
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Executive Team Section */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-text-main mb-6">Đội ngũ lãnh đạo</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {executives.map((exec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card hover className="p-5 text-center h-full">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold">
                      {exec.image}
                    </div>
                    <h3 className="font-semibold text-text-main">{exec.name}</h3>
                    <p className="text-sm text-primary mb-2">{exec.position}</p>
                    <p className="text-xs text-text-muted line-clamp-3">{exec.bio}</p>
                    <a href={exec.linkedin} className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                      <Linkedin className="w-3 h-3" />
                      LinkedIn
                    </a>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Media Coverage Section */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-text-main mb-6">Đưa tin trên báo chí</h2>
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-bg-border">
                {mediaCoverage.map((coverage, index) => (
                  <a 
                    key={index} 
                    href={coverage.link}
                    className="flex items-center justify-between p-4 hover:bg-bg-cardHover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-main">{coverage.title}</p>
                        <p className="text-sm text-text-muted">{coverage.outlet} • {coverage.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  </a>
                ))}
              </div>
            </Card>
          </section>

          {/* Media Assets Section */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-text-main mb-6">Tài nguyên truyền thông</h2>
            <div className="space-y-6">
              {mediaAssets.map((category, catIndex) => (
                <div key={catIndex}>
                  <h3 className="font-semibold text-text-main mb-3 flex items-center gap-2">
                    {catIndex === 0 ? <Image className="w-4 h-4" /> : 
                     catIndex === 1 ? <Image className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {category.category}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {category.items.map((asset, assetIndex) => (
                      <Card key={assetIndex} hover className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-text-main text-sm">{asset.name}</h4>
                            <p className="text-xs text-text-muted mb-2">{asset.description}</p>
                            <p className="text-xs text-text-muted">
                              {asset.type} • {asset.size}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ for Media */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-text-main mb-6">Câu hỏi thường gặp cho media</h2>
            <div className="space-y-3">
              {mediaFAQs.map((faq, index) => (
                <Card key={index} hover className="p-5">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h3 className="font-medium text-text-main">{faq.question}</h3>
                      <ChevronRight className="w-5 h-5 text-text-muted group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-text-secondary text-sm mt-3 pt-3 border-t border-bg-border">
                      {faq.answer}
                    </p>
                  </details>
                </Card>
              ))}
            </div>
          </section>

          {/* Social Media */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-text-main mb-6">Theo dõi chúng tôi</h2>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors">
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1DA1F2]/90 transition-colors">
                <Twitter className="w-5 h-5" />
                <span>Twitter</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#0A66C2]/90 transition-colors">
                <Linkedin className="w-5 h-5" />
                <span>LinkedIn</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#FF0000]/90 transition-colors">
                <Youtube className="w-5 h-5" />
                <span>YouTube</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#E4405F] text-white rounded-lg hover:bg-[#E4405F]/90 transition-colors">
                <Instagram className="w-5 h-5" />
                <span>Instagram</span>
              </a>
            </div>
          </section>

          {/* Contact Form */}
          <section>
            <h2 className="text-xl font-bold text-text-main mb-6">Liên hệ truyền thông</h2>
            <Card className="p-6 md:p-8">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">Họ và tên *</label>
                    <Input
                      type="text"
                      placeholder="Nhập họ và tên"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">Email *</label>
                    <Input
                      type="email"
                      placeholder="Nhập email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Tên phương tiện truyền thông *</label>
                  <Input
                    type="text"
                    placeholder="Tên báo, tạp chí, kênh..."
                    value={contactForm.media}
                    onChange={(e) => setContactForm({...contactForm, media: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Nội dung *</label>
                  <textarea
                    placeholder="Mô tả yêu cầu của bạn..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    className="w-full p-4 bg-bg-card border border-bg-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none h-32"
                    required
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full md:w-auto">
                  <Send className="w-5 h-5 mr-2" />
                  Gửi yêu cầu
                </Button>
              </form>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
