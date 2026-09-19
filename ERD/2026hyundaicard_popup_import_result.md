# 2026hyundaicard popup import verification

- Target: localhost:5432/popup_db
- Date: 2026-09-07
- Source: 2026hyundaicard_popup_data_insert.sql (unchanged)
- Applied: 60,584 INSERT/UPDATE operations across 45 tables; COMMIT confirmed.
- Duplicate primary keys: updated supplied columns with source values, as requested.
- Schema fix: added zero_rule.clover_page_section.up_section_id and section_sort_no as numeric(19), matching the supplied DDL.
- No type conversion errors occurred against the current database.
- Preflight: full upsert transaction succeeded with constraints checked, then rolled back; sequence updates excluded from preflight.
- Sequence restore: retained the greater of the existing and source sequence values; retained existing is_called=true.
- Postflight: 60,584 successful row operations confirmed; all 45 table counts were at least the source row count. Existing rows absent from the dump were retained.
- Validation scope: PostgreSQL syntax, column compatibility, enforced database constraints, transaction success, and table counts. Application-only relationships without database constraints are not covered.