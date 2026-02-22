'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, CheckCircle, Star, Mail, ThumbsUp, ThumbsDown, 
  Upload, X, FileImage, Phone, MessageCircle, AlertCircle, 
  Lightbulb, Bug, Palette, HelpCircle, ChevronRight
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

const ratings = [
  { value: 1, icon: ThumbsDown, label: 'Rất không hài lòng', color: 'text-danger' },
  { value: 2, icon: ThumbsDown, label: 'Không hài lòng', color: 'text-warning' },
  { value: 3, icon: Star, label: 'Bình thường', color: 'text-text-muted' },
  { value: 4, icon: ThumbsUp, label: 'Hài lòng', color: 'text-success' },
  { value: 5, icon: Star, label: 'Rất hài lòng', color: 'text-primary' },
];

const categories = [
  { id: 'feature', label: 'Góp ý tính năng', icon: Lightbulb, description: 'Đề xuất tính năng mới' },
  { id: 'bug', label: 'Báo cáo lỗi', icon: Bug, description: 'Báo lỗi hệ thống' },
  { id: 'ui', label: 'Góp ý giao diện', icon: Palette, description: 'Cải thiện giao diện' },
  { id: 'support', label: 'Hỗ trợ khác', icon: HelpCircle, description: 'Các vấn đề khác' },
];

const quickQuestions = [
  'Làm sao để kiểm tra số điện thoại?',
  'Cách báo cáo lừa đảo?',
  'Làm sao liên hệ hỗ trợ?',
  'Tính năng AI hoạt động như thế nào?',
];

export default function FeedbackPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [priority, setPriority] = useState('normal');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).slice(0, 5 - uploadedFiles.length).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file)
    }));

    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate submission ID
    const id = 'FB' + Date.now().toString(36).toUpperCase();
    setSubmissionId(id);
    setIsSubmitted(true);
    showToast('success', 'Cảm ơn góp ý của bạn!');
  };

  const isValid = message && category;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1 pt-20 pb-20 md:pb-8">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-text-main mb-4">
                Cảm ơn góp ý của bạn!
              </h1>
              <p className="text-text-secondary mb-2">
                Chúng tôi đã nhận được góp ý của bạn và sẽ xem xét để cải thiện dịch vụ.
              </p>
              <div className="bg-bg-card rounded-lg p-3 inline-block mb-8">
                <p className="text-sm text-text-muted">Mã theo dõi:</p>
                <p className="text-lg font-mono font-bold text-primary">{submissionId}</p>
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/">
                  <Button variant="secondary">
                    Về trang chủ
                  </Button>
                </Link>
                <Button variant="primary" onClick={() => {
                  setIsSubmitted(false);
                  setRating(null);
                  setCategory('');
                  setMessage('');
                  setEmail('');
                  setName('');
                  setPhone('');
                  setUploadedFiles([]);
                }}>
                  Gửi thêm góp ý
                </Button>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
        <MobileNav />
      </div>
    );
  }

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
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Phản hồi & Góp ý
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Góp ý & Phản hồi
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Chia sẻ ý kiến của bạn để giúp chúng tôi cải thiện dịch vụ tốt hơn
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
          {/* Quick Questions */}
          <Card className="mb-6 p-5 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-text-main mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Câu hỏi thường gặp
            </h3>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <Link key={i} href="/faq">
                  <Badge variant="default" className="cursor-pointer hover:bg-primary/20 transition-colors">
                    {q}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              {/* Rating */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-main mb-3">
                  Mức độ hài lòng của bạn <span className="text-text-muted font-normal">(không bắt buộc)</span>
                </label>
                <div className="flex justify-between gap-2">
                  {ratings.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(r.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all flex-1 ${
                        rating === r.value
                          ? 'bg-primary/20 text-primary ring-2 ring-primary'
                          : 'bg-bg-cardHover text-text-muted hover:text-text-secondary hover:bg-bg-cardHover/80'
                      }`}
                    >
                      <r.icon className={`w-6 h-6 ${rating === r.value ? r.color : ''}`} />
                      <span className="text-xs">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-main mb-3">
                  Chủ đề <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-4 rounded-xl text-left transition-all border ${
                        category === cat.id
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-bg-cardHover border-transparent text-text-secondary hover:text-text-main hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <cat.icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium text-sm">{cat.label}</div>
                          <div className="text-xs opacity-70">{cat.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Info */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-main mb-3">
                  Thông tin liên hệ <span className="text-text-muted font-normal">(không bắt buộc)</span>
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Họ và tên"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                      👤
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  </div>
                </div>
                <div className="mt-4 relative">
                  <Input
                    type="email"
                    placeholder="Email của bạn (để chúng tôi có thể phản hồi)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                </div>
              </div>

              {/* Priority */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-main mb-3">
                  Mức độ ưu tiên
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'low', label: 'Thấp', color: 'text-success' },
                    { value: 'normal', label: 'Bình thường', color: 'text-primary' },
                    { value: 'high', label: 'Cao', color: 'text-danger' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        priority === p.value
                          ? 'bg-primary text-white'
                          : 'bg-bg-cardHover text-text-secondary hover:text-text-main'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-main mb-3">
                  Nội dung góp ý <span className="text-danger">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Chia sẻ ý kiến của bạn...\n\nMô tả chi tiết vấn đề hoặc đề xuất của bạn để chúng tôi có thể hiểu và xử lý tốt hơn."
                  className="w-full p-4 bg-bg-card border border-bg-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none h-40"
                  required
                />
                <p className="text-xs text-text-muted mt-2 text-right">
                  {message.length} / 2000 ký tự
                </p>
              </div>

              {/* File Upload */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-main mb-3">
                  Đính kèm hình ảnh <span className="text-text-muted font-normal">(tối đa 5 ảnh, mỗi ảnh tối đa 5MB)</span>
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-bg-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">
                    Click để tải lên hình ảnh
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    PNG, JPG, GIF - Tối đa 5MB
                  </p>
                </div>

                {/* Preview */}
                <AnimatePresence>
                  {uploadedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-5 gap-2 mt-4"
                    >
                      {uploadedFiles.map((file) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-lg overflow-hidden bg-bg-card"
                        >
                          <img 
                            src={file.preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-danger transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full"
                disabled={!isValid}
              >
                <Send className="w-5 h-5 mr-2" />
                Gửi góp ý
              </Button>
            </form>
          </Card>

          {/* Alternative contact */}
          <Card className="mt-6 p-6 bg-warning/5 border-warning/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-text-main mb-2">Cần hỗ trợ khẩn cấp?</h3>
                <p className="text-sm text-text-secondary mb-3">
                  Nếu bạn cần hỗ trợ ngay lập tức hoặc có câu hỏi cụ thể:
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/help">
                    <Button variant="secondary" size="sm">
                      Xem trung tâm hỗ trợ
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-warning/20 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Email:</p>
                <p className="text-text-main font-medium">support@scamguard.vn</p>
              </div>
              <div>
                <p className="text-text-muted">Hotline:</p>
                <p className="text-text-main font-medium">1900-xxxx (24/7)</p>
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
