'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Shield, Users, Mail } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

export default function TermsPage() {
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
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Điều khoản sử dụng
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Quy định và điều kiện khi sử dụng dịch vụ ScamGuard
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
                1. Chấp nhận điều khoản
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed">
                  Bằng việc truy cập và sử dụng dịch vụ ScamGuard, bạn xác nhận rằng bạn đã đọc, 
                  hiểu và đồng ý tuân thủ các Điều khoản sử dụng này. Nếu bạn không đồng ý với 
                  bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng tôi.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                2. Mô tả dịch vụ
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  ScamGuard cung cấp nền tảng kiểm tra và báo cáo lừa đảo trực tuyến, bao gồm:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Tìm kiếm và kiểm tra số điện thoại, tài khoản ngân hàng</li>
                  <li>Kiểm tra website và địa chỉ ví crypto</li>
                  <li>Báo cáo vụ lừa đảo</li>
                  <li>Công cụ phân tích AI</li>
                  <li>Cảnh báo và thông báo về các mối đe dọa mới</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                3. Trách nhiệm người dùng
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Khi sử dụng dịch vụ, bạn đồng ý:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Cung cấp thông tin chính xác và trung thực</li>
                  <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                  <li>Không cố gắng xâm nhập hoặc gây hại cho hệ thống</li>
                  <li>Không đăng tải nội dung lừa đảo hoặc sai sự thật</li>
                  <li>Tôn trọng quyền của người dùng khác</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                4. Hạn chế trách nhiệm
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  ScamGuard cung cấp thông tin dựa trên dữ liệu báo cáo từ cộng đồng. Chúng tôi:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Không đảm bảo 100% chính xác của thông tin</li>
                  <li>Không chịu trách nhiệm về thiệt hại phát sinh từ việc sử dụng thông tin</li>
                  <li>Không xác minh tính hợp pháp của các giao dịch</li>
                  <li>Không cung cốp dịch vụ tài chính hoặc pháp lý</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4">
                5. Quyền sở hữu trí tuệ
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed">
                  Tất cả nội dung, tính năng và chức năng của ScamGuard là tài sản của chúng tôi 
                  và được bảo vệ bởi luật sở hữu trí tuệ Việt Nam và quốc tế. Bạn không được phép 
                  sao chép, phân phối, tạo tác phẩm phái sinh mà không có sự đồng ý bằng văn bản của chúng tôi.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4">
                6. Chấm dứt dịch vụ
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed">
                  Chúng tôi có quyền chấm dứt hoặc tạm ngừng quyền truy cập của bạn vào dịch vụ 
                  bất kỳ lúc nào, nếu chúng tôi cho rằng bạn đã vi phạm các Điều khoản sử dụng này 
                  hoặc có hành vi gây hại cho người dùng khác hoặc hệ thống.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                7. Liên hệ
              </h2>
              <Card className="p-6">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Nếu bạn có câu hỏi về Điều khoản sử dụng này, vui lòng liên hệ:
                </p>
                <div className="space-y-2 text-text-secondary">
                  <p>Email: legal@scamguard.vn</p>
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
