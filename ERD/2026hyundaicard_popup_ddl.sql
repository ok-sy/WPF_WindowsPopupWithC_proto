-- DROP SCHEMA zero_rule;

CREATE SCHEMA zero_rule AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA zero_rule IS 'standard public schema';

-- DROP SEQUENCE zero_rule.account_seq;

CREATE SEQUENCE zero_rule.account_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.auth_seq;

CREATE SEQUENCE zero_rule.auth_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.clover_pds_seq;

CREATE SEQUENCE zero_rule.clover_pds_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE zero_rule.cloverframework_seq;

CREATE SEQUENCE zero_rule.cloverframework_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.common_seq;

CREATE SEQUENCE zero_rule.common_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.commonrtrnegative_seq;

CREATE SEQUENCE zero_rule.commonrtrnegative_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 999999999
	START 1
	CACHE 20
	CYCLE;
-- DROP SEQUENCE zero_rule.file_seq;

CREATE SEQUENCE zero_rule.file_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.grid_filter_seq;

CREATE SEQUENCE zero_rule.grid_filter_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE zero_rule.interfaceinfo_ifid_seq;

CREATE SEQUENCE zero_rule.interfaceinfo_ifid_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 99999999
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.log_seq;

CREATE SEQUENCE zero_rule.log_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 20
	CYCLE;
-- DROP SEQUENCE zero_rule.rule_main_seq;

CREATE SEQUENCE zero_rule.rule_main_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 99999999
	START 1
	CACHE 20
	NO CYCLE;
-- DROP SEQUENCE zero_rule.rule_sub_seq;

CREATE SEQUENCE zero_rule.rule_sub_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 999999999
	START 1
	CACHE 20
	NO CYCLE;-- zero_rule.clover_api_log definition

-- Drop table

-- DROP TABLE zero_rule.clover_api_log;

CREATE TABLE zero_rule.clover_api_log (
	log_seq numeric(19) NOT NULL,
	req_dttm timestamp NOT NULL,
	api_url varchar(100) NULL,
	st_tm varchar(20) NULL,
	ed_tm varchar(20) NULL,
	proc_tm numeric(20) NULL,
	user_id numeric(19) NULL,
	CONSTRAINT pk_clover_api_log PRIMARY KEY (log_seq, req_dttm)
);


-- zero_rule.clover_api_page definition

-- Drop table

-- DROP TABLE zero_rule.clover_api_page;

CREATE TABLE zero_rule.clover_api_page (
	api_url varchar(100) NOT NULL,
	page_id numeric(19) NULL,
	api_url_nm varchar(1000) NULL,
	priv_id varchar(64) NULL,
	CONSTRAINT pk_clover_app_page PRIMARY KEY (api_url)
);


-- zero_rule.clover_app_log definition

-- Drop table

-- DROP TABLE zero_rule.clover_app_log;

CREATE TABLE zero_rule.clover_app_log (
	log_id numeric(19) NOT NULL,
	log_level varchar(1) NOT NULL,
	title varchar(1000) NOT NULL,
	msg varchar(4000) NULL,
	operator_name varchar(64) NULL,
	user_name varchar(64) NULL,
	log_tag varchar(20) NULL,
	node_id varchar(64) NOT NULL,
	host_ip varchar(45) NOT NULL,
	client_ip varchar(45) NULL,
	browser_name varchar(32) NULL,
	created_at timestamp NOT NULL,
	CONSTRAINT pk_clover_app_log PRIMARY KEY (log_id)
);


-- zero_rule.clover_audit_log definition

-- Drop table

-- DROP TABLE zero_rule.clover_audit_log;

CREATE TABLE zero_rule.clover_audit_log (
	log_id numeric(19) NOT NULL,
	log_level varchar(1) NOT NULL,
	log_kind varchar(20) NOT NULL,
	title varchar(1000) NOT NULL,
	msg varchar(4000) NULL,
	operator_name varchar(64) NULL,
	job_id varchar(64) NULL,
	page_id varchar(64) NULL,
	log_tag varchar(20) NULL,
	node_id varchar(64) NOT NULL,
	host_ip varchar(45) NOT NULL,
	client_ip varchar(45) NULL,
	browser_name varchar(32) NULL,
	created_at timestamp NOT NULL,
	CONSTRAINT pk_clover_audit_log PRIMARY KEY (log_id)
);


-- zero_rule.clover_batch_node definition

-- Drop table

-- DROP TABLE zero_rule.clover_batch_node;

CREATE TABLE zero_rule.clover_batch_node (
	dummy_id numeric(1) NOT NULL,
	node_id varchar(64) NULL,
	fst_updt_dttm timestamp NOT NULL,
	last_updt_dttm timestamp NOT NULL,
	CONSTRAINT pk_batch_node PRIMARY KEY (dummy_id)
);


-- zero_rule.clover_code definition

-- Drop table

-- DROP TABLE zero_rule.clover_code;

CREATE TABLE zero_rule.clover_code (
	code_type varchar(40) NOT NULL,
	dtl_expl varchar(200) NULL,
	regr_id varchar(50) NULL,
	chgr_id varchar(50) NULL,
	code varchar(20) NOT NULL,
	code_nm varchar(60) NOT NULL,
	chng_dttm timestamp NOT NULL,
	reg_dttm timestamp NOT NULL,
	CONSTRAINT pk_clover_code PRIMARY KEY (code_type, code)
);


-- zero_rule.clover_code_type definition

-- Drop table

-- DROP TABLE zero_rule.clover_code_type;

CREATE TABLE zero_rule.clover_code_type (
	code_type varchar(40) NOT NULL,
	dtl_expl varchar(200) NULL,
	regr_id varchar(50) NULL,
	chgr_id varchar(50) NULL,
	chng_dttm timestamp NOT NULL,
	code_type_nm varchar(60) NOT NULL,
	reg_dttm timestamp NOT NULL,
	CONSTRAINT pk_clover_code_type PRIMARY KEY (code_type)
);


-- zero_rule.clover_job_config definition

-- Drop table

-- DROP TABLE zero_rule.clover_job_config;

CREATE TABLE zero_rule.clover_job_config (
	job_id varchar(64) NOT NULL,
	job_status varchar(20) NOT NULL,
	node_id varchar(64) NULL,
	job_started_at timestamp NULL,
	job_finished_at timestamp NULL,
	error_msg varchar(100) NULL,
	changed_at timestamp NOT NULL,
	created_at timestamp NOT NULL,
	disabled_yn varchar(1) NOT NULL,
	CONSTRAINT pk_clover_job_config PRIMARY KEY (job_id)
);


-- zero_rule.clover_job_log definition

-- Drop table

-- DROP TABLE zero_rule.clover_job_log;

CREATE TABLE zero_rule.clover_job_log (
	log_id numeric(19) NOT NULL,
	log_level varchar(1) NOT NULL,
	job_id varchar(64) NOT NULL,
	msg varchar(4000) NOT NULL,
	log_tag varchar(20) NULL,
	node_id varchar(64) NOT NULL,
	created_at timestamp NOT NULL,
	CONSTRAINT pk_clover_job_log PRIMARY KEY (log_id)
);


-- zero_rule.clover_msg_mng definition

-- Drop table

-- DROP TABLE zero_rule.clover_msg_mng;

CREATE TABLE zero_rule.clover_msg_mng (
	msg_id varchar(10) NOT NULL,
	msg_clsf varchar(2) NULL,
	tsk_clsf_cd varchar(3) NULL,
	team_id numeric(10) NULL,
	occr_clsf_cd varchar(2) NULL,
	msg_prnt_cd varchar(2) NULL,
	msg_cn varchar(1000) NULL,
	use_yn varchar(1) NULL,
	reg_dttm date NULL,
	regr_id varchar(50) NULL,
	chng_dttm date NULL,
	chgr_id varchar(50) NULL,
	CONSTRAINT pk_clover_msg_mng PRIMARY KEY (msg_id)
);


