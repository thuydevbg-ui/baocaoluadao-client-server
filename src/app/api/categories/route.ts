import { NextResponse } from 'next/server';
import { fetchCategoryDirectory, type TinnhiemCategory } from '@/lib/dataSources/tinnhiemmang';

const VALID_CATEGORIES: TinnhiemCategory[] = ['organizations', 'websites', 'devices', 'systems', 'apps'];

function parseCategory(value: unknown): TinnhiemCategory {
  const category = typeof value === 'string' ? value : '';
  if (VALID_CATEGORIES.includes(category as TinnhiemCategory)) {
    return category as TinnhiemCategory;
  }
  return 'websites';
}

function parsePage(value: unknown): number {
  const page = typeof value === 'number' ? value : Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const category = parseCategory(payload?.category);
    const page = parsePage(payload?.page);

    const directory = await fetchCategoryDirectory(category, page);

    return NextResponse.json({
      success: true,
      source: 'tinnhiemmang.vn',
      category,
      mode: directory.mode,
      page: directory.page,
      maxPage: directory.maxPage,
      total: directory.totalEstimate,
      items: directory.items,
    });
  } catch (error) {
    console.error('Error fetching category data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data', items: [] },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to fetch category data',
    categories: VALID_CATEGORIES,
    example: {
      category: 'websites',
      page: 1,
    },
  });
}
