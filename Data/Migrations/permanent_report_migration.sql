USE amarcure_db;

ALTER TABLE medical_reports
  ADD COLUMN IF NOT EXISTS storage_key VARCHAR(500) NULL AFTER stored_name;

ALTER TABLE medical_reports
  MODIFY stored_name VARCHAR(255) NULL,
  MODIFY share_token VARCHAR(64) NULL;

CREATE TABLE IF NOT EXISTS report_share_links (
  id INT NOT NULL AUTO_INCREMENT,
  report_id INT NOT NULL,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  access_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_accessed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_report_share_token_hash (token_hash),
  KEY idx_report_share_report (report_id),
  KEY idx_report_share_user (user_id),
  KEY idx_report_share_expiry (expires_at),

  CONSTRAINT fk_report_share_report
    FOREIGN KEY (report_id)
    REFERENCES medical_reports(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_report_share_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE report_share_links
  ADD COLUMN IF NOT EXISTS access_count INT UNSIGNED NOT NULL DEFAULT 0
    AFTER revoked_at,
  ADD COLUMN IF NOT EXISTS last_accessed_at DATETIME NULL
    AFTER access_count;
