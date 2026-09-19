-- Canonical initial schema: zero_rule (framework) + popup (popup application).
-- For a NEW/EMPTY target database only. Not an upgrade/migration script.
-- Run as one script; transaction rolls back on failure.
BEGIN;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema IN ('zero_rule', 'popup') AND table_type = 'BASE TABLE') THEN
  RAISE EXCEPTION 'Target schemas contain tables. Use migrations for existing databases.';
 END IF;
END $$;

-- =====================================================================
-- Oracle -> PostgreSQL full final DDL
-- Source schema : "ZERO-RULE"
-- Target schema : zero_rule
--
-- Included:
--   1. All 53 table and column definitions
--   2. Oracle LONG -> PostgreSQL TEXT
--   3. Oracle BLOB -> PostgreSQL BYTEA
--   4. NOT NULL conditions
--   5. Primary keys and unique constraints
--   6. Non-constraint additional index
--   7. 12 sequences with PostgreSQL bigint-safe MAXVALUE settings
--   8. Sequence MAX-value alignment for clearly identified mappings
--   9. Verification queries
--
-- Notes:
--   * CREATE TABLE IF NOT EXISTS preserves already-created tables.
--   * Existing tables are not automatically reshaped by IF NOT EXISTS.
--   * PostgreSQL automatically creates indexes for PK/UNIQUE constraints.
--   * The supplied Oracle DDL contains no FOREIGN KEY definitions.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS zero_rule;

-- Optional clean rebuild:
-- Drop tables manually only when all migrated data may be deleted.
-- DROP SCHEMA zero_rule CASCADE;
-- CREATE SCHEMA zero_rule;

-- =====================================================================
-- 1. TABLES
-- =====================================================================

-- Oracle table: CLOVER_API_LOG
CREATE TABLE IF NOT EXISTS zero_rule.clover_api_log (
    log_seq BIGINT,
    req_dttm TIMESTAMP,
    api_url VARCHAR(100),
    st_tm VARCHAR(20),
    ed_tm VARCHAR(20),
    proc_tm NUMERIC(20,0),
    user_id BIGINT
);

-- Oracle table: CLOVER_API_PAGE
CREATE TABLE IF NOT EXISTS zero_rule.clover_api_page (
    api_url VARCHAR(100),
    page_id BIGINT,
    api_url_nm VARCHAR(1000),
    priv_id VARCHAR(64)
);

-- Oracle table: CLOVER_APP_LOG
CREATE TABLE IF NOT EXISTS zero_rule.clover_app_log (
    log_id BIGINT,
    log_level VARCHAR(1),
    title VARCHAR(1000),
    msg VARCHAR(4000),
    operator_name VARCHAR(64),
    user_name VARCHAR(64),
    log_tag VARCHAR(20),
    node_id VARCHAR(64),
    host_ip VARCHAR(45),
    client_ip VARCHAR(45),
    browser_name VARCHAR(32),
    created_at TIMESTAMP
);

-- Oracle table: CLOVER_AUDIT_LOG
CREATE TABLE IF NOT EXISTS zero_rule.clover_audit_log (
    log_id BIGINT,
    log_level VARCHAR(1),
    log_kind VARCHAR(20),
    title VARCHAR(1000),
    msg VARCHAR(4000),
    operator_name VARCHAR(64),
    job_id VARCHAR(64),
    page_id VARCHAR(64),
    log_tag VARCHAR(20),
    node_id VARCHAR(64),
    host_ip VARCHAR(45),
    client_ip VARCHAR(45),
    browser_name VARCHAR(32),
    created_at TIMESTAMP
);

-- Oracle table: CLOVER_BATCH_NODE
CREATE TABLE IF NOT EXISTS zero_rule.clover_batch_node (
    dummy_id SMALLINT,
    node_id VARCHAR(64),
    fst_updt_dttm TIMESTAMP,
    last_updt_dttm TIMESTAMP
);

-- Oracle table: CLOVER_CODE
CREATE TABLE IF NOT EXISTS zero_rule.clover_code (
    code_type VARCHAR(40),
    dtl_expl VARCHAR(200),
    regr_id VARCHAR(50),
    chgr_id VARCHAR(50),
    code VARCHAR(20),
    code_nm VARCHAR(60),
    chng_dttm TIMESTAMP,
    reg_dttm TIMESTAMP
);

-- Oracle table: CLOVER_CODE_TYPE
CREATE TABLE IF NOT EXISTS zero_rule.clover_code_type (
    code_type VARCHAR(40),
    dtl_expl VARCHAR(200),
    regr_id VARCHAR(50),
    chgr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    code_type_nm VARCHAR(60),
    reg_dttm TIMESTAMP
);

-- Oracle table: CLOVER_JOB_CONFIG
CREATE TABLE IF NOT EXISTS zero_rule.clover_job_config (
    job_id VARCHAR(64),
    job_status VARCHAR(20),
    node_id VARCHAR(64),
    job_started_at TIMESTAMP,
    job_finished_at TIMESTAMP,
    error_msg VARCHAR(100),
    changed_at TIMESTAMP,
    created_at TIMESTAMP,
    disabled_yn VARCHAR(1)
);

-- Oracle table: CLOVER_JOB_LOG
CREATE TABLE IF NOT EXISTS zero_rule.clover_job_log (
    log_id BIGINT,
    log_level VARCHAR(1),
    job_id VARCHAR(64),
    msg VARCHAR(4000),
    log_tag VARCHAR(20),
    node_id VARCHAR(64),
    created_at TIMESTAMP
);

-- Oracle table: CLOVER_MSG_MNG
CREATE TABLE IF NOT EXISTS zero_rule.clover_msg_mng (
    msg_id VARCHAR(10),
    msg_clsf VARCHAR(2),
    tsk_clsf_cd VARCHAR(3),
    team_id BIGINT,
    occr_clsf_cd VARCHAR(2),
    msg_prnt_cd VARCHAR(2),
    msg_cn VARCHAR(1000),
    use_yn CHAR(1),
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50)
);

-- Oracle table: CLOVER_NAV
CREATE TABLE IF NOT EXISTS zero_rule.clover_nav (
    nav_id BIGINT,
    nav_nm VARCHAR(30),
    expl VARCHAR(100)
);

-- Oracle table: CLOVER_NAV_ITEM
CREATE TABLE IF NOT EXISTS zero_rule.clover_nav_item (
    item_id BIGINT,
    page_id BIGINT,
    section_id BIGINT,
    sort_no BIGINT,
    nav_id BIGINT
);

-- Oracle table: CLOVER_PAGE
CREATE TABLE IF NOT EXISTS zero_rule.clover_page (
    page_id BIGINT,
    page_key VARCHAR(10),
    page_nm VARCHAR(50),
    url VARCHAR(100),
    icon VARCHAR(20),
    dtl_expl VARCHAR(200),
    tsk_clsf_cd VARCHAR(2),
    scre_tpcd VARCHAR(1),
    up_page_id BIGINT
);

-- Oracle table: CLOVER_PAGE_SECTION
CREATE TABLE IF NOT EXISTS zero_rule.clover_page_section (
    section_id BIGINT,
    icon VARCHAR(20),
    section_nm VARCHAR(30)
);

-- Oracle table: CLOVER_PRIV
CREATE TABLE IF NOT EXISTS zero_rule.clover_priv (
    priv_type VARCHAR(2),
    dtl_expl VARCHAR(200),
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50),
    priv_nm VARCHAR(50),
    priv_id VARCHAR(64)
);

-- Oracle table: CLOVER_ROLE
CREATE TABLE IF NOT EXISTS zero_rule.clover_role (
    role_id VARCHAR(10),
    role_nm VARCHAR(50),
    dtl_expl VARCHAR(200),
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50)
);

-- Oracle table: CLOVER_ROLE_PAGE
CREATE TABLE IF NOT EXISTS zero_rule.clover_role_page (
    role_id VARCHAR(10),
    page_id BIGINT,
    priv_id VARCHAR(64),
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50)
);

-- Oracle table: CLOVER_ROLE_USER
CREATE TABLE IF NOT EXISTS zero_rule.clover_role_user (
    role_id VARCHAR(10),
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50),
    user_id BIGINT
);

-- Oracle table: CLOVER_SYSTEM_NODE
CREATE TABLE IF NOT EXISTS zero_rule.clover_system_node (
    node_id VARCHAR(64),
    health_dttm TIMESTAMP,
    fst_updt_dttm TIMESTAMP
);

-- Oracle table: CLOVER_TEAM
CREATE TABLE IF NOT EXISTS zero_rule.clover_team (
    team_id BIGINT,
    team_nm VARCHAR(15),
    team_expl VARCHAR(255),
    psnl_stup_acce_yn CHAR(1),
    team_cmmn_stup_cn BYTEA,
    team_stat BIGINT,
    team_tsk_clsf SMALLINT,
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50)
);

-- Oracle table: CLOVER_USER
CREATE TABLE IF NOT EXISTS zero_rule.clover_user (
    user_id BIGINT,
    lgon_id VARCHAR(50),
    pswd VARCHAR(120),
    user_nm VARCHAR(30),
    bryy_mndy VARCHAR(6),
    user_tno VARCHAR(12),
    user_exno VARCHAR(17),
    cti_user_ntno VARCHAR(20),
    prt_posb_yn CHAR(1),
    dwnl_posb_yn CHAR(1),
    atnt_yn CHAR(1),
    team_id BIGINT,
    user_gd VARCHAR(20),
    user_state VARCHAR(20),
    lgon_fail_cnt SMALLINT DEFAULT 0,
    pswd_init_yn CHAR(1),
    last_pswd_chng_dttm TIMESTAMP,
    last_lgon_dttm TIMESTAMP,
    memo VARCHAR(255),
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50),
    role_id BIGINT,
    nav_id BIGINT
);

