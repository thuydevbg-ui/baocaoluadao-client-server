'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Phone, Building2, Globe, Wallet, Facebook, 
  TrendingUp, Briefcase, CheckCircle, ArrowRight, Upload,
  AlertTriangle, MessageSquare, ChevronRight, ChevronLeft,
  Camera, File, X, Clock, Shield, Search, Check
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface UploadedEvidence {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'document';
}

const scamTypes = [
  { 
    key: 'phone', 
    icon: Phone, 
    label: 'Lừa đảo qua điện thoại', 
    description: 'Gọi điện, tin nhắn SMS, Zalo lừa đảo',
    examples: ['Gọi điện yêu cầu chuyển tiền', 'Tin nhắn SMS lừa đảo', 'Zalo lừa đảo'] 
  },
  { 
    key: 'bank', 
    icon: Building2, 
    label: 'Lừa đảo ngân hàng', 
    description: 'Tài khoản, thẻ, chuyển tiền giả',
    examples: ['Tài khoản lừa đảo', 'Chuyển tiền giả', 'ATM giả'] 
  },
  { 
    key: 'website', 
    icon: Globe, 
    label: 'Lừa đảo website', 
    description: 'Shop giả, website lừa đảo, Phishing',
    examples: ['Shop giả mạo', 'Website lừa đảo', 'Phishing'] 
  },
  { 
    key: 'crypto', 
    icon: Wallet, 
    label: 'Lừa đảo crypto', 
    description: 'Sàn coin, ICO, ví giả',
    examples: ['Sàn coin lừa đảo', 'ICO lừa đảo', 'Ví giả'] 
  },
  { 
    key: 'social', 
    icon: Facebook, 
    label: 'Mạng xã hội', 
    description: 'Fanpage, tài khoản giả, quyên góp lừa đảo',
    examples: ['Fanpage giả', 'Tài khoản giả', 'Quyên góp lừa đảo'] 
  },
  { 
    key: 'investment', 
    icon: TrendingUp, 
    label: 'Đầu tư', 
    description: 'Đa cấp, Ponzi, đầu tư lừa đảo',
    examples: ['Đa cấp', 'Ponzi', 'Đầu tư lừa đảo'] 
  },
  { 
    key: 'job', 
    icon: Briefcase, 
    label: 'Việc làm', 
    description: 'Tuyển dụng, việc nhẹ lương cao, đặt cọc',
    examples: ['Tuyển dụng lừa đảo', 'Việc nhẹ lương cao', 'Đặt cọc'] 
  },
];

const wizardSteps: WizardStep[] = [
  { id: 1, title: 'Chọn loại lừa đảo', description: 'Xác định loại lừa đảo' },
  { id: 2, title: 'Nhập thông tin', description: 'Điền thông tin về đối tượng' },
  { id: 3, title: 'Tải bằng chứng', description: 'Thêm ảnh, tin nhắn làm bằng chứng' },
  { id: 4, title: 'Xác nhận & Gửi', description: 'Xem lại và gửi báo cáo' },
];