-- zero_rule.clover_nav definition

-- Drop table

-- DROP TABLE zero_rule.clover_nav;

CREATE TABLE zero_rule.clover_nav (
	nav_id numeric(19) NOT NULL,
	nav_nm varchar(30) NOT NULL,
	expl varchar(100) NULL,
	CONSTRAINT pk_clover_nav PRIMARY KEY (nav_id)
);


-- zero_rule.clover_nav_item definition

-- Drop table

-- DROP TABLE zero_rule.clover_nav_item;

CREATE TABLE zero_rule.clover_nav_item (
	item_id numeric(19) NOT NULL,
	page_id numeric(19) NOT NULL,
	section_id numeric(19) NULL,
	sort_no numeric(19) NOT NULL,
	nav_id numeric(19) NOT NULL,
	CONSTRAINT pk_clover_nav_item PRIMARY KEY (item_id)
);


-- zero_rule.clover_page definition

-- Drop table

-- DROP TABLE zero_rule.clover_page;

CREATE TABLE zero_rule.clover_page (
	page_id numeric(19) NOT NULL,
	page_key varchar(10) NULL,
	page_nm varchar(50) NOT NULL,
	url varchar(100) NOT NULL,
	icon varchar(20) NULL,
	dtl_expl varchar(200) NULL,
	tsk_clsf_cd varchar(2) NULL,
	scre_tpcd varchar(1) NULL,
	up_page_id numeric(19) NULL,
	CONSTRAINT pk_clover_page PRIMARY KEY (page_id)
);


-- zero_rule.clover_page_section definition

-- Drop table

-- DROP TABLE zero_rule.clover_page_section;

CREATE TABLE zero_rule.clover_page_section (
	section_id numeric(19) NOT NULL,
	icon varchar(20) NULL,
	section_nm varchar(30) NOT NULL,
	up_section_id numeric(19) NULL,
	section_sort_no numeric(19) NULL,
	CONSTRAINT pk_clover_page_section PRIMARY KEY (section_id)
);


-- zero_rule.clover_priv definition

-- Drop table

-- DROP TABLE zero_rule.clover_priv;

CREATE TABLE zero_rule.clover_priv (
	priv_type varchar(2) NOT NULL,
	dtl_expl varchar(200) NULL,
	reg_dttm date NOT NULL,
	regr_id varchar(50) NULL,
	chng_dttm date NOT NULL,
	chgr_id varchar(50) NULL,
	priv_nm varchar(50) NOT NULL,
	priv_id varchar(64) NOT NULL,
	CONSTRAINT pk_clover_priv PRIMARY KEY (priv_id)
);


-- zero_rule.clover_role definition

-- Drop table

-- DROP TABLE zero_rule.clover_role;

CREATE TABLE zero_rule.clover_role (
	role_id varchar(10) NOT NULL,
	role_nm varchar(50) NOT NULL,
	dtl_expl varchar(200) NULL,
	reg_dttm date NOT NULL,
	regr_id varchar(50) NULL,
	chng_dttm date NOT NULL,
	chgr_id varchar(50) NULL,
	CONSTRAINT pk_clover_role PRIMARY KEY (role_id)
);


-- zero_rule.clover_role_page definition

-- Drop table

-- DROP TABLE zero_rule.clover_role_page;

CREATE TABLE zero_rule.clover_role_page (
	role_id varchar(10) NOT NULL, -- 롤_ID
	page_id numeric(19) NOT NULL, -- 페이지_ID
	priv_id varchar(64) NOT NULL, -- 등록일시
	reg_dttm date NOT NULL, -- 등록일시
	regr_id varchar(50) NULL, -- 등록자_ID
	chng_dttm date NOT NULL, -- 변경일시
	chgr_id varchar(50) NULL, -- 변경자_ID
	CONSTRAINT pk_clover_role_page PRIMARY KEY (role_id, page_id, priv_id)
);
COMMENT ON TABLE zero_rule.clover_role_page IS 'CLOVER 롤페이지권한';

-- Column comments

COMMENT ON COLUMN zero_rule.clover_role_page.role_id IS '롤_ID';
COMMENT ON COLUMN zero_rule.clover_role_page.page_id IS '페이지_ID';
COMMENT ON COLUMN zero_rule.clover_role_page.priv_id IS '등록일시';
COMMENT ON COLUMN zero_rule.clover_role_page.reg_dttm IS '등록일시';
COMMENT ON COLUMN zero_rule.clover_role_page.regr_id IS '등록자_ID';
COMMENT ON COLUMN zero_rule.clover_role_page.chng_dttm IS '변경일시';
COMMENT ON COLUMN zero_rule.clover_role_page.chgr_id IS '변경자_ID';


-- zero_rule.clover_role_user definition

-- Drop table

-- DROP TABLE zero_rule.clover_role_user;

CREATE TABLE zero_rule.clover_role_user (
	role_id varchar(10) NOT NULL,
	reg_dttm date NULL,
	regr_id varchar(50) NULL,
	chng_dttm date NULL,
	chgr_id varchar(50) NULL,
	user_id numeric(19) NOT NULL,
	CONSTRAINT pk_clover_role_user PRIMARY KEY (role_id, user_id)
);


-- zero_rule.clover_system_node definition

-- Drop table

-- DROP TABLE zero_rule.clover_system_node;

CREATE TABLE zero_rule.clover_system_node (
	node_id varchar(64) NOT NULL,
	health_dttm timestamp NULL,
	fst_updt_dttm timestamp NOT NULL,
	CONSTRAINT pk_clover_system_node PRIMARY KEY (node_id)
);


-- zero_rule.clover_team definition

-- Drop table

-- DROP TABLE zero_rule.clover_team;

CREATE TABLE zero_rule.clover_team (
	team_id numeric(10) NOT NULL,
	team_nm varchar(15) NULL,
	team_expl varchar(255) NULL,
	psnl_stup_acce_yn varchar(1) NULL,
	team_cmmn_stup_cn bytea NULL,
	team_stat numeric(10) NULL,
	team_tsk_clsf numeric(1) NULL,
	reg_dttm date NULL,
	regr_id varchar(50) NULL,
	chng_dttm date NULL,
	chgr_id varchar(50) NULL,
	CONSTRAINT pk_clover_team PRIMARY KEY (team_id)
);


-- zero_rule.clover_user definition

-- Drop table

-- DROP TABLE zero_rule.clover_user;

CREATE TABLE zero_rule.clover_user (
	user_id numeric(19) NOT NULL,
	lgon_id varchar(50) NULL,
	pswd varchar(120) NULL,
	user_nm varchar(30) NULL,
	bryy_mndy varchar(6) NULL,
	user_tno varchar(12) NULL,
	user_exno varchar(17) NULL,
	cti_user_ntno varchar(20) NULL,
	prt_posb_yn varchar(1) NULL,
	dwnl_posb_yn varchar(1) NULL,
	atnt_yn varchar(1) NULL,
	team_id numeric(10) NULL,
	user_gd numeric(5) NULL,
	user_state varchar(20) NULL,
	lgon_fail_cnt numeric(2) NULL,
	pswd_init_yn varchar(1) NULL,
	last_pswd_chng_dttm date NULL,
	last_lgon_dttm timestamp NULL,
	memo varchar(255) NULL,
	reg_dttm timestamp NULL,
	regr_id varchar(50) NULL,
	chng_dttm timestamp NULL,
	chgr_id varchar(50) NULL,
	role_id numeric(19) NULL,
	nav_id numeric(19) NULL,
	CONSTRAINT pk_clover_user PRIMARY KEY (user_id)
);


-- zero_rule.clover_user_auth definition

-- Drop table

-- DROP TABLE zero_rule.clover_user_auth;

