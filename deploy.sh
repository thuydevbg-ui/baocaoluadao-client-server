#!/bin/bash
set -eo pipefail

cd /var/www/baocaoluadao.com

# Load environment variables from .env.production
if [[ -f .env.production ]]; then
  set +u  # Temporarily disable unset variable check for sourcing
  source .env.production
  set -u
else
  echo "ERROR: .env.production file not found"
  exit 1
fi

required_vars=(AUTH_COOKIE_SECRET ADMIN_EMAIL ADMIN_PASSWORD_HASH)
missing=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done
if [[ ${#missing[@]} -ne 0 ]]; then
  echo "ERROR: Missing required environment variables: ${missing[*]}"
  echo "Set them before running deploy.sh (e.g. export AUTH_COOKIE_SECRET=...)."
  exit 1
fi

deploy_worktree() {
  echo "Installing dependencies (production)..."
  npm ci

  echo "Running migrations..."
  ./scripts/run-migrations.sh

  echo "Building project..."
  npm run build

  echo "Reloading PM2..."
  pm2 reload ecosystem.config.js --update-env

  echo "Validating health endpoint..."
  STATUS=$(curl -s -o /tmp/deploy_health.json -w "%{http_code}" https://baocaoluadao.com/api/health)
  if [[ "$STATUS" -ne 200 ]]; then
    cat /tmp/deploy_health.json
    echo "ERROR: Health check failed (status $STATUS)"
    exit 1
  fi
}

deploy_head() {
  git fetch origin production --tags --prune
  git checkout production
  git reset --hard origin/production
}

if [[ "${1:-}" == "--rollback" ]]; then
  TAG="${2:-}"
  if [[ -z "$TAG" ]]; then
    echo "Usage: $0 --rollback <tag>"
    exit 1
  fi

  deploy_head

  if ! git rev-parse --verify "refs/tags/$TAG" >/dev/null 2>&1; then
    echo "Tag $TAG does not exist"
    exit 1
  fi

  echo "Rolling back to $TAG"
  git checkout "$TAG"
  deploy_worktree
  echo "Restoring production branch"
  git checkout production
  git reset --hard origin/production
  exit 0
fi

deploy_head

deploy_worktree
