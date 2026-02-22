'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, ChevronRight } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

export default function PrivacyPage() {
  const { t } = useI18n();

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
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Chính sách bảo mật
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Cam kết bảo vệ thông tin cá nhân của bạn
              </p>
              <p className="text-text-muted text-sm mt-4">
                Cập nhật lần cuối: 20/02/2025
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                1. Thu thập thông tin
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  ScamGuard thu thập các thông tin sau để cung cấp dịch vụ cho bạn:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Thông tin tài khoản:</strong> Email, tên đăng nhập khi bạn đăng ký tài khoản</li>
                  <li><strong>Dữ liệu tìm kiếm:</strong> Các từ khóa bạn tìm kiếm để cải thiện dịch vụ</li>
                  <li><strong>Báo cáo:</strong> Thông tin bạn gửi khi báo cáo vụ lừa đảo</li>
                  <li><strong>Dữ liệu sử dụng:</strong> Thông tin về cách bạn sử dụng dịch vụ</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                2. Sử dụng thông tin
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Chúng tôi sử dụng thông tin thu thập được để:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Cung cấp và duy trì dịch vụ của chúng tôi</li>
                  <li>Cải thiện và cá nhân hóa trải nghiệm người dùng</li>
                  <li>Phân tích dữ liệu để phát hiện xu hướng lừa đảo mới</li>
                  <li>Gửi thông báo về các cập nhật và cảnh báo an ninh</li>
                  <li>Phản hồi các yêu cầu hỗ trợ của bạn</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                3. Chia sẻ thông tin
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Chúng tôi <strong>không bán</strong> thông tin cá nhân của bạn cho bên thứ ba. 
                  Thông tin chỉ được chia sẻ trong các trường hợp sau:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Cộng đồng:</strong> Thông tin về các vụ lừa đảo (số điện thoại, tài khoản) 
                  được hiển thị công khai để cảnh báo người khác</li>
                  <li><strong>Cơ quan chức năng:</strong> Khi được yêu cầu theo pháp luật</li>
                  <li><strong>Dịch vụ bên thứ ba:</strong> Các nhà cung cấp dịch vụ giúp vận hành nền tảng</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                4. Bảo mật dữ liệu
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Chúng tôi cam kết bảo vệ thông tin của bạn bằng các biện pháp bảo mật tiên tiến:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Mã hóa dữ liệu bằng công nghệ SSL/TLS</li>
                  <li>Lưu trữ dữ liệu trên máy chủ an toàn</li>
                  <li>Hạn chế quyền truy cập thông tin</li>
                  <li>Giám sát hệ thống liên tục để phát hiện xâm nhập</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                5. Quyền của bạn
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Bạn có các quyền sau đối với thông tin cá nhân:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Truy cập:</strong> Xem thông tin cá nhân bạn đã cung cấp</li>
                  <li><strong>Chỉnh sửa:</strong> Cập nhật hoặc sửa thông tin không chính xác</li>
                  <li><strong>Xóa:</strong> Yêu cầu xóa thông tin cá nhân</li>
                  <li><strong>Opt-out:</strong> Từ chốc nhận email marketing</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4">6. Liên hệ chúng tôi</h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Nếu bạn có câu hỏi về Chính sách bảo mật này, vui lòng liên hệ:
                </p>
                <div className="space-y-2 text-text-secondary">
                  <p>Email: privacy@scamguard.vn</p>
                  <p>Hotline: 1900-xxxx</p>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