CREATE TABLE zero_rule.clover_user_auth (
	auth_id numeric(19) NOT NULL,
	auth_token varchar(512) NOT NULL,
	reg_dttm timestamp NOT NULL,
	chng_dttm timestamp NOT NULL,
	expiry_dttm timestamp NOT NULL,
	user_id numeric(19) NOT NULL,
	CONSTRAINT pk_clover_user_auth PRIMARY KEY (auth_id)
);


-- zero_rule.clover_user_blocked_ip definition

-- Drop table

-- DROP TABLE zero_rule.clover_user_blocked_ip;

CREATE TABLE zero_rule.clover_user_blocked_ip (
	ip varchar(45) NOT NULL,
	expiry_dttm timestamp NOT NULL,
	reg_dttm timestamp NOT NULL,
	CONSTRAINT pk_clover_user_blocked_ip PRIMARY KEY (ip)
);


-- zero_rule.clover_user_lgon_fail definition

-- Drop table

-- DROP TABLE zero_rule.clover_user_lgon_fail;

CREATE TABLE zero_rule.clover_user_lgon_fail (
	fail_id numeric(19) NOT NULL,
	ip varchar(45) NOT NULL,
	lgon_id varchar(50) NOT NULL,
	reason varchar(20) NOT NULL,
	reg_dttm timestamp NOT NULL,
	CONSTRAINT pk_clover_user_lgon_fail PRIMARY KEY (fail_id)
);


-- zero_rule.clover_user_priv definition

-- Drop table

-- DROP TABLE zero_rule.clover_user_priv;

CREATE TABLE zero_rule.clover_user_priv (
	priv_id varchar(64) NOT NULL,
	user_id numeric(19) NOT NULL,
	reg_dttm date NULL,
	regr_id varchar(50) NULL,
	chng_dttm date NULL,
	chgr_id varchar(50) NULL,
	CONSTRAINT pk_clover_user_priv PRIMARY KEY (user_id, priv_id)
);


-- zero_rule.clover_user_pw_fail definition

-- Drop table

-- DROP TABLE zero_rule.clover_user_pw_fail;

CREATE TABLE zero_rule.clover_user_pw_fail (
	fail_id numeric(19) NOT NULL,
	ip varchar(45) NOT NULL,
	reg_dttm timestamp NOT NULL,
	user_id numeric(19) NOT NULL,
	CONSTRAINT pk_clover_user_pw_fail PRIMARY KEY (fail_id)
);


-- zero_rule.grid_column definition

-- Drop table

-- DROP TABLE zero_rule.grid_column;

CREATE TABLE zero_rule.grid_column (
	filter_id numeric(19) NOT NULL, -- 그리드 필터 ID
	column_id varchar(300) NOT NULL, -- 컬럼ID
	visiable_yn varchar(1) NULL, -- 컬럼 표시여부
	filtering_text varchar(300) NULL, -- 필터링 문자
	filtering_oper_code varchar(10) NULL, -- 필터링 연산자
	column_seq numeric(19) NULL, -- 컬럼순번
	column_type_code varchar(10) NULL, -- 컬럼타입코드
	sorting_info varchar(20) NULL, -- 데이터 정렬 방식
	CONSTRAINT xpk_grid_column PRIMARY KEY (filter_id, column_id)
);
COMMENT ON TABLE zero_rule.grid_column IS '그리드컬럼정보';

-- Column comments

COMMENT ON COLUMN zero_rule.grid_column.filter_id IS '그리드 필터 ID';
COMMENT ON COLUMN zero_rule.grid_column.column_id IS '컬럼ID';
COMMENT ON COLUMN zero_rule.grid_column.visiable_yn IS '컬럼 표시여부';
COMMENT ON COLUMN zero_rule.grid_column.filtering_text IS '필터링 문자';
COMMENT ON COLUMN zero_rule.grid_column.filtering_oper_code IS '필터링 연산자';
COMMENT ON COLUMN zero_rule.grid_column.column_seq IS '컬럼순번';
COMMENT ON COLUMN zero_rule.grid_column.column_type_code IS '컬럼타입코드';
COMMENT ON COLUMN zero_rule.grid_column.sorting_info IS '데이터 정렬 방식';


-- zero_rule.grid_filter definition

-- Drop table

-- DROP TABLE zero_rule.grid_filter;

CREATE TABLE zero_rule.grid_filter (
	filter_id numeric(19) NOT NULL, -- 그리드 필터 ID
	filter_nm varchar(50) NULL, -- 필터명
	user_id numeric(19) NULL, -- 사용자 ID
	page_code varchar(50) NULL, -- 화면 코드
	filter_mode_yn varchar(1) NULL, -- 텍스트필터모드여부
	default_yn varchar(1) NULL, -- 기본필터 설정여부
	CONSTRAINT xpk_grid_filter PRIMARY KEY (filter_id)
);
COMMENT ON TABLE zero_rule.grid_filter IS '그리드필터정보';

-- Column comments

COMMENT ON COLUMN zero_rule.grid_filter.filter_id IS '그리드 필터 ID';
COMMENT ON COLUMN zero_rule.grid_filter.filter_nm IS '필터명';
COMMENT ON COLUMN zero_rule.grid_filter.user_id IS '사용자 ID';
COMMENT ON COLUMN zero_rule.grid_filter.page_code IS '화면 코드';
COMMENT ON COLUMN zero_rule.grid_filter.filter_mode_yn IS '텍스트필터모드여부';
COMMENT ON COLUMN zero_rule.grid_filter.default_yn IS '기본필터 설정여부';


-- zero_rule.if_email_transceive_info definition

-- Drop table

-- DROP TABLE zero_rule.if_email_transceive_info;

CREATE TABLE zero_rule.if_email_transceive_info (
	email_transceive_type_cd varchar(1) NOT NULL, -- 이메일송수신타입
	email_tracsceive_datetime varchar(14) NOT NULL, -- 이메일송수신시간
	emp_id varchar(20) NOT NULL, -- 사번
	opponent_email_domain_addr varchar(200) NULL, -- 상대방메일도메인주소
	file_attach_yn varchar(1) NULL, -- 첨부파일여부
	file_attach_size numeric(10) NULL, -- 첨부파일용량
	email_title varchar(2000) NULL, -- 이메일제목
	department_cd varchar(10) NULL, -- 부서코드
	reg_datetime varchar(14) NULL, -- 등록시간
	inspection_yn varchar(1) NULL, -- 점검대상여부
	call_rule_result varchar(500) NULL, -- 룰호출결과
	CONSTRAINT xpk_email_trans_info PRIMARY KEY (email_transceive_type_cd, email_tracsceive_datetime, emp_id)
);
COMMENT ON TABLE zero_rule.if_email_transceive_info IS '이메일송수신정보';

-- Column comments

COMMENT ON COLUMN zero_rule.if_email_transceive_info.email_transceive_type_cd IS '이메일송수신타입';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.email_tracsceive_datetime IS '이메일송수신시간';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.emp_id IS '사번';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.opponent_email_domain_addr IS '상대방메일도메인주소';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.file_attach_yn IS '첨부파일여부';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.file_attach_size IS '첨부파일용량';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.email_title IS '이메일제목';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.department_cd IS '부서코드';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.reg_datetime IS '등록시간';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.inspection_yn IS '점검대상여부';
COMMENT ON COLUMN zero_rule.if_email_transceive_info.call_rule_result IS '룰호출결과';


-- zero_rule.interfaceinfo definition

-- Drop table

-- DROP TABLE zero_rule.interfaceinfo;