export default function ReportGuidePage() {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    account: '',
    website: '',
    amount: '',
    description: '',
    contact: '',
    date: '',
  });
  const [uploadedEvidence, setUploadedEvidence] = useState<UploadedEvidence[]>([]);
  const [progress, setProgress] = useState(25);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedEvidence[] = Array.from(files).slice(0, 10 - uploadedEvidence.length).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'document'
    }));

    setUploadedEvidence([...uploadedEvidence, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedEvidence(uploadedEvidence.filter(f => f.id !== id));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setProgress((currentStep + 1) * 25);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgress((currentStep - 1) * 25);
    }
  };

  const handleSubmit = () => {
    const id = 'RP' + Date.now().toString(36).toUpperCase();
    setReportId(id);
    setSubmitted(true);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedType;
      case 2:
        return formData.description.length > 10;
      case 3:
        return true;
      default:
        return true;
    }
  };

  if (submitted) {
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
                Báo cáo đã được gửi!
              </h1>
              <p className="text-text-secondary mb-2">
                Cảm ơn bạn đã báo cáo. Đội ngũ ScamGuard sẽ xem xét và xử lý trong 1-3 ngày.
              </p>
              <div className="bg-bg-card rounded-lg p-3 inline-block mb-8">
                <p className="text-sm text-text-muted">Mã theo dõi:</p>
                <p className="text-lg font-mono font-bold text-primary">{reportId}</p>
              </div>
              
              <div className="bg-bg-card rounded-xl p-6 text-left mb-8">
                <h3 className="font-semibold text-text-main mb-3">Bạn có thể:</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Theo dõi trạng thái báo cáo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Gửi thêm bằng chứng bổ sung
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Chia sẻ để cảnh báo cộng đồng
                  </li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/">
                  <Button variant="secondary">
                    Về trang chủ
                  </Button>
                </Link>
                <Link href="/report">
                  <Button variant="primary">
                    Báo cáo thêm
                  </Button>
                </Link>
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
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <FileText className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Hướng dẫn báo cáo
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">
                Báo cáo lừa đảo
              </h1>
              <p className="text-text-secondary max-w-2xl mx-auto mb-6">
                Báo cáo của bạn giúp cộng đồng an toàn hơn. Hoàn thành các bước dưới đây để gửi báo cáo hiệu quả
              </p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  {wizardSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        currentStep >= step.id
                          ? 'bg-primary text-white'
                          : 'bg-bg-card text-text-muted'
                      }`}
                    >
                      {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-text-muted mt-2">
                  Bước {currentStep}: {wizardSteps[currentStep - 1].title}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Type */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold text-text-main mb-2">
                  Bước 1: Chọn loại lừa đảo
                </h2>
                <p className="text-text-secondary mb-6">
                  Chọn loại lừa đảo mà bạn muốn báo cáo
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                  {scamTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setSelectedType(type.key)}
                      className={`p-4 rounded-xl text-left transition-all border ${
                        selectedType === type.key
                          ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                          : 'bg-bg-card border-bg-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedType === type.key ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-main">{type.label}</h3>
                          <p className="text-xs text-text-muted mt-1">{type.description}</p>
                        </div>
                        {selectedType === type.key && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Enter Information */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold text-text-main mb-2">
                  Bước 2: Nhập thông tin
                </h2>
                <p className="text-text-secondary mb-6">
                  Điền thông tin chi tiết về vụ lừa đảo
                </p>

                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedType === 'phone' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-text-main mb-2">
                            Số điện thoại lừa đảo
                          </label>
                          <Input
                            type="tel"
                            placeholder="Nhập số điện thoại"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      )}
                      {selectedType === 'bank' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-text-main mb-2">
                            Số tài khoản ngân hàng
                          </label>
                          <Input
                            type="text"
                            placeholder="Nhập số tài khoản"
                            value={formData.account}
                            onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                          />
                        </div>
                      )}
                      {selectedType === 'website' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-text-main mb-2">
                            Đường dẫn website
                          </label>
                          <Input
                            type="url"
                            placeholder="https://..."
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Số tiền bị mất (nếu có)
                        </label>
                        <Input
                          type="text"
                          placeholder="Ví dụ: 5.000.000 VNĐ"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Ngày xảy ra
                        </label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-main mb-2">
                        Mô tả chi tiết vụ việc <span className="text-danger">*</span>
                      </label>
                      <textarea
                        placeholder="Mô tả chi tiết diễn biến vụ việc, bao gồm:\n- Ai liên lạc với bạn?\n- Họ yêu cầu gì?\n- Bạn đã làm gì?\n- Kết quả như thế nào?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-4 bg-bg-card border border-bg-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none h-40"
                      />
                      <p className="text-xs text-text-muted mt-2 text-right">
                        {formData.description.length} / 2000 ký tự
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-main mb-2">
                        Thông tin liên hệ của bạn (để nhận cập nhật)
                      </label>
                      <Input
                        type="email"
                        placeholder="Email hoặc số điện thoại"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Upload Evidence */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold text-text-main mb-2">
                  Bước 3: Tải bằng chứng
                </h2>
                <p className="text-text-secondary mb-6">
                  Thêm hình ảnh, tin nhắn, hoặc tài liệu làm bằng chứng (khuyến khích)
                </p>

                <Card className="p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-bg-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                    <p className="text-text-main font-medium mb-1">
                      Click để tải lên bằng chứng
                    </p>
                    <p className="text-sm text-text-muted">
                      PNG, JPG, GIF, PDF - Tối đa 10MB mỗi file
                    </p>
                  </div>

                  {/* Preview */}
                  {uploadedEvidence.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-text-main mb-3">
                        Đã tải lên ({uploadedEvidence.length})
                      </h4>
                      <div className="grid grid-cols-4 gap-3">
                        {uploadedEvidence.map((file) => (
                          <div
                            key={file.id}
                            className="relative aspect-square rounded-lg overflow-hidden bg-bg-card group"
                          >
                            {file.type === 'image' ? (
                              <img 
                                src={file.preview} 
                                alt="Evidence" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <File className="w-8 h-8 text-text-muted" />
                              </div>
                            )}
                            <button
                              onClick={() => removeFile(file.id)}
                              className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-danger transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="mt-6 p-4 bg-success/5 rounded-lg border border-success/20">
                    <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Mẹo bằng chứng hiệu quả
                    </h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      <li>• Ảnh chụp màn hình tin nhắn lừa đảo</li>
                      <li>• Ảnh chuyển khoản/thanh toán</li>
                      <li>• Ghi âm cuộc gọi (nếu có)</li>
                      <li>• Email hoặc các tin nhắn liên quan</li>
                    </ul>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Confirm & Submit */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold text-text-main mb-2">
                  Bước 4: Xác nhận & Gửi
                </h2>
                <p className="text-text-secondary mb-6">
                  Xem lại thông tin trước khi gửi báo cáo
                </p>

                <Card className="p-6">
                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-bg-border">
                      <span className="text-text-muted">Loại lừa đảo</span>
                      <Badge variant="danger">
                        {scamTypes.find(t => t.key === selectedType)?.label}
                      </Badge>
                    </div>
                    
                    {formData.phone && (
                      <div className="flex items-center justify-between py-3 border-b border-bg-border">
                        <span className="text-text-muted">Số điện thoại</span>
                        <span className="text-text-main font-medium">{formData.phone}</span>
                      </div>
                    )}
                    
                    {formData.account && (
                      <div className="flex items-center justify-between py-3 border-b border-bg-border">
                        <span className="text-text-muted">Tài khoản</span>
                        <span className="text-text-main font-medium">{formData.account}</span>
                      </div>
                    )}
                    
                    {formData.website && (
                      <div className="flex items-center justify-between py-3 border-b border-bg-border">
                        <span className="text-text-muted">Website</span>
                        <span className="text-text-main font-medium">{formData.website}</span>
                      </div>
                    )}
                    
                    {formData.amount && (
                      <div className="flex items-center justify-between py-3 border-b border-bg-border">
                        <span className="text-text-muted">Số tiền bị mất</span>
                        <span className="text-danger font-medium">{formData.amount}</span>
                      </div>
                    )}
                    
                    <div className="py-3 border-b border-bg-border">
                      <span className="text-text-muted block mb-2">Mô tả vụ việc</span>
                      <p className="text-text-main text-sm whitespace-pre-line">{formData.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-bg-border">
                      <span className="text-text-muted">Bằng chứng</span>
                      <span className="text-text-main">{uploadedEvidence.length} file</span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="mt-6 p-4 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-text-main mb-1">
                          Xác nhận thông tin
                        </h4>
                        <p className="text-xs text-text-muted">
                          Bạn xác nhận rằng thông tin cung cấp là chính xác. Báo cáo sai có thể ảnh hưởng đến người vô tội.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            
            {currentStep < 4 ? (
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Tiếp theo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Gửi báo cáo
              </Button>
            )}
          </div>

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-text-main mb-2">
                  Báo cáo của bạn được bảo mật
                </h3>
                <p className="text-sm text-text-secondary">
                  Thông tin cá nhân của bạn sẽ được bảo mật và chỉ sử dụng để xử lý báo cáo. 
                  Chúng tôi không chia sẻ thông tin với bên thứ ba.
                </p>
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
