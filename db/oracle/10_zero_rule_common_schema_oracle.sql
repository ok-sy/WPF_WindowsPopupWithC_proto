-- =====================================================================
--  ZERO_RULE ê³µíµ ì¤í¤ë§ â Oracle DDL (ERD/01_schema.sql ì zero_rule ë¶ë¶ì tools/convert-zero-rule-ddl.pl ë¡ ë³í)
--  ì©ë : ê°ë° ìë²(zeroserver) ê¸°ëÂ·WPF ì°ë ê²ì¦. ì´ìì ê¸°ì¡´ Oracle ê³µíµ ì¤í¤ë§ ì¬ì©.
--  ì¤í : sqlplus zero_rule/<pw>@//host:1521/XEPDB1 @10_zero_rule_common_schema_oracle.sql
--  ìì± : Sat Sep 19 17:44:11 2026
-- =====================================================================

-- 1. TABLES (53)

CREATE TABLE CLOVER_API_LOG
(
    log_seq                      NUMBER(19),
    req_dttm                     TIMESTAMP(6),
    api_url                      VARCHAR2(100 CHAR),
    st_tm                        VARCHAR2(20 CHAR),
    ed_tm                        VARCHAR2(20 CHAR),
    proc_tm                      NUMBER(20,0),
    user_id                      NUMBER(19)
);
CREATE TABLE CLOVER_API_PAGE
(
    api_url                      VARCHAR2(100 CHAR),
    page_id                      NUMBER(19),
    api_url_nm                   VARCHAR2(1000 CHAR),
    priv_id                      VARCHAR2(64 CHAR)
);
CREATE TABLE CLOVER_APP_LOG
(
    log_id                       NUMBER(19),
    log_level                    VARCHAR2(1 CHAR),
    title                        VARCHAR2(1000 CHAR),
    msg                          VARCHAR2(4000 CHAR),
    operator_name                VARCHAR2(64 CHAR),
    user_name                    VARCHAR2(64 CHAR),
    log_tag                      VARCHAR2(20 CHAR),
    node_id                      VARCHAR2(64 CHAR),
    host_ip                      VARCHAR2(45 CHAR),
    client_ip                    VARCHAR2(45 CHAR),
    browser_name                 VARCHAR2(32 CHAR),
    created_at                   TIMESTAMP(6)
);
CREATE TABLE CLOVER_AUDIT_LOG
(
    log_id                       NUMBER(19),
    log_level                    VARCHAR2(1 CHAR),
    log_kind                     VARCHAR2(20 CHAR),
    title                        VARCHAR2(1000 CHAR),
    msg                          VARCHAR2(4000 CHAR),
    operator_name                VARCHAR2(64 CHAR),
    job_id                       VARCHAR2(64 CHAR),
    page_id                      VARCHAR2(64 CHAR),
    log_tag                      VARCHAR2(20 CHAR),
    node_id                      VARCHAR2(64 CHAR),
    host_ip                      VARCHAR2(45 CHAR),
    client_ip                    VARCHAR2(45 CHAR),
    browser_name                 VARCHAR2(32 CHAR),
    created_at                   TIMESTAMP(6)
);
CREATE TABLE CLOVER_BATCH_NODE
(
    dummy_id                     NUMBER(5),
    node_id                      VARCHAR2(64 CHAR),
    fst_updt_dttm                TIMESTAMP(6),
    last_updt_dttm               TIMESTAMP(6)
);
CREATE TABLE CLOVER_CODE
(
    code_type                    VARCHAR2(40 CHAR),
    dtl_expl                     VARCHAR2(200 CHAR),
    regr_id                      VARCHAR2(50 CHAR),
    chgr_id                      VARCHAR2(50 CHAR),
    code                         VARCHAR2(20 CHAR),
    code_nm                      VARCHAR2(60 CHAR),
    chng_dttm                    TIMESTAMP(6),
    reg_dttm                     TIMESTAMP(6)
);
CREATE TABLE CLOVER_CODE_TYPE
(
    code_type                    VARCHAR2(40 CHAR),
    dtl_expl                     VARCHAR2(200 CHAR),
    regr_id                      VARCHAR2(50 CHAR),
    chgr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    code_type_nm                 VARCHAR2(60 CHAR),
    reg_dttm                     TIMESTAMP(6)
);
CREATE TABLE CLOVER_JOB_CONFIG
(
    job_id                       VARCHAR2(64 CHAR),
    job_status                   VARCHAR2(20 CHAR),
    node_id                      VARCHAR2(64 CHAR),
    job_started_at               TIMESTAMP(6),
    job_finished_at              TIMESTAMP(6),
    error_msg                    VARCHAR2(100 CHAR),
    changed_at                   TIMESTAMP(6),
    created_at                   TIMESTAMP(6),
    disabled_yn                  VARCHAR2(1 CHAR)
);
CREATE TABLE CLOVER_JOB_LOG
(
    log_id                       NUMBER(19),
    log_level                    VARCHAR2(1 CHAR),
    job_id                       VARCHAR2(64 CHAR),
    msg                          VARCHAR2(4000 CHAR),
    log_tag                      VARCHAR2(20 CHAR),
    node_id                      VARCHAR2(64 CHAR),
    created_at                   TIMESTAMP(6)
);
CREATE TABLE CLOVER_MSG_MNG
(
    msg_id                       VARCHAR2(10 CHAR),
    msg_clsf                     VARCHAR2(2 CHAR),
    tsk_clsf_cd                  VARCHAR2(3 CHAR),
    team_id                      NUMBER(19),
    occr_clsf_cd                 VARCHAR2(2 CHAR),
    msg_prnt_cd                  VARCHAR2(2 CHAR),
    msg_cn                       VARCHAR2(1000 CHAR),
    use_yn                       CHAR(1),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR)
);
CREATE TABLE CLOVER_NAV
(
    nav_id                       NUMBER(19),
    nav_nm                       VARCHAR2(30 CHAR),
    expl                         VARCHAR2(100 CHAR)
);
CREATE TABLE CLOVER_NAV_ITEM
(
    item_id                      NUMBER(19),
    page_id                      NUMBER(19),
    section_id                   NUMBER(19),
    sort_no                      NUMBER(19),
    nav_id                       NUMBER(19)
);
CREATE TABLE CLOVER_PAGE
(
    page_id                      NUMBER(19),
    page_key                     VARCHAR2(10 CHAR),
    page_nm                      VARCHAR2(50 CHAR),
    url                          VARCHAR2(100 CHAR),
    icon                         VARCHAR2(20 CHAR),
    dtl_expl                     VARCHAR2(200 CHAR),
    tsk_clsf_cd                  VARCHAR2(2 CHAR),
    scre_tpcd                    VARCHAR2(1 CHAR),
    up_page_id                   NUMBER(19)
);
CREATE TABLE CLOVER_PAGE_SECTION
(
    section_id                   NUMBER(19),
    icon                         VARCHAR2(20 CHAR),
    section_nm                   VARCHAR2(30 CHAR)
);
CREATE TABLE CLOVER_PRIV
(
    priv_type                    VARCHAR2(2 CHAR),
    dtl_expl                     VARCHAR2(200 CHAR),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR),
    priv_nm                      VARCHAR2(50 CHAR),
    priv_id                      VARCHAR2(64 CHAR)
);
CREATE TABLE CLOVER_ROLE
(
    role_id                      VARCHAR2(10 CHAR),
    role_nm                      VARCHAR2(50 CHAR),
    dtl_expl                     VARCHAR2(200 CHAR),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR)
);
CREATE TABLE CLOVER_ROLE_PAGE
(
    role_id                      VARCHAR2(10 CHAR),
    page_id                      NUMBER(19),
    priv_id                      VARCHAR2(64 CHAR),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR)
);
CREATE TABLE CLOVER_ROLE_USER
(
    role_id                      VARCHAR2(10 CHAR),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR),
    user_id                      NUMBER(19)
);
CREATE TABLE CLOVER_SYSTEM_NODE
(
    node_id                      VARCHAR2(64 CHAR),
    health_dttm                  TIMESTAMP(6),
    fst_updt_dttm                TIMESTAMP(6)
);
CREATE TABLE CLOVER_TEAM
(
    team_id                      NUMBER(19),
    team_nm                      VARCHAR2(15 CHAR),
    team_expl                    VARCHAR2(255 CHAR),
    psnl_stup_acce_yn            CHAR(1),
    team_cmmn_stup_cn            BLOB,
    team_stat                    NUMBER(19),
    team_tsk_clsf                NUMBER(5),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR)
);
CREATE TABLE CLOVER_USER
(
    user_id                      NUMBER(19),
    lgon_id                      VARCHAR2(50 CHAR),
    pswd                         VARCHAR2(120 CHAR),
    user_nm                      VARCHAR2(30 CHAR),
    bryy_mndy                    VARCHAR2(6 CHAR),
    user_tno                     VARCHAR2(12 CHAR),
    user_exno                    VARCHAR2(17 CHAR),
    cti_user_ntno                VARCHAR2(20 CHAR),
    prt_posb_yn                  CHAR(1),
    dwnl_posb_yn                 CHAR(1),
    atnt_yn                      CHAR(1),
    team_id                      NUMBER(19),
    user_gd                      VARCHAR2(20 CHAR),
    user_state                   VARCHAR2(20 CHAR),
    lgon_fail_cnt                NUMBER(5) DEFAULT 0,
    pswd_init_yn                 CHAR(1),
    last_pswd_chng_dttm          TIMESTAMP(6),
    last_lgon_dttm               TIMESTAMP(6),
    memo                         VARCHAR2(255 CHAR),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR),
    role_id                      NUMBER(19),
    nav_id                       NUMBER(19)
);
CREATE TABLE CLOVER_USER_AUTH
(
    auth_id                      NUMBER(19),
    auth_token                   VARCHAR2(512 CHAR),
    reg_dttm                     TIMESTAMP(6),
    chng_dttm                    TIMESTAMP(6),
    expiry_dttm                  TIMESTAMP(6),
    user_id                      NUMBER(19)
);
CREATE TABLE CLOVER_USER_BLOCKED_IP
(
    ip                           VARCHAR2(45 CHAR),
    expiry_dttm                  TIMESTAMP(6),
    reg_dttm                     TIMESTAMP(6)
);
CREATE TABLE CLOVER_USER_LGON_FAIL
(
    fail_id                      NUMBER(19),
    ip                           VARCHAR2(45 CHAR),
    lgon_id                      VARCHAR2(50 CHAR),
    reason                       VARCHAR2(20 CHAR),
    reg_dttm                     TIMESTAMP(6)
);
CREATE TABLE CLOVER_USER_PRIV
(
    priv_id                      VARCHAR2(64 CHAR),
    user_id                      NUMBER(19),
    reg_dttm                     TIMESTAMP(6),
    regr_id                      VARCHAR2(50 CHAR),
    chng_dttm                    TIMESTAMP(6),
    chgr_id                      VARCHAR2(50 CHAR)
);
CREATE TABLE CLOVER_USER_PW_FAIL
(
    fail_id                      NUMBER(19),
    ip                           VARCHAR2(45 CHAR),
    reg_dttm                     TIMESTAMP(6),
    user_id                      NUMBER(19)
);
CREATE TABLE GRID_COLUMN
(
    filter_id                    NUMBER(19),
    column_id                    VARCHAR2(300 CHAR),
    visiable_yn                  VARCHAR2(1 CHAR),
    filtering_text               VARCHAR2(300 CHAR),
    filtering_oper_code          VARCHAR2(10 CHAR),
    column_seq                   NUMBER(19),
    column_type_code             VARCHAR2(10 CHAR),
    sorting_info                 VARCHAR2(20 CHAR)
);
CREATE TABLE GRID_FILTER
(
    filter_id                    NUMBER(19),
    filter_nm                    VARCHAR2(50 CHAR),
    user_id                      NUMBER(19),
    page_code                    VARCHAR2(50 CHAR),
    filter_mode_yn               VARCHAR2(1 CHAR),
    default_yn                   VARCHAR2(1 CHAR)
);
CREATE TABLE IF_EMAIL_TRANSCEIVE_INFO
(
    email_transceive_type_cd     CHAR(1),
    email_tracsceive_datetime    CHAR(14),
    emp_id                       VARCHAR2(20 CHAR),
    opponent_email_domain_addr   VARCHAR2(200 CHAR),
    file_attach_yn               CHAR(1),
    file_attach_size             NUMBER(19),
    email_title                  VARCHAR2(2000 CHAR),
    department_cd                VARCHAR2(10 CHAR),
    reg_datetime                 CHAR(14),
    inspection_yn                CHAR(1),
    call_rule_result             VARCHAR2(500 CHAR)
);
CREATE TABLE INTERFACEINFO
(
    ifid                         CHAR(10),
    if_nm                        VARCHAR2(100 CHAR),
    if_desc                      VARCHAR2(2000 CHAR),
    if_process_type_cd           VARCHAR2(1 CHAR),
    if_connection_type_cd        VARCHAR2(2 CHAR),
    rule_use_yn                  CHAR(1),
    doc_length                   NUMBER(19),
    characterset                 VARCHAR2(50 CHAR),
    eaiid                        VARCHAR2(30 CHAR),
    del_yn                       VARCHAR2(1 CHAR),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE INTERFACEMAP
(
    ifid                         CHAR(10),
    field_eng_nm                 VARCHAR2(1000 CHAR),
    field_kor_nm                 VARCHAR2(1000 CHAR),
    field_order                  NUMBER(10),
    field_length                 NUMBER(10),
    field_start_no               NUMBER(10),
    field_code_type              CHAR(1),
    datatype_cd                  CHAR(1),
    field_scale                  NUMBER(5),
    trim_yn                      VARCHAR2(1 CHAR),
    characterset                 VARCHAR2(50 CHAR),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE LOCKS
(
    lockcode                     CHAR(3),
    lockkey                      VARCHAR2(100 CHAR),
    lockdatetime                 TIMESTAMP(6),
    userid                       NUMBER(19),
    locktypecode                 VARCHAR2(4 CHAR),
    locknote                     VARCHAR2(255 CHAR)
);
CREATE TABLE PDS
(
    pds_id                       NUMBER(19),
    create_user_id               VARCHAR2(20 CHAR),
    created_at                   TIMESTAMP(6),
    changed_at                   TIMESTAMP(6),
    location                     VARCHAR2(50 CHAR) DEFAULT 'BASIC',
    title                        VARCHAR2(100 CHAR),
    title_no_space               VARCHAR2(100 CHAR),
    substance                    CLOB,
    attach_file_count            NUMBER(10)
);
CREATE TABLE PDS_FILE
(
    file_id                      VARCHAR2(64 CHAR),
    file_type                    VARCHAR2(20 CHAR),
    file_name                    VARCHAR2(100 CHAR),
    pds_id                       NUMBER(19),
    sort_number                  NUMBER(19),
    file_size                    NUMBER(19),
    width                        NUMBER(10),
    height                       NUMBER(10),
    duration                     NUMBER(10),
    content_type                 VARCHAR2(40 CHAR),
    created_at                   TIMESTAMP(6),
    changed_at                   TIMESTAMP(6),
    del_yn                       VARCHAR2(1 CHAR) DEFAULT 'N'
);
CREATE TABLE RULE
(
    ruleid                       CHAR(10),
    rule_nm                      VARCHAR2(500 CHAR),
    rulealias_nm                 VARCHAR2(1000 CHAR),
    rule_desc                    VARCHAR2(4000 CHAR),
    rulereturn_type              CHAR(1),
    rulesort_cd                  CHAR(1),
    ruleusage_cd                 CHAR(1),
    allreturn_yn                 CHAR(1),
    use_yn                       CHAR(1),
    rule_verno                   NUMBER(5,2),
    activate_yn                  CHAR(1),
    activate_datetime            TIMESTAMP(6),
    rule_state                   CHAR(1),
    deploy_datetime              TIMESTAMP(6),
    deploy_userid                NUMBER(19),
    ifid                         CHAR(10),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14),
    rule_apply_yn                CHAR(1),
    deploy_wait_state_appy_yn    CHAR(1)
);
CREATE TABLE RULECONDITION
(
    ruleid                       CHAR(10),
    ruleconditionno              NUMBER(10),
    condition_infix_desc         VARCHAR2(4000 CHAR),
    condition_postfix_desc       VARCHAR2(4000 CHAR),
    condition_desc               VARCHAR2(4000 CHAR),
    use_yn                       CHAR(1),
    firstreg_userid              VARCHAR2(20 CHAR),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE RULECONDITIONRETURNITEM
(
    ruleid                       CHAR(10),
    ruleconditionno              NUMBER(10),
    return_itemid                CHAR(10),
    returnitem_expr_desc         VARCHAR2(4000 CHAR),
    returnitem_postfix_desc      VARCHAR2(4000 CHAR),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE RULECONDITIONRETURNITEM_HIST
(
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(5,2),
    ruleconditionno              NUMBER(10),
    return_itemid                CHAR(10),
    returnitem_expr_desc         VARCHAR2(4000 CHAR),
    returnitem_postfix_desc      VARCHAR2(4000 CHAR),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14),
    modified_userid              NUMBER(19),
    modified_datetime            CHAR(14)
);
CREATE TABLE RULECONDITIONRETURN_POSTOBJECT
(
    ruleid                       CHAR(10),
    ruleconditionno              NUMBER(10),
    return_itemid                CHAR(10),
    postfixobjectno              NUMBER(10),
    datatype_cd                  VARCHAR2(20 CHAR),
    operator_yn                  CHAR(1),
    object_data                  VARCHAR2(4000 CHAR)
);
CREATE TABLE RULECONDITIONRETURN_POSTOB_HI
(
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(5,2),
    ruleconditionno              NUMBER(10),
    return_itemid                CHAR(10),
    postfixobjectno              NUMBER,
    datatype_cd                  VARCHAR2(20 CHAR),
    operation_yn                 CHAR(1),
    object_data                  VARCHAR2(4000 CHAR)
);
CREATE TABLE RULECONDITION_HIST
(
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(5,2),
    ruleconditionno              NUMBER(10),
    condition_infix_desc         VARCHAR2(4000 CHAR),
    condition_postfix_desc       VARCHAR2(4000 CHAR),
    condition_desc               VARCHAR2(4000 CHAR),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14),
    modified_userid              NUMBER(19),
    modified_datetime            CHAR(14)
);
CREATE TABLE RULECONDITION_POSTFIXOBJECT
(
    ruleid                       CHAR(10),
    ruleconditionno              NUMBER(10),
    postfixobjectno              NUMBER(10),
    datatype_cd                  CHAR(1),
    operator_yn                  CHAR(1),
    object_data                  VARCHAR2(200 CHAR)
);
CREATE TABLE RULECONDITION_POSTFIXOBJECT_HI
(
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(5,2),
    ruleconditionno              NUMBER(10),
    postfixobjectno              NUMBER(10),
    datatype_cd                  CHAR(1),
    operator_yn                  CHAR(1),
    object_data                  VARCHAR2(200 CHAR)
);
CREATE TABLE RULEITEM
(
    itemid                       CHAR(10),
    item_nm                      VARCHAR2(1000 CHAR),
    itemalias_nm                 VARCHAR2(1000 CHAR),
    itemexplan_desc              VARCHAR2(4000 CHAR),
    datatype_cd                  CHAR(1),
    item_use_yn                  CHAR(1),
    ifid                         CHAR(10),
    firstreg_userid              VARCHAR2(20 CHAR),
    firstreg_datetime            CHAR(14),
    update_userid                VARCHAR2(20 CHAR),
    update_datetime              CHAR(14)
);
CREATE TABLE RULEITEMREF
(
    itemid                       CHAR(10),
    itemref_cd                   VARCHAR2(20 CHAR),
    itemref_nm                   VARCHAR2(1000 CHAR),
    itemrefalias_nm              VARCHAR2(1000 CHAR),
    itemrefexpr_desc             VARCHAR2(4000 CHAR),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE RULERETURNITEM
(
    ruleid                       CHAR(10),
    return_itemid                CHAR(10),
    returnitem_no                NUMBER,
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE RULERETURNITEM_HIST
(
    return_itemid                CHAR(10),
    returnitem_no                NUMBER,
    update_userid                NUMBER(19),
    update_datetime              CHAR(14),
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(10),
    modified_userid              NUMBER(19),
    modified_datetime            CHAR(14)
);
CREATE TABLE RULE_DEPLOY
(
    deploy_datetime              CHAR(14),
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(5,2),
    rule_update_yn               CHAR(1),
    before_deploy_apply_yn       CHAR(1),
    after_deploy_apply_yn        CHAR(1),
    rule_update_userid           NUMBER(19),
    rule_update_datetime         CHAR(14),
    reg_userid                   NUMBER(19),
    reg_datetime                 CHAR(14)
);
CREATE TABLE RULE_HIST
(
    ruleid                       CHAR(10),
    rule_verno                   NUMBER(5,2),
    rule_nm                      VARCHAR2(500 CHAR),
    rulealias_nm                 VARCHAR2(1000 CHAR),
    rule_desc                    VARCHAR2(4000 CHAR),
    rulereturn_type              CHAR(1),
    rulesort_cd                  CHAR(1),
    ruleusage_cd                 CHAR(1),
    allreturn_yn                 CHAR(1),
    use_yn                       CHAR(1),
    activate_yn                  CHAR(1),
    activate_datetime            TIMESTAMP(6),
    rule_state                   CHAR(2),
    deploy_datetime              TIMESTAMP(6),
    deploy_userid                NUMBER(19),
    ifid                         VARCHAR2(10 CHAR),
    ruleversionchangecode        VARCHAR2(10 CHAR),
    firstreg_userid              NUMBER(19),
    firstreg_datetime            CHAR(14),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14),
    modified_userid              NUMBER(19),
    modified_datetime            CHAR(14)
);
CREATE TABLE RULE_LOG
(
    log_no                       NUMBER(20,0),
    log_title                    VARCHAR2(20 CHAR),
    log_start_time               VARCHAR2(20 CHAR),
    log_end_time                 VARCHAR2(20 CHAR),
    log_request                  VARCHAR2(4000 CHAR),
    time_gap                     NUMBER(38,0),
    log_response                 VARCHAR2(4000 CHAR),
    rule_id                      CHAR(10),
    rulealias_nm                 VARCHAR2(200 CHAR),
    rule_verno                   NUMBER(5,2),
    inspection_yn                CHAR(1),
    res_code                     VARCHAR2(4 CHAR)
);
CREATE TABLE RULE_PROGRESS_HISTORY
(
    ruleid                       CHAR(10),
    history_no                   NUMBER(10),
    rule_verno                   NUMBER(5,2),
    rule_state                   CHAR(1),
    current_rule_apply_yn        CHAR(1),
    deploy_wait_state_apply_yn   CHAR(1),
    update_userid                NUMBER(19),
    update_datetime              CHAR(14)
);
CREATE TABLE SORTCODE
(
    sortcodeid                   VARCHAR2(100 CHAR),
    sortcode_nm                  VARCHAR2(1000 CHAR),
    sortcode_desc                VARCHAR2(1000 CHAR)
);
CREATE TABLE SORTCODEVALUE
(
    sortcodeid                   VARCHAR2(100 CHAR),
    codeid                       CHAR(2),
    code_nm                      VARCHAR2(1000 CHAR),
    code_desc                    VARCHAR2(2000 CHAR)
);

-- 2. NOT NULL (169)

ALTER TABLE CLOVER_API_LOG MODIFY (log_seq NOT NULL);
ALTER TABLE CLOVER_API_LOG MODIFY (req_dttm NOT NULL);
ALTER TABLE CLOVER_API_PAGE MODIFY (api_url NOT NULL);
ALTER TABLE CLOVER_APP_LOG MODIFY (log_id NOT NULL);
ALTER TABLE CLOVER_APP_LOG MODIFY (log_level NOT NULL);
ALTER TABLE CLOVER_APP_LOG MODIFY (title NOT NULL);
ALTER TABLE CLOVER_APP_LOG MODIFY (node_id NOT NULL);
ALTER TABLE CLOVER_APP_LOG MODIFY (host_ip NOT NULL);
ALTER TABLE CLOVER_APP_LOG MODIFY (created_at NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (log_id NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (log_level NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (log_kind NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (title NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (node_id NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (host_ip NOT NULL);
ALTER TABLE CLOVER_AUDIT_LOG MODIFY (created_at NOT NULL);
ALTER TABLE CLOVER_BATCH_NODE MODIFY (dummy_id NOT NULL);
ALTER TABLE CLOVER_BATCH_NODE MODIFY (fst_updt_dttm NOT NULL);
ALTER TABLE CLOVER_BATCH_NODE MODIFY (last_updt_dttm NOT NULL);
ALTER TABLE CLOVER_CODE MODIFY (code_type NOT NULL);
ALTER TABLE CLOVER_CODE MODIFY (code NOT NULL);
ALTER TABLE CLOVER_CODE MODIFY (code_nm NOT NULL);
ALTER TABLE CLOVER_CODE MODIFY (chng_dttm NOT NULL);
ALTER TABLE CLOVER_CODE MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_CODE_TYPE MODIFY (code_type NOT NULL);
ALTER TABLE CLOVER_CODE_TYPE MODIFY (chng_dttm NOT NULL);
ALTER TABLE CLOVER_CODE_TYPE MODIFY (code_type_nm NOT NULL);
ALTER TABLE CLOVER_CODE_TYPE MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_JOB_CONFIG MODIFY (job_id NOT NULL);
ALTER TABLE CLOVER_JOB_CONFIG MODIFY (job_status NOT NULL);
ALTER TABLE CLOVER_JOB_CONFIG MODIFY (changed_at NOT NULL);
ALTER TABLE CLOVER_JOB_CONFIG MODIFY (created_at NOT NULL);
ALTER TABLE CLOVER_JOB_CONFIG MODIFY (disabled_yn NOT NULL);
ALTER TABLE CLOVER_JOB_LOG MODIFY (log_id NOT NULL);
ALTER TABLE CLOVER_JOB_LOG MODIFY (log_level NOT NULL);
ALTER TABLE CLOVER_JOB_LOG MODIFY (job_id NOT NULL);
ALTER TABLE CLOVER_JOB_LOG MODIFY (msg NOT NULL);
ALTER TABLE CLOVER_JOB_LOG MODIFY (node_id NOT NULL);
ALTER TABLE CLOVER_JOB_LOG MODIFY (created_at NOT NULL);
ALTER TABLE CLOVER_MSG_MNG MODIFY (msg_id NOT NULL);
ALTER TABLE CLOVER_NAV MODIFY (nav_id NOT NULL);
ALTER TABLE CLOVER_NAV MODIFY (nav_nm NOT NULL);
ALTER TABLE CLOVER_NAV_ITEM MODIFY (item_id NOT NULL);
ALTER TABLE CLOVER_NAV_ITEM MODIFY (page_id NOT NULL);
ALTER TABLE CLOVER_NAV_ITEM MODIFY (sort_no NOT NULL);
ALTER TABLE CLOVER_NAV_ITEM MODIFY (nav_id NOT NULL);
ALTER TABLE CLOVER_PAGE MODIFY (page_id NOT NULL);
ALTER TABLE CLOVER_PAGE MODIFY (page_nm NOT NULL);
ALTER TABLE CLOVER_PAGE MODIFY (url NOT NULL);
ALTER TABLE CLOVER_PAGE_SECTION MODIFY (section_id NOT NULL);
ALTER TABLE CLOVER_PAGE_SECTION MODIFY (section_nm NOT NULL);
ALTER TABLE CLOVER_PRIV MODIFY (priv_type NOT NULL);
ALTER TABLE CLOVER_PRIV MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_PRIV MODIFY (chng_dttm NOT NULL);
ALTER TABLE CLOVER_PRIV MODIFY (priv_nm NOT NULL);
ALTER TABLE CLOVER_PRIV MODIFY (priv_id NOT NULL);
ALTER TABLE CLOVER_ROLE MODIFY (role_id NOT NULL);
ALTER TABLE CLOVER_ROLE MODIFY (role_nm NOT NULL);
ALTER TABLE CLOVER_ROLE MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_ROLE MODIFY (chng_dttm NOT NULL);
ALTER TABLE CLOVER_ROLE_PAGE MODIFY (role_id NOT NULL);
ALTER TABLE CLOVER_ROLE_PAGE MODIFY (page_id NOT NULL);
ALTER TABLE CLOVER_ROLE_PAGE MODIFY (priv_id NOT NULL);
ALTER TABLE CLOVER_ROLE_PAGE MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_ROLE_PAGE MODIFY (chng_dttm NOT NULL);
ALTER TABLE CLOVER_ROLE_USER MODIFY (role_id NOT NULL);
ALTER TABLE CLOVER_ROLE_USER MODIFY (user_id NOT NULL);
ALTER TABLE CLOVER_SYSTEM_NODE MODIFY (node_id NOT NULL);
ALTER TABLE CLOVER_SYSTEM_NODE MODIFY (fst_updt_dttm NOT NULL);
ALTER TABLE CLOVER_TEAM MODIFY (team_id NOT NULL);
ALTER TABLE CLOVER_USER MODIFY (user_id NOT NULL);
ALTER TABLE CLOVER_USER_AUTH MODIFY (auth_id NOT NULL);
ALTER TABLE CLOVER_USER_AUTH MODIFY (auth_token NOT NULL);
ALTER TABLE CLOVER_USER_AUTH MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_USER_AUTH MODIFY (chng_dttm NOT NULL);
ALTER TABLE CLOVER_USER_AUTH MODIFY (expiry_dttm NOT NULL);
ALTER TABLE CLOVER_USER_AUTH MODIFY (user_id NOT NULL);
ALTER TABLE CLOVER_USER_BLOCKED_IP MODIFY (ip NOT NULL);
ALTER TABLE CLOVER_USER_BLOCKED_IP MODIFY (expiry_dttm NOT NULL);
ALTER TABLE CLOVER_USER_BLOCKED_IP MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_USER_LGON_FAIL MODIFY (fail_id NOT NULL);
ALTER TABLE CLOVER_USER_LGON_FAIL MODIFY (ip NOT NULL);
ALTER TABLE CLOVER_USER_LGON_FAIL MODIFY (lgon_id NOT NULL);
ALTER TABLE CLOVER_USER_LGON_FAIL MODIFY (reason NOT NULL);
ALTER TABLE CLOVER_USER_LGON_FAIL MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_USER_PRIV MODIFY (priv_id NOT NULL);
ALTER TABLE CLOVER_USER_PRIV MODIFY (user_id NOT NULL);
ALTER TABLE CLOVER_USER_PW_FAIL MODIFY (fail_id NOT NULL);
ALTER TABLE CLOVER_USER_PW_FAIL MODIFY (ip NOT NULL);
ALTER TABLE CLOVER_USER_PW_FAIL MODIFY (reg_dttm NOT NULL);
ALTER TABLE CLOVER_USER_PW_FAIL MODIFY (user_id NOT NULL);
ALTER TABLE GRID_COLUMN MODIFY (filter_id NOT NULL);
ALTER TABLE GRID_COLUMN MODIFY (column_id NOT NULL);
ALTER TABLE GRID_FILTER MODIFY (filter_id NOT NULL);
ALTER TABLE IF_EMAIL_TRANSCEIVE_INFO MODIFY (email_transceive_type_cd NOT NULL);
ALTER TABLE IF_EMAIL_TRANSCEIVE_INFO MODIFY (email_tracsceive_datetime NOT NULL);
ALTER TABLE IF_EMAIL_TRANSCEIVE_INFO MODIFY (emp_id NOT NULL);
ALTER TABLE INTERFACEINFO MODIFY (ifid NOT NULL);
ALTER TABLE INTERFACEMAP MODIFY (ifid NOT NULL);
ALTER TABLE INTERFACEMAP MODIFY (field_eng_nm NOT NULL);
ALTER TABLE LOCKS MODIFY (lockcode NOT NULL);
ALTER TABLE LOCKS MODIFY (lockkey NOT NULL);
ALTER TABLE PDS MODIFY (pds_id NOT NULL);
ALTER TABLE PDS MODIFY (created_at NOT NULL);
ALTER TABLE PDS MODIFY (changed_at NOT NULL);
ALTER TABLE PDS MODIFY (title NOT NULL);
ALTER TABLE PDS MODIFY (title_no_space NOT NULL);
ALTER TABLE PDS_FILE MODIFY (file_id NOT NULL);
ALTER TABLE PDS_FILE MODIFY (file_type NOT NULL);
ALTER TABLE PDS_FILE MODIFY (pds_id NOT NULL);
ALTER TABLE PDS_FILE MODIFY (sort_number NOT NULL);
ALTER TABLE PDS_FILE MODIFY (file_size NOT NULL);
ALTER TABLE PDS_FILE MODIFY (width NOT NULL);
ALTER TABLE PDS_FILE MODIFY (height NOT NULL);
ALTER TABLE PDS_FILE MODIFY (duration NOT NULL);
ALTER TABLE PDS_FILE MODIFY (created_at NOT NULL);
ALTER TABLE PDS_FILE MODIFY (changed_at NOT NULL);
ALTER TABLE PDS_FILE MODIFY (del_yn NOT NULL);
ALTER TABLE RULE MODIFY (ruleid NOT NULL);
ALTER TABLE RULE MODIFY (ifid NOT NULL);
ALTER TABLE RULECONDITION MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITION MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM MODIFY (return_itemid NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM_HIST MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM_HIST MODIFY (rule_verno NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM_HIST MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITIONRETURNITEM_HIST MODIFY (return_itemid NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOBJECT MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOBJECT MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOBJECT MODIFY (return_itemid NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOBJECT MODIFY (postfixobjectno NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOB_HI MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOB_HI MODIFY (rule_verno NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOB_HI MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOB_HI MODIFY (return_itemid NOT NULL);
ALTER TABLE RULECONDITIONRETURN_POSTOB_HI MODIFY (postfixobjectno NOT NULL);
ALTER TABLE RULECONDITION_HIST MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITION_HIST MODIFY (rule_verno NOT NULL);
ALTER TABLE RULECONDITION_HIST MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT MODIFY (postfixobjectno NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT_HI MODIFY (ruleid NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT_HI MODIFY (rule_verno NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT_HI MODIFY (ruleconditionno NOT NULL);
ALTER TABLE RULECONDITION_POSTFIXOBJECT_HI MODIFY (postfixobjectno NOT NULL);
ALTER TABLE RULEITEM MODIFY (itemid NOT NULL);
ALTER TABLE RULEITEMREF MODIFY (itemid NOT NULL);
ALTER TABLE RULEITEMREF MODIFY (itemref_cd NOT NULL);
ALTER TABLE RULERETURNITEM MODIFY (ruleid NOT NULL);
ALTER TABLE RULERETURNITEM MODIFY (return_itemid NOT NULL);
ALTER TABLE RULERETURNITEM_HIST MODIFY (return_itemid NOT NULL);
ALTER TABLE RULERETURNITEM_HIST MODIFY (ruleid NOT NULL);
ALTER TABLE RULERETURNITEM_HIST MODIFY (rule_verno NOT NULL);
ALTER TABLE RULE_DEPLOY MODIFY (deploy_datetime NOT NULL);
ALTER TABLE RULE_DEPLOY MODIFY (ruleid NOT NULL);
ALTER TABLE RULE_HIST MODIFY (ruleid NOT NULL);
ALTER TABLE RULE_HIST MODIFY (rule_verno NOT NULL);
ALTER TABLE RULE_HIST MODIFY (ifid NOT NULL);
ALTER TABLE RULE_LOG MODIFY (log_no NOT NULL);
ALTER TABLE RULE_PROGRESS_HISTORY MODIFY (ruleid NOT NULL);
ALTER TABLE RULE_PROGRESS_HISTORY MODIFY (history_no NOT NULL);
ALTER TABLE RULE_PROGRESS_HISTORY MODIFY (rule_verno NOT NULL);
ALTER TABLE RULE_PROGRESS_HISTORY MODIFY (rule_state NOT NULL);
ALTER TABLE SORTCODE MODIFY (sortcodeid NOT NULL);
ALTER TABLE SORTCODEVALUE MODIFY (sortcodeid NOT NULL);
ALTER TABLE SORTCODEVALUE MODIFY (codeid NOT NULL);

-- 3. PRIMARY KEY / UNIQUE (54)

ALTER TABLE CLOVER_API_LOG ADD CONSTRAINT pk_clover_api_log PRIMARY KEY (log_seq, req_dttm);
ALTER TABLE CLOVER_API_PAGE ADD CONSTRAINT pk_clover_app_page PRIMARY KEY (api_url);
ALTER TABLE CLOVER_APP_LOG ADD CONSTRAINT pk_clover_app_log PRIMARY KEY (log_id);
ALTER TABLE CLOVER_AUDIT_LOG ADD CONSTRAINT pk_clover_audit_log PRIMARY KEY (log_id);
ALTER TABLE CLOVER_BATCH_NODE ADD CONSTRAINT pk_batch_node PRIMARY KEY (dummy_id);
ALTER TABLE CLOVER_CODE ADD CONSTRAINT pk_clover_code PRIMARY KEY (code_type, code);
ALTER TABLE CLOVER_CODE_TYPE ADD CONSTRAINT pk_clover_code_type PRIMARY KEY (code_type);
ALTER TABLE CLOVER_JOB_CONFIG ADD CONSTRAINT pk_clover_job_config PRIMARY KEY (job_id);
ALTER TABLE CLOVER_JOB_LOG ADD CONSTRAINT pk_clover_job_log PRIMARY KEY (log_id);
ALTER TABLE CLOVER_MSG_MNG ADD CONSTRAINT pk_clover_msg_mng PRIMARY KEY (msg_id);
ALTER TABLE CLOVER_NAV ADD CONSTRAINT pk_clover_nav PRIMARY KEY (nav_id);
ALTER TABLE CLOVER_NAV_ITEM ADD CONSTRAINT pk_clover_nav_item PRIMARY KEY (item_id);
ALTER TABLE CLOVER_PAGE ADD CONSTRAINT pk_clover_page PRIMARY KEY (page_id);
ALTER TABLE CLOVER_PAGE_SECTION ADD CONSTRAINT pk_clover_page_section PRIMARY KEY (section_id);
ALTER TABLE CLOVER_PRIV ADD CONSTRAINT pk_clover_priv PRIMARY KEY (priv_id);
ALTER TABLE CLOVER_ROLE ADD CONSTRAINT pk_clover_role PRIMARY KEY (role_id);
ALTER TABLE CLOVER_ROLE_PAGE ADD CONSTRAINT pk_clover_role_page PRIMARY KEY (role_id, page_id, priv_id);
ALTER TABLE CLOVER_ROLE_USER ADD CONSTRAINT pk_clover_role_user PRIMARY KEY (role_id, user_id);
ALTER TABLE CLOVER_SYSTEM_NODE ADD CONSTRAINT pk_clover_system_node PRIMARY KEY (node_id);
ALTER TABLE CLOVER_TEAM ADD CONSTRAINT pk_clover_team PRIMARY KEY (team_id);
ALTER TABLE CLOVER_USER ADD CONSTRAINT pk_clover_user PRIMARY KEY (user_id);
ALTER TABLE CLOVER_USER_AUTH ADD CONSTRAINT pk_clover_user_auth PRIMARY KEY (auth_id);
ALTER TABLE CLOVER_USER_BLOCKED_IP ADD CONSTRAINT pk_clover_user_blocked_ip PRIMARY KEY (ip);
ALTER TABLE CLOVER_USER_LGON_FAIL ADD CONSTRAINT pk_clover_user_lgon_fail PRIMARY KEY (fail_id);
ALTER TABLE CLOVER_USER_PRIV ADD CONSTRAINT pk_clover_user_priv PRIMARY KEY (user_id, priv_id);
ALTER TABLE CLOVER_USER_PW_FAIL ADD CONSTRAINT pk_clover_user_pw_fail PRIMARY KEY (fail_id);
ALTER TABLE GRID_COLUMN ADD CONSTRAINT xpk_grid_column PRIMARY KEY (filter_id, column_id);
ALTER TABLE GRID_FILTER ADD CONSTRAINT xpk_grid_filter PRIMARY KEY (filter_id);
ALTER TABLE IF_EMAIL_TRANSCEIVE_INFO ADD CONSTRAINT xpk_email_trans_info PRIMARY KEY (email_transceive_type_cd, email_tracsceive_datetime, emp_id);
ALTER TABLE INTERFACEINFO ADD CONSTRAINT xpk_interfaceinfo PRIMARY KEY (ifid);
ALTER TABLE INTERFACEMAP ADD CONSTRAINT xpk_interfacemap PRIMARY KEY (ifid, field_eng_nm);
ALTER TABLE LOCKS ADD CONSTRAINT xpk_locks PRIMARY KEY (lockcode, lockkey);
ALTER TABLE PDS ADD CONSTRAINT pk_pds PRIMARY KEY (pds_id);
ALTER TABLE PDS_FILE ADD CONSTRAINT pk_pds_file PRIMARY KEY (file_id);
ALTER TABLE RULE ADD CONSTRAINT xpk_rule PRIMARY KEY (ruleid);
ALTER TABLE RULECONDITION ADD CONSTRAINT xpk_rulecondition PRIMARY KEY (ruleid, ruleconditionno);
ALTER TABLE RULECONDITIONRETURNITEM ADD CONSTRAINT xpk_ruleexprreturnitem PRIMARY KEY (ruleid, ruleconditionno, return_itemid);
ALTER TABLE RULECONDITIONRETURNITEM_HIST ADD CONSTRAINT xpk_ruleexprreturnitem_hist PRIMARY KEY (ruleid, rule_verno, ruleconditionno, return_itemid);
ALTER TABLE RULECONDITIONRETURN_POSTOBJECT ADD CONSTRAINT xpk_rulecondtionr_pobject PRIMARY KEY (ruleid, ruleconditionno, return_itemid, postfixobjectno);
ALTER TABLE RULECONDITIONRETURN_POSTOB_HI ADD CONSTRAINT xpk_rulecondtionr_pobject_hi PRIMARY KEY (ruleid, rule_verno, ruleconditionno, return_itemid, postfixobjectno);
ALTER TABLE RULECONDITION_HIST ADD CONSTRAINT xpk_rulecondition_hist PRIMARY KEY (ruleid, rule_verno, ruleconditionno);
ALTER TABLE RULECONDITION_POSTFIXOBJECT ADD CONSTRAINT xpk_rulecondition_pobject PRIMARY KEY (ruleid, ruleconditionno, postfixobjectno);
ALTER TABLE RULECONDITION_POSTFIXOBJECT_HI ADD CONSTRAINT xpk_rulecondition_pobject_hi PRIMARY KEY (ruleid, rule_verno, ruleconditionno, postfixobjectno);
ALTER TABLE RULEITEM ADD CONSTRAINT xpk_ruleitem PRIMARY KEY (itemid);
ALTER TABLE RULEITEMREF ADD CONSTRAINT xpk_ruleitemref PRIMARY KEY (itemid, itemref_cd);
ALTER TABLE RULERETURNITEM ADD CONSTRAINT xpk_rulereturnitem PRIMARY KEY (ruleid, return_itemid);
ALTER TABLE RULERETURNITEM_HIST ADD CONSTRAINT xpk_ruleconreturnitem_hist PRIMARY KEY (return_itemid, ruleid, rule_verno);
ALTER TABLE RULE_DEPLOY ADD CONSTRAINT "xpk룰배포" PRIMARY KEY (deploy_datetime, ruleid);
ALTER TABLE RULE_HIST ADD CONSTRAINT xpk_rule_hist PRIMARY KEY (ruleid, rule_verno);
ALTER TABLE RULE_LOG ADD CONSTRAINT "xpk룰로그" PRIMARY KEY (log_no);
ALTER TABLE RULE_PROGRESS_HISTORY ADD CONSTRAINT "xpk룰진행상태이력" PRIMARY KEY (ruleid, history_no);
ALTER TABLE SORTCODE ADD CONSTRAINT xpk_sortcode PRIMARY KEY (sortcodeid);
ALTER TABLE SORTCODEVALUE ADD CONSTRAINT xpk_sortcodevalue PRIMARY KEY (sortcodeid, codeid);
ALTER TABLE INTERFACEMAP ADD CONSTRAINT xak1_interfacemap UNIQUE (field_eng_nm);

-- 4. INDEXES (1)

CREATE UNIQUE INDEX XPK_RULERETURNITEM_HIST ON RULERETURNITEM_HIST (ruleid,return_itemid,rule_verno);

-- 5. SEQUENCES (12)

CREATE SEQUENCE ACCOUNT_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE AUTH_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE CLOVERFRAMEWORK_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE CLOVER_PDS_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE COMMONRTRNEGATIVE_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE COMMON_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE FILE_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE GRID_FILTER_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE INTERFACEINFO_IFID_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE LOG_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE RULE_MAIN_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;
CREATE SEQUENCE RULE_SUB_SEQ INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;

COMMIT;
EXIT