CREATE TABLE zero_rule.interfaceinfo (
	ifid varchar(10) NOT NULL, -- 인터페이스ID
	if_nm varchar(100) NULL, -- 인터페이스명
	if_desc varchar(2000) NULL, -- 인터페이스설명
	if_process_type_cd varchar(1) NULL, -- 인터페이스처리유형
	if_connection_type_cd varchar(2) NULL, -- 연계방식
	rule_use_yn varchar(1) NULL, -- 룰사용여부
	doc_length numeric(10) NULL, -- 전문길이수
	characterset varchar(50) NULL, -- 캐릭터셋
	eaiid varchar(30) NULL, -- EAIID
	del_yn varchar(1) NULL, -- 삭제여부
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록일시
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	CONSTRAINT xpk_interfaceinfo PRIMARY KEY (ifid)
);
COMMENT ON TABLE zero_rule.interfaceinfo IS '인터페이스정보';

-- Column comments

COMMENT ON COLUMN zero_rule.interfaceinfo.ifid IS '인터페이스ID';
COMMENT ON COLUMN zero_rule.interfaceinfo.if_nm IS '인터페이스명';
COMMENT ON COLUMN zero_rule.interfaceinfo.if_desc IS '인터페이스설명';
COMMENT ON COLUMN zero_rule.interfaceinfo.if_process_type_cd IS '인터페이스처리유형';
COMMENT ON COLUMN zero_rule.interfaceinfo.if_connection_type_cd IS '연계방식';
COMMENT ON COLUMN zero_rule.interfaceinfo.rule_use_yn IS '룰사용여부';
COMMENT ON COLUMN zero_rule.interfaceinfo.doc_length IS '전문길이수';
COMMENT ON COLUMN zero_rule.interfaceinfo.characterset IS '캐릭터셋';
COMMENT ON COLUMN zero_rule.interfaceinfo.eaiid IS 'EAIID';
COMMENT ON COLUMN zero_rule.interfaceinfo.del_yn IS '삭제여부';
COMMENT ON COLUMN zero_rule.interfaceinfo.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.interfaceinfo.firstreg_datetime IS '최초등록일시';
COMMENT ON COLUMN zero_rule.interfaceinfo.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.interfaceinfo.update_datetime IS '변경일시';


-- zero_rule.interfacemap definition

-- Drop table

-- DROP TABLE zero_rule.interfacemap;

CREATE TABLE zero_rule.interfacemap (
	ifid varchar(10) NOT NULL, -- 인터페이스ID
	field_eng_nm varchar(1000) NOT NULL, -- 필드영문명
	field_kor_nm varchar(1000) NULL, -- 필드한글명
	field_order numeric(5) NULL, -- 순번
	field_length numeric(5) NULL, -- 길이
	field_start_no numeric(5) NULL, -- 시작위치번호
	field_code_type varchar(1) NULL, -- 코드ID
	datatype_cd varchar(1) NULL, -- 데이타타입코드
	field_scale numeric(2) NULL, -- 소수점자리수
	trim_yn varchar(1) NULL, -- TRIM여부
	characterset varchar(50) NULL, -- 캐릭터셋
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록일시
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	CONSTRAINT xak1_interfacemap UNIQUE (field_eng_nm),
	CONSTRAINT xpk_interfacemap PRIMARY KEY (ifid, field_eng_nm)
);
COMMENT ON TABLE zero_rule.interfacemap IS '인터페이스맵';

-- Column comments

COMMENT ON COLUMN zero_rule.interfacemap.ifid IS '인터페이스ID';
COMMENT ON COLUMN zero_rule.interfacemap.field_eng_nm IS '필드영문명';
COMMENT ON COLUMN zero_rule.interfacemap.field_kor_nm IS '필드한글명';
COMMENT ON COLUMN zero_rule.interfacemap.field_order IS '순번';
COMMENT ON COLUMN zero_rule.interfacemap.field_length IS '길이';
COMMENT ON COLUMN zero_rule.interfacemap.field_start_no IS '시작위치번호';
COMMENT ON COLUMN zero_rule.interfacemap.field_code_type IS '코드ID';
COMMENT ON COLUMN zero_rule.interfacemap.datatype_cd IS '데이타타입코드';
COMMENT ON COLUMN zero_rule.interfacemap.field_scale IS '소수점자리수';
COMMENT ON COLUMN zero_rule.interfacemap.trim_yn IS 'TRIM여부';
COMMENT ON COLUMN zero_rule.interfacemap.characterset IS '캐릭터셋';
COMMENT ON COLUMN zero_rule.interfacemap.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.interfacemap.firstreg_datetime IS '최초등록일시';
COMMENT ON COLUMN zero_rule.interfacemap.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.interfacemap.update_datetime IS '변경일시';


-- zero_rule.locks definition

-- Drop table

-- DROP TABLE zero_rule.locks;

CREATE TABLE zero_rule.locks (
	lockcode varchar(3) NOT NULL, -- 잠금객체ID
	lockkey varchar(100) NOT NULL, -- 저장정보
	lockdatetime date NULL, -- 잠금설정일시
	userid numeric(19) NULL, -- 사용자ID
	locktypecode varchar(4) NULL, -- 잠금경로
	locknote varchar(255) NULL, -- 잠금설명내용
	CONSTRAINT xpk_locks PRIMARY KEY (lockcode, lockkey)
);
COMMENT ON TABLE zero_rule.locks IS '객체잠금';

-- Column comments

COMMENT ON COLUMN zero_rule.locks.lockcode IS '잠금객체ID';
COMMENT ON COLUMN zero_rule.locks.lockkey IS '저장정보';
COMMENT ON COLUMN zero_rule.locks.lockdatetime IS '잠금설정일시';
COMMENT ON COLUMN zero_rule.locks.userid IS '사용자ID';
COMMENT ON COLUMN zero_rule.locks.locktypecode IS '잠금경로';
COMMENT ON COLUMN zero_rule.locks.locknote IS '잠금설명내용';


-- zero_rule.pds definition

-- Drop table

-- DROP TABLE zero_rule.pds;

CREATE TABLE zero_rule.pds (
	pds_id numeric(19) NOT NULL,
	create_user_id varchar(20) NULL,
	created_at timestamp NOT NULL,
	changed_at timestamp NOT NULL,
	"location" varchar(50) NULL,
	title varchar(100) NOT NULL,
	title_no_space varchar(100) NOT NULL,
	substance text NULL,
	attach_file_count numeric(5) NULL,
	CONSTRAINT pk_pds PRIMARY KEY (pds_id)
);


-- zero_rule.pds_file definition

-- Drop table

-- DROP TABLE zero_rule.pds_file;

CREATE TABLE zero_rule.pds_file (
	file_id varchar(64) NOT NULL,
	file_type varchar(20) NOT NULL,
	file_name varchar(100) NULL,
	pds_id numeric(19) NOT NULL,
	sort_number numeric(19) NOT NULL,
	file_size numeric(10) NOT NULL,
	width numeric(5) NOT NULL,
	height numeric(5) NOT NULL,
	duration numeric(5) NOT NULL,
	content_type varchar(40) NULL,
	created_at timestamp NOT NULL,
	changed_at timestamp NOT NULL,
	del_yn varchar(1) NOT NULL,
	CONSTRAINT pk_pds_file PRIMARY KEY (file_id)
);


-- zero_rule."rule" definition

-- Drop table

-- DROP TABLE zero_rule."rule";

CREATE TABLE zero_rule."rule" (
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_nm varchar(500) NULL, -- 룰명
	rulealias_nm varchar(1000) NULL, -- 룰별칭명
	rule_desc varchar(4000) NULL, -- 룰설명
	rulereturn_type varchar(1) NULL, -- 룰반환타입코드
	rulesort_cd varchar(1) NULL, -- 룰종류코드
	ruleusage_cd varchar(1) NULL, -- 룰용도구분코드
	allreturn_yn varchar(1) NULL, -- 만족하는모든리턴항목반환여부
	use_yn varchar(1) NULL, -- 사용여부
	rule_verno numeric(5, 2) NULL, -- 룰버전번호
	activate_yn varchar(1) NULL, -- 룰활성화여부
	activate_datetime date NULL, -- 활성화여부변경일시
	rule_state varchar(1) NULL, -- 룰상태
	deploy_datetime date NULL, -- 룰배포일시
	deploy_userid numeric(19) NULL, -- 룰배포담당자
	ifid varchar(10) NOT NULL, -- 인터페이스ID
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록일시
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	rule_apply_yn varchar(1) NULL, -- 룰적용여부
	deploy_wait_state_appy_yn varchar(1) NULL, -- 배포대기상태적용여부
	CONSTRAINT xpk_rule PRIMARY KEY (ruleid)
);
COMMENT ON TABLE zero_rule."rule" IS '룰';

