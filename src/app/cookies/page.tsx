'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cookie, Shield, Settings, ChevronRight } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

export default function CookiesPage() {
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
                <Cookie className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Chính sách Cookie
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Tìm hiểu cách chúng tôi sử dụng cookie và công nghệ theo dõi tương tự
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
                1. Cookie là gì?
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed">
                  Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi truy cập website. 
                  Chúng giúp website hoạt động hiệu quả hơn và cung cấp thông tin cho chủ sở hữu website.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                2. Chúng tôi sử dụng cookie như thế nào?
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  ScamGuard sử dụng cookie cho các mục đích sau:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Cookie cần thiết:</strong> Để website hoạt động, đăng nhập và bảo mật</li>
                  <li><strong>Cookie phân tích:</strong> Để hiểu cách người dùng sử dụng website</li>
                  <li><strong>Cookie chức năng:</strong> Để ghi nhớ sở thích và cài đặt của bạn</li>
                  <li><strong>Cookie quảng cáo:</strong> Để hiển thị nội dung phù hợp với bạn</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                3. Quản lý cookie
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Bạn có thể kiểm soát hoặc xóa cookie bất kỳ lúc nào:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Thay đổi cài đặt trình duyệt</li>
                  <li>Xóa cookie đã lưu</li>
                  <li>Chặn cookie mới</li>
                </ul>
                <p className="text-text-secondary leading-relaxed">
                  Lưu ý: Nếu bạn chặn cookie, một số tính năng của website có thể không hoạt động đúng.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4">
                4. Các loại cookie chúng tôi sử dụng
              </h2>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="border-b border-bg-border pb-4">
                    <h3 className="font-semibold text-text-main mb-2">Cookie phiên</h3>
                    <p className="text-sm text-text-secondary">
                      Tạm thời lưu trữ khi bạn đang truy cập website, bị xóa khi đóng trình duyệt.
                    </p>
                  </div>
                  <div className="border-b border-bg-border pb-4">
                    <h3 className="font-semibold text-text-main mb-2">Cookie vĩnh viễn</h3>
                    <p className="text-sm text-text-secondary">
                      Lưu trữ trong thời gian dài để ghi nhớ sở thích và cài đặt của bạn.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-main mb-2">Cookie bên thứ ba</h3>
                    <p className="text-sm text-text-secondary">
                      Được đặt bởi các dịch vụ bên thứ cha như Google Analytics, Facebook Pixel.
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4">
                5. Cập nhật chính sách
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed">
                  Chúng tôi có thể cập nhật Chính sách Cookie này bất kỳ lúc nào. Mọi thay đổi sẽ 
                  được đăng tải trên trang này. Chúng tôi khuyến khích bạn kiểm tra định kỳ để 
                  cập nhật thông tin mới nhất.
                </p>
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
