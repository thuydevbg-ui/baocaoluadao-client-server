# Rollback Guide - ScamGuard

## Các điểm khôi phục đã tạo

### Branches
| Branch | Mô tả |
|--------|-------|
| `master` | Phiên bản hiện tại |
| `backup-initial` | Sao lưu ban đầu |

### Tags
| Tag | Mô tả |
|-----|-------|
| `v1.0.0-initial` | Phiên bản ban đầu |

---

## Cách Rollback

### 1. Rollback về phiên bản ban đầu (khôi phục toàn bộ)
```bash
# Cách 1: Dùng branch backup
git checkout backup-initial
git checkout -b master-backup
git push -f origin master-backup:master

# Cách 2: Dùng tag
git checkout v1.0.0-initial
git checkout -b master
git push -f origin master
```

### 2. Rollback một file cụ thể
```bash
# Xem lịch sử file
git log --oneline src/app/page.tsx

# Khôi phục file về phiên bản cũ
git checkout v1.0.0-initial -- src/app/page.tsx

# Hoặc khôi phục từ commit cụ thể
git checkout abc1234 -- src/app/page.tsx
```

### 3. Undo commit cuối (giữ lịch sử)
```bash
# Undo commit nhưng giữ thay đổi trong staging
git reset --soft HEAD~1

# Undo commit và bỏ thay đổi
git reset --hard HEAD~1
```

### 4. Tạo điểm backup mới trước khi thay đổi lớn
```bash
# Tạo branch backup mới
git checkout -b backup-$(date +%Y%m%d)

# Hoặc tạo tag
git tag v1.0.$(date +%Y%m%d)-backup

# Push lên GitHub
git push origin backup-$(date +%Y%m%d)
```

---

## GitHub Actions (Optional)

Để tự động hóa rollback, có thể thêm GitHub Actions:
- Tạo release mỗi khi merge vào master
- Cho phép rollback bằng cách revert PR

---

## Liên hệ

Nếu cần hỗ trợ rollback, liên hệ qua GitHub Issues.