-- Column comments

COMMENT ON COLUMN zero_rule."rule".ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule."rule".rule_nm IS '룰명';
COMMENT ON COLUMN zero_rule."rule".rulealias_nm IS '룰별칭명';
COMMENT ON COLUMN zero_rule."rule".rule_desc IS '룰설명';
COMMENT ON COLUMN zero_rule."rule".rulereturn_type IS '룰반환타입코드';
COMMENT ON COLUMN zero_rule."rule".rulesort_cd IS '룰종류코드';
COMMENT ON COLUMN zero_rule."rule".ruleusage_cd IS '룰용도구분코드';
COMMENT ON COLUMN zero_rule."rule".allreturn_yn IS '만족하는모든리턴항목반환여부';
COMMENT ON COLUMN zero_rule."rule".use_yn IS '사용여부';
COMMENT ON COLUMN zero_rule."rule".rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule."rule".activate_yn IS '룰활성화여부';
COMMENT ON COLUMN zero_rule."rule".activate_datetime IS '활성화여부변경일시';
COMMENT ON COLUMN zero_rule."rule".rule_state IS '룰상태';
COMMENT ON COLUMN zero_rule."rule".deploy_datetime IS '룰배포일시';
COMMENT ON COLUMN zero_rule."rule".deploy_userid IS '룰배포담당자';
COMMENT ON COLUMN zero_rule."rule".ifid IS '인터페이스ID';
COMMENT ON COLUMN zero_rule."rule".firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule."rule".firstreg_datetime IS '최초등록일시';
COMMENT ON COLUMN zero_rule."rule".update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule."rule".update_datetime IS '변경일시';
COMMENT ON COLUMN zero_rule."rule".rule_apply_yn IS '룰적용여부';
COMMENT ON COLUMN zero_rule."rule".deploy_wait_state_appy_yn IS '배포대기상태적용여부';


-- zero_rule.rule_deploy definition

-- Drop table

-- DROP TABLE zero_rule.rule_deploy;

CREATE TABLE zero_rule.rule_deploy (
	deploy_datetime varchar(14) NOT NULL, -- 룰적용일시
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_verno numeric(5, 2) NULL, -- 룰버전번호
	rule_update_yn varchar(1) NULL, -- 룰변경유무
	before_deploy_apply_yn varchar(1) NULL, -- 룰배포전적용여부
	after_deploy_apply_yn varchar(1) NULL, -- 룰배포후적용여부
	rule_update_userid numeric(19) NULL, -- 룰변경자ID
	rule_update_datetime varchar(14) NULL, -- 룰변경일시
	reg_userid numeric(19) NULL, -- 등록자사용자ID
	reg_datetime varchar(14) NULL, -- 등록일시
	CONSTRAINT xpk룰배포 PRIMARY KEY (deploy_datetime, ruleid)
);
COMMENT ON TABLE zero_rule.rule_deploy IS '룰배포';

-- Column comments

COMMENT ON COLUMN zero_rule.rule_deploy.deploy_datetime IS '룰적용일시';
COMMENT ON COLUMN zero_rule.rule_deploy.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rule_deploy.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.rule_deploy.rule_update_yn IS '룰변경유무';
COMMENT ON COLUMN zero_rule.rule_deploy.before_deploy_apply_yn IS '룰배포전적용여부';
COMMENT ON COLUMN zero_rule.rule_deploy.after_deploy_apply_yn IS '룰배포후적용여부';
COMMENT ON COLUMN zero_rule.rule_deploy.rule_update_userid IS '룰변경자ID';
COMMENT ON COLUMN zero_rule.rule_deploy.rule_update_datetime IS '룰변경일시';
COMMENT ON COLUMN zero_rule.rule_deploy.reg_userid IS '등록자사용자ID';
COMMENT ON COLUMN zero_rule.rule_deploy.reg_datetime IS '등록일시';


-- zero_rule.rule_hist definition

-- Drop table

-- DROP TABLE zero_rule.rule_hist;

CREATE TABLE zero_rule.rule_hist (
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_verno numeric(5, 2) NOT NULL, -- 룰버전번호
	rule_nm varchar(500) NULL, -- 룰명
	rulealias_nm varchar(1000) NULL, -- 룰별칭명
	rule_desc varchar(4000) NULL, -- 룰설명
	rulereturn_type varchar(1) NULL, -- 룰반환타입코드
	rulesort_cd varchar(1) NULL, -- 룰종류코드
	ruleusage_cd varchar(1) NULL, -- 룰용도구분코드
	allreturn_yn varchar(1) NULL, -- 만족하는모든리턴항목반환여부
	use_yn varchar(1) NULL, -- 사용여부
	activate_yn varchar(1) NULL, -- 룰활성화여부
	activate_datetime date NULL, -- 활성화여부변경일시
	rule_state varchar(2) NULL, -- 룰상태
	deploy_datetime date NULL, -- 룰적용일시
	deploy_userid numeric(19) NULL, -- 룰적용담당자ID
	ifid varchar(10) NOT NULL, -- 인터페이스ID
	ruleversionchangecode varchar(10) NULL, -- 룰버전변경코드
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록일시
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	modified_userid numeric(19) NULL, -- 룰 수정 ID
	modified_datetime varchar(14) NULL, -- 룰 수정 일시
	CONSTRAINT xpk_rule_hist PRIMARY KEY (ruleid, rule_verno)
);
COMMENT ON TABLE zero_rule.rule_hist IS '룰버전';

-- Column comments

COMMENT ON COLUMN zero_rule.rule_hist.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rule_hist.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.rule_hist.rule_nm IS '룰명';
COMMENT ON COLUMN zero_rule.rule_hist.rulealias_nm IS '룰별칭명';
COMMENT ON COLUMN zero_rule.rule_hist.rule_desc IS '룰설명';
COMMENT ON COLUMN zero_rule.rule_hist.rulereturn_type IS '룰반환타입코드';
COMMENT ON COLUMN zero_rule.rule_hist.rulesort_cd IS '룰종류코드';
COMMENT ON COLUMN zero_rule.rule_hist.ruleusage_cd IS '룰용도구분코드';
COMMENT ON COLUMN zero_rule.rule_hist.allreturn_yn IS '만족하는모든리턴항목반환여부';
COMMENT ON COLUMN zero_rule.rule_hist.use_yn IS '사용여부';
COMMENT ON COLUMN zero_rule.rule_hist.activate_yn IS '룰활성화여부';
COMMENT ON COLUMN zero_rule.rule_hist.activate_datetime IS '활성화여부변경일시';
COMMENT ON COLUMN zero_rule.rule_hist.rule_state IS '룰상태';
COMMENT ON COLUMN zero_rule.rule_hist.deploy_datetime IS '룰적용일시';
COMMENT ON COLUMN zero_rule.rule_hist.deploy_userid IS '룰적용담당자ID';
COMMENT ON COLUMN zero_rule.rule_hist.ifid IS '인터페이스ID';
COMMENT ON COLUMN zero_rule.rule_hist.ruleversionchangecode IS '룰버전변경코드';
COMMENT ON COLUMN zero_rule.rule_hist.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.rule_hist.firstreg_datetime IS '최초등록일시';
COMMENT ON COLUMN zero_rule.rule_hist.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.rule_hist.update_datetime IS '변경일시';
COMMENT ON COLUMN zero_rule.rule_hist.modified_userid IS '룰 수정 ID';
COMMENT ON COLUMN zero_rule.rule_hist.modified_datetime IS '룰 수정 일시';


