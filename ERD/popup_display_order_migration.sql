-- Popup display priority/order migration
-- Existing rows keep the default priority so current data remains valid.

ALTER TABLE popup.popup_notice
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 100;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_popup_display_order'
          AND conrelid = 'popup.popup_notice'::regclass
    ) THEN
        ALTER TABLE popup.popup_notice
            ADD CONSTRAINT ck_popup_display_order
            CHECK (display_order >= 1);
    END IF;
END $$;

COMMENT ON COLUMN popup.popup_notice.display_order IS
    'Popup display priority/order. Lower values are displayed first; popups with the same order may be grouped for simultaneous display.';
