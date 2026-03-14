'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/lib/utils';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

interface ScamDetail {
  value: string;
  risk: string;
  riskScore: number;
  reports: number;
  description?: string;
  type?: string;
  organization?: string;
  domainRegisteredAt?: string;
}

interface DetailInsight {
  typeLabel: string;
  status: string;
  statusLabel: string;
  updatedAt: string;
  riskSignals: string[];
  recommendations: string[];
  channels: string[];
  source?: string;
  sourceLink?: string;
  sourceIcon?: string;
  confidence: number;
  isTrustedEntity: boolean;
}

interface FeedbackCommentView {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: number;
  helpful: number;
  rating: number | null;
  verified: boolean;
  helpfulMarked: boolean;
  canMarkHelpful: boolean;
  socialSource?: 'facebook' | 'telegram' | null;
}

interface FeedbackStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface DetailContentNewProps {
  data: ScamDetail;
  insight: DetailInsight;
  normalizedType: string;
  viewCount: number | null;
  comments: FeedbackCommentView[];
  ratingStats: FeedbackStats;
  myRating: number | null;
  accountAge24h: boolean;
  isAuthenticated: boolean;
  commentSort: 'latest' | 'helpful';
  onCommentSortChange: (sort: 'latest' | 'helpful') => void;
  onCommentSubmit: (text: string) => Promise<void>;
  onRate: (rating: number) => void;
  onHelpful: (commentId: string) => Promise<void>;
  onCopy: () => void;
  copied: boolean;
  isCommentSubmitting: boolean;
  isRatingSubmitting: boolean;
}