-- zero_rule.rule_log definition

-- Drop table

-- DROP TABLE zero_rule.rule_log;

CREATE TABLE zero_rule.rule_log (
	log_no numeric(20) NOT NULL, -- 로그번호
	log_title varchar(20) NULL, -- 로그제목
	log_start_time varchar(20) NULL, -- 룰호출시작일시
	log_end_time varchar(20) NULL, -- 룰호출종료일시
	log_request varchar(4000) NULL, -- 룰호출요청DATA
	time_gap numeric(38) NULL, -- 룰호출시간차이
	log_response varchar(4000) NULL, -- 룰호출결과DATA
	rule_id varchar(10) NULL, -- 룰ID
	rulealias_nm varchar(200) NULL, -- 룰명
	rule_verno numeric(5, 2) NULL, -- 룰버전
	inspection_yn varchar(1) NULL, -- 룰점검결과
	res_code varchar(4) NULL, -- 룰응답결과
	CONSTRAINT xpk룰로그 PRIMARY KEY (log_no)
);
COMMENT ON TABLE zero_rule.rule_log IS '룰로그';

-- Column comments

COMMENT ON COLUMN zero_rule.rule_log.log_no IS '로그번호';
COMMENT ON COLUMN zero_rule.rule_log.log_title IS '로그제목';
COMMENT ON COLUMN zero_rule.rule_log.log_start_time IS '룰호출시작일시';
COMMENT ON COLUMN zero_rule.rule_log.log_end_time IS '룰호출종료일시';
COMMENT ON COLUMN zero_rule.rule_log.log_request IS '룰호출요청DATA';
COMMENT ON COLUMN zero_rule.rule_log.time_gap IS '룰호출시간차이';
COMMENT ON COLUMN zero_rule.rule_log.log_response IS '룰호출결과DATA';
COMMENT ON COLUMN zero_rule.rule_log.rule_id IS '룰ID';
COMMENT ON COLUMN zero_rule.rule_log.rulealias_nm IS '룰명';
COMMENT ON COLUMN zero_rule.rule_log.rule_verno IS '룰버전';
COMMENT ON COLUMN zero_rule.rule_log.inspection_yn IS '룰점검결과';
COMMENT ON COLUMN zero_rule.rule_log.res_code IS '룰응답결과';


-- zero_rule.rule_progress_history definition

-- Drop table

-- DROP TABLE zero_rule.rule_progress_history;

CREATE TABLE zero_rule.rule_progress_history (
	ruleid varchar(10) NOT NULL, -- 룰ID
	history_no numeric(5) NOT NULL, -- 이력번호
	rule_verno numeric(5, 2) NOT NULL, -- 룰버전번호
	rule_state varchar(1) NOT NULL, -- 룰상태
	current_rule_apply_yn varchar(1) NULL, -- 현재적용여부
	deploy_wait_state_apply_yn varchar(1) NULL, -- 배포대기상태적용여부
	update_userid numeric(19) NULL, -- 등록사용자ID
	update_datetime varchar(14) NULL, -- 등록일시
	CONSTRAINT xpk룰진행상태이력 PRIMARY KEY (ruleid, history_no)
);
COMMENT ON TABLE zero_rule.rule_progress_history IS '룰진행상태이력';

-- Column comments

COMMENT ON COLUMN zero_rule.rule_progress_history.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rule_progress_history.history_no IS '이력번호';
COMMENT ON COLUMN zero_rule.rule_progress_history.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.rule_progress_history.rule_state IS '룰상태';
COMMENT ON COLUMN zero_rule.rule_progress_history.current_rule_apply_yn IS '현재적용여부';
COMMENT ON COLUMN zero_rule.rule_progress_history.deploy_wait_state_apply_yn IS '배포대기상태적용여부';
COMMENT ON COLUMN zero_rule.rule_progress_history.update_userid IS '등록사용자ID';
COMMENT ON COLUMN zero_rule.rule_progress_history.update_datetime IS '등록일시';


-- zero_rule.rulecondition definition

-- Drop table

-- DROP TABLE zero_rule.rulecondition;

CREATE TABLE zero_rule.rulecondition (
	ruleid varchar(10) NOT NULL, -- 룰ID
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	condition_infix_desc varchar(4000) NULL, -- 중위식조건식내용
	condition_postfix_desc varchar(4000) NULL, -- 후위식조건식내용
	condition_desc varchar(4000) NULL, -- 조건식설명
	use_yn varchar(1) NULL, -- 사용여부
	firstreg_userid varchar(20) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록시간
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경시간
	CONSTRAINT xpk_rulecondition PRIMARY KEY (ruleid, ruleconditionno)
);
COMMENT ON TABLE zero_rule.rulecondition IS '룰조건식';

-- Column comments

COMMENT ON COLUMN zero_rule.rulecondition.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rulecondition.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.rulecondition.condition_infix_desc IS '중위식조건식내용';
COMMENT ON COLUMN zero_rule.rulecondition.condition_postfix_desc IS '후위식조건식내용';
COMMENT ON COLUMN zero_rule.rulecondition.condition_desc IS '조건식설명';
COMMENT ON COLUMN zero_rule.rulecondition.use_yn IS '사용여부';
COMMENT ON COLUMN zero_rule.rulecondition.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.rulecondition.firstreg_datetime IS '최초등록시간';
COMMENT ON COLUMN zero_rule.rulecondition.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.rulecondition.update_datetime IS '변경시간';


-- zero_rule.rulecondition_hist definition

-- Drop table

-- DROP TABLE zero_rule.rulecondition_hist;

CREATE TABLE zero_rule.rulecondition_hist (
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_verno numeric(5, 2) NOT NULL, -- 룰버전번호
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	condition_infix_desc varchar(4000) NULL, -- 중위식조건식내용
	condition_postfix_desc varchar(4000) NULL, -- 후위식조건식내용
	condition_desc varchar(4000) NULL, -- 조건식설명
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록시간
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경시간
	modified_userid numeric(19) NULL, -- 조건식 수정 ID
	modified_datetime varchar(14) NULL, -- 조건식 수정 일시
	CONSTRAINT xpk_rulecondition_hist PRIMARY KEY (ruleid, rule_verno, ruleconditionno)
);
COMMENT ON TABLE zero_rule.rulecondition_hist IS '룰조건식버전';

-- Column comments

COMMENT ON COLUMN zero_rule.rulecondition_hist.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rulecondition_hist.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.rulecondition_hist.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.rulecondition_hist.condition_infix_desc IS '중위식조건식내용';
COMMENT ON COLUMN zero_rule.rulecondition_hist.condition_postfix_desc IS '후위식조건식내용';
COMMENT ON COLUMN zero_rule.rulecondition_hist.condition_desc IS '조건식설명';
COMMENT ON COLUMN zero_rule.rulecondition_hist.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.rulecondition_hist.firstreg_datetime IS '최초등록시간';
COMMENT ON COLUMN zero_rule.rulecondition_hist.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.rulecondition_hist.update_datetime IS '변경시간';
COMMENT ON COLUMN zero_rule.rulecondition_hist.modified_userid IS '조건식 수정 ID';
COMMENT ON COLUMN zero_rule.rulecondition_hist.modified_datetime IS '조건식 수정 일시';


-- zero_rule.rulecondition_postfixobject definition

-- Drop table

-- DROP TABLE zero_rule.rulecondition_postfixobject;

