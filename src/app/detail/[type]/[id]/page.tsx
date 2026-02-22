'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, Building2, Globe, Wallet, AlertTriangle, Clock, Shield, MessageCircle, ThumbsUp, User, Calendar, Share2, Flag } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, RiskBadge, DetailSkeleton } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { cn, type ScamDetail, type Comment, sanitizeHTML } from '@/lib/utils';

export default function DetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { type, id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScamDetail | null>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    { id: 1, user: 'Nguyen Van A', avatar: 'N', text: 'This is a scam! They called me claiming to be from the bank.', time: '2 hours ago', helpful: 12 },
    { id: 2, user: 'Le Thi B', avatar: 'L', text: 'Same here! They asked for OTP code.', time: '5 hours ago', helpful: 8 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setData({
          id: id as string,
          type: type as 'phone' | 'bank' | 'website' | 'crypto',
          value: id as string,
          risk: 'scam',
          riskScore: 92,
          reports: 156,
          firstSeen: '2024-01-15',
          lastReported: '2024-02-20',
          description: 'Scammers call pretending to be from bank security department. They claim your account has suspicious activity and ask for OTP codes to "verify" your identity. Do NOT give them any codes!',
          amount: '50,000,000 VND',
        });
      } catch (err) {
        setError('Failed to load scam details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'phone': return Phone;
      case 'bank': return Building2;
      case 'website': return Globe;
      case 'crypto': return Wallet;
      default: return AlertTriangle;
    }
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    
    const newComment = {
      id: Date.now(),
      user: 'You',
      avatar: 'Y',
      text: comment,
      time: 'Just now',
      helpful: 0,
    };
    
    setComments([newComment, ...comments]);
    setComment('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
            <DetailSkeleton />
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 text-center">
            <Card className="py-12">
              <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-main mb-2">{t('common.error')}</h2>
              <p className="text-text-secondary mb-6">{error}</p>
              <Button variant="primary" onClick={() => router.refresh()}>
                {t('common.retry')}
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!data) return null;

  const Icon = getIcon(type as string);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center',
                    data.risk === 'scam' ? 'bg-danger/10 text-danger' :
                    data.risk === 'suspicious' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  )}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-text-main">{data.value}</h1>
                    <p className="text-text-muted capitalize">{type} scam</p>
                  </div>
                </div>
                <RiskBadge risk={data.risk} label={t(`risk.${data.risk}`)} />
              </div>

              {/* Risk Score */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">{t('risk.score')}</span>
                  <span className={cn(
                    'font-mono font-bold',
                    data.risk === 'scam' ? 'text-danger' :
                    data.risk === 'suspicious' ? 'text-warning' :
                    'text-success'
                  )}>{data.riskScore}/100</span>
                </div>
                <div className="h-3 bg-bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.riskScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      data.risk === 'scam' ? 'risk-scam' :
                      data.risk === 'suspicious' ? 'risk-suspicious' :
                      'risk-safe'
                    )}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-cardHover rounded-lg p-4 text-center">
                  <AlertTriangle className="w-5 h-5 text-danger mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-main font-mono">{data.reports}</p>
                  <p className="text-xs text-text-muted">{t('risk.reports')}</p>
                </div>
                <div className="bg-bg-cardHover rounded-lg p-4 text-center">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-text-main">{data.firstSeen}</p>
                  <p className="text-xs text-text-muted">{t('risk.first_seen')}</p>
                </div>
                <div className="bg-bg-cardHover rounded-lg p-4 text-center">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-text-main">{data.lastReported}</p>
                  <p className="text-xs text-text-muted">{t('risk.last_reported')}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                  {t('detail.share')}
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Flag className="w-4 h-4" />}>
                  {t('detail.report')}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold text-text-main mb-4">{t('detail.description')}</h2>
            <Card className="mb-6">
              <p className="text-text-secondary leading-relaxed">{data.description}</p>
              {data.amount && (
                <div className="mt-4 pt-4 border-t border-bg-border">
                  <span className="text-text-muted">{t('detail.estimated_loss')}: </span>
                  <span className="text-danger font-mono font-bold">{data.amount}</span>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Comments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-text-main mb-4">
              {t('detail.comments')} ({comments.length})
            </h2>
            
            {/* Add Comment */}
            <Card className="mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  Y
                </div>
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('detail.comment_placeholder')}
                    rows={3}
                    className="w-full px-4 py-3 bg-bg-cardHover border border-bg-border rounded-button text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <Button variant="primary" size="sm" onClick={handleComment}>
                      {t('detail.add_comment')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Card hover className="mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-semibold">
                        {c.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-main">{c.user}</span>
                          <span className="text-xs text-text-muted">{c.time}</span>
                        </div>
                        <p className="text-text-secondary">{sanitizeHTML(c.text)}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                            {c.helpful} {t('detail.helpful')}
                          </button>
                          <button className="text-sm text-text-muted hover:text-primary transition-colors">
                            {t('detail.reply')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
