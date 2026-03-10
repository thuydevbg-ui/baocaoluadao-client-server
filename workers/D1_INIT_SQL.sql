-- D1 Database Initialization SQL
-- Run this in Cloudflare Dashboard -> D1 -> baocaoluadao-d1 -> Query

-- ============================================
-- CATEGORIES TABLE
-- ============================================

INSERT INTO categories (id, name, slug, type, description, icon, color, is_active, display_order, created_at, updated_at) VALUES
('CAT001', 'Website lừa đảo', 'websites', 'website', 'Các website lừa đảo, giả mạo', 'globe', '#ef4444', 1, 1, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT002', 'Tổ chức', 'organizations', 'organization', 'Tổ chức xác minh hoặc cảnh báo', 'building', '#8b5cf6', 1, 2, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT003', 'Thiết bị', 'devices', 'device', 'Thiết bị bị cảnh báo', 'smartphone', '#10b981', 1, 3, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT004', 'Hệ thống', 'systems', 'system', 'Hệ thống bị nguy hiểm', 'shield', '#f59e0b', 1, 4, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT005', 'Ứng dụng', 'apps', 'application', 'Ứng dụng độc hại', 'app', '#f97316', 1, 5, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT006', 'Số điện thoại', 'phones', 'phone', 'Số điện thoại lừa đảo', 'phone', '#ec4899', 1, 6, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT007', 'Email', 'emails', 'email', 'Email lừa đảo', 'mail', '#3b82f6', 1, 7, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT008', 'Mạng xã hội', 'social', 'social', 'Tài khoản mạng xã hội lừa đảo', 'users', '#06b6d4', 1, 8, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT009', 'Tin nhắn SMS', 'sms', 'sms', 'Tin nhắn SMS lừa đảo', 'message', '#84cc16', 1, 9, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT010', 'Ngân hàng', 'banks', 'bank', 'Tài khoản ngân hàng lừa đảo', 'building2', '#14b8a6', 1, 10, '2026-02-28 19:06:45', '2026-02-28 19:07:35');

-- ============================================
-- SITE_SETTINGS TABLE (Optional defaults)
-- ============================================

INSERT INTO site_settings (key, value, type, description, created_at, updated_at) VALUES
('site_name', 'Báo Cáo Lừa Đảo', 'string', 'Tên website', '2026-02-28 19:00:00', '2026-02-28 19:00:00'),
('site_description', 'Hệ thống cảnh báo lừa đảo Việt Nam', 'string', 'Mô tả website', '2026-02-28 19:00:00', '2026-02-28 19:00:00'),
('reports_enabled', 'true', 'boolean', 'Cho phép gửi báo cáo', '2026-02-28 19:00:00', '2026-02-28 19:00:00'),
('ai_scan_enabled', 'true', 'boolean', 'Bật tính năng quét AI', '2026-02-28 19:00:00', '2026-02-28 19:00:00');

-- ============================================
-- VERIFY DATA
-- ============================================

SELECT 'Categories:' as info, COUNT(*) as count FROM categories;
SELECT 'Site Settings:' as info, COUNT(*) as count FROM site_settings;