CREATE TABLE zero_rule.rulecondition_postfixobject (
	ruleid varchar(10) NOT NULL, -- 룰ID
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	postfixobjectno numeric(5) NOT NULL, -- 후위식객체순서
	datatype_cd varchar(1) NULL, -- 데이타타입코드
	operator_yn varchar(1) NULL, -- 연산자여부
	object_data varchar(200) NULL, -- 객체데이타
	CONSTRAINT xpk_rulecondition_pobject PRIMARY KEY (ruleid, ruleconditionno, postfixobjectno)
);
COMMENT ON TABLE zero_rule.rulecondition_postfixobject IS '룰후위식조건식객체';

-- Column comments

COMMENT ON COLUMN zero_rule.rulecondition_postfixobject.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject.postfixobjectno IS '후위식객체순서';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject.datatype_cd IS '데이타타입코드';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject.operator_yn IS '연산자여부';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject.object_data IS '객체데이타';


-- zero_rule.rulecondition_postfixobject_hi definition

-- Drop table

-- DROP TABLE zero_rule.rulecondition_postfixobject_hi;

CREATE TABLE zero_rule.rulecondition_postfixobject_hi (
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_verno numeric(5, 2) NOT NULL, -- 룰버전번호
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	postfixobjectno numeric(5) NOT NULL, -- 후위식객체순서
	datatype_cd varchar(1) NULL, -- 데이타타입코드
	operator_yn varchar(1) NULL, -- 연산자여부
	object_data varchar(200) NULL, -- 객체데이타
	CONSTRAINT xpk_rulecondition_pobject_hi PRIMARY KEY (ruleid, rule_verno, ruleconditionno, postfixobjectno)
);
COMMENT ON TABLE zero_rule.rulecondition_postfixobject_hi IS '룰후위식조건식객체버전';

-- Column comments

COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.postfixobjectno IS '후위식객체순서';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.datatype_cd IS '데이타타입코드';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.operator_yn IS '연산자여부';
COMMENT ON COLUMN zero_rule.rulecondition_postfixobject_hi.object_data IS '객체데이타';


-- zero_rule.ruleconditionreturn_postob_hi definition

-- Drop table

-- DROP TABLE zero_rule.ruleconditionreturn_postob_hi;

CREATE TABLE zero_rule.ruleconditionreturn_postob_hi (
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_verno numeric(5, 2) NOT NULL, -- 룰버전번호
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	return_itemid varchar(10) NOT NULL, -- 반환항목ID
	postfixobjectno numeric NOT NULL, -- 후위식객체순서
	datatype_cd varchar(20) NULL, -- 데이타타입코드
	operation_yn varchar(1) NULL, -- 연산자여부
	object_data varchar(4000) NULL, -- 객체데이타
	CONSTRAINT xpk_rulecondtionr_pobject_hi PRIMARY KEY (ruleid, rule_verno, ruleconditionno, return_itemid, postfixobjectno)
);
COMMENT ON TABLE zero_rule.ruleconditionreturn_postob_hi IS '룰조건리턴항목후위식객체버전';

-- Column comments

COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.return_itemid IS '반환항목ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.postfixobjectno IS '후위식객체순서';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.datatype_cd IS '데이타타입코드';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.operation_yn IS '연산자여부';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postob_hi.object_data IS '객체데이타';


-- zero_rule.ruleconditionreturn_postobject definition

-- Drop table

-- DROP TABLE zero_rule.ruleconditionreturn_postobject;

CREATE TABLE zero_rule.ruleconditionreturn_postobject (
	ruleid varchar(10) NOT NULL, -- 룰ID
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	return_itemid varchar(10) NOT NULL, -- 반환항목ID
	postfixobjectno numeric(5) NOT NULL, -- 후위식객체순서
	datatype_cd varchar(20) NULL, -- 데이타타입코드
	operator_yn varchar(1) NULL, -- 연산자여부
	object_data varchar(4000) NULL, -- 객체데이타
	CONSTRAINT xpk_rulecondtionr_pobject PRIMARY KEY (ruleid, ruleconditionno, return_itemid, postfixobjectno)
);
COMMENT ON TABLE zero_rule.ruleconditionreturn_postobject IS '룰조건리턴항목후위식객체';

-- Column comments

COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.return_itemid IS '반환항목ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.postfixobjectno IS '후위식객체순서';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.datatype_cd IS '데이타타입코드';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.operator_yn IS '연산자여부';
COMMENT ON COLUMN zero_rule.ruleconditionreturn_postobject.object_data IS '객체데이타';


-- zero_rule.ruleconditionreturnitem definition

-- Drop table

-- DROP TABLE zero_rule.ruleconditionreturnitem;

CREATE TABLE zero_rule.ruleconditionreturnitem (
	ruleid varchar(10) NOT NULL, -- 룰ID
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	return_itemid varchar(10) NOT NULL, -- 반환항목ID
	returnitem_expr_desc varchar(4000) NULL, -- 반환항목표현식내용
	returnitem_postfix_desc varchar(4000) NULL, -- 반환항목후위식내용
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록시간
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	CONSTRAINT xpk_ruleexprreturnitem PRIMARY KEY (ruleid, ruleconditionno, return_itemid)
);
COMMENT ON TABLE zero_rule.ruleconditionreturnitem IS '룰조건식리턴항목값';

-- Column comments

COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.return_itemid IS '반환항목ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.returnitem_expr_desc IS '반환항목표현식내용';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.returnitem_postfix_desc IS '반환항목후위식내용';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.firstreg_datetime IS '최초등록시간';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem.update_datetime IS '변경일시';


-- zero_rule.ruleconditionreturnitem_hist definition

-- Drop table

-- DROP TABLE zero_rule.ruleconditionreturnitem_hist;

CREATE TABLE zero_rule.ruleconditionreturnitem_hist (
	ruleid varchar(10) NOT NULL, -- 룰ID
	rule_verno numeric(5, 2) NOT NULL, -- 룰버전번호
	ruleconditionno numeric(5) NOT NULL, -- 조건식번호
	return_itemid varchar(10) NOT NULL, -- 반환항목ID
	returnitem_expr_desc varchar(4000) NULL, -- 반환항목표현식내용
	returnitem_postfix_desc varchar(4000) NULL, -- 반환항목후위식내용
	firstreg_userid numeric(19) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록시간
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	modified_userid numeric(19) NULL, -- 조건식 수정 ID
	modified_datetime varchar(14) NULL, -- 조건식 수정 일시
	CONSTRAINT xpk_ruleexprreturnitem_hist PRIMARY KEY (ruleid, rule_verno, ruleconditionno, return_itemid)
);
COMMENT ON TABLE zero_rule.ruleconditionreturnitem_hist IS '룰조건식리턴항목값버전';

-- Column comments

COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.rule_verno IS '룰버전번호';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.ruleconditionno IS '조건식번호';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.return_itemid IS '반환항목ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.returnitem_expr_desc IS '반환항목표현식내용';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.returnitem_postfix_desc IS '반환항목후위식내용';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.firstreg_datetime IS '최초등록시간';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.update_datetime IS '변경일시';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.modified_userid IS '조건식 수정 ID';
COMMENT ON COLUMN zero_rule.ruleconditionreturnitem_hist.modified_datetime IS '조건식 수정 일시';


-- zero_rule.ruleitem definition

-- Drop table

-- DROP TABLE zero_rule.ruleitem;

CREATE TABLE zero_rule.ruleitem (
	itemid varchar(10) NOT NULL, -- 항목ID
	item_nm varchar(1000) NULL, -- 항목명
	itemalias_nm varchar(1000) NULL, -- 항목별칭명
	itemexplan_desc varchar(4000) NULL, -- 항목설명내용
	datatype_cd varchar(1) NULL, -- 데이타타입코드
	item_use_yn varchar(1) NULL, -- 항목사용여부
	ifid varchar(10) NULL, -- 인터페이스ID
	firstreg_userid varchar(20) NULL, -- 최초등록사용자ID
	firstreg_datetime varchar(14) NULL, -- 최초등록시간
	update_userid varchar(20) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	CONSTRAINT xpk_ruleitem PRIMARY KEY (itemid)
);
COMMENT ON TABLE zero_rule.ruleitem IS '룰항목';