-- Oracle table: CLOVER_USER_AUTH
CREATE TABLE IF NOT EXISTS zero_rule.clover_user_auth (
    auth_id BIGINT,
    auth_token VARCHAR(512),
    reg_dttm TIMESTAMP,
    chng_dttm TIMESTAMP,
    expiry_dttm TIMESTAMP,
    user_id BIGINT
);

-- Oracle table: CLOVER_USER_BLOCKED_IP
CREATE TABLE IF NOT EXISTS zero_rule.clover_user_blocked_ip (
    ip VARCHAR(45),
    expiry_dttm TIMESTAMP,
    reg_dttm TIMESTAMP
);

-- Oracle table: CLOVER_USER_LGON_FAIL
CREATE TABLE IF NOT EXISTS zero_rule.clover_user_lgon_fail (
    fail_id BIGINT,
    ip VARCHAR(45),
    lgon_id VARCHAR(50),
    reason VARCHAR(20),
    reg_dttm TIMESTAMP
);

-- Oracle table: CLOVER_USER_PRIV
CREATE TABLE IF NOT EXISTS zero_rule.clover_user_priv (
    priv_id VARCHAR(64),
    user_id BIGINT,
    reg_dttm TIMESTAMP,
    regr_id VARCHAR(50),
    chng_dttm TIMESTAMP,
    chgr_id VARCHAR(50)
);

-- Oracle table: CLOVER_USER_PW_FAIL
CREATE TABLE IF NOT EXISTS zero_rule.clover_user_pw_fail (
    fail_id BIGINT,
    ip VARCHAR(45),
    reg_dttm TIMESTAMP,
    user_id BIGINT
);

-- Oracle table: GRID_COLUMN
CREATE TABLE IF NOT EXISTS zero_rule.grid_column (
    filter_id BIGINT,
    column_id VARCHAR(300),
    visiable_yn VARCHAR(1),
    filtering_text VARCHAR(300),
    filtering_oper_code VARCHAR(10),
    column_seq BIGINT,
    column_type_code VARCHAR(10),
    sorting_info VARCHAR(20)
);

-- Oracle table: GRID_FILTER
CREATE TABLE IF NOT EXISTS zero_rule.grid_filter (
    filter_id BIGINT,
    filter_nm VARCHAR(50),
    user_id BIGINT,
    page_code VARCHAR(50),
    filter_mode_yn VARCHAR(1),
    default_yn VARCHAR(1)
);

-- Oracle table: IF_EMAIL_TRANSCEIVE_INFO
CREATE TABLE IF NOT EXISTS zero_rule.if_email_transceive_info (
    email_transceive_type_cd CHAR(1),
    email_tracsceive_datetime CHAR(14),
    emp_id VARCHAR(20),
    opponent_email_domain_addr VARCHAR(200),
    file_attach_yn CHAR(1),
    file_attach_size BIGINT,
    email_title VARCHAR(2000),
    department_cd VARCHAR(10),
    reg_datetime CHAR(14),
    inspection_yn CHAR(1),
    call_rule_result VARCHAR(500)
);

