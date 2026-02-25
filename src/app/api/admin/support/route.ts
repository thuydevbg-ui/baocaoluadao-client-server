import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminAuth } from '@/lib/adminApiAuth';

export type FeedbackStatus = 'new' | 'read' | 'replied' | 'resolved';
export type FeedbackType = 'question' | 'complaint' | 'suggestion' | 'bug_report' | 'other';

export interface FeedbackRecord {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  message: string;
  email: string;
  name: string;
  ip?: string;
  createdAt: string;
  updatedAt: string;
  reply?: string;
  repliedAt?: string;
  repliedBy?: string;
}

declare global {
  var __scamGuardAdminFeedback: FeedbackRecord[] | undefined;
}

const feedbackStore = globalThis.__scamGuardAdminFeedback ?? [
  {
    id: 'FB001',
    type: 'question',
    status: 'new',
    subject: 'Hỏi về cách báo cáo website lừa đảo',
    message: 'Tôi muốn hỏi cách báo cáo một website lừa đảo thì cần làm gì?',
    email: 'user1@example.com',
    name: 'Nguyễn Văn A',
    ip: '192.168.1.1',
    createdAt: '2026-02-20T10:30:00.000Z',
    updatedAt: '2026-02-20T10:30:00.000Z',
  },
  {
    id: 'FB002',
    type: 'suggestion',
    status: 'replied',
    subject: 'Đề xuất thêm tính năng thông báo',
    message: 'Rất mong hệ thống có thể gửi email thông báo khi có báo cáo mới được xác minh.',
    email: 'user2@example.com',
    name: 'Trần Thị B',
    createdAt: '2026-02-19T14:20:00.000Z',
    updatedAt: '2026-02-19T16:00:00.000Z',
    reply: 'Cảm ơn đề xuất của bạn. Chúng tôi sẽ xem xét và triển khai trong phiên bản tới.',
    repliedAt: '2026-02-19T16:00:00.000Z',
    repliedBy: 'admin@scamguard.vn',
  },
  {
    id: 'FB003',
    type: 'bug_report',
    status: 'resolved',
    subject: 'Lỗi không thể tải trang chi tiết',
    message: 'Khi truy cập trang chi tiết báo cáo, trang bị trắng và không hiển thị nội dung.',
    email: 'user3@example.com',
    name: 'Lê Văn C',
    createdAt: '2026-02-18T09:15:00.000Z',
    updatedAt: '2026-02-18T11:30:00.000Z',
    reply: 'Lỗi đã được sửa trong phiên bản mới nhất. Bạn vui lòng tải lại trang.',
    repliedAt: '2026-02-18T11:30:00.000Z',
    repliedBy: 'admin@scamguard.vn',
  },
  {
    id: 'FB004',
    type: 'complaint',
    status: 'read',
    subject: 'Khiếu nại về việc báo cáo bị từ chối',
    message: 'Báo cáo của tôi bị từ chối nhưng không có lý do rõ ràng. Mong được giải thích.',
    email: 'user4@example.com',
    name: 'Phạm Thị D',
    createdAt: '2026-02-17T16:45:00.000Z',
    updatedAt: '2026-02-18T08:00:00.000Z',
  },
];

if (!globalThis.__scamGuardAdminFeedback) {
  globalThis.__scamGuardAdminFeedback = feedbackStore;
}

function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

function parseStatus(value: string | null): FeedbackStatus | 'all' {
  if (!value) return 'all';
  if (['new', 'read', 'replied', 'resolved'].includes(value)) {
    return value as FeedbackStatus;
  }
  return 'all';
}

function parseType(value: string | null): FeedbackType | 'all' {
  if (!value) return 'all';
  if (['question', 'complaint', 'suggestion', 'bug_report', 'other'].includes(value)) {
    return value as FeedbackType;
  }
  return 'all';
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const type = parseType(searchParams.get('type'));
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10)));

  let filtered = [...feedbackStore];

  if (status !== 'all') {
    filtered = filtered.filter(f => f.status === status);
  }
  if (type !== 'all') {
    filtered = filtered.filter(f => f.type === type);
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const summary = {
    new: feedbackStore.filter(f => f.status === 'new').length,
    read: feedbackStore.filter(f => f.status === 'read').length,
    replied: feedbackStore.filter(f => f.status === 'replied').length,
    resolved: feedbackStore.filter(f => f.status === 'resolved').length,
  };

  return NextResponse.json({
    success: true,
    items,
    total,
    page,
    pageSize,
    totalPages,
    summary,
  });
}

export async function POST(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, feedbackId, reply } = body;

    if (action === 'reply' && feedbackId && reply) {
      const feedback = feedbackStore.find(f => f.id === feedbackId);
      if (!feedback) {
        return NextResponse.json(
          { success: false, error: 'Feedback không tồn tại' },
          { status: 404 }
        );
      }

      feedback.reply = sanitizeString(reply, 1000);
      feedback.repliedAt = new Date().toISOString();
      feedback.repliedBy = auth.email;
      feedback.status = 'replied';
      feedback.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: 'Phản hồi đã được gửi',
        feedback,
      });
    }

    if (action === 'markRead' && feedbackId) {
      const feedback = feedbackStore.find(f => f.id === feedbackId);
      if (!feedback) {
        return NextResponse.json(
          { success: false, error: 'Feedback không tồn tại' },
          { status: 404 }
        );
      }

      if (feedback.status === 'new') {
        feedback.status = 'read';
        feedback.updatedAt = new Date().toISOString();
      }

      return NextResponse.json({
        success: true,
        feedback,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Hành động không hợp lệ' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Feedback action error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}