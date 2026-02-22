'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Users, Zap, Globe, ArrowRight, MapPin, Clock, DollarSign } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

const benefits = [
  { icon: Zap, title: 'Làm việc linh hoạt', description: 'Hybrid hoặc remote' },
  { icon: Users, title: 'Đội ngũ trẻ', description: 'Môi trường năng động' },
  { icon: Globe, title: 'Cơ hội phát triển', description: 'Training & workshop' },
  { icon: Briefcase, title: 'Phúc lợi hấp dẫn', description: 'Bảo hiểm, thưởng' },
];

const jobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Hà Nội / Remote',
    type: 'Full-time',
    salary: '30-50 triệu',
    tags: ['React', 'Next.js', 'TypeScript']
  },
  {
    id: 2,
    title: 'Backend Developer',
    department: 'Engineering',
    location: 'Hà Nội / Remote',
    type: 'Full-time',
    salary: '25-45 triệu',
    tags: ['Node.js', 'PostgreSQL', 'AWS']
  },
  {
    id: 3,
    title: 'Data Analyst',
    department: 'Data',
    location: 'Hà Nội',
    type: 'Full-time',
    salary: '20-35 triệu',
    tags: ['Python', 'SQL', 'Machine Learning']
  },
  {
    id: 4,
    title: 'Product Designer',
    department: 'Product',
    location: 'Hà Nội / Remote',
    type: 'Full-time',
    salary: '25-40 triệu',
    tags: ['Figma', 'UI/UX', 'Design System']
  },
  {
    id: 5,
    title: 'Customer Support Specialist',
    department: 'Operations',
    location: 'Hà Nội',
    type: 'Full-time',
    salary: '15-25 triệu',
    tags: ['Support', 'Vietnamese', 'English']
  },
];

export default function CareersPage() {
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
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Tuyển dụng
              </h1>
              <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
                Tham gia cùng chúng tôi trong sứ mệnh bảo vệ người dùng khỏi lừa đảo trực tuyến
              </p>
              <Link href="#jobs">
                <Button variant="primary" size="lg">
                  Xem vị trí tuyển dụng
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Benefits */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-text-main mb-6 text-center">
              Tại sao chọn ScamGuard?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card hover className="p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-text-main mb-1">{benefit.title}</h3>
                    <p className="text-sm text-text-muted">{benefit.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Jobs */}
          <div id="jobs">
            <h2 className="text-xl font-bold text-text-main mb-6">
              Vị trí đang tuyển dụng ({jobs.length})
            </h2>
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Card hover className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="primary">{job.department}</Badge>
                        </div>
                        <h3 className="font-semibold text-text-main text-lg mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          {job.tags.map((tag, tagIndex) => (
                            <span 
                              key={tagIndex} 
                              className="px-2 py-1 bg-bg-cardHover rounded text-xs text-text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Button variant="secondary" size="sm">
                          Ứng tuyển
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-text-main mb-3">
                Không tìm thấy vị trí phù hợp?
              </h2>
              <p className="text-text-secondary mb-6">
                Gửi CV của bạn cho chúng tôi, chúng tôi sẽ liên hệ khi có cơ hội phù hợp
              </p>
              <Button variant="primary">
                Gửi CV qua email
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
