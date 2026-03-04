/**
 * Script để tạo các file hình ảnh SEO
 * Chạy: node scripts/generate-seo-images.js
 */

const fs = require('fs');
const path = require('path');

// Đường dẫn đến thư mục public
const publicDir = path.join(__dirname, '..', 'public');

// Đảm bảo thư mục public tồn tại
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Tạo SVG cho OG Image (1200x630)
const ogImageSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grad1)"/>
  <text x="600" y="250" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">BÁO CÁO LỪA ĐẢO</text>
  <text x="600" y="340" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle">Cộng đồng chống scam lớn nhất Việt Nam</text>
  <text x="600" y="420" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.9)" text-anchor="middle">Tra cứu và Báo cáo lừa đảo miễn phí</text>
  <circle cx="600" cy="520" r="40" fill="white" opacity="0.2"/>
  <path d="M580 520 L595 535 L625 505" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Tạo SVG cho Logo (512x512)
const logoSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#logoGrad)"/>
  <circle cx="256" cy="256" r="160" fill="white" opacity="0.15"/>
  <path d="M186 256 L226 296 L326 196" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="380" cy="140" r="40" fill="#ef4444"/>
  <text x="380" y="152" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">!</text>
</svg>`;

// Tạo SVG cho Apple Touch Icon (180x180)
const appleTouchIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="40" fill="url(#appleGrad)"/>
  <path d="M65 90 L87 112 L115 68" stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="140" cy="50" r="20" fill="#ef4444"/>
  <text x="140" y="56" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">!</text>
</svg>`;

// Tạo SVG cho Favicon (32x32)
const favicon32SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#0ea5e9"/>
  <path d="M10 16 L14 20 L22 12" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Tạo SVG cho Favicon (16x16)
const favicon16SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="3" fill="#0ea5e9"/>
  <path d="M5 8 L7 10 L11 6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Ghi các file SVG
fs.writeFileSync(path.join(publicDir, 'og-image.svg'), ogImageSVG);
fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSVG);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIconSVG);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.svg'), favicon32SVG);
fs.writeFileSync(path.join(publicDir, 'favicon-16x16.svg'), favicon16SVG);

console.log('✅ Đã tạo các file SVG:');
console.log('  - public/og-image.svg');
console.log('  - public/logo.svg');
console.log('  - public/apple-touch-icon.svg');
console.log('  - public/favicon-32x32.svg');
console.log('  - public/favicon-16x16.svg');

// Thử sử dụng sharp để chuyển đổi sang PNG/JPG
try {
  const sharp = require('sharp');
  
  // Chuyển đổi OG Image sang JPG
  sharp(Buffer.from(ogImageSVG))
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'og-image.jpg'))
    .then(() => console.log('✅ public/og-image.jpg'))
    .catch(err => console.log('⚠️  og-image.jpg:', err.message));
  
  // Chuyển đổi Logo sang PNG
  sharp(Buffer.from(logoSVG))
    .png()
    .toFile(path.join(publicDir, 'logo.png'))
    .then(() => console.log('✅ public/logo.png'))
    .catch(err => console.log('⚠️  logo.png:', err.message));
  
  // Chuyển đổi Apple Touch Icon sang PNG
  sharp(Buffer.from(appleTouchIconSVG))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
    .then(() => console.log('✅ public/apple-touch-icon.png'))
    .catch(err => console.log('⚠️  apple-touch-icon.png:', err.message));
  
  // Chuyển đổi favicon sang PNG
  sharp(Buffer.from(favicon32SVG))
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'))
    .then(() => console.log('✅ public/favicon-32x32.png'))
    .catch(err => console.log('⚠️  favicon-32x32.png:', err.message));
  
  sharp(Buffer.from(favicon16SVG))
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'))
    .then(() => console.log('✅ public/favicon-16x16.png'))
    .catch(err => console.log('⚠️  favicon-16x16.png:', err.message));
  
  // Tạo favicon.ico (multi-size)
  const ico = require('sharp-ico');
  if (ico) {
    ico.sharpIco([favicon16SVG, favicon32SVG], {
      sizes: [16, 32],
      format: 'png'
    }).then(buf => {
      fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf);
      console.log('✅ public/favicon.ico');
    }).catch(err => console.log('⚠️  favicon.ico:', err.message));
  }
  
} catch (err) {
  console.log('\n⚠️  Sharp không được cài đặt. Để tạo file PNG/JPG, hãy chạy:');
  console.log('   npm install sharp');
  console.log('\n   Hoặc sử dụng các công cụ online để chuyển đổi SVG sang PNG/JPG');
  console.log('   Các file SVG đã được tạo và có thể sử dụng trực tiếp.');
}

console.log('\n📝 Hướng dẫn:');
console.log('   1. Nếu có sharp: npm install sharp && node scripts/generate-seo-images.js');
console.log('   2. Hoặc upload các file SVG lên công cụ chuyển đổi online');
console.log('   3. Các file SVG cũng hoạt động tốt trên hầu hết các trình duyệt hiện đại');
