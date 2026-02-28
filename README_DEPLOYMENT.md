# Deployment Flow — baocaoluadao.com

This project follows a GitHub-first production process from development to zero-downtime deployment.

## Branch strategy
- `main` is the active development branch. All feature work, testing, and staging merges happen here.
- `production` is the only branch that may ever be deployed. Commits land here via Pull Request after validation.

## GitHub Actions CI/CD (production)
1. Merge validated changes into `production`.
2. GitHub Actions (`.github/workflows/deploy-production.yml`) triggers on `push` to `production`.
3. Workflow steps:
   - Checkout full history (`fetch-depth: 0`).
   - Install Node.js (v20) and run `npm ci`.
   - Run `npm run lint` (type + code style check) and `npm run build`.
   - SSH into the production VPS using secrets `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`.
   - On VPS: fetch `origin/production`, run `./deploy.sh`, which installs deps, runs migrations, builds, and reloads PM2.

## VPS Deploy Script
- The script always pulls the latest `origin/production` and refuses to run without `AUTH_COOKIE_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH` set.
- Supports `./deploy.sh --rollback vX.X.X` to redeploy any tag. The script checks out the tag, builds it, reloads PM2, and then reverts the worktree to `production`.

## PM2 & Zero Downtime
- `ecosystem.config.js` runs `npm start -- --hostname 127.0.0.1` in a clustered, max-instance configuration with `wait_ready`, `listen_timeout`, `kill_timeout`, and `max_memory_restart` settings.
- Logs are written to `/var/log/baocaoluadao/pm2-out.log` and `pm2-error.log` and are rotated using `pm2-logrotate` with 14-day retention and compression.

## Database Safety
- Migrations live in `migrations/` and are tracked by `scripts/run-migrations.sh`, which records progress in `schema_migrations`.
- Deployments run the migration script to avoid repeats.
- Automated backups run nightly at 02:00 via `/usr/local/bin/backup-baocaoluadao.sh`, retaining the last 7 days of dumps and logging to `/var/log/backup-baocaoluadao.log`.

## Monitoring & Health
- `/api/health` verifies database connectivity, Redis availability, and critical environment variables.
- Rate limiting (Redis-backed with in-memory fallback) protects login, report submission, and public settings endpoints.

## Secrets
- Secrets are never committed. Use `.env.production` on the VPS (ignored via `.gitignore`) to store:
  - `NODE_ENV=production`
  - `AUTH_COOKIE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `REDIS_URL`, `REDIS_TOKEN`

## Rollout & Rollback
1. Tag the release (`git tag -a v1.2.3 -m "Release v1.2.3" && git push origin v1.2.3`).
2. Deploy by merging/pushing to `production` (CI takes over).
3. To rollback, run `./deploy.sh --rollback v1.2.2` inside `/var/www/baocaoluadao.com`.

## Manual Maintenance
- Avoid editing files directly on the VPS; always work in Git and push via GitHub.
- For emergency fixes, create a branch off `production`, fix, push, merge, and rely on the workflow to redeploy.
