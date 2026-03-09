CREATE TABLE IF NOT EXISTS user_profile_summary (
  userId CHAR(36) PRIMARY KEY,
  reportsCount INT NOT NULL DEFAULT 0,
  watchlistCount INT NOT NULL DEFAULT 0,
  alertCount INT NOT NULL DEFAULT 0,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profile_summary_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO user_profile_summary (userId, reportsCount, watchlistCount, alertCount)
SELECT
  u.id,
  COALESCE(r.reportsCount, 0),
  COALESCE(w.watchlistCount, 0),
  COALESCE(w.watchlistCount, 0)
FROM users u
LEFT JOIN (
  SELECT userId, COUNT(*) AS reportsCount
  FROM user_reports
  GROUP BY userId
) r ON r.userId = u.id
LEFT JOIN (
  SELECT userId, COUNT(*) AS watchlistCount
  FROM watchlist
  GROUP BY userId
) w ON w.userId = u.id
ON DUPLICATE KEY UPDATE
  reportsCount = VALUES(reportsCount),
  watchlistCount = VALUES(watchlistCount),
  alertCount = VALUES(alertCount),
  updatedAt = NOW();
