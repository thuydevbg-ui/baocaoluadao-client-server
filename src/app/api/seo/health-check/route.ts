/**
 * SEO Health Check API
 * Tự động kiểm tra và báo cáo tình trạng SEO
 * Chạy định kỳ (daily/weekly) để đảm bảo SEO luôn healthy
 */

import { NextResponse } from 'next/server';

interface SEOHealthReport {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }[];
  recommendations: string[];
  timestamp: string;
}

export async function GET() {
  const report: SEOHealthReport = {
    status: 'healthy',
    score: 0,
    checks: [],
    recommendations: [],
    timestamp: new Date().toISOString(),
  };

  // Check 1: Sitemap exists
  try {
    const sitemapRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`);
    if (sitemapRes.ok) {
      report.checks.push({
        name: 'Sitemap',
        status: 'pass',
        message: 'Sitemap.xml accessible',
      });
    } else {
      report.checks.push({
        name: 'Sitemap',
        status: 'fail',
        message: 'Sitemap.xml not found',
      });
      report.status = 'critical';
    }
  } catch {
    report.checks.push({
      name: 'Sitemap',
      status: 'warning',
      message: 'Could not verify sitemap',
    });
  }

  // Check 2: Robots.txt exists
  try {
    const robotsRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/robots.txt`);
    if (robotsRes.ok) {
      report.checks.push({
        name: 'Robots.txt',
        status: 'pass',
        message: 'Robots.txt accessible',
      });
    } else {
      report.checks.push({
        name: 'Robots.txt',
        status: 'fail',
        message: 'Robots.txt not found',
      });
    }
  } catch {
    report.checks.push({
      name: 'Robots.txt',
      status: 'warning',
      message: 'Could not verify robots.txt',
    });
  }

  // Check 3: OG Image exists
  try {
    const ogRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.svg`);
    if (ogRes.ok) {
      report.checks.push({
        name: 'OG Image',
        status: 'pass',
        message: 'Open Graph image accessible',
      });
    } else {
      report.checks.push({
        name: 'OG Image',
        status: 'warning',
        message: 'OG image not found',
      });
    }
  } catch {
    report.checks.push({
      name: 'OG Image',
      status: 'warning',
      message: 'Could not verify OG image',
    });
  }

  // Calculate score
  const passed = report.checks.filter(c => c.status === 'pass').length;
  const total = report.checks.length;
  report.score = Math.round((passed / total) * 100);

  // Determine status
  if (report.score >= 90) {
    report.status = 'healthy';
  } else if (report.score >= 70) {
    report.status = 'warning';
  } else {
    report.status = 'critical';
  }

  // Generate recommendations
  if (report.checks.some(c => c.name === 'Sitemap' && c.status === 'fail')) {
    report.recommendations.push('Generate sitemap.xml using /api/sitemap');
  }
  if (report.checks.some(c => c.name === 'OG Image' && c.status !== 'pass')) {
    report.recommendations.push('Create OG image at /public/og-image.svg');
  }

  return NextResponse.json(report);
}