-- Oracle table: INTERFACEINFO
CREATE TABLE IF NOT EXISTS zero_rule.interfaceinfo (
    ifid CHAR(10),
    if_nm VARCHAR(100),
    if_desc VARCHAR(2000),
    if_process_type_cd VARCHAR(1),
    if_connection_type_cd VARCHAR(2),
    rule_use_yn CHAR(1),
    doc_length BIGINT,
    characterset VARCHAR(50),
    eaiid VARCHAR(30),
    del_yn VARCHAR(1),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: INTERFACEMAP
CREATE TABLE IF NOT EXISTS zero_rule.interfacemap (
    ifid CHAR(10),
    field_eng_nm VARCHAR(1000),
    field_kor_nm VARCHAR(1000),
    field_order INTEGER,
    field_length INTEGER,
    field_start_no INTEGER,
    field_code_type CHAR(1),
    datatype_cd CHAR(1),
    field_scale SMALLINT,
    trim_yn VARCHAR(1),
    characterset VARCHAR(50),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: LOCKS
CREATE TABLE IF NOT EXISTS zero_rule.locks (
    lockcode CHAR(3),
    lockkey VARCHAR(100),
    lockdatetime TIMESTAMP,
    userid BIGINT,
    locktypecode VARCHAR(4),
    locknote VARCHAR(255)
);

-- Oracle table: PDS
CREATE TABLE IF NOT EXISTS zero_rule.pds (
    pds_id BIGINT,
    create_user_id VARCHAR(20),
    created_at TIMESTAMP,
    changed_at TIMESTAMP,
    location VARCHAR(50) DEFAULT 'BASIC',
    title VARCHAR(100),
    title_no_space VARCHAR(100),
    substance TEXT,
    attach_file_count INTEGER
);

-- Oracle table: PDS_FILE
CREATE TABLE IF NOT EXISTS zero_rule.pds_file (
    file_id VARCHAR(64),
    file_type VARCHAR(20),
    file_name VARCHAR(100),
    pds_id BIGINT,
    sort_number BIGINT,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    content_type VARCHAR(40),
    created_at TIMESTAMP,
    changed_at TIMESTAMP,
    del_yn VARCHAR(1) DEFAULT 'N'
);

-- Oracle table: RULE
CREATE TABLE IF NOT EXISTS zero_rule.rule (
    ruleid CHAR(10),
    rule_nm VARCHAR(500),
    rulealias_nm VARCHAR(1000),
    rule_desc VARCHAR(4000),
    rulereturn_type CHAR(1),
    rulesort_cd CHAR(1),
    ruleusage_cd CHAR(1),
    allreturn_yn CHAR(1),
    use_yn CHAR(1),
    rule_verno NUMERIC(5,2),
    activate_yn CHAR(1),
    activate_datetime TIMESTAMP,
    rule_state CHAR(1),
    deploy_datetime TIMESTAMP,
    deploy_userid BIGINT,
    ifid CHAR(10),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14),
    rule_apply_yn CHAR(1),
    deploy_wait_state_appy_yn CHAR(1)
);

-- Oracle table: RULECONDITION
CREATE TABLE IF NOT EXISTS zero_rule.rulecondition (
    ruleid CHAR(10),
    ruleconditionno INTEGER,
    condition_infix_desc VARCHAR(4000),
    condition_postfix_desc VARCHAR(4000),
    condition_desc VARCHAR(4000),
    use_yn CHAR(1),
    firstreg_userid VARCHAR(20),
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: RULECONDITIONRETURNITEM
CREATE TABLE IF NOT EXISTS zero_rule.ruleconditionreturnitem (
    ruleid CHAR(10),
    ruleconditionno INTEGER,
    return_itemid CHAR(10),
    returnitem_expr_desc VARCHAR(4000),
    returnitem_postfix_desc VARCHAR(4000),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: RULECONDITIONRETURNITEM_HIST
CREATE TABLE IF NOT EXISTS zero_rule.ruleconditionreturnitem_hist (
    ruleid CHAR(10),
    rule_verno NUMERIC(5,2),
    ruleconditionno INTEGER,
    return_itemid CHAR(10),
    returnitem_expr_desc VARCHAR(4000),
    returnitem_postfix_desc VARCHAR(4000),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14),
    modified_userid BIGINT,
    modified_datetime CHAR(14)
);

-- Oracle table: RULECONDITIONRETURN_POSTOBJECT
CREATE TABLE IF NOT EXISTS zero_rule.ruleconditionreturn_postobject (
    ruleid CHAR(10),
    ruleconditionno INTEGER,
    return_itemid CHAR(10),
    postfixobjectno INTEGER,
    datatype_cd VARCHAR(20),
    operator_yn CHAR(1),
    object_data VARCHAR(4000)
);

-- Oracle table: RULECONDITIONRETURN_POSTOB_HI
CREATE TABLE IF NOT EXISTS zero_rule.ruleconditionreturn_postob_hi (
    ruleid CHAR(10),
    rule_verno NUMERIC(5,2),
    ruleconditionno INTEGER,
    return_itemid CHAR(10),
    postfixobjectno NUMERIC,
    datatype_cd VARCHAR(20),
    operation_yn CHAR(1),
    object_data VARCHAR(4000)
);

-- Oracle table: RULECONDITION_HIST
CREATE TABLE IF NOT EXISTS zero_rule.rulecondition_hist (
    ruleid CHAR(10),
    rule_verno NUMERIC(5,2),
    ruleconditionno INTEGER,
    condition_infix_desc VARCHAR(4000),
    condition_postfix_desc VARCHAR(4000),
    condition_desc VARCHAR(4000),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14),
    modified_userid BIGINT,
    modified_datetime CHAR(14)
);

-- Oracle table: RULECONDITION_POSTFIXOBJECT
CREATE TABLE IF NOT EXISTS zero_rule.rulecondition_postfixobject (
    ruleid CHAR(10),
    ruleconditionno INTEGER,
    postfixobjectno INTEGER,
    datatype_cd CHAR(1),
    operator_yn CHAR(1),
    object_data VARCHAR(200)
);

-- Oracle table: RULECONDITION_POSTFIXOBJECT_HI
CREATE TABLE IF NOT EXISTS zero_rule.rulecondition_postfixobject_hi (
    ruleid CHAR(10),
    rule_verno NUMERIC(5,2),
    ruleconditionno INTEGER,
    postfixobjectno INTEGER,
    datatype_cd CHAR(1),
    operator_yn CHAR(1),
    object_data VARCHAR(200)
);

-- Oracle table: RULEITEM
CREATE TABLE IF NOT EXISTS zero_rule.ruleitem (
    itemid CHAR(10),
    item_nm VARCHAR(1000),
    itemalias_nm VARCHAR(1000),
    itemexplan_desc VARCHAR(4000),
    datatype_cd CHAR(1),
    item_use_yn CHAR(1),
    ifid CHAR(10),
    firstreg_userid VARCHAR(20),
    firstreg_datetime CHAR(14),
    update_userid VARCHAR(20),
    update_datetime CHAR(14)
);

-- Oracle table: RULEITEMREF
CREATE TABLE IF NOT EXISTS zero_rule.ruleitemref (
    itemid CHAR(10),
    itemref_cd VARCHAR(20),
    itemref_nm VARCHAR(1000),
    itemrefalias_nm VARCHAR(1000),
    itemrefexpr_desc VARCHAR(4000),
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: RULERETURNITEM
CREATE TABLE IF NOT EXISTS zero_rule.rulereturnitem (
    ruleid CHAR(10),
    return_itemid CHAR(10),
    returnitem_no NUMERIC,
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: RULERETURNITEM_HIST
CREATE TABLE IF NOT EXISTS zero_rule.rulereturnitem_hist (
    return_itemid CHAR(10),
    returnitem_no NUMERIC,
    update_userid BIGINT,
    update_datetime CHAR(14),
    ruleid CHAR(10),
    rule_verno INTEGER,
    modified_userid BIGINT,
    modified_datetime CHAR(14)
);

-- Oracle table: RULE_DEPLOY
CREATE TABLE IF NOT EXISTS zero_rule.rule_deploy (
    deploy_datetime CHAR(14),
    ruleid CHAR(10),
    rule_verno NUMERIC(5,2),
    rule_update_yn CHAR(1),
    before_deploy_apply_yn CHAR(1),
    after_deploy_apply_yn CHAR(1),
    rule_update_userid BIGINT,
    rule_update_datetime CHAR(14),
    reg_userid BIGINT,
    reg_datetime CHAR(14)
);

-- Oracle table: RULE_HIST
CREATE TABLE IF NOT EXISTS zero_rule.rule_hist (
    ruleid CHAR(10),
    rule_verno NUMERIC(5,2),
    rule_nm VARCHAR(500),
    rulealias_nm VARCHAR(1000),
    rule_desc VARCHAR(4000),
    rulereturn_type CHAR(1),
    rulesort_cd CHAR(1),
    ruleusage_cd CHAR(1),
    allreturn_yn CHAR(1),
    use_yn CHAR(1),
    activate_yn CHAR(1),
    activate_datetime TIMESTAMP,
    rule_state CHAR(2),
    deploy_datetime TIMESTAMP,
    deploy_userid BIGINT,
    ifid VARCHAR(10),
    ruleversionchangecode VARCHAR(10),
    firstreg_userid BIGINT,
    firstreg_datetime CHAR(14),
    update_userid BIGINT,
    update_datetime CHAR(14),
    modified_userid BIGINT,
    modified_datetime CHAR(14)
);

-- Oracle table: RULE_LOG
CREATE TABLE IF NOT EXISTS zero_rule.rule_log (
    log_no NUMERIC(20,0),
    log_title VARCHAR(20),
    log_start_time VARCHAR(20),
    log_end_time VARCHAR(20),
    log_request VARCHAR(4000),
    time_gap NUMERIC(38,0),
    log_response VARCHAR(4000),
    rule_id CHAR(10),
    rulealias_nm VARCHAR(200),
    rule_verno NUMERIC(5,2),
    inspection_yn CHAR(1),
    res_code VARCHAR(4)
);

-- Oracle table: RULE_PROGRESS_HISTORY
CREATE TABLE IF NOT EXISTS zero_rule.rule_progress_history (
    ruleid CHAR(10),
    history_no INTEGER,
    rule_verno NUMERIC(5,2),
    rule_state CHAR(1),
    current_rule_apply_yn CHAR(1),
    deploy_wait_state_apply_yn CHAR(1),
    update_userid BIGINT,
    update_datetime CHAR(14)
);

-- Oracle table: SORTCODE
CREATE TABLE IF NOT EXISTS zero_rule.sortcode (
    sortcodeid VARCHAR(100),
    sortcode_nm VARCHAR(1000),
    sortcode_desc VARCHAR(1000)
);

-- Oracle table: SORTCODEVALUE
CREATE TABLE IF NOT EXISTS zero_rule.sortcodevalue (
    sortcodeid VARCHAR(100),
    codeid CHAR(2),
    code_nm VARCHAR(1000),
    code_desc VARCHAR(2000)
);

-- =====================================================================
-- 2. CONSTRAINTS / INDEX / SEQUENCES / VERIFICATION
-- =====================================================================

BEGIN;

-- 0. Correct Oracle LONG mapping: PDS.SUBSTANCE must be PostgreSQL TEXT.
DO $ddl$
DECLARE
    current_type text;
BEGIN
    SELECT data_type
      INTO current_type
      FROM information_schema.columns
     WHERE table_schema = 'zero_rule'
       AND table_name = 'pds'
       AND column_name = 'substance';

    IF current_type = 'bytea' THEN
        EXECUTE 'ALTER TABLE zero_rule.pds '
             || 'ALTER COLUMN substance TYPE text '
             || 'USING convert_from(substance, ''UTF8'')';
    END IF;
END
$ddl$;

-- 1. NOT NULL constraints
ALTER TABLE zero_rule.clover_api_log ALTER COLUMN log_seq SET NOT NULL;
ALTER TABLE zero_rule.clover_api_log ALTER COLUMN req_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_api_page ALTER COLUMN api_url SET NOT NULL;
ALTER TABLE zero_rule.clover_app_log ALTER COLUMN log_id SET NOT NULL;
ALTER TABLE zero_rule.clover_app_log ALTER COLUMN log_level SET NOT NULL;
ALTER TABLE zero_rule.clover_app_log ALTER COLUMN title SET NOT NULL;
ALTER TABLE zero_rule.clover_app_log ALTER COLUMN node_id SET NOT NULL;
ALTER TABLE zero_rule.clover_app_log ALTER COLUMN host_ip SET NOT NULL;
ALTER TABLE zero_rule.clover_app_log ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN log_id SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN log_level SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN log_kind SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN title SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN node_id SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN host_ip SET NOT NULL;
ALTER TABLE zero_rule.clover_audit_log ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE zero_rule.clover_batch_node ALTER COLUMN dummy_id SET NOT NULL;
ALTER TABLE zero_rule.clover_batch_node ALTER COLUMN fst_updt_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_batch_node ALTER COLUMN last_updt_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_code ALTER COLUMN code_type SET NOT NULL;
ALTER TABLE zero_rule.clover_code ALTER COLUMN code SET NOT NULL;
ALTER TABLE zero_rule.clover_code ALTER COLUMN code_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_code ALTER COLUMN chng_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_code ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_code_type ALTER COLUMN code_type SET NOT NULL;
ALTER TABLE zero_rule.clover_code_type ALTER COLUMN chng_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_code_type ALTER COLUMN code_type_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_code_type ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_job_config ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE zero_rule.clover_job_config ALTER COLUMN job_status SET NOT NULL;
ALTER TABLE zero_rule.clover_job_config ALTER COLUMN changed_at SET NOT NULL;
ALTER TABLE zero_rule.clover_job_config ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE zero_rule.clover_job_config ALTER COLUMN disabled_yn SET NOT NULL;
ALTER TABLE zero_rule.clover_job_log ALTER COLUMN log_id SET NOT NULL;
ALTER TABLE zero_rule.clover_job_log ALTER COLUMN log_level SET NOT NULL;
ALTER TABLE zero_rule.clover_job_log ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE zero_rule.clover_job_log ALTER COLUMN msg SET NOT NULL;
ALTER TABLE zero_rule.clover_job_log ALTER COLUMN node_id SET NOT NULL;
ALTER TABLE zero_rule.clover_job_log ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE zero_rule.clover_msg_mng ALTER COLUMN msg_id SET NOT NULL;
ALTER TABLE zero_rule.clover_nav ALTER COLUMN nav_id SET NOT NULL;
ALTER TABLE zero_rule.clover_nav ALTER COLUMN nav_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_nav_item ALTER COLUMN item_id SET NOT NULL;
ALTER TABLE zero_rule.clover_nav_item ALTER COLUMN page_id SET NOT NULL;
ALTER TABLE zero_rule.clover_nav_item ALTER COLUMN sort_no SET NOT NULL;
ALTER TABLE zero_rule.clover_nav_item ALTER COLUMN nav_id SET NOT NULL;
ALTER TABLE zero_rule.clover_page ALTER COLUMN page_id SET NOT NULL;
ALTER TABLE zero_rule.clover_page ALTER COLUMN page_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_page ALTER COLUMN url SET NOT NULL;
ALTER TABLE zero_rule.clover_page_section ALTER COLUMN section_id SET NOT NULL;
ALTER TABLE zero_rule.clover_page_section ALTER COLUMN section_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_priv ALTER COLUMN priv_type SET NOT NULL;
ALTER TABLE zero_rule.clover_priv ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_priv ALTER COLUMN chng_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_priv ALTER COLUMN priv_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_priv ALTER COLUMN priv_id SET NOT NULL;
ALTER TABLE zero_rule.clover_role ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE zero_rule.clover_role ALTER COLUMN role_nm SET NOT NULL;
ALTER TABLE zero_rule.clover_role ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_role ALTER COLUMN chng_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_role_page ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE zero_rule.clover_role_page ALTER COLUMN page_id SET NOT NULL;
ALTER TABLE zero_rule.clover_role_page ALTER COLUMN priv_id SET NOT NULL;
ALTER TABLE zero_rule.clover_role_page ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_role_page ALTER COLUMN chng_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_role_user ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE zero_rule.clover_role_user ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE zero_rule.clover_system_node ALTER COLUMN node_id SET NOT NULL;
ALTER TABLE zero_rule.clover_system_node ALTER COLUMN fst_updt_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_team ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_auth ALTER COLUMN auth_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_auth ALTER COLUMN auth_token SET NOT NULL;
ALTER TABLE zero_rule.clover_user_auth ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_auth ALTER COLUMN chng_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_auth ALTER COLUMN expiry_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_auth ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_blocked_ip ALTER COLUMN ip SET NOT NULL;
ALTER TABLE zero_rule.clover_user_blocked_ip ALTER COLUMN expiry_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_blocked_ip ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_lgon_fail ALTER COLUMN fail_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_lgon_fail ALTER COLUMN ip SET NOT NULL;
ALTER TABLE zero_rule.clover_user_lgon_fail ALTER COLUMN lgon_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_lgon_fail ALTER COLUMN reason SET NOT NULL;
ALTER TABLE zero_rule.clover_user_lgon_fail ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_priv ALTER COLUMN priv_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_priv ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_pw_fail ALTER COLUMN fail_id SET NOT NULL;
ALTER TABLE zero_rule.clover_user_pw_fail ALTER COLUMN ip SET NOT NULL;
ALTER TABLE zero_rule.clover_user_pw_fail ALTER COLUMN reg_dttm SET NOT NULL;
ALTER TABLE zero_rule.clover_user_pw_fail ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE zero_rule.grid_column ALTER COLUMN filter_id SET NOT NULL;
ALTER TABLE zero_rule.grid_column ALTER COLUMN column_id SET NOT NULL;
ALTER TABLE zero_rule.grid_filter ALTER COLUMN filter_id SET NOT NULL;
ALTER TABLE zero_rule.if_email_transceive_info ALTER COLUMN email_transceive_type_cd SET NOT NULL;
ALTER TABLE zero_rule.if_email_transceive_info ALTER COLUMN email_tracsceive_datetime SET NOT NULL;
ALTER TABLE zero_rule.if_email_transceive_info ALTER COLUMN emp_id SET NOT NULL;
ALTER TABLE zero_rule.interfaceinfo ALTER COLUMN ifid SET NOT NULL;
ALTER TABLE zero_rule.interfacemap ALTER COLUMN ifid SET NOT NULL;
ALTER TABLE zero_rule.interfacemap ALTER COLUMN field_eng_nm SET NOT NULL;
ALTER TABLE zero_rule.locks ALTER COLUMN lockcode SET NOT NULL;
ALTER TABLE zero_rule.locks ALTER COLUMN lockkey SET NOT NULL;
ALTER TABLE zero_rule.pds ALTER COLUMN pds_id SET NOT NULL;
ALTER TABLE zero_rule.pds ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE zero_rule.pds ALTER COLUMN changed_at SET NOT NULL;
ALTER TABLE zero_rule.pds ALTER COLUMN title SET NOT NULL;
ALTER TABLE zero_rule.pds ALTER COLUMN title_no_space SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN file_id SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN file_type SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN pds_id SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN sort_number SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN file_size SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN width SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN height SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN duration SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN changed_at SET NOT NULL;
ALTER TABLE zero_rule.pds_file ALTER COLUMN del_yn SET NOT NULL;
ALTER TABLE zero_rule.rule ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rule ALTER COLUMN ifid SET NOT NULL;
ALTER TABLE zero_rule.rulecondition ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rulecondition ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem ALTER COLUMN return_itemid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem_hist ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem_hist ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem_hist ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturnitem_hist ALTER COLUMN return_itemid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postobject ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postobject ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postobject ALTER COLUMN return_itemid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postobject ALTER COLUMN postfixobjectno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postob_hi ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postob_hi ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postob_hi ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postob_hi ALTER COLUMN return_itemid SET NOT NULL;
ALTER TABLE zero_rule.ruleconditionreturn_postob_hi ALTER COLUMN postfixobjectno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_hist ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_hist ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_hist ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject ALTER COLUMN postfixobjectno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject_hi ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject_hi ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject_hi ALTER COLUMN ruleconditionno SET NOT NULL;
ALTER TABLE zero_rule.rulecondition_postfixobject_hi ALTER COLUMN postfixobjectno SET NOT NULL;
ALTER TABLE zero_rule.ruleitem ALTER COLUMN itemid SET NOT NULL;
ALTER TABLE zero_rule.ruleitemref ALTER COLUMN itemid SET NOT NULL;
ALTER TABLE zero_rule.ruleitemref ALTER COLUMN itemref_cd SET NOT NULL;
ALTER TABLE zero_rule.rulereturnitem ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rulereturnitem ALTER COLUMN return_itemid SET NOT NULL;
ALTER TABLE zero_rule.rulereturnitem_hist ALTER COLUMN return_itemid SET NOT NULL;
ALTER TABLE zero_rule.rulereturnitem_hist ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rulereturnitem_hist ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.rule_deploy ALTER COLUMN deploy_datetime SET NOT NULL;
ALTER TABLE zero_rule.rule_deploy ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rule_hist ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rule_hist ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.rule_hist ALTER COLUMN ifid SET NOT NULL;
ALTER TABLE zero_rule.rule_log ALTER COLUMN log_no SET NOT NULL;
ALTER TABLE zero_rule.rule_progress_history ALTER COLUMN ruleid SET NOT NULL;
ALTER TABLE zero_rule.rule_progress_history ALTER COLUMN history_no SET NOT NULL;
ALTER TABLE zero_rule.rule_progress_history ALTER COLUMN rule_verno SET NOT NULL;
ALTER TABLE zero_rule.rule_progress_history ALTER COLUMN rule_state SET NOT NULL;
ALTER TABLE zero_rule.sortcode ALTER COLUMN sortcodeid SET NOT NULL;
ALTER TABLE zero_rule.sortcodevalue ALTER COLUMN sortcodeid SET NOT NULL;
ALTER TABLE zero_rule.sortcodevalue ALTER COLUMN codeid SET NOT NULL;

-- 2. PRIMARY KEY and UNIQUE constraints
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_api_log'
           AND c.conname = 'pk_clover_api_log'
    ) THEN
        ALTER TABLE zero_rule.clover_api_log
            ADD CONSTRAINT pk_clover_api_log PRIMARY KEY (log_seq, req_dttm);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_api_page'
           AND c.conname = 'pk_clover_app_page'
    ) THEN
        ALTER TABLE zero_rule.clover_api_page
            ADD CONSTRAINT pk_clover_app_page PRIMARY KEY (api_url);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_app_log'
           AND c.conname = 'pk_clover_app_log'
    ) THEN
        ALTER TABLE zero_rule.clover_app_log
            ADD CONSTRAINT pk_clover_app_log PRIMARY KEY (log_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_audit_log'
           AND c.conname = 'pk_clover_audit_log'
    ) THEN
        ALTER TABLE zero_rule.clover_audit_log
            ADD CONSTRAINT pk_clover_audit_log PRIMARY KEY (log_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_batch_node'
           AND c.conname = 'pk_batch_node'
    ) THEN
        ALTER TABLE zero_rule.clover_batch_node
            ADD CONSTRAINT pk_batch_node PRIMARY KEY (dummy_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_code'
           AND c.conname = 'pk_clover_code'
    ) THEN
        ALTER TABLE zero_rule.clover_code
            ADD CONSTRAINT pk_clover_code PRIMARY KEY (code_type, code);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_code_type'
           AND c.conname = 'pk_clover_code_type'
    ) THEN
        ALTER TABLE zero_rule.clover_code_type
            ADD CONSTRAINT pk_clover_code_type PRIMARY KEY (code_type);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_job_config'
           AND c.conname = 'pk_clover_job_config'
    ) THEN
        ALTER TABLE zero_rule.clover_job_config
            ADD CONSTRAINT pk_clover_job_config PRIMARY KEY (job_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_job_log'
           AND c.conname = 'pk_clover_job_log'
    ) THEN
        ALTER TABLE zero_rule.clover_job_log
            ADD CONSTRAINT pk_clover_job_log PRIMARY KEY (log_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_msg_mng'
           AND c.conname = 'pk_clover_msg_mng'
    ) THEN
        ALTER TABLE zero_rule.clover_msg_mng
            ADD CONSTRAINT pk_clover_msg_mng PRIMARY KEY (msg_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_nav'
           AND c.conname = 'pk_clover_nav'
    ) THEN
        ALTER TABLE zero_rule.clover_nav
            ADD CONSTRAINT pk_clover_nav PRIMARY KEY (nav_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_nav_item'
           AND c.conname = 'pk_clover_nav_item'
    ) THEN
        ALTER TABLE zero_rule.clover_nav_item
            ADD CONSTRAINT pk_clover_nav_item PRIMARY KEY (item_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_page'
           AND c.conname = 'pk_clover_page'
    ) THEN
        ALTER TABLE zero_rule.clover_page
            ADD CONSTRAINT pk_clover_page PRIMARY KEY (page_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_page_section'
           AND c.conname = 'pk_clover_page_section'
    ) THEN
        ALTER TABLE zero_rule.clover_page_section
            ADD CONSTRAINT pk_clover_page_section PRIMARY KEY (section_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_priv'
           AND c.conname = 'pk_clover_priv'
    ) THEN
        ALTER TABLE zero_rule.clover_priv
            ADD CONSTRAINT pk_clover_priv PRIMARY KEY (priv_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_role'
           AND c.conname = 'pk_clover_role'
    ) THEN
        ALTER TABLE zero_rule.clover_role
            ADD CONSTRAINT pk_clover_role PRIMARY KEY (role_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_role_page'
           AND c.conname = 'pk_clover_role_page'
    ) THEN
        ALTER TABLE zero_rule.clover_role_page
            ADD CONSTRAINT pk_clover_role_page PRIMARY KEY (role_id, page_id, priv_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_role_user'
           AND c.conname = 'pk_clover_role_user'
    ) THEN
        ALTER TABLE zero_rule.clover_role_user
            ADD CONSTRAINT pk_clover_role_user PRIMARY KEY (role_id, user_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_system_node'
           AND c.conname = 'pk_clover_system_node'
    ) THEN
        ALTER TABLE zero_rule.clover_system_node
            ADD CONSTRAINT pk_clover_system_node PRIMARY KEY (node_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_team'
           AND c.conname = 'pk_clover_team'
    ) THEN
        ALTER TABLE zero_rule.clover_team
            ADD CONSTRAINT pk_clover_team PRIMARY KEY (team_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_user'
           AND c.conname = 'pk_clover_user'
    ) THEN
        ALTER TABLE zero_rule.clover_user
            ADD CONSTRAINT pk_clover_user PRIMARY KEY (user_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_user_auth'
           AND c.conname = 'pk_clover_user_auth'
    ) THEN
        ALTER TABLE zero_rule.clover_user_auth
            ADD CONSTRAINT pk_clover_user_auth PRIMARY KEY (auth_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_user_blocked_ip'
           AND c.conname = 'pk_clover_user_blocked_ip'
    ) THEN
        ALTER TABLE zero_rule.clover_user_blocked_ip
            ADD CONSTRAINT pk_clover_user_blocked_ip PRIMARY KEY (ip);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_user_lgon_fail'
           AND c.conname = 'pk_clover_user_lgon_fail'
    ) THEN
        ALTER TABLE zero_rule.clover_user_lgon_fail
            ADD CONSTRAINT pk_clover_user_lgon_fail PRIMARY KEY (fail_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_user_priv'
           AND c.conname = 'pk_clover_user_priv'
    ) THEN
        ALTER TABLE zero_rule.clover_user_priv
            ADD CONSTRAINT pk_clover_user_priv PRIMARY KEY (user_id, priv_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'clover_user_pw_fail'
           AND c.conname = 'pk_clover_user_pw_fail'
    ) THEN
        ALTER TABLE zero_rule.clover_user_pw_fail
            ADD CONSTRAINT pk_clover_user_pw_fail PRIMARY KEY (fail_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'grid_column'
           AND c.conname = 'xpk_grid_column'
    ) THEN
        ALTER TABLE zero_rule.grid_column
            ADD CONSTRAINT xpk_grid_column PRIMARY KEY (filter_id, column_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'grid_filter'
           AND c.conname = 'xpk_grid_filter'
    ) THEN
        ALTER TABLE zero_rule.grid_filter
            ADD CONSTRAINT xpk_grid_filter PRIMARY KEY (filter_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'if_email_transceive_info'
           AND c.conname = 'xpk_email_trans_info'
    ) THEN
        ALTER TABLE zero_rule.if_email_transceive_info
            ADD CONSTRAINT xpk_email_trans_info PRIMARY KEY (email_transceive_type_cd, email_tracsceive_datetime, emp_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'interfaceinfo'
           AND c.conname = 'xpk_interfaceinfo'
    ) THEN
        ALTER TABLE zero_rule.interfaceinfo
            ADD CONSTRAINT xpk_interfaceinfo PRIMARY KEY (ifid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'interfacemap'
           AND c.conname = 'xpk_interfacemap'
    ) THEN
        ALTER TABLE zero_rule.interfacemap
            ADD CONSTRAINT xpk_interfacemap PRIMARY KEY (ifid, field_eng_nm);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'locks'
           AND c.conname = 'xpk_locks'
    ) THEN
        ALTER TABLE zero_rule.locks
            ADD CONSTRAINT xpk_locks PRIMARY KEY (lockcode, lockkey);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'pds'
           AND c.conname = 'pk_pds'
    ) THEN
        ALTER TABLE zero_rule.pds
            ADD CONSTRAINT pk_pds PRIMARY KEY (pds_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'pds_file'
           AND c.conname = 'pk_pds_file'
    ) THEN
        ALTER TABLE zero_rule.pds_file
            ADD CONSTRAINT pk_pds_file PRIMARY KEY (file_id);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rule'
           AND c.conname = 'xpk_rule'
    ) THEN
        ALTER TABLE zero_rule.rule
            ADD CONSTRAINT xpk_rule PRIMARY KEY (ruleid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rulecondition'
           AND c.conname = 'xpk_rulecondition'
    ) THEN
        ALTER TABLE zero_rule.rulecondition
            ADD CONSTRAINT xpk_rulecondition PRIMARY KEY (ruleid, ruleconditionno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'ruleconditionreturnitem'
           AND c.conname = 'xpk_ruleexprreturnitem'
    ) THEN
        ALTER TABLE zero_rule.ruleconditionreturnitem
            ADD CONSTRAINT xpk_ruleexprreturnitem PRIMARY KEY (ruleid, ruleconditionno, return_itemid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'ruleconditionreturnitem_hist'
           AND c.conname = 'xpk_ruleexprreturnitem_hist'
    ) THEN
        ALTER TABLE zero_rule.ruleconditionreturnitem_hist
            ADD CONSTRAINT xpk_ruleexprreturnitem_hist PRIMARY KEY (ruleid, rule_verno, ruleconditionno, return_itemid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'ruleconditionreturn_postobject'
           AND c.conname = 'xpk_rulecondtionr_pobject'
    ) THEN
        ALTER TABLE zero_rule.ruleconditionreturn_postobject
            ADD CONSTRAINT xpk_rulecondtionr_pobject PRIMARY KEY (ruleid, ruleconditionno, return_itemid, postfixobjectno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'ruleconditionreturn_postob_hi'
           AND c.conname = 'xpk_rulecondtionr_pobject_hi'
    ) THEN
        ALTER TABLE zero_rule.ruleconditionreturn_postob_hi
            ADD CONSTRAINT xpk_rulecondtionr_pobject_hi PRIMARY KEY (ruleid, rule_verno, ruleconditionno, return_itemid, postfixobjectno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rulecondition_hist'
           AND c.conname = 'xpk_rulecondition_hist'
    ) THEN
        ALTER TABLE zero_rule.rulecondition_hist
            ADD CONSTRAINT xpk_rulecondition_hist PRIMARY KEY (ruleid, rule_verno, ruleconditionno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rulecondition_postfixobject'
           AND c.conname = 'xpk_rulecondition_pobject'
    ) THEN
        ALTER TABLE zero_rule.rulecondition_postfixobject
            ADD CONSTRAINT xpk_rulecondition_pobject PRIMARY KEY (ruleid, ruleconditionno, postfixobjectno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rulecondition_postfixobject_hi'
           AND c.conname = 'xpk_rulecondition_pobject_hi'
    ) THEN
        ALTER TABLE zero_rule.rulecondition_postfixobject_hi
            ADD CONSTRAINT xpk_rulecondition_pobject_hi PRIMARY KEY (ruleid, rule_verno, ruleconditionno, postfixobjectno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'ruleitem'
           AND c.conname = 'xpk_ruleitem'
    ) THEN
        ALTER TABLE zero_rule.ruleitem
            ADD CONSTRAINT xpk_ruleitem PRIMARY KEY (itemid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'ruleitemref'
           AND c.conname = 'xpk_ruleitemref'
    ) THEN
        ALTER TABLE zero_rule.ruleitemref
            ADD CONSTRAINT xpk_ruleitemref PRIMARY KEY (itemid, itemref_cd);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rulereturnitem'
           AND c.conname = 'xpk_rulereturnitem'
    ) THEN
        ALTER TABLE zero_rule.rulereturnitem
            ADD CONSTRAINT xpk_rulereturnitem PRIMARY KEY (ruleid, return_itemid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rulereturnitem_hist'
           AND c.conname = 'xpk_ruleconreturnitem_hist'
    ) THEN
        ALTER TABLE zero_rule.rulereturnitem_hist
            ADD CONSTRAINT xpk_ruleconreturnitem_hist PRIMARY KEY (return_itemid, ruleid, rule_verno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rule_deploy'
           AND c.conname = 'xpk룰배포'
    ) THEN
        ALTER TABLE zero_rule.rule_deploy
            ADD CONSTRAINT "xpk룰배포" PRIMARY KEY (deploy_datetime, ruleid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rule_hist'
           AND c.conname = 'xpk_rule_hist'
    ) THEN
        ALTER TABLE zero_rule.rule_hist
            ADD CONSTRAINT xpk_rule_hist PRIMARY KEY (ruleid, rule_verno);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rule_log'
           AND c.conname = 'xpk룰로그'
    ) THEN
        ALTER TABLE zero_rule.rule_log
            ADD CONSTRAINT "xpk룰로그" PRIMARY KEY (log_no);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'rule_progress_history'
           AND c.conname = 'xpk룰진행상태이력'
    ) THEN
        ALTER TABLE zero_rule.rule_progress_history
            ADD CONSTRAINT "xpk룰진행상태이력" PRIMARY KEY (ruleid, history_no);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'sortcode'
           AND c.conname = 'xpk_sortcode'
    ) THEN
        ALTER TABLE zero_rule.sortcode
            ADD CONSTRAINT xpk_sortcode PRIMARY KEY (sortcodeid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'sortcodevalue'
           AND c.conname = 'xpk_sortcodevalue'
    ) THEN
        ALTER TABLE zero_rule.sortcodevalue
            ADD CONSTRAINT xpk_sortcodevalue PRIMARY KEY (sortcodeid, codeid);
    END IF;
