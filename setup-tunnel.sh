#!/bin/bash

# Cloudflare Tunnel Setup Script for baocaoluadao.com
# Chạy script này trên máy tính của bạn (không phải VPS)

set -e

echo "=========================================="
echo "Cloudflare Tunnel Setup for baocaoluadao"
echo "=========================================="

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared chưa được cài đặt"
    echo "Cài đặt bằng: brew install cloudflared (macOS) hoặc tải từ https://github.com/cloudflare/cloudflared"
    exit 1
fi

echo "✅ cloudflared đã cài đặt: $(cloudflared --version)"

# Step 1: Login to Cloudflare
echo ""
echo "Bước 1: Đăng nhập Cloudflare..."
echo "Browser sẽ mở ra, hãy đăng nhập và chọn domain baocaoluadao.com"
cloudflared tunnel login

# Step 2: Create tunnel
echo ""
echo "Bước 2: Tạo Cloudflare Tunnel..."
TUNNEL_ID=$(cloudflared tunnel create baocaoluadao-db --json | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✅ Tunnel ID: $TUNNEL_ID"

# Step 3: Create config file
echo ""
echo "Bước 3: Tạo cấu hình tunnel..."

mkdir -p ~/.cloudflared
cat > ~/.cloudflared/mysql.toml << EOF
tunnel: $TUNNEL_ID
credentials-file: ~/.cloudflared/credentials.json

ingress:
  - hostname: mysql.baocaoluadao.internal
    service: tcp://localhost:3306
  - service: http_status:404
EOF

echo "✅ Đã tạo config tại ~/.cloudflared/mysql.toml"

# Step 4: Create DNS route
echo ""
echo "Bước 4: Tạo DNS record..."
cloudflared tunnel route dns baocaoluadao-db api.baocaoluadao.com

echo ""
echo "=========================================="
echo "✅ Setup hoàn tất!"
echo "=========================================="
echo ""
echo "Tunnel ID của bạn: $TUNNEL_ID"
echo ""
echo "Để chạy tunnel, gõ:"
echo "  cloudflared tunnel --config ~/.cloudflared/mysql.toml run"
echo ""
echo "Để chạy ở background:"
echo "  cloudflared tunnel --config ~/.cloudflared/mysql.toml run &"
echo ""
echo "Hãy copy Tunnel ID này cho tôi: $TUNNEL_ID"
echo "để tôi cấu hình Workers!"
