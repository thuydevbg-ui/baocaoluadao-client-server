#!/usr/bin/env node

/**
 * SEO Validator Script
 * Kiểm tra toàn bộ website để đảm bảo:
 * 1. Không có thông tin nhạy cảm bị lộ trong SEO
 * 2. Metadata hợp lệ và chuẩn SEO
 * 3. Heading structure đúng chuẩn
 * 4. Không có internal URLs, debug info trong output
 */

const fs = require('fs');
const path = require('path');

// Simple glob implementation without external dependency
function globSync(pattern, options = {}) {
  const results = [];
  const baseDir = process.cwd();
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!options.ignore || !options.ignore.some(ignore => fullPath.includes(ignore.replace('**/', '')))) {
          walkDir(fullPath);
        }
      } else {
        if (file.match(/\.(tsx|ts|jsx|js)$/) && !file.includes('.test.') && !file.includes('.spec.')) {
          results.push(fullPath);
        }
      }
    }
  }
  
  walkDir(path.join(baseDir, 'src'));
  return results;
}

// Sensitive patterns that should NOT appear in SEO metadata
const SENSITIVE_PATTERNS = [
  // API Keys and Secrets
  /[a-zA-Z0-9_-]*api[_-]?key[a-zA-Z0-9_-]*[=:]\s*['"][a-zA-Z0-9]{16,}['"]/i,
  /[a-zA-Z0-9_-]*secret[a-zA-Z0-9_-]*[=:]\s*['"][a-zA-Z0-9]{16,}['"]/i,
  /[a-zA-Z0-9_-]*token[a-zA-Z0-9_-]*[=:]\s*['"][a-zA-Z0-9]{16,}['"]/i,
  /[a-zA-Z0-9_-]*password[a-zA-Z0-9_-]*[=:]\s*['"][^'"]+['"]/i,
  
  // Internal URLs
  /localhost:\d+/i,
  /127\.0\.0\.1/,
  /192\.168\.\d+\.\d+/,
  /10\.\d+\.\d+\.\d+/,
  /172\.1[6-9]\.\d+\.\d+/,
  /172\.2[0-9]\.\d+\.\d+/,
  /172\.3[0-1]\.\d+\.\d+/,
  /staging\./i,
  /dev\./i,
  /test\./i,
  /internal\./i,
  
  // Debug/Development markers
  /console\.log\(/,
  /debugger;/,
  /__DEBUG__/,
  /process\.env\./,
  
  // Database connection strings
  /mongodb(\+srv)?:\/\//,
  /mysql:\/\//,
  /postgres:\/\//,
  /redis:\/\//,
];

// Patterns for metadata validation
const META_PATTERNS = {
  title: /<title>([^<]*)<\/title>/i,
  description: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
  ogTitle: /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
  ogDescription: /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
  canonical: /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i,
};

// Heading patterns
const HEADING_PATTERNS = {
  h1: /<h1[^>]*>([^<]*)<\/h1>/gi,
  h2: /<h2[^>]*>([^<]*)<\/h2>/gi,
  h3: /<h3[^>]*>([^<]*)<\/h3>/gi,
};

class SEOValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(type, message, file = '') {
    const prefix = file ? `[${file}] ` : '';
    switch (type) {
      case 'error':
        this.issues.push(`${prefix}${message}`);
        console.error(`❌ ${prefix}${message}`);
        break;
      case 'warning':
        this.warnings.push(`${prefix}${message}`);
        console.warn(`⚠️  ${prefix}${message}`);
        break;
      case 'pass':
        this.passed.push(`${prefix}${message}`);
        console.log(`✅ ${prefix}${message}`);
        break;
    }
  }

  validateFile(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check for sensitive information
    SENSITIVE_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        const patternNames = ['API Key', 'Secret', 'Token', 'Password', 'Localhost', 
          'Private IP', 'Staging URL', 'Debug code', 'Database URL'];
        this.log('error', `Phát hiện ${patternNames[index] || 'sensitive data'} trong code`, relativePath);
      }
    });

    // Only validate metadata for page files
    if (filePath.includes('/app/') && (filePath.endsWith('page.tsx') || filePath.endsWith('layout.tsx'))) {
      this.validateMetadata(content, relativePath);
      this.validateHeadings(content, relativePath);
    }
  }

  validateMetadata(content, filePath) {
    // Check title
    const titleMatch = content.match(META_PATTERNS.title);
    if (!titleMatch) {
      this.log('error', 'Thiếu thẻ <title>', filePath);
    } else {
      const title = titleMatch[1];
      if (title.length < 30) {
        this.log('warning', `Title quá ngắn (${title.length} ký tự)`, filePath);
      } else if (title.length > 60) {
        this.log('warning', `Title quá dài (${title.length} ký tự)`, filePath);
      } else {
        this.log('pass', `Title hợp lệ (${title.length} ký tự): "${title}"`, filePath);
      }
    }

    // Check description
    const descMatch = content.match(META_PATTERNS.description);
    if (!descMatch) {
      this.log('error', 'Thiếu meta description', filePath);
    } else {
      const desc = descMatch[1];
      if (desc.length < 120) {
        this.log('warning', `Description quá ngắn (${desc.length} ký tự)`, filePath);
      } else if (desc.length > 160) {
        this.log('warning', `Description quá dài (${desc.length} ký tự)`, filePath);
      } else {
        this.log('pass', `Description hợp lệ (${desc.length} ký tự)`, filePath);
      }
    }

    // Check for Open Graph
    const ogTitleMatch = content.match(META_PATTERNS.ogTitle);
    const ogDescMatch = content.match(META_PATTERNS.ogDescription);
    
    if (!ogTitleMatch) {
      this.log('warning', 'Thiếu og:title (khuyến nghị cho social sharing)', filePath);
    }
    if (!ogDescMatch) {
      this.log('warning', 'Thiếu og:description (khuyến nghị cho social sharing)', filePath);
    }
  }

  validateHeadings(content, filePath) {
    // Count headings
    const h1Matches = content.match(HEADING_PATTERNS.h1) || [];
    const h2Matches = content.match(HEADING_PATTERNS.h2) || [];
    const h3Matches = content.match(HEADING_PATTERNS.h3) || [];

    if (h1Matches.length === 0) {
      this.log('error', 'Thiếu thẻ H1', filePath);
    } else if (h1Matches.length > 1) {
      this.log('error', `Có ${h1Matches.length} thẻ H1 (chỉ nên có 1)`, filePath);
    } else {
      const h1Text = h1Matches[0].replace(/<[^>]*>/g, '').trim();
      this.log('pass', `H1 hợp lệ: "${h1Text.substring(0, 50)}${h1Text.length > 50 ? '...' : ''}"`, filePath);
    }

    if (h2Matches.length === 0) {
      this.log('warning', 'Không có thẻ H2 (nên có ít nhất 2)', filePath);
    } else {
      this.log('pass', `Có ${h2Matches.length} thẻ H2`, filePath);
    }

    // Check heading hierarchy
    if (h3Matches.length > 0 && h2Matches.length === 0) {
      this.log('error', 'Có H3 nhưng không có H2 - vi phạm cấu trúc', filePath);
    }
  }

  validateEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      this.log('warning', 'Không tìm thấy .env.local');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Check if sensitive vars are exposed in client-side
    const clientExposed = envContent.match(/NEXT_PUBLIC_.*=(.+)/g) || [];
    clientExposed.forEach(line => {
      const [key, value] = line.split('=');
      if (value && value.length > 20 && !value.includes('http')) {
        this.log('warning', `Biến ${key} có giá trị dài - kiểm tra không phải secret`, '.env.local');
      }
    });
  }

  run() {
    console.log('🔍 SEO Validator - Kiểm tra website trước khi deploy\n');
    console.log('==============================================\n');

    // Validate env file
    this.validateEnvFile();

    // Find all relevant files
    const files = globSync('src/**/*.{tsx,ts,jsx,js}', {
      ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
    });

    console.log(`Tìm thấy ${files.length} files để kiểm tra\n`);

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      this.validateFile(file, content);
    });

    // Summary
    console.log('\n==============================================');
    console.log('📊 KẾT QUẢ KIỂM TRA:');
    console.log(`✅ Đạt: ${this.passed.length}`);
    console.log(`⚠️  Cảnh báo: ${this.warnings.length}`);
    console.log(`❌ Lỗi: ${this.issues.length}`);
    console.log('==============================================\n');

    if (this.issues.length > 0) {
      console.log('🚫 CÓ LỖI NGHIÊM TRỌNG - KHÔNG NÊN DEPLOY');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('⚠️  CÓ CẢNH BÁO - NÊN KIỂM TRA LẠI');
      process.exit(0);
    } else {
      console.log('✅ TẤT CẢ ĐẠT CHUẨN - CÓ THỂ DEPLOY');
      process.exit(0);
    }
  }
}

// Run validator
const validator = new SEOValidator();
validator.run();
