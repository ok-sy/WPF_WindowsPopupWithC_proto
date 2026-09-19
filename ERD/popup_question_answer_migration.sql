-- Apply before starting the server with inline question editing enabled.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE popup.popup_question
    ADD COLUMN IF NOT EXISTS correct_answer text,
    ADD COLUMN IF NOT EXISTS answer_match_mode varchar(10)
        CHECK (answer_match_mode IN ('EXACT', 'CONTAINS'));
COMMIT;
