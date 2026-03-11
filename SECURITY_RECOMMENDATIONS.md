# Security Recommendations

## Cloudflare Workers Security

### 1. Rate Limiting

**Implementation:**
- Use Cloudflare Rate Limiting (requires Pro plan)
- Configure in Cloudflare Dashboard → Security → WAF → Rate Limiting

**Recommended Limits:**
| Endpoint | Requests/Minute | Burst |
|----------|-----------------|-------|
| /report | 10 | 20 |
| /scan | 20 | 30 |
| /scams | 60 | 100 |
| /categories | 60 | 100 |
| /stats | 30 | 50 |
| /policy-violations/lookup | 30 | 50 |
| /detail-feedback | 20 | 30 |
| /detail-views | 60 | 100 |
| /risk/analyze | 10 | 20 |
| /phishtank | 30 | 50 |
| /seo/health-check | 10 | 20 |
| /settings/public | 120 | 200 |

### 2. CORS Configuration

**Current Configuration** (`workers/src/utils.ts`):
```typescript
const allowedOrigins = [
  'https://baocaoluadao.com',
  'https://www.baocaoluadao.com',
  'http://localhost:3000',
  'http://localhost:3001',
];
```

**Production:** Only allow your production domain.

### 3. Request Validation

All handlers include:
- Input sanitization
- Type validation
- Format validation
- Length limits

### 4. Sensitive Data Protection

**Never expose:**
- Database credentials in client-side code
- API keys in public code
- Internal server IPs

**Use:**
- Cloudflare Secrets for sensitive data
- Environment variables for configuration

### 5. DDoS Protection

Cloudflare provides:
- Automatic DDoS mitigation
- Traffic filtering
- Bot detection

Ensure these are enabled in Cloudflare Dashboard.

### 6. Firewall Rules

Configure WAF rules in Cloudflare:
- Block known malicious IPs
- Country-based filtering (if needed)
- SQL injection protection
- XSS protection

### 7. SSL/TLS

Cloudflare provides free SSL:
- Ensure SSL is set to "Full" or "Full (strict)"
- Enable "Always Use HTTPS"

### 8. Monitoring

**Set up alerts:**
- Error rate spikes
- Response time degradation
- Unusual traffic patterns

**Use:**
- Cloudflare Analytics
- Workers Metrics
- Error logging

---

## Database Security

### Option 1: Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflared  # macOS
# or
sudo apt install cloudflared  # Linux

# Create tunnel
cloudflared tunnel create baocaoluadao-db

# Configure tunnel
cloudflared tunnel route dns baocaoluadao-db api.baocaoluadao.com
```

### Option 2: Private Network

- Use VPC peering or private networking
- Restrict database to internal network only
- Use firewall rules to allow only VPS and Workers IPs

---

## Audit Checklist

- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] SSL/TLS enforced
- [ ] WAF rules configured
- [ ] Database access secured
- [ ] API keys stored as secrets
- [ ] Monitoring alerts set up
- [ ] Error logging configured
- [ ] DDoS protection enabled
- [ ] Access logs reviewed regularly
