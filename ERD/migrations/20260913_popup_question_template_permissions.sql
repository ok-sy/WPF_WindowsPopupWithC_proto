-- Give template reads the same page/privilege mapping as popup detail.
BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM zero_rule.clover_api_page WHERE api_url = '/apis/popup/info') THEN
        RAISE EXCEPTION 'Missing popup detail permission mapping';
    END IF;
END $$;
INSERT INTO zero_rule.clover_api_page (api_url, page_id, api_url_nm, priv_id)
SELECT endpoint.api_url, source.page_id, endpoint.api_url_nm, source.priv_id
FROM (SELECT DISTINCT page_id, priv_id FROM zero_rule.clover_api_page WHERE api_url = '/apis/popup/info') source
CROSS JOIN (VALUES
    ('/apis/popup/question-templates', '문항 템플릿 목록'),
    ('/apis/popup/question-template', '문항 템플릿 상세')
) endpoint(api_url, api_url_nm)
WHERE NOT EXISTS (
    SELECT 1 FROM zero_rule.clover_api_page existing
    WHERE existing.api_url = endpoint.api_url
      AND existing.page_id = source.page_id
      AND existing.priv_id = source.priv_id
);
COMMIT;
