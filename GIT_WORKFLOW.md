# Git Workflow (Production)

Mục tiêu: đảm bảo ổn định production, kiểm soát chất lượng và rollback dễ dàng.

## 1) Branch Model
- `main`: production (chỉ merge qua PR).
- `staging`: pre-production / UAT (khuyến nghị nếu có môi trường staging).
- `feature/*`: phát triển tính năng.
- `fix/*`: sửa lỗi thường.
- `hotfix/*`: sửa lỗi khẩn cấp từ `main`.

## 2) Quy tắc bắt buộc
- Không push trực tiếp vào `main` (và `staging` nếu có).
- PR bắt buộc + tối thiểu 1 approval.
- CI bắt buộc xanh trước khi merge.
- Merge theo kiểu `squash` hoặc `rebase` để giữ lịch sử gọn.

## 3) Quy ước commit (khuyến nghị)
Sử dụng Conventional Commits:
- `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`

## 4) Quy trình phát triển
1. `git checkout main`
2. `git pull --rebase`
3. `git checkout -b feature/ten-tinh-nang`
4. Code + commit
5. Push + mở PR vào `staging` (hoặc `main` nếu không có staging)
6. CI pass + review -> merge

## 5) Quy trình release
1. Tạo PR release từ `staging` -> `main` (hoặc từ `main` nếu không có staging).
2. Sau khi merge, tag release:
   - `git tag -a vX.Y.Z -m "release vX.Y.Z"`
   - `git push origin vX.Y.Z`
3. Deploy production từ `main`.

## 6) Hotfix
1. `git checkout main`
2. `git checkout -b hotfix/mo-ta-loi`
3. Fix + PR vào `main`
4. Sau khi merge, cherry-pick vào `staging` (nếu có):
   - `git checkout staging`
   - `git cherry-pick <commit>`

## 7) Branch Protection (GitHub/GitLab)
Thiết lập (trên UI repo):
- Require PR for `main` (và `staging`).
- Require status checks: `CI`.
- Require linear history.
- Require at least 1 reviewer.