END
$ddl$;
DO $ddl$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'zero_rule'
           AND t.relname = 'interfacemap'
           AND c.conname = 'xak1_interfacemap'
    ) THEN
        ALTER TABLE zero_rule.interfacemap
            ADD CONSTRAINT xak1_interfacemap UNIQUE (field_eng_nm);
    END IF;
END
$ddl$;
-- 3. Additional index not supplied automatically by PK/UK
CREATE UNIQUE INDEX IF NOT EXISTS xpk_rulereturnitem_hist ON zero_rule.rulereturnitem_hist (ruleid,return_itemid,rule_verno);

COMMIT;

-- 4. Sequences
-- PostgreSQL sequences use bigint; Oracle MAXVALUE values above bigint
-- were replaced by NO MAXVALUE.
CREATE SEQUENCE IF NOT EXISTS zero_rule.account_seq;
ALTER SEQUENCE zero_rule.account_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.auth_seq;
ALTER SEQUENCE zero_rule.auth_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.cloverframework_seq;
ALTER SEQUENCE zero_rule.cloverframework_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.clover_pds_seq;
ALTER SEQUENCE zero_rule.clover_pds_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS zero_rule.commonrtrnegative_seq;
ALTER SEQUENCE zero_rule.commonrtrnegative_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999999
    CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.common_seq;