export function DetailContentNew({
  data,
  insight,
  normalizedType,
  viewCount,
  comments,
  ratingStats,
  myRating,
  accountAge24h,
  isAuthenticated,
  commentSort,
  onCommentSortChange,
  onCommentSubmit,
  onRate,
  onHelpful,
  onCopy,
  copied,
  isCommentSubmitting,
  isRatingSubmitting,
}: DetailContentNewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [commentText, setCommentText] = useState('');
  // Start at 0 to keep server/client render consistent, then update after mount.
  const [now, setNow] = useState(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  
  // Update time every minute for relative time display
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const derivedRiskScore = Math.max(0, Math.min(100, data.riskScore));
  const trustScore = Math.max(0, Math.min(100, 100 - derivedRiskScore));
  
  const isConfirmedRisk = data.risk === 'scam' || data.risk === 'suspicious' || data.risk === 'policy';
  const riskTagText = isConfirmedRisk ? 'LỪA ĐẢO' : data.risk === 'unknown' ? 'CẦN KIỂM TRA' : null;
  const warningMessage =
    insight.statusLabel && insight.statusLabel.toLowerCase().includes('đang xử lý')
      ? ''
      : insight.statusLabel;

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isCommentSubmitting) return;
    await onCommentSubmit(commentText.trim());
    setCommentText('');
  };

  const formatTimeAgo = (timestamp: number): string => {
    if (!timestamp) return '—';
    if (!now) return dateFormatter.format(new Date(timestamp));
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 0) return dateFormatter.format(new Date(timestamp));
    if (seconds < 60) return 'vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return dateFormatter.format(new Date(timestamp));
  };

  const getTypeIcon = () => {
    switch (normalizedType) {
      case 'phone': return 'fa-phone';
      case 'bank': return 'fa-university';
      case 'crypto': return 'fa-bitcoin';
      default: return 'fa-globe';
    }
  };

  const getRiskColor = () => {
    if (data.risk === 'scam' || data.risk === 'policy') return '#ef4444';
    if (data.risk === 'suspicious') return '#f97316';
    return '#10b981';
  };

  const reportHref = `/report?type=${encodeURIComponent(normalizedType)}&target=${encodeURIComponent(data.value)}`;
  const searchHref = `/search?q=${encodeURIComponent(data.value)}`;

  const loadBookmarkState = useCallback(async () => {
    if (!isAuthenticated || !data.value) {
      setBookmarkId(null);
      return;
    }

    try {
      const response = await fetch('/api/user/watchlist', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!response.ok) {
        setBookmarkId(null);
        return;
      }
      const payload = await response.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const targetKey = data.value.trim().toLowerCase();
      const typeKey = String(normalizedType || '').toLowerCase();
      const matched = items.find((item: { id?: string; target?: string; type?: string }) => {
        const itemTarget = String(item?.target || '').trim().toLowerCase();
        const itemType = String(item?.type || '').toLowerCase();
        return itemTarget === targetKey && itemType === typeKey;
      });
      setBookmarkId(matched?.id ?? null);
    } catch {
      setBookmarkId(null);
    }
  }, [data.value, isAuthenticated, normalizedType]);

  useEffect(() => {
    void loadBookmarkState();
  }, [loadBookmarkState]);

  useEffect(() => {
    if (!isOptionsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!optionsRef.current) return;
      if (!optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOptionsOpen]);

  const handleCopyLink = async () => {
    try {
      await onCopy();
      showToast('success', 'Đã sao chép liên kết.');
    } catch {
      showToast('error', 'Không thể sao chép liên kết.');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cảnh báo: ${data.value}`,
          text: `Xem chi tiết cảnh báo cho ${data.value}`,
          url: window.location.href,
        });
        return;
      }
    } catch {
      // User cancelled share sheet; fall back silently.
      return;
    }
    await handleCopyLink();
  };

  const handleToggleBookmark = async () => {
    if (bookmarkLoading) return;
    if (!isAuthenticated) {
      showToast('warning', 'Vui lòng đăng nhập để lưu theo dõi.');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setBookmarkLoading(true);
    try {
      if (bookmarkId) {
        const response = await fetch(`/api/user/watchlist/${encodeURIComponent(bookmarkId)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error || 'Không thể bỏ lưu mục này.');
        }
        setBookmarkId(null);
        showToast('success', 'Đã bỏ lưu khỏi danh sách theo dõi.');
      } else {
        const response = await fetch('/api/user/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ target: data.value, type: normalizedType }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error || 'Không thể lưu mục này.');
        }
        if (payload?.id) {
          setBookmarkId(payload.id);
        } else {
          await loadBookmarkState();
        }
        showToast('success', 'Đã lưu vào danh sách theo dõi.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật theo dõi.';
      showToast('error', message);
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="detail-page-new">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="domain-section">
            <div className="domain-icon">
              <i className={`fas ${getTypeIcon()}`}></i>
            </div>
            <div className="domain-info">
              <h1 className="nowrap">{data.value}</h1>
              <div className="domain-meta">
                {riskTagText && (
                  <span className="badge-scam">
                    <i className="fas fa-skull"></i> {riskTagText}
                  </span>
                )}
                <div className="domain-stats">
                  <span><i className="far fa-eye"></i> {viewCount === null ? '—' : formatNumber(viewCount)}</span>
                  <span><i className="far fa-comment"></i> {formatNumber(comments.length)}</span>
                  <span><i className="far fa-clock"></i> {insight.updatedAt}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="header-actions" ref={optionsRef}>
            <button className="header-btn" title="Chia sẻ" onClick={handleShare}>
              <i className="fas fa-share-alt"></i>
            </button>
            <button
              className={`header-btn ${bookmarkId ? 'active' : ''}`}
              title={bookmarkId ? 'Bỏ lưu' : 'Lưu'}
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              aria-pressed={Boolean(bookmarkId)}
            >
              <i className={`${bookmarkId ? 'fas' : 'far'} fa-bookmark`}></i>
            </button>
            <button
              className="header-btn"
              title="Tùy chọn"
              onClick={() => setIsOptionsOpen((prev) => !prev)}
              aria-expanded={isOptionsOpen}
              aria-haspopup="menu"
            >
              <i className="fas fa-ellipsis-h"></i>
            </button>
            {isOptionsOpen && (
              <div className="options-menu" role="menu">
                <button
                  className="options-item"
                  type="button"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    void handleCopyLink();
                  }}
                  role="menuitem"
                >
                  <i className="fas fa-copy"></i>
                  Sao chép liên kết
                </button>
                <button
                  className="options-item"
                  type="button"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    router.push(reportHref);
                  }}
                  role="menuitem"
                >
                  <i className="fas fa-flag"></i>
                  Báo cáo mục này
                </button>
                <button
                  className="options-item"
                  type="button"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    router.push(searchHref);
                  }}
                  role="menuitem"
                >
                  <i className="fas fa-search"></i>
                  Tra cứu lại
                </button>
                <button
                  className="options-item"
                  type="button"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    void handleToggleBookmark();
                  }}
                  role="menuitem"
                >
                  <i className={`${bookmarkId ? 'fas' : 'far'} fa-bookmark`}></i>
                  {bookmarkId ? 'Bỏ lưu' : 'Lưu theo dõi'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {/* LEFT COLUMN */}
          <div className="left-col">
            {/* Trust Score */}
            <div className="card">
              <div className="trust-score">
                <div className="trust-value" style={{ color: getRiskColor() }}>{trustScore}%</div>
                <div className="trust-label">Độ tin cậy</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${trustScore}%`, background: `linear-gradient(90deg, ${getRiskColor()}, ${getRiskColor()}80)` }}></div>
                </div>
                <div className="tags">
                  <span className="tag"><i className="fas fa-globe"></i> {insight.typeLabel}</span>
                  <span className="tag"><i className="fas fa-flag"></i> {formatNumber(data.reports)} báo cáo</span>
                  <span className="tag"><i className="fas fa-shield-alt"></i> {insight.isTrustedEntity ? 'Đã xác thực' : 'Chưa xác thực'}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            {isConfirmedRisk && (
              <div className="warning-box voucher">
                <div className="warning-icon">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <div className="warning-content">
                  <h4>Cảnh báo lừa đảo!</h4>
                  <p>{warningMessage || 'Nội dung có nguy cơ lừa đảo cao'}</p>
                </div>
                <div className="warning-badge">
                  <i className="fas fa-shield-alt"></i>
                  Cảnh báo
                </div>
              </div>
            )}

            {/* Thông tin chi tiết */}
            <div className="card">
              <div className="card-header">
                <i className="fas fa-info-circle"></i>
                <h3>Thông tin chi tiết</h3>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-tag"></i></div>
                  <div className="info-content">
                    <div className="info-label">Loại</div>
                    <div className="info-value nowrap">{insight.typeLabel}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-bullhorn"></i></div>
                  <div className="info-content">
                    <div className="info-label">Kênh</div>
                    <div className="info-value nowrap">{insight.channels?.[0] || 'Không rõ'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-link"></i></div>
                  <div className="info-content">
                    <div className="info-label">Link rút gọn</div>
                    <div className="info-value">{normalizedType === 'website' ? 'Có thể có' : 'N/A'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-clock"></i></div>
                  <div className="info-content">
                    <div className="info-label">Cập nhật</div>
                    <div className="info-value nowrap">{insight.updatedAt}</div>
                  </div>
                </div>
              </div>

              {/* Khuyến nghị */}
              {insight.recommendations && insight.recommendations.length > 0 && (
                <div className="recommendations">
                  <div className="recommendations-header">
                    <i className="fas fa-shield-alt"></i>
                    <h4>Khuyến nghị</h4>
                  </div>
                  <ul className="recommendations-list">
                    {insight.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx}><i className="fas fa-check-circle"></i> {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* Dấu hiệu lừa đảo */}
            {insight.riskSignals && insight.riskSignals.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444' }}></i>
                  <h3>Dấu hiệu lừa đảo</h3>
                  <span className="badge">{insight.riskSignals.length} phát hiện</span>
                </div>
                <div className="signs-list">
                  {insight.riskSignals.slice(0, 3).map((signal, idx) => (
                    <div className="sign-item" key={idx}>
                      <div className="sign-icon">
                        <i className={`fas ${idx === 0 ? 'fa-globe' : idx === 1 ? 'fa-tag' : 'fa-credit-card'}`}></i>
                      </div>
                      <div className="sign-content">
                        <div className="sign-title">{signal}</div>
                        <div className="sign-desc">Phát hiện bởi hệ thống</div>
                      </div>
                      <span className="sign-risk">Nguy hiểm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phát hiện & cập nhật */}
            <div className="card">
              <div className="card-header">
                <i className="fas fa-history"></i>
                <h3>Phát hiện & cập nhật</h3>
              </div>
              <div className="detection-item">
                <i className="fas fa-calendar"></i>
                <div className="detection-content">
                  <div className="detection-label">PHÁT HIỆN LẦN ĐẦU</div>
                  <div className="detection-value">{data.domainRegisteredAt || 'Không rõ'}</div>
                </div>
              </div>
              <div className="detection-item">
                <i className="fas fa-clock"></i>
                <div className="detection-content">
                  <div className="detection-label">CẬP NHẬT GẦN NHẤT</div>
                  <div className="detection-value">{insight.updatedAt}</div>
                </div>
              </div>
              <div className="detection-item">
                <i className="fas fa-sync-alt"></i>
                <div className="detection-content">
                  <div className="detection-label">CẬP NHẬT HỆ THỐNG</div>
                  <div className="detection-value">24/7</div>
                </div>
              </div>
            </div>

            {/* Source */}
            <div className="source-card">
              <div className="source-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="source-info">
                <div className="source-name nowrap">
                  {insight.source || 'baocaoluadao.com'}
                  <i className="fi fi-ss-badge-check"></i>
                </div>
                <div className="source-meta">
                  <span><i className="fas fa-check-circle"></i> Nguồn tin cậy</span>
                  <span>·</span>
                  <span><i className="fas fa-shield-alt"></i> Đã xác thực</span>
                  <span>·</span>
                  <span className="source-badge" style={{ padding: '2px 8px', marginLeft: 0 }}>
                    <i className="fi fi-ss-badge-check"></i> An toàn
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="action-buttons">
              <button className="action-btn" onClick={() => router.push(`/search?q=${encodeURIComponent(data.value)}`)}>
                <i className="fas fa-search"></i> Tra cứu
              </button>
              <button className="action-btn" onClick={handleShare}>
                <i className="fas fa-share-alt"></i> Chia sẻ
              </button>
              <button className="action-btn" onClick={onCopy}>
                <i className="fas fa-copy"></i> {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          {/* COMMENTS */}
          <div className="comments-section">
            <div className="comments-header">
              <h3><i className="far fa-comments"></i> Bình luận ({comments.length})</h3>
              <div className="rating-box">
                <span className="stars">{'★'.repeat(Math.round(ratingStats.average))}{'☆'.repeat(5 - Math.round(ratingStats.average))}</span>
                <span>{ratingStats.average.toFixed(1)}</span>
                <span style={{ color: '#64748b' }}>({ratingStats.total} đánh giá)</span>
              </div>
            </div>

            <div className="filter-tabs">
              <button 
                className={`filter-tab ${commentSort === 'latest' ? 'active' : ''}`}
                onClick={() => onCommentSortChange('latest')}
              >
                Mới nhất
              </button>
              <button 
                className={`filter-tab ${commentSort === 'helpful' ? 'active' : ''}`}
                onClick={() => onCommentSortChange('helpful')}
              >
                Hữu ích nhất
              </button>
            </div>

            {/* Comment Input */}
            <div className="comment-input">
              <input 
                type="text" 
                placeholder={accountAge24h ? "Viết bình luận..." : "Đăng nhập để bình luận..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                disabled={!accountAge24h || isCommentSubmitting}
              />
              <button 
                onClick={handleCommentSubmit}
                disabled={!accountAge24h || !commentText.trim() || isCommentSubmitting}
              >
                <i className="fas fa-paper-plane"></i> Gửi
              </button>
            </div>

            {/* Auth message for non-logged in users */}
            {!accountAge24h && (
              <div style={{ 
                background: '#eef2ff', 
                border: '1px solid #c7d2fe', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: '#6366f1', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white',
                  fontSize: '18px'
                }}>
                  <i className="fas fa-user-clock"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {!isAuthenticated ? '🔒 Bình luận yêu cầu đăng nhập' : '⏳ Chờ một chút!'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {!isAuthenticated 
                      ? 'Chỉ thành viên hoạt động ≥24 giờ mới có thể bình luận & đánh giá.' 
                      : 'Tài khoản cần đợi 24 giờ sau đăng ký để bình luận.'}
                  </div>
                </div>
                {!isAuthenticated && (
                  <button 
                    onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                    style={{
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Đăng nhập →
                  </button>
                )}
              </div>
            )}

            {/* Rating */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Đánh giá:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => accountAge24h && onRate(star)}
                  disabled={!accountAge24h || isRatingSubmitting}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: accountAge24h ? 'pointer' : 'not-allowed',
                    fontSize: '18px',
                    color: star <= (myRating ?? Math.round(ratingStats.average)) ? '#f59e0b' : '#d1d5db',
                    padding: '4px'
                  }}
                >
                  <i className={star <= (myRating ?? Math.round(ratingStats.average)) ? 'fas fa-star' : 'far fa-star'}></i>
                </button>
              ))}
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                ({ratingStats.total} đánh giá)
              </span>
            </div>

            {/* Comments List */}
            {comments.map((comment) => (
              <div className="comment-card" key={comment.id}>
                <div className="comment-avatar">
                  {comment.avatar || comment.user.charAt(0).toUpperCase()}
                  {comment.verified && (
                    <span className="verified-badge"><i className="fas fa-check"></i></span>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author nowrap">{comment.user}</span>
                    {comment.rating && (
                      <span className="comment-stars">{'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}</span>
                    )}
                    <span className="comment-time"><i className="far fa-clock"></i> {formatTimeAgo(comment.createdAt)}</span>
                    {comment.socialSource && (
                      <div className="comment-social">
                        <span className={`social-icon ${comment.socialSource}`}>
                          <i className={`fab fa-${comment.socialSource}`}></i>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-footer">
                    <span onClick={() => onHelpful(comment.id)} style={{ cursor: accountAge24h ? 'pointer' : 'not-allowed' }}>
                      <i className="far fa-thumbs-up"></i> {comment.helpful}
                    </span>
                    <span><i className="far fa-thumbs-down"></i></span>
                    <span>Trả lời</span>
                  </div>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <i className="far fa-comments" style={{ fontSize: '48px', marginBottom: '16px', display: 'block', opacity: 0.5 }}></i>
                <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <i className="fas fa-circle"></i>
          Cập nhật liên tục 24/7 · Dữ liệu từ cộng đồng
        </div>
      </div>
    </div>
  );
}
