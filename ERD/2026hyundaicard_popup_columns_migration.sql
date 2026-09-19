-- Match the source DDL without changing INSERT values.
ALTER TABLE zero_rule.clover_page_section
    ADD COLUMN IF NOT EXISTS up_section_id numeric(19),
    ADD COLUMN IF NOT EXISTS section_sort_no numeric(19);