ALTER SEQUENCE zero_rule.common_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.file_seq;
ALTER SEQUENCE zero_rule.file_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.grid_filter_seq;
ALTER SEQUENCE zero_rule.grid_filter_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS zero_rule.interfaceinfo_ifid_seq;
ALTER SEQUENCE zero_rule.interfaceinfo_ifid_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 99999999
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.log_seq;
ALTER SEQUENCE zero_rule.log_seq
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.rule_main_seq;
ALTER SEQUENCE zero_rule.rule_main_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 99999999
    NO CYCLE
    CACHE 20;
CREATE SEQUENCE IF NOT EXISTS zero_rule.rule_sub_seq;
ALTER SEQUENCE zero_rule.rule_sub_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999999
    NO CYCLE
    CACHE 20;

-- 5. Sequence value alignment
-- Run the MAX queries, then apply setval only after confirming the actual
-- Oracle NEXTVAL usage. Two mappings are clear from their names/PKs.

-- PDS.PDS_ID -> CLOVER_PDS_SEQ
SELECT MAX(pds_id) AS pds_id_max FROM zero_rule.pds;
SELECT setval(
    'zero_rule.clover_pds_seq',
    GREATEST(COALESCE((SELECT MAX(pds_id) FROM zero_rule.pds), 1), 1),
    (SELECT COUNT(*) > 0 FROM zero_rule.pds)
);

