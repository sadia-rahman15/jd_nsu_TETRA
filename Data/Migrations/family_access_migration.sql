-- Family Access feature: run this against the amarcure_db database.
-- Follows the house style used in backend/database_migration.sql.

USE amarcure_db;

-- ---------------------------------------------------------------------
-- 1. family_relationships
--    One row per (owner, member) pair. Doubles as the invitation and the
--    live relationship -- there is no separate "invitations" table because
--    an invitee must already have an AmarCure account, so every row is
--    always resolvable to a real member_user_id from the moment it is
--    created. Re-inviting after a decline/removal reuses this same row
--    (UPDATE back to 'pending') rather than inserting a duplicate, so the
--    UNIQUE (owner_user_id, member_user_id) key holds forever and full
--    history is preserved via status transitions.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_relationships (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT UNSIGNED NOT NULL,
  member_user_id INT UNSIGNED NOT NULL,
  relationship_type ENUM('child','parent','spouse','sibling','guardian','other') NOT NULL,
  access_level ENUM('view_only','manage','emergency') NOT NULL,
  status ENUM('pending','active','revoked','declined') NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_family_owner_member (owner_user_id, member_user_id),
  KEY idx_family_rel_owner (owner_user_id),
  KEY idx_family_rel_member (member_user_id),
  KEY idx_family_rel_status (status),
  CONSTRAINT fk_family_rel_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_family_rel_member
    FOREIGN KEY (member_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. family_activity_log
--    event_type is VARCHAR, not ENUM, since it's an open-ended, growing
--    list of event kinds (INVITE_SENT, INVITE_ACCEPTED, INVITE_DECLINED,
--    ACCESS_LEVEL_CHANGED, MEMBER_REMOVED, PROFILE_VIEWED, PROFILE_UPDATED,
--    EMERGENCY_ACCESS_USED, QR_CARD_GENERATED, QR_CARD_REVOKED,
--    QR_CARD_SCANNED, REPORT_VIEWED) and a VARCHAR avoids a schema
--    migration every time a new one is added.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_activity_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT UNSIGNED NOT NULL,
  actor_user_id INT UNSIGNED NULL,
  relationship_id INT UNSIGNED NULL,
  event_type VARCHAR(40) NOT NULL,
  description VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_family_activity_owner (owner_user_id, created_at),
  KEY idx_family_activity_actor (actor_user_id, created_at),
  CONSTRAINT fk_family_activity_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_family_activity_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_family_activity_relationship
    FOREIGN KEY (relationship_id) REFERENCES family_relationships(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. emergency_card_tokens (mirrors report_share_links)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_card_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  access_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_accessed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_emergency_card_token_hash (token_hash),
  KEY idx_emergency_card_user (user_id),
  KEY idx_emergency_card_expiry (expires_at),
  CONSTRAINT fk_emergency_card_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. device_push_tokens
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_push_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  expo_push_token VARCHAR(255) NOT NULL,
  device_info VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_push_token (expo_push_token),
  KEY idx_device_push_user (user_id),
  CONSTRAINT fk_device_push_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
