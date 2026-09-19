-- Existing popup_db databases: align the user grade with the application's
-- String userGd and clover_code.code (VARCHAR(20)). Existing values are retained.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE zero_rule.clover_user
    ALTER COLUMN user_gd TYPE VARCHAR(20) USING user_gd::VARCHAR(20);

COMMIT;