-- Column comments

COMMENT ON COLUMN zero_rule.ruleitem.itemid IS '항목ID';
COMMENT ON COLUMN zero_rule.ruleitem.item_nm IS '항목명';
COMMENT ON COLUMN zero_rule.ruleitem.itemalias_nm IS '항목별칭명';
COMMENT ON COLUMN zero_rule.ruleitem.itemexplan_desc IS '항목설명내용';
COMMENT ON COLUMN zero_rule.ruleitem.datatype_cd IS '데이타타입코드';
COMMENT ON COLUMN zero_rule.ruleitem.item_use_yn IS '항목사용여부';
COMMENT ON COLUMN zero_rule.ruleitem.ifid IS '인터페이스ID';
COMMENT ON COLUMN zero_rule.ruleitem.firstreg_userid IS '최초등록사용자ID';
COMMENT ON COLUMN zero_rule.ruleitem.firstreg_datetime IS '최초등록시간';
COMMENT ON COLUMN zero_rule.ruleitem.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.ruleitem.update_datetime IS '변경일시';


-- zero_rule.ruleitemref definition

-- Drop table

-- DROP TABLE zero_rule.ruleitemref;

CREATE TABLE zero_rule.ruleitemref (
	itemid varchar(10) NOT NULL, -- 항목ID
	itemref_cd varchar(20) NOT NULL, -- 참조값코드
	itemref_nm varchar(1000) NULL, -- 참조값명
	itemrefalias_nm varchar(1000) NULL, -- 참조값별칭명
	itemrefexpr_desc varchar(4000) NULL, -- 참조값설명
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	CONSTRAINT xpk_ruleitemref PRIMARY KEY (itemid, itemref_cd)
);
COMMENT ON TABLE zero_rule.ruleitemref IS '항목참조값';

-- Column comments

COMMENT ON COLUMN zero_rule.ruleitemref.itemid IS '항목ID';
COMMENT ON COLUMN zero_rule.ruleitemref.itemref_cd IS '참조값코드';
COMMENT ON COLUMN zero_rule.ruleitemref.itemref_nm IS '참조값명';
COMMENT ON COLUMN zero_rule.ruleitemref.itemrefalias_nm IS '참조값별칭명';
COMMENT ON COLUMN zero_rule.ruleitemref.itemrefexpr_desc IS '참조값설명';
COMMENT ON COLUMN zero_rule.ruleitemref.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.ruleitemref.update_datetime IS '변경일시';


-- zero_rule.rulereturnitem definition

-- Drop table

-- DROP TABLE zero_rule.rulereturnitem;

CREATE TABLE zero_rule.rulereturnitem (
	ruleid varchar(10) NOT NULL, -- 룰ID
	return_itemid varchar(10) NOT NULL, -- 반환항목ID
	returnitem_no numeric NULL, -- 반환항목번호
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	CONSTRAINT xpk_rulereturnitem PRIMARY KEY (ruleid, return_itemid)
);
COMMENT ON TABLE zero_rule.rulereturnitem IS '룰반환항목';

-- Column comments

COMMENT ON COLUMN zero_rule.rulereturnitem.ruleid IS '룰ID';
COMMENT ON COLUMN zero_rule.rulereturnitem.return_itemid IS '반환항목ID';
COMMENT ON COLUMN zero_rule.rulereturnitem.returnitem_no IS '반환항목번호';
COMMENT ON COLUMN zero_rule.rulereturnitem.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.rulereturnitem.update_datetime IS '변경일시';


-- zero_rule.rulereturnitem_hist definition

-- Drop table

-- DROP TABLE zero_rule.rulereturnitem_hist;

CREATE TABLE zero_rule.rulereturnitem_hist (
	return_itemid varchar(10) NOT NULL, -- 반환항목ID
	returnitem_no numeric NULL, -- 반환항목번호
	update_userid numeric(19) NULL, -- 변경사용자ID
	update_datetime varchar(14) NULL, -- 변경일시
	ruleid varchar(10) NOT NULL,
	rule_verno numeric(5) NOT NULL,
	modified_userid numeric(19) NULL, -- 반환 항목 수정 ID
	modified_datetime varchar(14) NULL, -- 반환 항목 수정 일시
	CONSTRAINT xpk_ruleconreturnitem_hist PRIMARY KEY (return_itemid, ruleid, rule_verno)
);
CREATE UNIQUE INDEX xpk_rulereturnitem_hist ON zero_rule.rulereturnitem_hist USING btree (ruleid, return_itemid, rule_verno);
COMMENT ON TABLE zero_rule.rulereturnitem_hist IS '룰반환항목버전';

-- Column comments

COMMENT ON COLUMN zero_rule.rulereturnitem_hist.return_itemid IS '반환항목ID';
COMMENT ON COLUMN zero_rule.rulereturnitem_hist.returnitem_no IS '반환항목번호';
COMMENT ON COLUMN zero_rule.rulereturnitem_hist.update_userid IS '변경사용자ID';
COMMENT ON COLUMN zero_rule.rulereturnitem_hist.update_datetime IS '변경일시';
COMMENT ON COLUMN zero_rule.rulereturnitem_hist.modified_userid IS '반환 항목 수정 ID';
COMMENT ON COLUMN zero_rule.rulereturnitem_hist.modified_datetime IS '반환 항목 수정 일시';


-- zero_rule.sortcode definition

-- Drop table

-- DROP TABLE zero_rule.sortcode;

CREATE TABLE zero_rule.sortcode (
	sortcodeid varchar(100) NOT NULL, -- 분류코드
	sortcode_nm varchar(1000) NULL, -- 분류코드명
	sortcode_desc varchar(1000) NULL, -- 분류코드설명
	CONSTRAINT xpk_sortcode PRIMARY KEY (sortcodeid)
);
COMMENT ON TABLE zero_rule.sortcode IS '분류코드';

-- Column comments

COMMENT ON COLUMN zero_rule.sortcode.sortcodeid IS '분류코드';
COMMENT ON COLUMN zero_rule.sortcode.sortcode_nm IS '분류코드명';
COMMENT ON COLUMN zero_rule.sortcode.sortcode_desc IS '분류코드설명';


-- zero_rule.sortcodevalue definition

-- Drop table

-- DROP TABLE zero_rule.sortcodevalue;

CREATE TABLE zero_rule.sortcodevalue (
	sortcodeid varchar(100) NOT NULL, -- 분류코드
	codeid bpchar(2) NOT NULL, -- 코드ID
	code_nm varchar(1000) NULL, -- 코드명
	code_desc varchar(2000) NULL, -- 코드설명
	CONSTRAINT xpk_sortcodevalue PRIMARY KEY (sortcodeid, codeid)
);
COMMENT ON TABLE zero_rule.sortcodevalue IS '분류코드값';

-- Column comments

COMMENT ON COLUMN zero_rule.sortcodevalue.sortcodeid IS '분류코드';
COMMENT ON COLUMN zero_rule.sortcodevalue.codeid IS '코드ID';
COMMENT ON COLUMN zero_rule.sortcodevalue.code_nm IS '코드명';
COMMENT ON COLUMN zero_rule.sortcodevalue.code_desc IS '코드설명';



-- DROP FUNCTION zero_rule.cast_numeric_to_text(numeric);

CREATE OR REPLACE FUNCTION zero_rule.cast_numeric_to_text(numeric)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
    SELECT $1::text
$function$
;

-- DROP FUNCTION zero_rule.cast_numeric_to_varchar(numeric);

CREATE OR REPLACE FUNCTION zero_rule.cast_numeric_to_varchar(numeric)
 RETURNS character varying
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
    SELECT $1::varchar
$function$
;