-- GRID_FILTER.FILTER_ID -> GRID_FILTER_SEQ
SELECT MAX(filter_id) AS filter_id_max FROM zero_rule.grid_filter;
SELECT setval(
    'zero_rule.grid_filter_seq',
    GREATEST(COALESCE((SELECT MAX(filter_id) FROM zero_rule.grid_filter), 1), 1),
    (SELECT COUNT(*) > 0 FROM zero_rule.grid_filter)
);

-- Other sequence-to-column bindings are not shown in the supplied DDL.
-- Locate Oracle NEXTVAL usage before setting these values or column defaults.
-- Oracle query:
-- SELECT name, type, line, text
--   FROM user_source
--  WHERE UPPER(text) LIKE '%NEXTVAL%'
--  ORDER BY name, type, line;

-- 6. Verification summary
SELECT
    (SELECT COUNT(*)
       FROM information_schema.tables
      WHERE table_schema = 'zero_rule'
        AND table_type = 'BASE TABLE') AS table_count,
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = 'zero_rule'
        AND constraint_type = 'PRIMARY KEY') AS pk_count,
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = 'zero_rule'
        AND constraint_type = 'UNIQUE') AS uk_count,
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = 'zero_rule'
        AND constraint_type = 'FOREIGN KEY') AS fk_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'zero_rule') AS index_count,
    (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'zero_rule') AS sequence_count;

-- Detailed constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    kcu.ordinal_position
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
      AND tc.table_name = kcu.table_name
WHERE tc.table_schema = 'zero_rule'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- Detailed indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'zero_rule'
ORDER BY tablename, indexname;

-- Detailed sequences
SELECT
    schemaname,
    sequencename,
    data_type,
    start_value,
    min_value,
    max_value,
    increment_by,
    cycle,
    cache_size,
    last_value
FROM pg_sequences
WHERE schemaname = 'zero_rule'
ORDER BY sequencename;


-- Popup application schema (matches Java mapper qualification).
CREATE SCHEMA IF NOT EXISTS popup;
SET LOCAL search_path TO popup, pg_catalog;
CREATE TABLE app_department
(
    department_id        VARCHAR(30)  NOT NULL,
    parent_department_id VARCHAR(30),
    department_name      VARCHAR(100) NOT NULL,
    department_level     INTEGER      NOT NULL,
    sort_order           INTEGER      NOT NULL,
    active_yn            CHAR(1)      NOT NULL DEFAULT 'Y',
    created_by           VARCHAR(30)  NOT NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(30)  NOT NULL,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_app_department PRIMARY KEY (department_id),
    CONSTRAINT fk_department_parent
        FOREIGN KEY (parent_department_id)
        REFERENCES app_department (department_id),
    CONSTRAINT ck_department_level CHECK (department_level >= 1),
    CONSTRAINT ck_department_sort_order CHECK (sort_order >= 0),
    CONSTRAINT ck_department_active CHECK (active_yn IN ('Y', 'N'))
);

CREATE TABLE app_position
(
    position_id   VARCHAR(30)  NOT NULL,
    position_name VARCHAR(100) NOT NULL,
    sort_order    INTEGER      NOT NULL,
    active_yn     CHAR(1)      NOT NULL DEFAULT 'Y',
    created_by    VARCHAR(30)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    VARCHAR(30)  NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_app_position PRIMARY KEY (position_id),
    CONSTRAINT ck_position_sort_order CHECK (sort_order >= 0),
    CONSTRAINT ck_position_active CHECK (active_yn IN ('Y', 'N'))
);

CREATE TABLE app_user
(
    employee_no   VARCHAR(30)  NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(30)  NOT NULL,
    position_id   VARCHAR(30)  NOT NULL,
    active_yn     CHAR(1)      NOT NULL DEFAULT 'Y',
    hire_date     DATE,
    last_login_at TIMESTAMP,
    created_by    VARCHAR(30)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    VARCHAR(30)  NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_app_user PRIMARY KEY (employee_no),
    CONSTRAINT fk_user_department
        FOREIGN KEY (department_id)
        REFERENCES app_department (department_id),
    CONSTRAINT fk_user_position
        FOREIGN KEY (position_id)
        REFERENCES app_position (position_id),
    CONSTRAINT ck_user_active CHECK (active_yn IN ('Y', 'N'))
);

CREATE TABLE question_template
(
    question_template_id BIGINT GENERATED BY DEFAULT AS IDENTITY,
    template_group_id    VARCHAR(30)  NOT NULL,
    template_name        VARCHAR(100) NOT NULL,
    template_type        VARCHAR(10)  NOT NULL,
    template_version     INTEGER      NOT NULL,
    current_yn           CHAR(1)      NOT NULL DEFAULT 'Y',
    active_yn            CHAR(1)      NOT NULL DEFAULT 'Y',
    created_by           VARCHAR(30)  NOT NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(30)  NOT NULL,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_question_template PRIMARY KEY (question_template_id),
    CONSTRAINT uk_question_template_group_version
        UNIQUE (template_group_id, template_version),
    CONSTRAINT ck_question_template_version CHECK (template_version >= 1),
    CONSTRAINT ck_question_template_current CHECK (current_yn IN ('Y', 'N')),
    CONSTRAINT ck_question_template_active CHECK (active_yn IN ('Y', 'N'))
);

CREATE UNIQUE INDEX ux_question_template_current
    ON question_template (template_group_id)
    WHERE current_yn = 'Y';

