#!/bin/bash
# Find psql command - check PATH first, then PostgreSQL 16 location
PSQL_CMD=""

if command -v psql >/dev/null 2>&1; then
  PSQL_CMD="psql"
elif [ -f "/opt/homebrew/opt/postgresql@16/bin/psql" ]; then
  PSQL_CMD="/opt/homebrew/opt/postgresql@16/bin/psql"
elif [ -f "/usr/local/opt/postgresql@16/bin/psql" ]; then
  PSQL_CMD="/usr/local/opt/postgresql@16/bin/psql"
else
  echo "Error: psql command not found. Please install PostgreSQL 16."
  exit 1
fi

echo "=== User Authentication Status ==="
$PSQL_CMD -d trip_planner -c "
SELECT
  u.email,
  u.name,
  COUNT(DISTINCT a.id) as google_accounts,
  COUNT(DISTINCT t.id) as trips,
  MAX(a.provider) as provider
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN trips t ON u.id = t.user_id
GROUP BY u.email, u.name
ORDER BY u.email;
"
