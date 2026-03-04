# Team Auto-Push Setup

Muc tieu: moi thanh vien co the code tren bat ky may nao, sau do he thong tu dong `git add` + `git commit` + `git push`.

## 1) Setup tren moi may

1. Cai `git` + `nodejs` (khuyen nghi Node 20+).
2. Clone repo:
```bash
git clone git@github.com:thuydevbg-ui/baocaoluadao-client-server.git
cd baocaoluadao-client-server
```
3. Cau hinh danh tinh git (neu chua co):
```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```
4. Cai dependency:
```bash
npm ci
```

## 2) Quy tac branch cho team

- Moi nguoi nen lam viec tren branch rieng (vi du: `dev/thuy`, `dev/an`, `feature/report-filter`).
- Khong nen bat auto-push tren `production` neu khong that su can.

## 3) Bat auto-push

Chay:
```bash
npm run team:auto-push
```

Script se:
- Quet thay doi moi 10 giay.
- Tu dong commit va push len branch hien tai.
- Neu push bi reject do branch moi tren remote, script se tu `pull --rebase` roi push lai.

## 4) Kiem tra nhanh 1 lan

```bash
npm run team:auto-push:once
```

Lenh nay chi chay 1 chu ky, khong giu process nen.

## 5) Bien moi truong tuy chinh

- `AUTO_PUSH_INTERVAL`: chu ky quet (giay), mac dinh `10`.
- `AUTO_PUSH_REMOTE`: remote, mac dinh `origin`.
- `AUTO_PUSH_BRANCH`: branch dich (mac dinh la branch hien tai luc bat script).
- `AUTO_PUSH_MESSAGE_PREFIX`: prefix commit message.
- `AUTO_PUSH_REBASE_ON_REJECT`: dat `0` de tat auto rebase khi push reject.
- `AUTO_PUSH_ALLOW_PROTECTED`: mac dinh script chan `main/master/production`; dat `1` neu muon bo chan.
- `AUTO_PUSH_PROTECTED_BRANCHES`: danh sach branch can chan, mac dinh `main,master,production`.

Vi du:
```bash
AUTO_PUSH_INTERVAL=5 AUTO_PUSH_MESSAGE_PREFIX="chore(sync): team" npm run team:auto-push
```

## 6) Dung auto-push

- Nhan `Ctrl + C` tai terminal dang chay.

## 7) Luu y quan trong

- Auto-push phu hop voi branch lam viec ca nhan/feature branch.
- Van nen merge vao `production` qua PR + review.
- Khong commit file secret vao repo (`.env`, key, token...).
