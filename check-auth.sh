#!/bin/bash
echo "=== User Authentication Status ==="
/opt/homebrew/opt/postgresql@15/bin/psql -d trip_planner -c "
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
