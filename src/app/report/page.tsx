'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Building2, Globe, Wallet, Facebook, TrendingUp, Briefcase, ArrowLeft, ArrowRight, Upload, X, Check, Sparkles, LucideIcon } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card, Input, Modal } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type ScamType = 'phone' | 'bank' | 'website' | 'crypto' | 'social' | 'investment' | 'job';

interface ReportData {
  type: ScamType | null;
  phone: string;
  bankAccount: string;
  website: string;
  telegram: string;
  facebook: string;
  amount: string;
  description: string;
  images: string[];
}

const scamTypes: { key: ScamType; icon: LucideIcon; label: string; color: string }[] = [
  { key: 'phone', icon: Phone, label: 'report.scam_types.phone', color: 'from-blue-500 to-cyan-400' },
  { key: 'bank', icon: Building2, label: 'report.scam_types.bank', color: 'from-purple-500 to-pink-400' },
  { key: 'website', icon: Globe, label: 'report.scam_types.website', color: 'from-green-500 to-emerald-400' },
  { key: 'crypto', icon: Wallet, label: 'report.scam_types.crypto', color: 'from-orange-500 to-amber-400' },
  { key: 'social', icon: Facebook, label: 'report.scam_types.social', color: 'from-blue-400 to-indigo-400' },
  { key: 'investment', icon: TrendingUp, label: 'report.scam_types.investment', color: 'from-yellow-500 to-orange-400' },
  { key: 'job', icon: Briefcase, label: 'report.scam_types.job', color: 'from-teal-500 to-cyan-400' },
];

function ReportPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [reportData, setReportData] = useState<ReportData>({
    type: null,
    phone: '',
    bankAccount: '',
    website: '',
    telegram: '',
    facebook: '',
    amount: '',
    description: '',
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const imageUrlsRef = React.useRef<string[]>([]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Get initial type from URL
  React.useEffect(() => {
    const type = searchParams.get('type') as ScamType;
    if (type && scamTypes.find(s => s.key === type)) {
      setReportData(prev => ({ ...prev, type }));
      setStep(2);
    }
  }, [searchParams]);

  const updateData = <K extends keyof ReportData>(field: K, value: ReportData[K]) => {
    setReportData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !reportData.type) {
      showToast('warning', 'Please select a scam type');
      return;
    }
    if (step === 2) {
      // Validate phone number if provided (supports 0xxxxxxxxx, +84xxxxxxxxx, 84xxxxxxxxx)
      if (reportData.phone && !/^(\+84|84|0)\d{9,10}$/.test(reportData.phone.replace(/\s/g, ''))) {
        showToast('warning', 'Invalid phone number format');
        return;
      }
      // Validate URL if provided
      if (reportData.website && !/^https?:\/\/.+/.test(reportData.website)) {
        showToast('warning', 'Invalid website URL');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!reportData.type) {
      showToast('warning', 'Please select a scam type');
      return;
    }
    if (!reportData.description.trim()) {
      showToast('warning', 'Please provide a description');
      return;
    }
    
    setIsSubmitting(true);
    // TODO: Replace with actual API call to backend
    // Example: await fetch('/api/reports', { method: 'POST', body: JSON.stringify(reportData) })
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
      const MAX_FILES = 10;
      
      // Filter files by size and limit total count
      const validFiles = Array.from(files).filter((f) => {
        if (f.size > MAX_SIZE) {
          showToast('warning', `File ${f.name} exceeds 5MB limit`);
          return false;
        }
        return true;
      });
      
      const currentCount = reportData.images.length;
      const availableSlots = MAX_FILES - currentCount;
      const filesToAdd = validFiles.slice(0, availableSlots);
      
      if (filesToAdd.length < validFiles.length) {
        showToast('warning', `Only ${availableSlots} files can be uploaded (max ${MAX_FILES})`);
      }
      
      // In real app, upload to server and get URLs
      const newImages = filesToAdd.map(f => URL.createObjectURL(f));
      imageUrlsRef.current = [...imageUrlsRef.current, ...newImages];
      updateData('images', [...reportData.images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const urlToRemove = reportData.images[index];
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
      imageUrlsRef.current = imageUrlsRef.current.filter(u => u !== urlToRemove);
    }
    updateData('images', reportData.images.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm',
                    s < step ? 'bg-primary text-white' :
                    s === step ? 'bg-primary text-white ring-4 ring-primary/30' :
                    'bg-bg-card text-text-muted border border-bg-border'
                  )}>
                    {s < step ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={cn(
                      'flex-1 h-1 mx-2 rounded',
                      s < step ? 'bg-primary' : 'bg-bg-border'
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>{t('report.step1_title')}</span>
              <span>{t('report.step2_title')}</span>
              <span>{t('report.step3_title')}</span>
              <span>{t('report.step4_title')}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-text-main mb-6">{t('report.step1_title')}</h1>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {scamTypes.map((type) => (
                    <motion.button
                      key={type.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateData('type', type.key)}
                      className={cn(
                        'p-6 rounded-card border-2 text-left transition-all',
                        reportData.type === type.key 
                          ? 'border-primary bg-primary/10 shadow-glow' 
                          : 'border-bg-border bg-bg-card hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center',
                        type.color
                      )}>
                        <type.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-text-main">{t(type.label)}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Input Data */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-text-main mb-6">{t('report.step2_title')}</h1>
                
                <Card className="space-y-4">
                  {reportData.type === 'phone' && (
                    <Input
                      label={t('report.phone')}
                      value={reportData.phone}
                      onChange={(e) => updateData('phone', e.target.value)}
                      placeholder="0123456789"
                    />
                  )}
                  
                  {reportData.type === 'bank' && (
                    <Input
                      label={t('report.bank_account')}
                      value={reportData.bankAccount}
                      onChange={(e) => updateData('bankAccount', e.target.value)}
                      placeholder="VCB 123456789"
                    />
                  )}
                  
                  {reportData.type === 'website' && (
                    <Input
                      label={t('report.website')}
                      value={reportData.website}
                      onChange={(e) => updateData('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  )}
                  
                  {(reportData.type === 'social' || reportData.type === 'investment' || reportData.type === 'job') && (
                    <>
                      <Input
                        label={t('report.telegram')}
                        value={reportData.telegram}
                        onChange={(e) => updateData('telegram', e.target.value)}
                        placeholder="@username"
                      />
                      <Input
                        label={t('report.facebook')}
                        value={reportData.facebook}
                        onChange={(e) => updateData('facebook', e.target.value)}
                        placeholder="facebook.com/username"
                      />
                    </>
                  )}

                  <Input
                    label={t('report.amount')}
                    value={reportData.amount}
                    onChange={(e) => updateData('amount', e.target.value)}
                    placeholder="10,000,000 VND"
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('report.description')}
                    </label>
                    <textarea
                      value={reportData.description}
                      onChange={(e) => updateData('description', e.target.value)}
                      placeholder={t('report.description_placeholder')}
                      rows={4}
                      className="w-full px-4 py-3 bg-bg-card border border-bg-border rounded-button text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Upload Proof */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-text-main mb-6">{t('report.step3_title')}</h1>
                
                {/* Upload Zone */}
                <div className="border-2 border-dashed border-bg-border rounded-card p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">{t('report.drag_drop')}</p>
                </div>

                {/* Image Preview */}
                {reportData.images.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                    {reportData.images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-bg-card">
                        <img src={img} alt={`Proof image ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 p-1 bg-danger rounded-full text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-text-main mb-6">{t('report.step4_title')}</h1>
                
                <Card className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-bg-border">
                    <span className="text-text-muted">Type</span>
                    <span className="text-text-main font-medium">
                      {reportData.type && t(`report.scam_types.${reportData.type}`)}
                    </span>
                  </div>
                  {reportData.phone && (
                    <div className="flex justify-between py-2 border-b border-bg-border">
                      <span className="text-text-muted">{t('report.phone')}</span>
                      <span className="text-text-main font-mono">{reportData.phone}</span>
                    </div>
                  )}
                  {reportData.bankAccount && (
                    <div className="flex justify-between py-2 border-b border-bg-border">
                      <span className="text-text-muted">{t('report.bank_account')}</span>
                      <span className="text-text-main font-mono">{reportData.bankAccount}</span>
                    </div>
                  )}
                  {reportData.website && (
                    <div className="flex justify-between py-2 border-b border-bg-border">
                      <span className="text-text-muted">{t('report.website')}</span>
                      <span className="text-text-main font-mono">{reportData.website}</span>
                    </div>
                  )}
                  {reportData.amount && (
                    <div className="flex justify-between py-2 border-b border-bg-border">
                      <span className="text-text-muted">{t('report.amount')}</span>
                      <span className="text-danger font-mono font-semibold">{reportData.amount}</span>
                    </div>
                  )}
                  {reportData.description && (
                    <div className="py-2">
                      <span className="text-text-muted block mb-2">{t('report.description')}</span>
                      <p className="text-text-main">{reportData.description}</p>
                    </div>
                  )}
                  {reportData.images.length > 0 && (
                    <div className="py-2">
                      <span className="text-text-muted block mb-2">{t('report.upload_proof')}</span>
                      <div className="flex gap-2">
                        {reportData.images.map((img, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden">
                            <img src={img} alt={`Proof image ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {t('common.submit')}
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => router.push('/')}>
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-success" />
          </motion.div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Success!</h2>
          <p className="text-text-secondary mb-6">{t('report.submit_success')}</p>
          <Button variant="primary" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </Modal>
    </div>
  );
}



export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-main" />}>
      <ReportPageContent />
    </Suspense>
  );
}
