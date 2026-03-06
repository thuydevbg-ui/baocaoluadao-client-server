'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Building2,
  Globe,
  Wallet,
  Facebook,
  TrendingUp,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Check,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Chip, Input, Modal } from '@/components/ui';
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

const scamTypes: { key: ScamType; icon: LucideIcon; label: string }[] = [
  { key: 'phone', icon: Phone, label: 'report.scam_types.phone' },
  { key: 'bank', icon: Building2, label: 'report.scam_types.bank' },
  { key: 'website', icon: Globe, label: 'report.scam_types.website' },
  { key: 'crypto', icon: Wallet, label: 'report.scam_types.crypto' },
  { key: 'social', icon: Facebook, label: 'report.scam_types.social' },
  { key: 'investment', icon: TrendingUp, label: 'report.scam_types.investment' },
  { key: 'job', icon: Briefcase, label: 'report.scam_types.job' },
];

function ReportStepper({ step, labels }: { step: number; labels: string[] }) {
  const progressPercent = useMemo(() => {
    const clamped = Math.min(4, Math.max(1, step));
    return ((clamped - 1) / 3) * 100;
  }, [step]);

  return (
    <div className="mb-10">
      <div className="relative mx-auto max-w-4xl">
        <div className="absolute left-5 right-5 top-5 h-[3px] rounded-full bg-bg-border" />
        <div
          className="absolute left-5 top-5 h-[3px] rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative grid grid-cols-4">
          {[1, 2, 3, 4].map((s, idx) => {
            const isDone = s < step;
            const isCurrent = s === step;
            return (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm',
                    'transition-colors duration-200',
                    isDone || isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-bg-card text-text-muted border border-bg-border',
                    isCurrent && 'ring-4 ring-primary/25 shadow-sm'
                  )}
                >
                  {isDone ? <Check className="w-5 h-5" /> : s}
                </div>
                <div
                  className={cn(
                    'text-[11px] md:text-xs text-center leading-tight',
                    isCurrent ? 'text-text-main font-semibold' : isDone ? 'text-text-secondary' : 'text-text-muted'
                  )}
                >
                  {labels[idx] || ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
      if (reportData.website) {
        const raw = reportData.website.trim();
        if (raw) {
          const normalized = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
          try {
            // eslint-disable-next-line no-new
            new URL(normalized);
            updateData('website', normalized);
          } catch {
            showToast('warning', 'Invalid website URL');
            return;
          }
        }
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
    
    // Map frontend scam types to API report types
    const typeMap: Record<ScamType, string> = {
      'phone': 'phone',
      'bank': 'phone', // Map bank to phone (for bank account)
      'website': 'website',
      'crypto': 'website', // Map crypto to website
      'social': 'social',
      'investment': 'website', // Map investment to website
      'job': 'website', // Map job to website
    };
    
    // Build target based on type
    let target = '';
    switch (reportData.type) {
      case 'phone':
        target = reportData.phone;
        break;
      case 'bank':
        target = reportData.bankAccount;
        break;
      case 'website':
        target = reportData.website;
        break;
      case 'crypto':
      case 'investment':
      case 'job':
        target = reportData.website || reportData.telegram || reportData.facebook;
        break;
      case 'social':
        target = reportData.facebook || reportData.telegram;
        break;
    }
    
    if (!target) {
      showToast('warning', 'Please provide target information');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: typeMap[reportData.type!],
          target: target,
          description: reportData.description,
          name: '', // Optional reporter name
          email: '', // Optional reporter email
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        showToast('error', result.error || 'Failed to submit report');
        setIsSubmitting(false);
        return;
      }
      
      showToast('success', 'Report submitted successfully!');
    } catch (error) {
      console.error('Report submission error:', error);
      showToast('error', 'Failed to submit report. Please try again.');
    }
    
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
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
          <div className="max-w-3xl mx-auto">
            <ReportStepper
              step={step}
              labels={[t('report.step1_title'), t('report.step2_title'), t('report.step3_title'), t('report.step4_title')]}
            />

            <AnimatePresence mode="wait">
              {/* Step 1: Select Type */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                >
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-main mb-6">
                    {t('report.step1_title')}
                  </h1>

                  <div className="rounded-2xl border border-bg-border bg-bg-card shadow-none ring-0 overflow-hidden">
                    <div className="divide-y divide-bg-border">
                      {scamTypes.map((type) => {
                        const selected = reportData.type === type.key;
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.key}
                            onClick={() => updateData('type', type.key)}
                            className={cn(
                              'w-full px-5 md:px-6 py-4 text-left transition-colors',
                              'flex items-center gap-4',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset',
                              selected ? 'bg-primary/5' : 'bg-transparent hover:bg-bg-cardHover/35'
                            )}
                            type="button"
                            aria-pressed={selected}
                          >
                            <div
                              className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center shrink-0 border',
                                selected
                                  ? 'bg-primary/10 border-primary/20 text-primary'
                                  : 'bg-bg-cardHover border-bg-border text-text-secondary'
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-medium text-text-main truncate">{t(type.label)}</p>
                              {selected ? (
                                <div className="mt-1.5">
                                  <Chip variant="primary" size="sm" leftIcon={<Check className="h-3.5 w-3.5" />}>
                                    {t('report.selected')}
                                  </Chip>
                                </div>
                              ) : (
                                <p className="mt-0.5 text-sm text-text-muted line-clamp-1">
                                  {t(`report.scam_type_hints.${type.key}`)}
                                </p>
                              )}
                            </div>

                            {selected && (
                              <div className="shrink-0 text-primary" aria-hidden>
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Input Data */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                >
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-main mb-6">
                    {t('report.step2_title')}
                  </h1>

                  <div className="rounded-2xl border border-bg-border bg-bg-card shadow-none ring-0 overflow-hidden">
                    <div className="flex items-start gap-4 px-5 md:px-6 py-4">
                      <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-main">{t('report.step2_title')}</p>
                          {reportData.type && (
                            <Chip variant="primary" size="sm">
                              {t(`report.scam_types.${reportData.type}`)}
                            </Chip>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-text-muted">{t('report.step2_hint')}</p>
                      </div>
                    </div>

                    <div className="px-5 md:px-6 py-6 border-t border-bg-border space-y-5">
                      {reportData.type === 'phone' && (
                        <Input
                          label={t('report.phone')}
                          value={reportData.phone}
                          onChange={(e) => updateData('phone', e.target.value)}
                          placeholder="0123456789"
                          inputMode="tel"
                          className="rounded-xl h-11 bg-bg-card"
                        />
                      )}

                      {reportData.type === 'bank' && (
                        <Input
                          label={t('report.bank_account')}
                          value={reportData.bankAccount}
                          onChange={(e) => updateData('bankAccount', e.target.value)}
                          placeholder="VCB 123456789"
                          className="rounded-xl h-11 bg-bg-card"
                        />
                      )}

                      {(reportData.type === 'website' ||
                        reportData.type === 'crypto' ||
                        reportData.type === 'investment' ||
                        reportData.type === 'job') && (
                        <Input
                          label={t('report.website')}
                          value={reportData.website}
                          onChange={(e) => updateData('website', e.target.value)}
                          placeholder="example.com"
                          inputMode="url"
                          className="rounded-xl h-11 bg-bg-card"
                        />
                      )}

                      {(reportData.type === 'social' || reportData.type === 'investment' || reportData.type === 'job') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label={t('report.telegram')}
                            value={reportData.telegram}
                            onChange={(e) => updateData('telegram', e.target.value)}
                            placeholder="@username"
                            className="rounded-xl h-11 bg-bg-card"
                          />
                          <Input
                            label={t('report.facebook')}
                            value={reportData.facebook}
                            onChange={(e) => updateData('facebook', e.target.value)}
                            placeholder="facebook.com/username"
                            className="rounded-xl h-11 bg-bg-card"
                          />
                        </div>
                      )}

                      <Input
                        label={t('report.amount')}
                        value={reportData.amount}
                        onChange={(e) => updateData('amount', e.target.value)}
                        placeholder="10,000,000 VND"
                        inputMode="decimal"
                        className="rounded-xl h-11 bg-bg-card"
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
                          className="w-full px-4 py-3 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Step 3: Upload Proof */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
              >
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-main mb-6">
                  {t('report.step3_title')}
                </h1>
                
                <div className="rounded-2xl border border-bg-border bg-bg-card shadow-none ring-0 overflow-hidden">
                  <div className="divide-y divide-bg-border">
                    <div className="flex items-start gap-4 px-5 md:px-6 py-4">
                      <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20 text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-main">{t('report.upload_proof')}</p>
                          <Chip variant={reportData.images.length > 0 ? 'success' : 'default'} size="sm">
                            {reportData.images.length > 0
                              ? t('report.proof_added').replace('{count}', String(reportData.images.length))
                              : t('report.proof_none')}
                          </Chip>
                        </div>
                        <p className="mt-0.5 text-sm text-text-muted">{t('report.proof_hint')}</p>
                      </div>

                      <label className="shrink-0">
                        <span className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-primary/25 bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/15 transition-colors cursor-pointer">
                          {t('report.choose_images')}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {reportData.images.length > 0 && (
                      <div className="divide-y divide-bg-border">
                        {reportData.images.map((img, i) => (
                          <div
                            key={img}
                            className="flex items-center gap-3 px-5 md:px-6 py-3 bg-bg-card hover:bg-bg-cardHover/35 transition-colors"
                          >
                            <div className="h-11 w-11 rounded-xl overflow-hidden border border-bg-border bg-bg-card shrink-0">
                              <img src={img} alt={`Proof image ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text-main truncate">
                                {t('report.proof_image')} {i + 1}
                              </p>
                              <p className="text-xs text-text-muted truncate">{t('report.proof_caption')}</p>
                            </div>
                            <button
                              onClick={() => removeImage(i)}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-bg-border bg-bg-card text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-colors"
                              aria-label="Remove image"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
              >
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-main mb-6">
                  {t('report.step4_title')}
                </h1>
                
                <div className="rounded-2xl border border-bg-border bg-bg-card shadow-none ring-0 overflow-hidden">
                  <div className="divide-y divide-bg-border">
                    <div className="flex items-start gap-4 px-5 md:px-6 py-4">
                      <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20 text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-main">{t('report.summary_title')}</p>
                        <p className="mt-0.5 text-sm text-text-muted">{t('report.summary_hint')}</p>
                      </div>
                    </div>

                    <div className="px-5 md:px-6 py-2">
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-text-muted">{t('report.summary_type')}</span>
                        <Chip variant="primary" size="sm">
                          {reportData.type ? t(`report.scam_types.${reportData.type}`) : '—'}
                        </Chip>
                      </div>

                      {reportData.phone && (
                        <div className="flex items-center justify-between py-3 border-t border-bg-border">
                          <span className="text-sm text-text-muted">{t('report.phone')}</span>
                          <span className="text-sm font-mono text-text-main">{reportData.phone}</span>
                        </div>
                      )}
                      {reportData.bankAccount && (
                        <div className="flex items-center justify-between py-3 border-t border-bg-border">
                          <span className="text-sm text-text-muted">{t('report.bank_account')}</span>
                          <span className="text-sm font-mono text-text-main">{reportData.bankAccount}</span>
                        </div>
                      )}
                      {reportData.website && (
                        <div className="flex items-center justify-between py-3 border-t border-bg-border">
                          <span className="text-sm text-text-muted">{t('report.website')}</span>
                          <span className="text-sm font-mono text-text-main truncate max-w-[60%]">{reportData.website}</span>
                        </div>
                      )}
                      {reportData.telegram && (
                        <div className="flex items-center justify-between py-3 border-t border-bg-border">
                          <span className="text-sm text-text-muted">{t('report.telegram')}</span>
                          <span className="text-sm font-mono text-text-main">{reportData.telegram}</span>
                        </div>
                      )}
                      {reportData.facebook && (
                        <div className="flex items-center justify-between py-3 border-t border-bg-border">
                          <span className="text-sm text-text-muted">{t('report.facebook')}</span>
                          <span className="text-sm font-mono text-text-main truncate max-w-[60%]">{reportData.facebook}</span>
                        </div>
                      )}
                      {reportData.amount && (
                        <div className="flex items-center justify-between py-3 border-t border-bg-border">
                          <span className="text-sm text-text-muted">{t('report.amount')}</span>
                          <Chip variant="danger" size="sm">
                            {reportData.amount}
                          </Chip>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-3 border-t border-bg-border">
                        <span className="text-sm text-text-muted">{t('report.upload_proof')}</span>
                        <Chip variant={reportData.images.length > 0 ? 'success' : 'default'} size="sm">
                          {reportData.images.length > 0
                            ? t('report.proof_added').replace('{count}', String(reportData.images.length))
                            : t('report.proof_none')}
                        </Chip>
                      </div>
                    </div>

                    {reportData.description && (
                      <div className="px-5 md:px-6 py-4">
                        <span className="text-sm text-text-muted block mb-2">{t('report.description')}</span>
                        <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">{reportData.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-10">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={step === 1}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="min-w-[120px] rounded-xl shadow-none"
              >
                {t('report.back')}
              </Button>

              {step < 4 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="min-w-[140px] rounded-xl shadow-sm shadow-primary/15 hover:shadow-md hover:shadow-primary/20"
                >
                  {t('report.next')}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  className="min-w-[160px] rounded-xl shadow-sm shadow-danger/15 hover:shadow-md hover:shadow-danger/20"
                >
                  {t('common.submit')}
                </Button>
              )}
            </div>
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
