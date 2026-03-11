# Deployment Instructions

## Cloudflare Workers Deployment Guide

### Prerequisites

1. **Cloudflare Account** - Sign up at https://cloudflare.com
2. **Wrangler CLI** - Install via npm:
   ```bash
   npm install -g wrangler
   ```

3. **Cloudflare Tunnel** - For database access from Workers

---

## Step 1: Configure Environment Variables

Create secrets for your Workers:

```bash
cd workers

# Database connection (via Cloudflare Tunnel)
wrangler secret put DB_HOST
# Enter: your-vps-ip or tunnel-address

wrangler secret put DB_USER
# Enter: database username

wrangler secret put DB_PASSWORD
# Enter: database password

wrangler secret put DB_NAME
# Enter: database name

# Optional: API Keys
wrangler secret put WEB_RISK_API_KEY
# Enter: Google Web Risk API key

wrangler secret put PHISHTANK_API_KEY
# Enter: PhishTank API key
```

---

## Step 2: Configure DNS

In Cloudflare Dashboard:

1. Go to **DNS** → **Records**
2. Add a new CNAME record:
   - Name: `api`
   - Value: `your-worker-name.workers.dev`
   - Proxy: **Proxied** (orange cloud)

---

## Step 3: Deploy Workers

### Development
```bash
cd workers
npm install
npm run dev
```

### Production
```bash
cd workers
npm run deploy
```

### Staging
```bash
cd workers
npm run deploy:staging
```

---

## Step 4: Configure Environment Variables in Frontend

Add to your `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.baocaoluadao.com
```

---

## Step 5: Test the API

Test health endpoint:
```bash
curl https://api.baocaoluadao.com/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Step 6: Rollback

If issues occur:

1. **Quick Rollback** - Redeploy previous version:
   ```bash
   wrangler deployments list
   wrangler rollback [deployment-id]
   ```

2. **Remove Route** - Delete the DNS record to stop routing to Workers

---

## Monitoring

Check Workers metrics in Cloudflare Dashboard:
- **Workers** → **Metrics**

View logs:
```bash
wrangler tail
```

---

## Troubleshooting

### CORS Errors
Ensure your domain is in the allowed origins list in `workers/src/utils.ts`

### Database Connection Issues
- Verify Cloudflare Tunnel is running
- Check firewall rules on VPS

### Rate Limiting
Adjust rate limits in `workers/src/index.ts` if needed