CREATE TABLE popup_notice
(
    popup_id                       VARCHAR(50)  NOT NULL,
    question_template_id           BIGINT,
    popup_type                     VARCHAR(20)  NOT NULL,
    title                          VARCHAR(200) NOT NULL,
    show_on_login_yn               CHAR(1)      NOT NULL DEFAULT 'N',
    show_on_schedule_yn            CHAR(1)      NOT NULL DEFAULT 'N',
    scheduled_at                   TIMESTAMP,
    display_start_at               TIMESTAMP    NOT NULL,
    display_end_at                 TIMESTAMP    NOT NULL,
    display_mode                   VARCHAR(20)  NOT NULL,
    display_order                  INTEGER NOT NULL DEFAULT 100 CONSTRAINT ck_popup_display_order CHECK (display_order >= 1),
    period_mode                    VARCHAR(20)  NOT NULL,
    repeat_interval                INTEGER,
    repeat_day_of_week             VARCHAR(20),
    repeat_day_of_month            INTEGER,
    active_yn                      CHAR(1)      NOT NULL DEFAULT 'Y',
    size_mode                      VARCHAR(30)  NOT NULL,
    popup_width                    NUMERIC(10,2),
    popup_height                   NUMERIC(10,2),
    width_ratio                    NUMERIC(5,4),
    height_ratio                   NUMERIC(5,4),
    minimum_width                  NUMERIC(10,2),
    minimum_height                 NUMERIC(10,2),
    maximum_width                  NUMERIC(10,2),
    maximum_height                 NUMERIC(10,2),
    show_header_yn                 CHAR(1)      NOT NULL DEFAULT 'Y',
    show_close_button_yn           CHAR(1)      NOT NULL DEFAULT 'Y',
    show_footer_yn                 CHAR(1)      NOT NULL DEFAULT 'Y',
    show_do_not_show_again_yn      CHAR(1)      NOT NULL DEFAULT 'N',
    hide_days                      INTEGER,
    completion_ratio               NUMERIC(5,4),
    passing_score                  NUMERIC(10,2),
    allow_close_before_complete_yn CHAR(1)      NOT NULL DEFAULT 'Y',
    created_by                     VARCHAR(30)  NOT NULL,
    created_at                     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by                     VARCHAR(30)  NOT NULL,
    updated_at                     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_notice PRIMARY KEY (popup_id),
    CONSTRAINT fk_popup_question_template
        FOREIGN KEY (question_template_id)
        REFERENCES question_template (question_template_id),
    CONSTRAINT ck_popup_display_period CHECK (display_end_at >= display_start_at),
    CONSTRAINT ck_popup_scheduled_at CHECK
        (show_on_schedule_yn = 'N' OR scheduled_at IS NOT NULL),
    CONSTRAINT ck_popup_repeat_interval CHECK
        (repeat_interval IS NULL OR repeat_interval >= 1),
    CONSTRAINT ck_popup_repeat_day_of_month CHECK
        (repeat_day_of_month IS NULL OR repeat_day_of_month BETWEEN 1 AND 31),
    CONSTRAINT ck_popup_hide_days CHECK (hide_days IS NULL OR hide_days >= 1),
    CONSTRAINT ck_popup_completion_ratio CHECK
        (completion_ratio IS NULL OR completion_ratio BETWEEN 0 AND 1),
    CONSTRAINT ck_popup_passing_score CHECK
        (passing_score IS NULL OR passing_score >= 0),
    CONSTRAINT ck_popup_width_ratio CHECK
        (width_ratio IS NULL OR width_ratio > 0),
    CONSTRAINT ck_popup_height_ratio CHECK
        (height_ratio IS NULL OR height_ratio > 0),
    CONSTRAINT ck_popup_yn_values CHECK
        (show_on_login_yn IN ('Y', 'N')
         AND show_on_schedule_yn IN ('Y', 'N')
         AND active_yn IN ('Y', 'N')
         AND show_header_yn IN ('Y', 'N')
         AND show_close_button_yn IN ('Y', 'N')
         AND show_footer_yn IN ('Y', 'N')
         AND show_do_not_show_again_yn IN ('Y', 'N')
         AND allow_close_before_complete_yn IN ('Y', 'N'))
);

CREATE TABLE popup_content
(
    popup_id        VARCHAR(50) NOT NULL,
    content_title   VARCHAR(200),
    description     VARCHAR(2000),
    content_body    TEXT,
    media_url       VARCHAR(2000),
    link_url        VARCHAR(2000),
    content_options JSONB,
    created_by      VARCHAR(30) NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(30) NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_content PRIMARY KEY (popup_id),
    CONSTRAINT fk_content_popup
        FOREIGN KEY (popup_id)
        REFERENCES popup_notice (popup_id)
        ON DELETE CASCADE
);

CREATE TABLE popup_target_group
(
    target_group_id   BIGINT GENERATED BY DEFAULT AS IDENTITY,
    popup_id          VARCHAR(50)  NOT NULL,
    target_name       VARCHAR(100) NOT NULL,
    target_description VARCHAR(500) NOT NULL,
    group_order       INTEGER      NOT NULL,
    created_by        VARCHAR(30)  NOT NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by        VARCHAR(30)  NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_target_group PRIMARY KEY (target_group_id),
    CONSTRAINT fk_target_group_popup
        FOREIGN KEY (popup_id)
        REFERENCES popup_notice (popup_id)
        ON DELETE CASCADE,
    CONSTRAINT uq_target_group_order UNIQUE (popup_id, group_order),
    CONSTRAINT ck_target_group_order CHECK (group_order >= 1)
);

