import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminAuthValidated } from '@/lib/adminApiAuth';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  reportCount: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

declare global {
  var __scamGuardAdminCategories: Category[] | undefined;
}

const categories = globalThis.__scamGuardAdminCategories ?? [
  {
    id: 'cat-1',
    name: 'Website lừa đảo',
    icon: 'Globe',
    description: 'Các website giả mạo, lừa đảo mua sắm, đầu tư',
    reportCount: 3456,
    color: '#EF4444',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'SMS lừa đảo',
    icon: 'MessageSquare',
    description: 'Tin nhắn SMS lừa đảo, giả mạo bưu điện, ngân hàng',
    reportCount: 2876,
    color: '#F59E0B',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-3',
    name: 'Cuộc gọi lừa đảo',
    icon: 'Phone',
    description: 'Cuộc gọi từ số máy lạ, giả mạo công an, ngân hàng',
    reportCount: 1543,
    color: '#8B5CF6',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-4',
    name: 'Email lừa đảo',
    icon: 'Mail',
    description: 'Email giả mạo, lừa đảo phiếu mua hàng, thông báo',
    reportCount: 1234,
    color: '#3B82F6',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-5',
    name: 'Mạng xã hội',
    icon: 'Facebook',
    description: 'Tài khoản mạng xã hội giả mạo, lừa đảo',
    reportCount: 892,
    color: '#EC4899',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-6',
    name: 'Ngân hàng/Tài khoản',
    icon: 'Building',
    description: 'Tài khoản ngân hàng bị lừa đảo, mạo danh ngân hàng',
    reportCount: 756,
    color: '#10B981',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

if (!globalThis.__scamGuardAdminCategories) {
  globalThis.__scamGuardAdminCategories = categories;
}

function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const filtered = includeInactive 
    ? categories 
    : categories.filter(c => c.isActive);

  return NextResponse.json({
    success: true,
    categories: filtered,
    total: filtered.length,
  });
});

export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = sanitizeString(typeof body.name === 'string' ? body.name : '', 100);
    const icon = sanitizeString(typeof body.icon === 'string' ? body.icon : '', 50);
    const description = sanitizeString(typeof body.description === 'string' ? body.description : '', 500);
    const color = sanitizeString(typeof body.color === 'string' ? body.color : '', 20);

    if (!name || !icon || !description) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const newCategory: Category = {
      id: `cat-${crypto.randomUUID().slice(0, 8)}`,
      name,
      icon,
      description,
      reportCount: 0,
      color: color || '#6B7280',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    categories.push(newCategory);

    return NextResponse.json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
});