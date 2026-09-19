/*
 * Popup System - PostgreSQL sample data v0.8
 * Prerequisite: 01_schema.sql (empty popup tables)
 * Target schema: popup
 */

BEGIN;
SET LOCAL search_path TO popup, pg_catalog;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM popup_notice WHERE popup_id LIKE 'SAMPLE-%') THEN
        RAISE EXCEPTION 'Sample popup data already exists. This script was not executed.';
    END IF;
END
$$;

INSERT INTO app_department
(
    department_id, parent_department_id, department_name,
    department_level, sort_order, active_yn,
    created_by, updated_by
)
VALUES
    ('HQ',       NULL, '본사',       1, 1, 'Y', 'SYSTEM', 'SYSTEM'),
    ('IT',       'HQ', 'IT부문',     2, 1, 'Y', 'SYSTEM', 'SYSTEM'),
    ('SECURITY', 'IT', '정보보안팀', 3, 1, 'Y', 'SYSTEM', 'SYSTEM'),
    ('DEV',      'IT', '개발팀',     3, 2, 'Y', 'SYSTEM', 'SYSTEM'),
    ('HR',       'HQ', '인사팀',     2, 2, 'Y', 'SYSTEM', 'SYSTEM');

INSERT INTO app_position
(
    position_id, position_name, sort_order, active_yn,
    created_by, updated_by
)
VALUES
    ('STAFF',   '사원',  1, 'Y', 'SYSTEM', 'SYSTEM'),
    ('SENIOR',  '대리',  2, 'Y', 'SYSTEM', 'SYSTEM'),
    ('MANAGER', '과장',  3, 'Y', 'SYSTEM', 'SYSTEM'),
    ('LEADER',  '팀장',  4, 'Y', 'SYSTEM', 'SYSTEM');

INSERT INTO app_user
(
    employee_no, employee_name, department_id, position_id,
    active_yn, hire_date, created_by, updated_by
)
VALUES
    ('E1001', '김개발', 'DEV',      'STAFF',   'Y', DATE '2026-07-01', 'SYSTEM', 'SYSTEM'),
    ('E1002', '이보안', 'SECURITY', 'SENIOR',  'Y', DATE '2024-03-04', 'SYSTEM', 'SYSTEM'),
    ('E1003', '박과장', 'DEV',      'MANAGER', 'Y', DATE '2020-01-02', 'SYSTEM', 'SYSTEM'),
    ('E1004', '최인사', 'HR',       'LEADER',  'Y', DATE '2018-09-10', 'SYSTEM', 'SYSTEM');

INSERT INTO question_template
(
    question_template_id, template_group_id, template_name,
    template_type, template_version, current_yn, active_yn,
    created_by, updated_by
)
VALUES
    (1001, 'SECURITY_EDU', '정보보안 교육 확인 설문',
     'SURVEY', 1, 'Y', 'Y', 'SYSTEM', 'SYSTEM');

