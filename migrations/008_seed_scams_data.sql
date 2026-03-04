-- Migration 008: Seed initial scams data
-- Created: 2026-03-04

-- Seed sample scams data for production
INSERT INTO scams (id, type, value, description, report_count, risk_level, status, source, created_at, updated_at) VALUES
('SC001', 'website', 'shopee-com-vn.xyz', 'Website giả mạo trang thanh toán Shopee', 234, 'high', 'blocked', 'community', NOW(), NOW()),
('SC002', 'phone', '0123456789', 'Số điện thoại lừa đảo tuyển dụng online', 156, 'high', 'blocked', 'community', NOW(), NOW()),
('SC003', 'email', 'support@vietcombank-fake.com', 'Email giả mạo thông báo khóa tài khoản', 89, 'medium', 'investigating', 'auto_scan', NOW(), NOW()),
('SC004', 'bank', '1234567890', 'Tài khoản ngân hàng lừa đảo chuyển khoản', 67, 'high', 'blocked', 'law_enforcement', NOW(), NOW()),
('SC005', 'website', 'mua-laptop-gia-re.com', 'Website bán hàng không giao hàng', 45, 'medium', 'active', 'community', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
