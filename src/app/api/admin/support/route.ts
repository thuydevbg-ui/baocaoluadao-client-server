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

const feedbackStore = globalThis.__scamGuardAdminFeedback ?? [];

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
