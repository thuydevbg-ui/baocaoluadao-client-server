import { SearchResult, ScamDetail, Comment } from './utils';

// Mock search results for the search dropdown
export const mockSearchResults: SearchResult[] = [
  { id: 1, type: 'phone', value: '0123456789', risk: 'scam', reports: 23 },
  { id: 2, type: 'bank', value: 'VCB 123456789', risk: 'suspicious', reports: 5 },
  { id: 3, type: 'website', value: 'fakestore.com', risk: 'scam', reports: 156 },
];

// Mock notifications
export const mockNotifications = [
  { id: 1, text: 'Có báo cáo mới gần bạn', unread: true },
  { id: 2, text: 'Báo cáo của bạn đã được cập nhật', unread: false },
];

// Categories from tinnhiemmang.vn
export const mockCategories = [
  { name: 'Website', slug: 'websites', count: 8200, icon: '🌐', description: 'Website giả mạo, lừa đảo', color: 'from-blue-500 to-blue-600' },
  { name: 'Tổ chức', slug: 'organizations', count: 2100, icon: '🏢', description: 'Tổ chức bị mạo danh', color: 'from-purple-500 to-purple-600' },
  { name: 'Thiết bị', slug: 'devices', count: 1200, icon: '📱', description: 'Thiết bị bị cảnh báo', color: 'from-green-500 to-green-600' },
  { name: 'Hệ thống', slug: 'systems', count: 550, icon: '🔒', description: 'Hệ thống bị tấn công', color: 'from-red-500 to-red-600' },
  { name: 'Ứng dụng', slug: 'apps', count: 355, icon: '📲', description: 'Ứng dụng giả mạo', color: 'from-orange-500 to-orange-600' },
];

// Mock stats for homepage with extended data
export const mockStats = {
  totalReports: '12,405',
  totalReportsNum: 12405,
  verifiedCases: '8,932',
  verifiedCasesNum: 8932,
  verifiedPercent: 72,
  totalMembers: '45.2K',
  totalMembersNum: 45200,
  protectedAmount: '$2.4M',
  protectedAmountNum: 2400000,
};

// Mock popular searches for homepage
export const mockPopularSearches = [
  { type: 'phone' as const, value: '0123456789', risk: 'scam' as const },
  { type: 'bank' as const, value: 'VCB 123456789', risk: 'suspicious' as const },
  { type: 'website' as const, value: 'fakestore.com', risk: 'scam' as const },
  { type: 'crypto' as const, value: '0x1234...abcd', risk: 'scam' as const },
];

// Mock recent search history
export const mockSearchHistory = [
  '0987654321',
  'Techcombank fake',
  'shopee scam',
];

// Mock trending scams
export const mockTrendingScams = [
  { id: 1, name: 'Giả mạo CSKH ngân hàng', reports: 1245, type: 'phone', risk: 'high', image: '📞' },
  { id: 2, name: 'Website giả Shopee/Tiki', reports: 892, type: 'website', risk: 'high', image: '🛒' },
  { id: 3, name: 'Lừa đảo đầu tư forex', reports: 567, type: 'investment', risk: 'high', image: '💹' },
  { id: 4, name: 'Giả mạo việc làm online', reports: 423, type: 'job', risk: 'medium', image: '💼' },
  { id: 5, name: 'Lừa đảo mua bán xe', reports: 312, type: 'social', risk: 'medium', image: '🚗' },
  { id: 6, name: 'Giả mạo shipper', reports: 289, type: 'phone', risk: 'medium', image: '📦' },
];

// Mock safety tips
export const mockSafetyTips = [
  { id: 1, title: 'Không chia sẻ OTP', description: 'Ngân hàng và các tổ chức uy tín KHÔNG bao giờ yêu cầu bạn cung cấp mã OTP qua điện thoại.', icon: '🔒', category: 'security' },
  { id: 2, title: 'Xác minh nguồn gốc', description: 'Kiểm tra kỹ thông tin về người liên hệ, công ty trước khi thực hiện giao dịch.', icon: '✅', category: 'verification' },
  { id: 3, title: 'Cảnh giác đường link', description: 'Không click vào các link lạ trong tin nhắn SMS, email hoặc mạng xã hội.', icon: '🔗', category: 'security' },
  { id: 4, title: 'Thanh toán an toàn', description: 'Sử dụng các phương thức thanh toán có bảo vệ khi mua sắm trực tuyến.', icon: '💳', category: 'payment' },
  { id: 5, title: 'Báo cáo ngay lập tức', description: 'Nếu phát hiện lừa đảo, hãy báo cáo ngay để bảo vệ cộng đồng.', icon: '📢', category: 'community' },
  { id: 6, title: 'Cập nhật thông tin', description: 'Theo dõi các cảnh báo mới nhất từ cộng đồng và cơ quan chức năng.', icon: '📰', category: 'awareness' },
];

// Mock recent alerts
export const mockRecentAlerts = [
  { id: 1, type: 'phone', value: '0987 654 321', description: 'Giả mạo CSKH Viettel yêu cầu cung cấp thông tin tài khoản', risk: 'scam', reports: 45, views: 1234, comments: 12, priority: 'high', time: '38 phút trước', verified: true },
  { id: 2, type: 'website', value: 'fakestore-vn.com', description: 'Website giả mạo Shopee với các sản phẩm giảm giá khủng', risk: 'scam', reports: 156, views: 5678, comments: 34, priority: 'high', time: '2 giờ trước', verified: true },
  { id: 3, type: 'bank', value: 'ACB 8888 9999', description: 'Tài khoản lừa đảo qua tin nhắn SMS giả mạo ngân hàng', risk: 'scam', reports: 23, views: 892, comments: 8, priority: 'medium', time: '5 giờ trước', verified: true },
  { id: 4, type: 'phone', value: '0901 234 567', description: 'Cuộc gọi giả mạo công an yêu cầu chuyển tiền để "phong tỏa tài khoản"', risk: 'scam', reports: 89, views: 2345, comments: 21, priority: 'high', time: '1 ngày trước', verified: true },
  { id: 5, type: 'website', value: 'investFake.net', description: 'Nền tảng đầu tư lừa đảo với lời hứa lợi nhuận cao bất thường', risk: 'scam', reports: 234, views: 8901, comments: 56, priority: 'high', time: '1 ngày trước', verified: true },
  { id: 6, type: 'phone', value: '0935 123 456', description: 'Tin nhắn SMS giả mạo trúng thưởng với link malware', risk: 'suspicious', reports: 12, views: 456, comments: 4, priority: 'low', time: '2 ngày trước', verified: false },
];

// Mock comments
export const mockComments: Comment[] = [
  { id: 1, user: 'Nguyen Van A', avatar: 'N', text: 'This is a scam! They called me claiming to be from the bank.', time: '2 hours ago', helpful: 12 },
  { id: 2, user: 'Le Thi B', avatar: 'L', text: 'Same here! They asked for OTP code.', time: '5 hours ago', helpful: 8 },
];