CREATE TABLE popup_target_condition
(
    target_condition_id BIGINT GENERATED BY DEFAULT AS IDENTITY,
    target_group_id     BIGINT      NOT NULL,
    condition_type      VARCHAR(30) NOT NULL,
    condition_operator  VARCHAR(10) NOT NULL,
    department_id       VARCHAR(30),
    position_id         VARCHAR(30),
    employee_no         VARCHAR(30),
    condition_date_value DATE,
    include_child_yn    CHAR(1)     NOT NULL DEFAULT 'N',
    condition_order     INTEGER     NOT NULL,
    created_by          VARCHAR(30) NOT NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          VARCHAR(30) NOT NULL,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_target_condition PRIMARY KEY (target_condition_id),
    CONSTRAINT fk_target_condition_group
        FOREIGN KEY (target_group_id)
        REFERENCES popup_target_group (target_group_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_target_condition_department
        FOREIGN KEY (department_id)
        REFERENCES app_department (department_id),
    CONSTRAINT fk_target_condition_position
        FOREIGN KEY (position_id)
        REFERENCES app_position (position_id),
    CONSTRAINT fk_target_condition_employee
        FOREIGN KEY (employee_no)
        REFERENCES app_user (employee_no),
    CONSTRAINT uq_target_condition_order UNIQUE (target_group_id, condition_order),
    CONSTRAINT ck_target_condition_order CHECK (condition_order >= 1),
    CONSTRAINT ck_target_condition_include_child CHECK (include_child_yn IN ('Y', 'N')),
    CONSTRAINT ck_target_condition_operator CHECK
        (condition_operator IN ('=', '!=', '<', '<=', '>', '>=')),
    CONSTRAINT ck_target_condition_value CHECK
    (
        num_nonnulls(department_id, position_id, employee_no, condition_date_value) = 1
        AND
        CASE condition_type
            WHEN 'DEPARTMENT' THEN department_id IS NOT NULL
            WHEN 'POSITION'   THEN position_id IS NOT NULL
            WHEN 'EMPLOYEE'   THEN employee_no IS NOT NULL
            WHEN 'HIRE_DATE'  THEN condition_date_value IS NOT NULL
            ELSE FALSE
        END
    ),
    CONSTRAINT ck_target_condition_child_department CHECK
        (include_child_yn = 'N' OR condition_type = 'DEPARTMENT')
);

CREATE TABLE popup_question
(
    question_id          BIGINT GENERATED BY DEFAULT AS IDENTITY,
    question_template_id BIGINT        NOT NULL,
    question_type        VARCHAR(30)   NOT NULL,
    question_title       VARCHAR(1000) NOT NULL,
    question_description VARCHAR(2000),
    required_yn          CHAR(1)       NOT NULL DEFAULT 'N',
    scored_yn            CHAR(1)       NOT NULL DEFAULT 'N',
    question_score       NUMERIC(10,2),
    correct_answer       TEXT,
    answer_match_mode    VARCHAR(10) CHECK (answer_match_mode IN ('EXACT', 'CONTAINS')),
    sort_order           INTEGER       NOT NULL,
    created_by           VARCHAR(30)   NOT NULL,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(30)   NOT NULL,
    updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_question PRIMARY KEY (question_id),
    CONSTRAINT fk_question_template
        FOREIGN KEY (question_template_id)
        REFERENCES question_template (question_template_id)
        ON DELETE CASCADE,
    CONSTRAINT uq_question_sort_order UNIQUE (question_template_id, sort_order),
    CONSTRAINT ck_question_sort_order CHECK (sort_order >= 1),
    CONSTRAINT ck_question_yn_values CHECK
        (required_yn IN ('Y', 'N') AND scored_yn IN ('Y', 'N')),
    CONSTRAINT ck_question_score CHECK
        ((scored_yn = 'Y' AND question_score IS NOT NULL AND question_score >= 0)
         OR (scored_yn = 'N' AND question_score IS NULL))
);

CREATE TABLE popup_option
(
    option_id    BIGINT GENERATED BY DEFAULT AS IDENTITY,
    question_id  BIGINT        NOT NULL,
    option_value VARCHAR(200)   NOT NULL,
    option_text  VARCHAR(1000)  NOT NULL,
    correct_yn   CHAR(1)        NOT NULL DEFAULT 'N',
    sort_order   INTEGER        NOT NULL,
    created_by   VARCHAR(30)    NOT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by   VARCHAR(30)    NOT NULL,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_option PRIMARY KEY (option_id),
    CONSTRAINT fk_option_question
        FOREIGN KEY (question_id)
        REFERENCES popup_question (question_id)
        ON DELETE CASCADE,
    CONSTRAINT uq_option_value UNIQUE (question_id, option_value),
    CONSTRAINT uq_option_sort_order UNIQUE (question_id, sort_order),
    CONSTRAINT ck_option_sort_order CHECK (sort_order >= 1),
    CONSTRAINT ck_option_correct CHECK (correct_yn IN ('Y', 'N'))
);

CREATE TABLE user_popup_status
(
    user_popup_status_id BIGINT GENERATED BY DEFAULT AS IDENTITY,
    employee_no          VARCHAR(30) NOT NULL,
    popup_id             VARCHAR(50) NOT NULL,
    popup_status         VARCHAR(30) NOT NULL,
    first_displayed_at   TIMESTAMP,
    last_displayed_at    TIMESTAMP,
    display_count        INTEGER     NOT NULL DEFAULT 0,
    closed_at            TIMESTAMP,
    hidden_from_at       TIMESTAMP,
    hidden_until_at      TIMESTAMP,
    completed_yn         CHAR(1)     NOT NULL DEFAULT 'N',
    completed_at         TIMESTAMP,
    created_by           VARCHAR(30) NOT NULL,
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(30) NOT NULL,
    updated_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_user_popup_status PRIMARY KEY (user_popup_status_id),
    CONSTRAINT uq_user_popup_status UNIQUE (employee_no, popup_id),
    CONSTRAINT fk_status_user
        FOREIGN KEY (employee_no)
        REFERENCES app_user (employee_no),
    CONSTRAINT fk_status_popup
        FOREIGN KEY (popup_id)
        REFERENCES popup_notice (popup_id)
        ON DELETE CASCADE,
    CONSTRAINT ck_status_display_count CHECK (display_count >= 0),
    CONSTRAINT ck_status_completed CHECK (completed_yn IN ('Y', 'N')),
    CONSTRAINT ck_status_hidden_period CHECK
        (hidden_until_at IS NULL OR hidden_from_at IS NULL OR hidden_until_at >= hidden_from_at)
);

CREATE TABLE popup_response
(
    response_id          BIGINT GENERATED BY DEFAULT AS IDENTITY,
    client_request_id    VARCHAR(100) NOT NULL,
    popup_id             VARCHAR(50)  NOT NULL,
    employee_no          VARCHAR(30)  NOT NULL,
    question_template_id BIGINT,
    response_status      VARCHAR(30)  NOT NULL,
    response_started_at  TIMESTAMP,
    submitted_at         TIMESTAMP,
    received_at          TIMESTAMP,
    total_score          NUMERIC(10,2),
    passed_yn            CHAR(1),
    created_by           VARCHAR(30)  NOT NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(30)  NOT NULL,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_response PRIMARY KEY (response_id),
    CONSTRAINT uq_response_request UNIQUE (client_request_id),
    CONSTRAINT uq_response_user_popup UNIQUE (employee_no, popup_id),
    CONSTRAINT fk_response_popup
        FOREIGN KEY (popup_id)
        REFERENCES popup_notice (popup_id),
    CONSTRAINT fk_response_user
        FOREIGN KEY (employee_no)
        REFERENCES app_user (employee_no),
    CONSTRAINT fk_response_question_template
        FOREIGN KEY (question_template_id)
        REFERENCES question_template (question_template_id),
    CONSTRAINT ck_response_passed CHECK (passed_yn IS NULL OR passed_yn IN ('Y', 'N')),
    CONSTRAINT ck_response_total_score CHECK (total_score IS NULL OR total_score >= 0)
);

CREATE TABLE popup_response_answer
(
    response_answer_id BIGINT GENERATED BY DEFAULT AS IDENTITY,
    response_id        BIGINT       NOT NULL,
    question_id        BIGINT       NOT NULL,
    text_answer        TEXT,
    earned_score       NUMERIC(10,2),
    correct_yn         CHAR(1),
    created_by         VARCHAR(30) NOT NULL,
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by         VARCHAR(30) NOT NULL,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_response_answer PRIMARY KEY (response_answer_id),
    CONSTRAINT uq_response_question UNIQUE (response_id, question_id),
    CONSTRAINT fk_answer_response
        FOREIGN KEY (response_id)
        REFERENCES popup_response (response_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id)
        REFERENCES popup_question (question_id),
    CONSTRAINT ck_answer_earned_score CHECK (earned_score IS NULL OR earned_score >= 0),
    CONSTRAINT ck_answer_correct CHECK (correct_yn IS NULL OR correct_yn IN ('Y', 'N'))
);

CREATE TABLE popup_response_value
(
    response_value_id  BIGINT GENERATED BY DEFAULT AS IDENTITY,
    response_answer_id BIGINT       NOT NULL,
    option_id          BIGINT,
    selected_value     VARCHAR(200) NOT NULL,
    created_by         VARCHAR(30) NOT NULL,
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by         VARCHAR(30) NOT NULL,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_popup_response_value PRIMARY KEY (response_value_id),
    CONSTRAINT fk_value_answer
        FOREIGN KEY (response_answer_id)
        REFERENCES popup_response_answer (response_answer_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_value_option
        FOREIGN KEY (option_id)
        REFERENCES popup_option (option_id)
);

CREATE TABLE video_view_status
(
    video_view_status_id     BIGINT GENERATED BY DEFAULT AS IDENTITY,
    employee_no              VARCHAR(30)   NOT NULL,
    popup_id                 VARCHAR(50)   NOT NULL,
    total_duration_seconds   NUMERIC(12,3),
    last_position_seconds    NUMERIC(12,3),
    maximum_position_seconds NUMERIC(12,3),
    watched_seconds          NUMERIC(12,3),
    watched_ratio            NUMERIC(5,4),
    completed_yn             CHAR(1)       NOT NULL DEFAULT 'N',
    first_played_at          TIMESTAMP,
    last_played_at           TIMESTAMP,
    completed_at             TIMESTAMP,
    created_by               VARCHAR(30)   NOT NULL,
    created_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by               VARCHAR(30)   NOT NULL,
    updated_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_video_view_status PRIMARY KEY (video_view_status_id),
    CONSTRAINT uq_video_view_status UNIQUE (employee_no, popup_id),
    CONSTRAINT fk_video_status_user
        FOREIGN KEY (employee_no)
        REFERENCES app_user (employee_no),
    CONSTRAINT fk_video_status_popup
        FOREIGN KEY (popup_id)
        REFERENCES popup_notice (popup_id)
        ON DELETE CASCADE,
    CONSTRAINT ck_video_completed CHECK (completed_yn IN ('Y', 'N')),
    CONSTRAINT ck_video_duration CHECK
        (total_duration_seconds IS NULL OR total_duration_seconds >= 0),
    CONSTRAINT ck_video_last_position CHECK
        (last_position_seconds IS NULL OR last_position_seconds >= 0),
    CONSTRAINT ck_video_maximum_position CHECK
        (maximum_position_seconds IS NULL OR maximum_position_seconds >= 0),
    CONSTRAINT ck_video_watched_seconds CHECK
        (watched_seconds IS NULL OR watched_seconds >= 0),
    CONSTRAINT ck_video_watched_ratio CHECK
        (watched_ratio IS NULL OR watched_ratio BETWEEN 0 AND 1)
);

CREATE TABLE api_request_log
(
    api_request_log_id   BIGINT GENERATED BY DEFAULT AS IDENTITY,
    client_request_id    VARCHAR(100),
    employee_no          VARCHAR(30),
    popup_id             VARCHAR(50),
    api_path             VARCHAR(1000) NOT NULL,
    http_method          VARCHAR(10)   NOT NULL,
    client_ip            VARCHAR(100),
    request_received_at  TIMESTAMP     NOT NULL,
    response_completed_at TIMESTAMP,
    elapsed_milliseconds BIGINT,
    http_status_code     INTEGER,
    success_yn           CHAR(1)       NOT NULL,
    error_code           VARCHAR(100),
    error_message        TEXT,
    request_summary      TEXT,
    response_summary     TEXT,
    created_by           VARCHAR(30)   NOT NULL,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(30)   NOT NULL,
    updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_api_request_log PRIMARY KEY (api_request_log_id),
    CONSTRAINT fk_api_log_user
        FOREIGN KEY (employee_no)
        REFERENCES app_user (employee_no),
    CONSTRAINT fk_api_log_popup
        FOREIGN KEY (popup_id)
        REFERENCES popup_notice (popup_id),
    CONSTRAINT ck_api_log_elapsed CHECK
        (elapsed_milliseconds IS NULL OR elapsed_milliseconds >= 0),
    CONSTRAINT ck_api_log_status CHECK
        (http_status_code IS NULL OR http_status_code BETWEEN 100 AND 599),
    CONSTRAINT ck_api_log_success CHECK (success_yn IN ('Y', 'N'))
);

CREATE INDEX ix_department_parent
    ON app_department (parent_department_id);
CREATE INDEX ix_user_department
    ON app_user (department_id);
CREATE INDEX ix_user_position
    ON app_user (position_id);
CREATE INDEX ix_popup_display_period
    ON popup_notice (active_yn, display_start_at, display_end_at);
CREATE INDEX ix_popup_template
    ON popup_notice (question_template_id);
CREATE INDEX ix_target_group_popup
    ON popup_target_group (popup_id);
CREATE INDEX ix_target_condition_group
    ON popup_target_condition (target_group_id);
CREATE INDEX ix_question_template
    ON popup_question (question_template_id, sort_order);
CREATE INDEX ix_option_question
    ON popup_option (question_id, sort_order);
CREATE INDEX ix_status_popup
    ON user_popup_status (popup_id);
CREATE INDEX ix_response_popup_user
    ON popup_response (popup_id, employee_no);
CREATE INDEX ix_answer_response
    ON popup_response_answer (response_id);
CREATE INDEX ix_value_answer
    ON popup_response_value (response_answer_id);
CREATE INDEX ix_video_popup
    ON video_view_status (popup_id);
CREATE INDEX ix_api_log_received_at
    ON api_request_log (request_received_at);

COMMENT ON TABLE question_template IS 'Reusable and versioned question template';
COMMENT ON COLUMN popup_target_condition.condition_date_value IS
    'Comparison date used when CONDITION_TYPE is HIRE_DATE';

COMMIT;
