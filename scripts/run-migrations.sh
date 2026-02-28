#!/bin/bash
set -euo pipefail

cd /var/www/baocaoluadao.com

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production file. Create it before running migrations."
  exit 1
fi

source .env.production

required=(DB_HOST DB_USER DB_NAME DB_PASSWORD)
for var in "${required[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is required for migrations"
    exit 1
  fi
done

export MYSQL_PWD="$DB_PASSWORD"
MYSQL_CMD=(mysql -u "$DB_USER" -h "$DB_HOST" "$DB_NAME")

printf "Creating schema_migrations table if missing...\n"
"${MYSQL_CMD[@]}" -e '
CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
'

for migration in migrations/*.sql; do
  name=$(basename "$migration")
  already_applied=$("${MYSQL_CMD[@]}" -N -B -e "SELECT COUNT(*) FROM schema_migrations WHERE name = '$name';")

  if [[ "$already_applied" == "0" ]]; then
    printf "Applying migration %s...\n" "$name"
    "${MYSQL_CMD[@]}" < "$migration"
    "${MYSQL_CMD[@]}" -e "INSERT INTO schema_migrations (name) VALUES ('$name');"
  else
    printf "Skipping %s (already applied)\n" "$name"
  fi
done

unset MYSQL_PWD
