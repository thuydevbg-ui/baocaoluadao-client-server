'use client';

import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Theme script
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      document.documentElement.classList.add(theme);
    } catch (e) {}
  })();
`;

interface ScamItem {
  id: number;
  domain: string;
  type: string;
  date: string;
  status: string;
  isScam: boolean;
}

interface TrustItem {
  id: number;
  domain: string;
  name: string;
  owner: string;
  org: string;
  status: string;
}

interface StatsData {
  website: number;
  organization: number;
  phone: number;
  email: number;
  total: number;
  categories: Array<{ name: string; slug: string; count: number }>;
}

interface HomeData {
  stats: StatsData;
  recentScams: ScamItem[];
  trustedOrgs: TrustItem[];
}

export default function HomeClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(100);
  const [loadingPage, setLoadingPage] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // Fetch real data from APIs
  const fetchData = useCallback(async (page: number = 1) => {
    setLoadingPage(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/stats');
      const statsJson = await statsRes.json();
      
      // Fetch recent scams with pagination (limit 6)
      const scamsRes = await fetch(`/api/scams?category=website&limit=6&page=${page}`);
      const scamsJson = await scamsRes.json();
      
      // Update total pages from API response
      if (scamsJson.pagination?.totalPages) {
        setTotalPages(scamsJson.pagination.totalPages);
      }
      
      // Fetch trusted organizations (limit 4)
      const trustedRes = await fetch('/api/scams?category=organization&includeTrusted=true&limit=4&page=1');
      const trustedJson = await trustedRes.json();

      // Process stats data
      const stats: StatsData = {
        website: statsJson.data?.website || statsJson.website || 0,
        organization: statsJson.data?.organization || statsJson.organization || 0,
        phone: statsJson.data?.phone || statsJson.phone || 0,
        email: statsJson.data?.email || statsJson.email || 0,
        total: statsJson.data?.total || statsJson.total || 0,
        categories: statsJson.data?.categories || statsJson.categories || []
      };

      // Process recent scams
      const recentScams: ScamItem[] = (scamsJson.data || []).map((item: any) => ({
        id: item.id,
        domain: item.domain || item.name || item.value || 'Unknown',
        type: item.type || 'website',
        date: item.date || '',
        status: item.status || 'active',
        isScam: item.is_scam === true || item.is_scam === 1
      }));

      // Process trusted organizations
      const trustedOrgs: TrustItem[] = (trustedJson.data || []).map((item: any) => ({
        id: item.id,
        domain: item.domain || item.name || item.value || '',
        name: item.name || '',
        owner: item.owner || item.description || '',
        org: item.source || 'Tổ chức',
        status: item.status === 'trusted' ? 'Uy tín' : 'Chờ xác minh'
      }));

      setData({
        stats,
        recentScams,
        trustedOrgs
      });
      setLoading(false);
      setLoadingPage(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData({
        stats: { website: 0, organization: 0, phone: 0, email: 0, total: 0, categories: [] },
        recentScams: [],
        trustedOrgs: []
      });
      setLoading(false);
      setLoadingPage(false);
    }
  }, []);

  // Call fetchData when mounted or page changes
  useEffect(() => {
    if (!mounted) return;
    fetchData(currentPage);
  }, [fetchData, mounted, currentPage]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loadingPage) {
      setCurrentPage(newPage);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Calculate stats
  const totalWarnings = data?.stats.total || 0;
  const totalScams = data?.stats.website || 0;
  const totalOrgs = data?.stats.organization || 0;
  const totalPhones = data?.stats.phone || 0;

  if (!mounted || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #cbd5e1, #d9e2e8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#5A747B', fontSize: '18px' }}>Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>BaoCaoLuaDao · Cảnh báo lừa đảo</title>
      </Head>
      <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />

      <div className="main-card">
        {/* HEADER */}
        <div className="header">
          <div className="header-left">
            <div className="icon-box">
              <i className="fi fi-sr-user-police"></i>
            </div>
            <div className="title-group">
              <h1>BaoCaoLuaDao</h1>
              <p><i className="fi fi-sr-shield-check"></i> Cảnh báo lừa đảo</p>
            </div>
          </div>
          <div className="date-badge">
            <i className="fi fi-sr-calendar"></i> {dateStr}
          </div>
        </div>

        {/* MENU SECTION */}
        <div className="menu-section">
          {/* MOBILE MENU */}
          <div className="mobile-menu">
            <Link href="/" className="menu-item active">
              <i className="fi fi-sr-home"></i>
              <span>Trang chủ</span>
            </Link>
            <Link href="/report" className="menu-item">
              <i className="fi fi-sr-warning"></i>
              <span>Tố giác</span>
            </Link>
            <Link href="/report-lua-dao" className="menu-item">
              <i className="fi fi-sr-shield-check"></i>
              <span>Uy tín</span>
            </Link>
            <Link href="/profile" className="menu-item">
              <i className="fi fi-sr-user"></i>
              <span>Cá nhân</span>
            </Link>
          </div>

          {/* PC MENU */}
          <div className="pc-menu">
            <div className="pc-menu-left">
              <Link href="/" className="menu-item active">
                <i className="fi fi-sr-home"></i> Trang chủ
              </Link>
              <Link href="/report" className="menu-item">
                <i className="fi fi-sr-warning"></i> Tố giác
              </Link>
              <Link href="/report-lua-dao" className="menu-item">
                <i className="fi fi-sr-shield-check"></i> Uy tín
              </Link>
              <Link href="/search" className="menu-item">
                <i className="fi fi-sr-search"></i> Tra cứu
              </Link>
            </div>
            <div className="pc-menu-right">
              {isLoggedIn ? (
                <Link href="/profile" className="menu-item user-item">
                  <i className="fi fi-sr-user"></i> Tài khoản
                </Link>
              ) : (
                <>
                  <Link href="/register" className="menu-item auth-item">
                    <i className="fi fi-sr-user-add"></i> Đăng ký
                  </Link>
                  <Link href="/login" className="menu-item auth-item">
                    <i className="fi fi-sr-sign-in-alt"></i> Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STATS - REAL DATA */}
        <div className="stats-grid">
          <div className="stat-item">
            {/* NOTE: Some Flaticon icon names differ by version; shield-exclamation renders reliably here. */}
            <i className="fi fi-sr-shield-exclamation"></i>
            <div className="stat-label">CẢNH BÁO</div>
            <div className="stat-value">{totalWarnings.toLocaleString('vi-VN')}</div>
          </div>
          <div className="stat-item">
            <i className="fi fi-sr-globe"></i>
            <div className="stat-label">WEBSITE</div>
            <div className="stat-value">{totalScams.toLocaleString('vi-VN')}</div>
          </div>
          <div className="stat-item">
            <i className="fi fi-sr-building"></i>
            <div className="stat-label">TỔ CHỨC</div>
            <div className="stat-value">{totalOrgs.toLocaleString('vi-VN')}</div>
          </div>
          <div className="stat-item">
            <i className="fi fi-sr-phone"></i>
            <div className="stat-label">ĐIỆN THOẠI</div>
            <div className="stat-value">{totalPhones.toLocaleString('vi-VN')}</div>
          </div>
        </div>

        {/* TIP */}
        <div className="tip-box">
          <div className="tip-icon">
            <i className="fi fi-rr-megaphone"></i>
          </div>
          <div className="tip-text">
            <strong>Mẹo:</strong> Luôn kiểm tra tên miền thật kỹ trước khi giao dịch.
          </div>
        </div>

        {/* SCAM LIST - REAL DATA */}
        <div className="section-head">
          <h2><i className="fi fi-sr-warning"></i> Tố giác gần đây</h2>
          <Link href="/report-lua-dao" className="view-all">Xem tất cả</Link>
        </div>
        <div className="scam-list">
          {(data?.recentScams && data.recentScams.length > 0) ? (
            data.recentScams.map((scam) => (
              <Link key={scam.id} href={`/detail/website/${encodeURIComponent(scam.domain)}`} className="scam-row">
                <div className="scam-content">
                  <span className="domain-name">{scam.domain}</span>
                  <span className={`badge ${scam.isScam ? 'badge-scam' : 'badge-safe'}`}>
                    <i className={`fi ${scam.isScam ? 'fi-sr-exclamation-circle' : 'fi-sr-check-circle'}`}></i> 
                    {scam.isScam ? 'LỪA ĐẢO' : 'UY TÍN'}
                  </span>
                  <span className="date-info">
                    <i className="fi fi-sr-calendar"></i> {scam.date}
                  </span>
                </div>
                <div className="police-icon">
                  <i className="fi fi-sr-user-police"></i>
                </div>
              </Link>
            ))
          ) : (
            <div className="scam-row">
              <div className="scam-content">
                <span className="domain-name">Chưa có dữ liệu</span>
                <span className="badge">Đang cập nhật...</span>
              </div>
            </div>
          )}
        </div>

        {/* TRUST LIST - REAL DATA */}
        <div className="section-head">
          <h2><i className="fi fi-sr-shield-check"></i> Danh sách uy tín</h2>
          <Link href="/report" className="view-all">Xem tất cả</Link>
        </div>
        <div className="trust-list">
          {(data?.trustedOrgs && data.trustedOrgs.length > 0) ? (
            data.trustedOrgs.map((org) => (
              <Link key={org.id} href={`/detail/organization/${encodeURIComponent(org.domain)}`} className="trust-item">
                <div className="trust-header">
                  <span className="trust-domain">
                    {org.name || org.domain}
                    <span>UY TÍN</span>
                  </span>
                </div>
                <div className="trust-owner">
                  <i className="fi fi-sr-building"></i> {org.owner || 'Tổ chức đã xác minh'}
                </div>
                <div className="trust-footer">
                  <span className="trust-org">{org.org}</span>
                  <span className="trust-status">
                    <i className="fi fi-sr-badge-check"></i> {org.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="trust-item">
              <div className="trust-header">
                <span className="trust-domain">Chưa có dữ liệu</span>
              </div>
              <div className="trust-owner">
                <i className="fi fi-sr-building"></i> Đang cập nhật...
              </div>
            </div>
          )}
        </div>

        {/* BRAND */}
        <div className="brand-bar">
          <div className="brand-icon">
            <i className="fi fi-sr-shield-exclamation"></i>
          </div>
          <div className="brand-name">BaoCaoLuaDao</div>
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button 
            className="page-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loadingPage}
            aria-label="Trang trước"
          >
            <i className="fi fi-sr-angle-left"></i>
          </button>
          <div className="page-info">
            <span>{currentPage}</span> / {totalPages}
          </div>
          <button 
            className="page-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loadingPage}
            aria-label="Trang sau"
          >
            <i className="fi fi-sr-angle-right"></i>
          </button>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <i className="fi fi-sr-refresh"></i>
          <span>Cập nhật liên tục 24/7</span>
        </div>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          background: linear-gradient(145deg, #cbd5e1, #d9e2e8);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 16px;
          color: #0F343D;
        }

        :root {
          --bg-dark: #0F343D;
          --grad-light: #5A747B;
          --accent: #22C55E;
          --border-light: #E5E7EB;
          --card-bg: #153E47;
          --card-hover: #1F5663;
          --text-light: #E2EFF3;
        }

        .main-card {
          width: 100%;
          max-width: 500px;
          background: var(--bg-dark);
          border-radius: 40px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          padding: 24px 20px 28px;
          border: 1px solid var(--grad-light);
        }

        @media (min-width: 800px) {
          .main-card { max-width: 1100px; padding: 32px 40px; border-radius: 60px; }
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 2px solid var(--grad-light);
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .icon-box {
          width: 52px; height: 52px;
          background: var(--accent);
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          color: var(--bg-dark); font-size: 28px;
          box-shadow: 0 10px 20px rgba(34,197,94,0.3);
        }
        .title-group h1 { font-size: 24px; font-weight: 800; color: white; line-height: 1.2; }
        .title-group p { font-size: 12px; color: #B0C9D2; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
        .date-badge {
          background: #1C4A57; padding: 8px 18px; border-radius: 60px;
          font-size: 14px; font-weight: 600; color: white;
          display: flex; align-items: center; gap: 8px;
          border: 1px solid var(--grad-light);
        }
        .date-badge i { color: var(--accent); }

        /* Menu */
        .menu-section { margin-bottom: 28px; }
        
        .mobile-menu {
          display: flex;
          background: rgba(21,62,71,0.9);
          backdrop-filter: blur(10px);
          border-radius: 40px;
          padding: 6px;
          border: 1px solid rgba(90,116,123,0.5);
          margin-bottom: 20px;
        }
        .mobile-menu .menu-item {
          flex: 1; text-align: center; padding: 10px 4px;
          border-radius: 34px; font-weight: 600; font-size: 12px;
          color: rgba(255,255,255,0.7);
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          text-decoration: none;
          transition: all 0.25s;
        }
        .mobile-menu .menu-item i { color: var(--accent); font-size: 20px; }
        .mobile-menu .menu-item.active { background: var(--accent); color: var(--bg-dark); transform: translateY(-2px); }
        .mobile-menu .menu-item.active i { color: var(--bg-dark); }

        .pc-menu { display: none; background: rgba(21,62,71,0.95); backdrop-filter: blur(10px); border-radius: 60px; padding: 8px 12px; border: 1px solid var(--grad-light); margin-bottom: 28px; flex-wrap: wrap; justify-content: space-between; align-items: center; }
        .pc-menu-left { display: flex; flex-wrap: wrap; gap: 6px; }
        .pc-menu-right { display: flex; gap: 8px; margin-left: auto; }
        .pc-menu .menu-item {
          padding: 12px 20px; border-radius: 50px; font-weight: 600; font-size: 15px;
          color: #E0EEF5; display: inline-flex; align-items: center; gap: 10px;
          cursor: pointer; transition: all 0.25s; white-space: nowrap; text-decoration: none;
        }
        .pc-menu .menu-item i { color: var(--accent); font-size: 18px; transition: all 0.2s; }
        .pc-menu .menu-item.active { background: var(--accent); color: var(--bg-dark); box-shadow: 0 6px 15px rgba(34,197,94,0.5); }
        .pc-menu .menu-item.active i { color: var(--bg-dark); }
        .pc-menu .menu-item:not(.active):hover { background: rgba(34,197,94,0.2); color: white; transform: translateY(-2px); }
        
        .auth-item { background: rgba(255,255,255,0.1); border: 1px solid var(--accent); padding: 10px 22px; border-radius: 40px; color: white; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .auth-item i { color: var(--accent); }
        .auth-item:hover { background: var(--accent); color: var(--bg-dark); }
        .auth-item:hover i { color: var(--bg-dark); }

        @media (max-width: 799px) { .mobile-menu { display: flex; } .pc-menu { display: none; } }
        @media (min-width: 800px) { .mobile-menu { display: none; } .pc-menu { display: flex; } }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .stat-item { background: var(--card-bg); border-radius: 24px; padding: 14px 6px; text-align: center; border: 1px solid var(--grad-light); }
        .stat-item i { font-size: 22px; color: var(--accent); margin-bottom: 6px; }
        .stat-label { font-size: 10px; font-weight: 700; color: #A1BDC7; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
        .stat-value { font-size: 24px; font-weight: 800; color: white; }

        /* Tip */
        .tip-box { background: #1C4A57; border-radius: 30px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 28px; border: 1px solid var(--grad-light); }
        .tip-icon { width: 46px; height: 46px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--bg-dark); font-size: 24px; flex-shrink: 0; }
        .tip-text { font-size: 15px; color: #EAF4F8; line-height: 1.45; font-weight: 500; }
        .tip-text strong { color: var(--accent); }

        /* Section */
        .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .section-head h2 { font-size: 20px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
        .section-head h2 i { color: var(--accent); font-size: 22px; }
        .view-all { color: var(--bg-dark); font-size: 14px; font-weight: 600; cursor: pointer; padding: 8px 20px; background: var(--accent); border-radius: 40px; transition: all 0.2s; box-shadow: 0 5px 12px rgba(34,197,94,0.3); white-space: nowrap; border: none; text-decoration: none; display: inline-block; }
        .view-all:hover { background: #1CA850; transform: scale(1.02); }

        /* Scam List */
        .scam-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
        .scam-row { background: var(--card-bg); border-radius: 28px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--grad-light); cursor: pointer; transition: all 0.25s; text-decoration: none; }
        .scam-row:hover { border-color: var(--accent); background: var(--card-hover); transform: translateY(-2px); box-shadow: 0 8px 18px rgba(34,197,94,0.2); }
        .scam-content { display: flex; align-items: center; gap: 14px; flex-wrap: nowrap; flex: 1; min-width: 0; }
        .domain-name { font-size: 15px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .badge { background: #1E505E; color: var(--accent); font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 40px; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase; white-space: nowrap; flex-shrink: 0; border: 1px solid var(--grad-light); }
        .badge-scam { background: #dc2626; color: white; border-color: #ef4444; }
        .badge-safe { background: #16a34a; color: white; border-color: #22c55e; }
        .date-info { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #C2D9E2; white-space: nowrap; flex-shrink: 0; background: #1C4A57; padding: 4px 12px; border-radius: 40px; }
        .date-info i { color: var(--accent); font-size: 11px; }
        .police-icon { width: 42px; height: 42px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--bg-dark); font-size: 20px; flex-shrink: 0; margin-left: 8px; }

        /* Trust List */
        .trust-list { display: flex; flex-direction: column; gap: 12px; margin: 24px 0 20px; }
        .trust-item { background: var(--card-bg); border-radius: 24px; padding: 16px 18px; border: 1px solid var(--grad-light); transition: all 0.2s; text-decoration: none; display: block; }
        .trust-item:hover { border-color: var(--accent); background: var(--card-hover); transform: translateY(-2px); }
        .trust-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .trust-domain { font-size: 16px; font-weight: 700; color: white; letter-spacing: -0.2px; }
        .trust-domain span { color: var(--accent); font-weight: 800; background: #1E505E; padding: 2px 8px; border-radius: 20px; font-size: 12px; margin-left: 6px; border: 1px solid var(--grad-light); }
        .trust-owner { font-size: 13px; color: #B0CDD8; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .trust-owner i { color: var(--accent); font-size: 13px; }
        .trust-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; flex-wrap: wrap; gap: 8px; }
        .trust-org { font-size: 13px; color: #C2D9E2; background: #1C4A57; padding: 4px 12px; border-radius: 30px; border: 1px solid var(--grad-light); }
        .trust-status { display: flex; align-items: center; gap: 6px; color: var(--accent); font-weight: 600; font-size: 13px; background: #1A4A55; padding: 4px 14px; border-radius: 30px; border: 1px solid var(--grad-light); }
        .trust-status i { font-size: 14px; }

        /* Brand */
        .brand-bar { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 20px 0 22px; padding: 18px 0; border-top: 2px dashed var(--grad-light); border-bottom: 2px dashed var(--grad-light); }
        .brand-icon { width: 56px; height: 56px; background: linear-gradient(145deg, var(--accent), #169946); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: var(--bg-dark); font-size: 30px; transform: rotate(-3deg); box-shadow: 0 8px 18px rgba(34,197,94,0.4); }
        .brand-name { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, var(--border-light), #FFFFFF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px; }

        /* Pagination */
        .pagination { display: flex; align-items: center; justify-content: center; gap: 24px; margin: 20px 0 14px; }
        .page-btn { width: 46px; height: 46px; border-radius: 46px; background: #1C4A57; border: 1px solid var(--grad-light); display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; font-size: 20px; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { background: var(--accent); color: var(--bg-dark); border-color: var(--accent); transform: scale(1.05); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .page-info { font-size: 16px; font-weight: 600; color: var(--border-light); }
        .page-info span { color: var(--bg-dark); font-weight: 800; background: var(--accent); padding: 6px 16px; border-radius: 40px; margin: 0 6px; }

        /* Footer */
        .footer { display: flex; align-items: center; justify-content: center; gap: 10px; color: #A6C3CE; font-size: 13px; margin-top: 12px; flex-wrap: wrap; }
        .footer i { color: var(--accent); font-size: 15px; animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Responsive */
        @media (min-width: 800px) { .domain-name { max-width: 300px; font-size: 16px; } .trust-domain { font-size: 18px; } }
        @media (max-width: 420px) { 
          .main-card { padding: 20px 16px; } 
          .domain-name { max-width: 110px; font-size: 13px; } 
          .trust-domain { font-size: 14px; } 
          .mobile-menu .menu-item { font-size: 11px; }
          .pagination { gap: 12px; }
          .page-btn { width: 38px; height: 38px; font-size: 16px; }
          .page-info { font-size: 13px; }
          .page-info span { padding: 4px 10px; }
        }
        @media (min-width: 1200px) {
          .main-card { max-width: 900px; }
        }
        @media (min-width: 1400px) {
          .main-card { max-width: 1000px; }
        }
      `}</style>
    </>
  );
}