INSERT INTO popup_notice
(
    popup_id, question_template_id, popup_type, title,
    show_on_login_yn, show_on_schedule_yn, scheduled_at,
    display_start_at, display_end_at, display_mode, period_mode,
    active_yn, size_mode, popup_width, popup_height,
    show_header_yn, show_close_button_yn, show_footer_yn,
    show_do_not_show_again_yn, hide_days,
    completion_ratio, passing_score, allow_close_before_complete_yn,
    created_by, updated_by
)
VALUES
    (
        'SAMPLE-TEXT-001', NULL, 'TEXT', '시스템 점검 안내',
        'Y', 'N', NULL,
        TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2027-12-31 23:59:59',
        'CENTER', 'FIXED',
        'Y', 'FIXED', 560, 420,
        'Y', 'Y', 'Y', 'Y', 30,
        NULL, NULL, 'Y',
        'SYSTEM', 'SYSTEM'
    ),
    (
        'SAMPLE-IMAGE-001', NULL, 'IMAGE', '신규 서비스 안내',
        'Y', 'N', NULL,
        TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2027-12-31 23:59:59',
        'CENTER', 'FIXED',
        'Y', 'FIXED', 720, 600,
        'Y', 'Y', 'Y', 'Y', 30,
        NULL, NULL, 'Y',
        'SYSTEM', 'SYSTEM'
    ),
    (
        'SAMPLE-VIDEO-001', NULL, 'VIDEO', '정보보안 교육 영상',
        'Y', 'N', NULL,
        TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2027-12-31 23:59:59',
        'CENTER', 'FIXED',
        'Y', 'FIXED', 960, 650,
        'Y', 'Y', 'N', 'N', NULL,
        0.8000, NULL, 'N',
        'SYSTEM', 'SYSTEM'
    ),
    (
        'SAMPLE-SURVEY-001', 1001, 'SURVEY', '정보보안 교육 확인',
        'Y', 'N', NULL,
        TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2027-12-31 23:59:59',
        'CENTER', 'FIXED',
        'Y', 'FIXED', 720, 680,
        'Y', 'Y', 'N', 'N', NULL,
        NULL, 80, 'N',
        'SYSTEM', 'SYSTEM'
    );

INSERT INTO popup_content
(
    popup_id, content_title, description, content_body,
    media_url, link_url, content_options,
    created_by, updated_by
)
VALUES
    (
        'SAMPLE-TEXT-001', '서비스 일시 중단 안내',
        '시스템 정기 점검 안내입니다.',
        '2026년 정기 점검으로 일부 서비스 이용이 제한될 수 있습니다.',
        NULL, NULL,
        '{"emphasis": "점검 시간 동안 저장되지 않은 작업은 유실될 수 있습니다."}'::jsonb,
        'SYSTEM', 'SYSTEM'
    ),
    (
        'SAMPLE-IMAGE-001', '신규 서비스 오픈',
        '이미지 팝업 렌더링 확인용 데이터입니다.',
        NULL,
        'https://example.com/images/popup-sample.png',
        'https://example.com/service',
        '{"stretch": "Uniform", "showDescription": true}'::jsonb,
        'SYSTEM', 'SYSTEM'
    ),
    (
        'SAMPLE-VIDEO-001', '필수 정보보안 교육',
        '전체 영상의 80% 이상 시청해야 완료됩니다.',
        NULL,
        'https://example.com/videos/security-training.mp4',
        NULL,
        '{"playbackRates": [0.75, 1.0, 1.25, 1.5], "defaultVolume": 0.8}'::jsonb,
        'SYSTEM', 'SYSTEM'
    ),
    (
        'SAMPLE-SURVEY-001', '교육 확인 설문',
        '80점 이상이면 통과됩니다.',
        NULL, NULL, NULL,
        '{"submitButtonText": "제출"}'::jsonb,
        'SYSTEM', 'SYSTEM'
    );

INSERT INTO popup_target_group
(
    target_group_id, popup_id, target_name, target_description,
    group_order, created_by, updated_by
)
VALUES
    (2001, 'SAMPLE-TEXT-001',   'IT부문 대상', 'IT부문과 모든 하위 부서를 포함합니다.', 1, 'SYSTEM', 'SYSTEM'),
    (2002, 'SAMPLE-IMAGE-001',  '과장 대상',   '과장 직급 사용자 대상입니다.',          1, 'SYSTEM', 'SYSTEM'),
    (2003, 'SAMPLE-VIDEO-001',  '개별 대상',   '지정된 사번 한 명을 대상으로 합니다.',  1, 'SYSTEM', 'SYSTEM'),
    (2004, 'SAMPLE-SURVEY-001', '입사일 대상', '기준일 이전 입사자를 대상으로 합니다.', 1, 'SYSTEM', 'SYSTEM');

