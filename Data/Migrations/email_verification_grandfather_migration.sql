-- One-time migration: run this ONCE, immediately when deploying the email
-- verification enforcement added to /api/login.
--
-- Email verification was never enforced before this change, so existing
-- accounts have email_verified_at = NULL even though their owners never
-- had a chance to verify. This marks all currently-existing accounts as
-- verified so nobody already registered gets locked out of login.
--
-- Do not re-run this later — running it after new, genuinely-unverified
-- signups have accumulated would incorrectly grandfather them in too.

USE amarcure_db;

UPDATE users
SET email_verified_at = CURRENT_TIMESTAMP
WHERE email_verified_at IS NULL;
