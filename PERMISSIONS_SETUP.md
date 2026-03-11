# Hướng dẫn chọn Permissions

## Cách đơn giản nhất (Dùng Template)

**Thay vì tạo "Custom token", hãy:**

1. Xóa token đang tạo (nếu đang tạo custom)
2. Click **"Create Token"**
3. Chọn tab **"Custom token"**
4. Click **"Edit Workers"** (template có sẵn)

→ Bỏ qua bước Permissions!

---

## Nếu vẫn muốn tạo Custom Token

### Permissions cần thiết (chỉ 3 cái):

| Type | Permission | Resource |
|------|------------|----------|
| Account | Workers - Edit | baocaoluadao.com |
| Zone | DNS - Edit | baocaoluadao.com |
| Account | Workers Scripts - Write | baocaoluadao.com |

### Cách thêm:

1. **Click "Add more"** trong phần Permissions

2. **Thêm từng dòng**:

```
Permission 1:
- Type: Workers
- Permission: Edit
- Resource: Account - baocaoluadao.com

Permission 2:  
- Type: DNS
- Permission: Edit
- Resource: Zone - baocaoluadao.com

Permission 3:
- Type: Workers Scripts
- Permission: Write
- Resource: Account - baocaoluadao.com
```

---

## Tiếp theo

Sau Permissions → Bước **Resources**:

1. **Account Resources**: Include → `baocaoluadao.com`
2. **Zone Resources**: Include → `baocaoluadao.com`

→ Bỏ qua Client IP Filtering và TTL (để mặc định)

---

## Cuối cùng

Click **"Create Token"** 

**LƯU TOKEN ngay!**
