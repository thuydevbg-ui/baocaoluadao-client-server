import { NextResponse } from 'next/server';
import { fetchCategoryDirectory, type TinnhiemCategory } from '@/lib/dataSources/tinnhiemmang';

interface CategoryStats {
  name: string;
  slug: TinnhiemCategory;
  count: number;
  icon: string;
  description: string;
}

const CATEGORY_META: Record<TinnhiemCategory, Omit<CategoryStats, 'slug' | 'count'>> = {
  websites: {
    name: 'Website',
    icon: '🌐',
    description: 'Danh sách website cảnh báo hoặc cần xác minh',
  },
  organizations: {
    name: 'Tổ chức',
    icon: '🏢',
    description: 'Danh sách tổ chức đã xác minh trên tinnhiemmang.vn',
  },
  devices: {
    name: 'Thiết bị',
    icon: '📱',
    description: 'Danh mục thiết bị được xác minh',
  },
  systems: {
    name: 'Hệ thống',
    icon: '🔒',
    description: 'Danh mục hệ thống được xác minh',
  },
  apps: {
    name: 'Ứng dụng',
    icon: '📲',
    description: 'Danh mục ứng dụng được xác minh',
  },
};

const FALLBACK_COUNTS: Record<TinnhiemCategory, number> = {
  websites: 8200,
  organizations: 2100,
  devices: 1200,
  systems: 550,
  apps: 355,
};

function estimateCategoryCount(category: TinnhiemCategory, totalEstimate: number, firstPageItems: number): number {
  if (totalEstimate > 0) {
    return Math.min(totalEstimate, 200000);
  }
  if (firstPageItems > 0) {
    return firstPageItems;
  }
  return FALLBACK_COUNTS[category];
}

export async function GET() {
  try {
    const orderedCategories: TinnhiemCategory[] = ['websites', 'organizations', 'devices', 'systems', 'apps'];
    const settled = await Promise.allSettled(
      orderedCategories.map((category) => fetchCategoryDirectory(category, 1))
    );

    let successCount = 0;
    const categories: CategoryStats[] = orderedCategories.map((category, index) => {
      const meta = CATEGORY_META[category];
      const result = settled[index];

      if (result.status === 'fulfilled') {
        successCount += 1;
        const estimatedCount = estimateCategoryCount(
          category,
          result.value.totalEstimate,
          result.value.items.length
        );

        return {
          name: meta.name,
          slug: category,
          count: estimatedCount,
          icon: meta.icon,
          description: meta.description,
        };
      }

      return {
        name: meta.name,
        slug: category,
        count: FALLBACK_COUNTS[category],
        icon: meta.icon,
        description: meta.description,
      };
    });

    const total = categories.reduce((sum, category) => sum + category.count, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total,
      categories,
      summary: {
        websites: categories.find((c) => c.slug === 'websites')?.count ?? 0,
        organizations: categories.find((c) => c.slug === 'organizations')?.count ?? 0,
        devices: categories.find((c) => c.slug === 'devices')?.count ?? 0,
        systems: categories.find((c) => c.slug === 'systems')?.count ?? 0,
        apps: categories.find((c) => c.slug === 'apps')?.count ?? 0,
      },
      source: successCount > 0 ? 'tinnhiemmang.vn' : 'fallback',
      message:
        successCount > 0
          ? 'Dữ liệu đã đồng bộ từ tinnhiemmang.vn (một phần số lượng là ước lượng theo phân trang).'
          : 'Không thể đồng bộ nguồn ngoài, đang dùng dữ liệu dự phòng.',
    });
  } catch (error) {
    console.error('Error fetching stats:', error);

    const categories: CategoryStats[] = (Object.keys(CATEGORY_META) as TinnhiemCategory[]).map((slug) => ({
      name: CATEGORY_META[slug].name,
      slug,
      count: FALLBACK_COUNTS[slug],
      icon: CATEGORY_META[slug].icon,
      description: CATEGORY_META[slug].description,
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: categories.reduce((sum, category) => sum + category.count, 0),
      categories,
      summary: {
        websites: FALLBACK_COUNTS.websites,
        organizations: FALLBACK_COUNTS.organizations,
        devices: FALLBACK_COUNTS.devices,
        systems: FALLBACK_COUNTS.systems,
        apps: FALLBACK_COUNTS.apps,
      },
      source: 'fallback',
    });
  }
}