INSERT INTO popup_target_condition
(
    target_condition_id, target_group_id, condition_type, condition_operator,
    department_id, position_id, employee_no, condition_date_value,
    include_child_yn, condition_order, created_by, updated_by
)
VALUES
    (3001, 2001, 'DEPARTMENT', '=',  'IT', NULL, NULL, NULL,              'Y', 1, 'SYSTEM', 'SYSTEM'),
    (3002, 2002, 'POSITION',   '=',  NULL, 'MANAGER', NULL, NULL,         'N', 1, 'SYSTEM', 'SYSTEM'),
    (3003, 2003, 'EMPLOYEE',   '=',  NULL, NULL, 'E1002', NULL,           'N', 1, 'SYSTEM', 'SYSTEM'),
    (3004, 2004, 'HIRE_DATE',  '<=', NULL, NULL, NULL, DATE '2025-12-31', 'N', 1, 'SYSTEM', 'SYSTEM');

INSERT INTO popup_question
(
    question_id, question_template_id, question_type,
    question_title, question_description,
    required_yn, scored_yn, question_score, sort_order,
    created_by, updated_by
)
VALUES
    (4001, 1001, 'SINGLE_CHOICE',
     '비밀번호를 다른 사람과 공유해도 됩니까?', NULL,
     'Y', 'Y', 50, 1, 'SYSTEM', 'SYSTEM'),
    (4002, 1001, 'SINGLE_CHOICE',
     '의심스러운 메일의 링크를 바로 클릭해도 됩니까?', NULL,
     'Y', 'Y', 50, 2, 'SYSTEM', 'SYSTEM'),
    (4003, 1001, 'TEXT',
     '교육에 대한 의견을 작성해 주세요.', '선택 입력 항목입니다.',
     'N', 'N', NULL, 3, 'SYSTEM', 'SYSTEM');

INSERT INTO popup_option
(
    option_id, question_id, option_value, option_text,
    correct_yn, sort_order, created_by, updated_by
)
VALUES
    (5001, 4001, 'YES', '예',   'N', 1, 'SYSTEM', 'SYSTEM'),
    (5002, 4001, 'NO',  '아니요', 'Y', 2, 'SYSTEM', 'SYSTEM'),
    (5003, 4002, 'YES', '예',   'N', 1, 'SYSTEM', 'SYSTEM'),
    (5004, 4002, 'NO',  '아니요', 'Y', 2, 'SYSTEM', 'SYSTEM');

SELECT setval(
    pg_get_serial_sequence('question_template', 'question_template_id'),
    (SELECT MAX(question_template_id) FROM question_template), true
);
SELECT setval(
    pg_get_serial_sequence('popup_target_group', 'target_group_id'),
    (SELECT MAX(target_group_id) FROM popup_target_group), true
);
SELECT setval(
    pg_get_serial_sequence('popup_target_condition', 'target_condition_id'),
    (SELECT MAX(target_condition_id) FROM popup_target_condition), true
);
SELECT setval(
    pg_get_serial_sequence('popup_question', 'question_id'),
    (SELECT MAX(question_id) FROM popup_question), true
);
SELECT setval(
    pg_get_serial_sequence('popup_option', 'option_id'),
    (SELECT MAX(option_id) FROM popup_option), true
);


SELECT 'app_department' AS table_name, COUNT(*) AS row_count FROM app_department
UNION ALL
SELECT 'app_position', COUNT(*) FROM app_position
UNION ALL
SELECT 'app_user', COUNT(*) FROM app_user
UNION ALL
SELECT 'question_template', COUNT(*) FROM question_template
UNION ALL
SELECT 'popup_notice', COUNT(*) FROM popup_notice
UNION ALL
SELECT 'popup_content', COUNT(*) FROM popup_content
UNION ALL
SELECT 'popup_target_group', COUNT(*) FROM popup_target_group
UNION ALL
SELECT 'popup_target_condition', COUNT(*) FROM popup_target_condition
UNION ALL
SELECT 'popup_question', COUNT(*) FROM popup_question
UNION ALL
SELECT 'popup_option', COUNT(*) FROM popup_option
ORDER BY table_name;

COMMIT;
