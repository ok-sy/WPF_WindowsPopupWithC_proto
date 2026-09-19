/*
 * Popup System - DB 3 validation queries v0.8
 * Prerequisite: schema and sample data scripts
 * Target schema: popup
 */

BEGIN READ ONLY;
SET LOCAL search_path TO popup, pg_catalog;

/*
 * 1. Eligibility matrix for every sample user and popup.
 *
 * Group rule:
 *   - conditions inside one target group are AND
 *   - multiple target groups for one popup are OR
 */
WITH RECURSIVE department_tree AS
(
    SELECT
        department_id AS ancestor_department_id,
        department_id AS descendant_department_id
    FROM app_department

    UNION ALL

    SELECT
        tree.ancestor_department_id,
        child.department_id
    FROM department_tree tree
    JOIN app_department child
      ON child.parent_department_id = tree.descendant_department_id
),
condition_result AS
(
    SELECT
        usr.employee_no,
        usr.employee_name,
        popup.popup_id,
        popup.popup_type,
        popup.title,
        target.target_group_id,
        condition.target_condition_id,
        CASE condition.condition_type
            WHEN 'DEPARTMENT' THEN
                CASE condition.condition_operator
                    WHEN '=' THEN
                        CASE
                            WHEN condition.include_child_yn = 'Y' THEN EXISTS
                            (
                                SELECT 1
                                FROM department_tree tree
                                WHERE tree.ancestor_department_id = condition.department_id
                                  AND tree.descendant_department_id = usr.department_id
                            )
                            ELSE usr.department_id = condition.department_id
                        END
                    WHEN '!=' THEN
                        CASE
                            WHEN condition.include_child_yn = 'Y' THEN NOT EXISTS
                            (
                                SELECT 1
                                FROM department_tree tree
                                WHERE tree.ancestor_department_id = condition.department_id
                                  AND tree.descendant_department_id = usr.department_id
                            )
                            ELSE usr.department_id <> condition.department_id
                        END
                    ELSE FALSE
                END
            WHEN 'POSITION' THEN
                CASE condition.condition_operator
                    WHEN '='  THEN usr.position_id = condition.position_id
                    WHEN '!=' THEN usr.position_id <> condition.position_id
                    ELSE FALSE
                END
            WHEN 'EMPLOYEE' THEN
                CASE condition.condition_operator
                    WHEN '='  THEN usr.employee_no = condition.employee_no
                    WHEN '!=' THEN usr.employee_no <> condition.employee_no
                    ELSE FALSE
                END
            WHEN 'HIRE_DATE' THEN
                CASE condition.condition_operator
                    WHEN '='  THEN usr.hire_date = condition.condition_date_value
                    WHEN '!=' THEN usr.hire_date <> condition.condition_date_value
                    WHEN '<'  THEN usr.hire_date <  condition.condition_date_value
                    WHEN '<=' THEN usr.hire_date <= condition.condition_date_value
                    WHEN '>'  THEN usr.hire_date >  condition.condition_date_value
                    WHEN '>=' THEN usr.hire_date >= condition.condition_date_value
                    ELSE FALSE
                END
            ELSE FALSE
        END AS condition_matched
    FROM app_user usr
    CROSS JOIN popup_notice popup
    JOIN popup_target_group target
      ON target.popup_id = popup.popup_id
    JOIN popup_target_condition condition
      ON condition.target_group_id = target.target_group_id
    WHERE usr.active_yn = 'Y'
      AND popup.active_yn = 'Y'
      AND CURRENT_TIMESTAMP BETWEEN popup.display_start_at AND popup.display_end_at
),
group_result AS
(
    SELECT
        employee_no,
        employee_name,
        popup_id,
        popup_type,
        title,
        target_group_id,
        BOOL_AND(condition_matched) AS group_matched
    FROM condition_result
    GROUP BY
        employee_no,
        employee_name,
        popup_id,
        popup_type,
        title,
        target_group_id
),
popup_result AS
(
    SELECT
        employee_no,
        employee_name,
        popup_id,
        popup_type,
        title,
        BOOL_OR(group_matched) AS eligible
    FROM group_result
    GROUP BY employee_no, employee_name, popup_id, popup_type, title
)
SELECT
    employee_no,
    employee_name,
    popup_id,
    popup_type,
    title,
    eligible
FROM popup_result
ORDER BY employee_no, popup_id;

/*
 * Expected eligible=true rows for the supplied sample data:
 *
 * E1001: SAMPLE-TEXT-001
 * E1002: SAMPLE-TEXT-001, SAMPLE-VIDEO-001, SAMPLE-SURVEY-001
 * E1003: SAMPLE-TEXT-001, SAMPLE-IMAGE-001, SAMPLE-SURVEY-001
 * E1004: SAMPLE-SURVEY-001
 */

/*
 * 2. Final API-oriented popup query for one employee.
 * Change params.employee_no to test another employee.
 */
WITH RECURSIVE params AS
(
    SELECT 'E1002'::VARCHAR(30) AS employee_no
),
department_tree AS
(
    SELECT
        department_id AS ancestor_department_id,
        department_id AS descendant_department_id
    FROM app_department

    UNION ALL

    SELECT
        tree.ancestor_department_id,
        child.department_id
    FROM department_tree tree
    JOIN app_department child
      ON child.parent_department_id = tree.descendant_department_id
),
selected_user AS
(
    SELECT usr.*
    FROM app_user usr
    JOIN params
      ON params.employee_no = usr.employee_no
    WHERE usr.active_yn = 'Y'
),
condition_result AS
(
    SELECT
        popup.popup_id,
        target.target_group_id,
        CASE condition.condition_type
            WHEN 'DEPARTMENT' THEN
                CASE condition.condition_operator
                    WHEN '=' THEN
                        CASE
                            WHEN condition.include_child_yn = 'Y' THEN EXISTS
                            (
                                SELECT 1
                                FROM department_tree tree
                                WHERE tree.ancestor_department_id = condition.department_id
                                  AND tree.descendant_department_id = usr.department_id
                            )
                            ELSE usr.department_id = condition.department_id
                        END
                    WHEN '!=' THEN
                        CASE
                            WHEN condition.include_child_yn = 'Y' THEN NOT EXISTS
                            (
                                SELECT 1
                                FROM department_tree tree
                                WHERE tree.ancestor_department_id = condition.department_id
                                  AND tree.descendant_department_id = usr.department_id
                            )
                            ELSE usr.department_id <> condition.department_id
                        END
                    ELSE FALSE
                END
            WHEN 'POSITION' THEN
                CASE condition.condition_operator
                    WHEN '='  THEN usr.position_id = condition.position_id
                    WHEN '!=' THEN usr.position_id <> condition.position_id
                    ELSE FALSE
                END
            WHEN 'EMPLOYEE' THEN
                CASE condition.condition_operator
                    WHEN '='  THEN usr.employee_no = condition.employee_no
                    WHEN '!=' THEN usr.employee_no <> condition.employee_no
                    ELSE FALSE
                END
            WHEN 'HIRE_DATE' THEN
                CASE condition.condition_operator
                    WHEN '='  THEN usr.hire_date = condition.condition_date_value
                    WHEN '!=' THEN usr.hire_date <> condition.condition_date_value
                    WHEN '<'  THEN usr.hire_date <  condition.condition_date_value
                    WHEN '<=' THEN usr.hire_date <= condition.condition_date_value
                    WHEN '>'  THEN usr.hire_date >  condition.condition_date_value
                    WHEN '>=' THEN usr.hire_date >= condition.condition_date_value
                    ELSE FALSE
                END
            ELSE FALSE
        END AS condition_matched
    FROM selected_user usr
    CROSS JOIN popup_notice popup
    JOIN popup_target_group target
      ON target.popup_id = popup.popup_id
    JOIN popup_target_condition condition
      ON condition.target_group_id = target.target_group_id
    WHERE popup.active_yn = 'Y'
      AND CURRENT_TIMESTAMP BETWEEN popup.display_start_at AND popup.display_end_at
      AND NOT EXISTS
      (
          SELECT 1
          FROM user_popup_status status
          WHERE status.employee_no = usr.employee_no
            AND status.popup_id = popup.popup_id
            AND status.hidden_until_at > CURRENT_TIMESTAMP
      )
),
eligible_popup AS
(
    SELECT popup_id
    FROM condition_result
    GROUP BY popup_id, target_group_id
    HAVING BOOL_AND(condition_matched)
),
eligible_popup_distinct AS
(
    SELECT DISTINCT popup_id
    FROM eligible_popup
)
SELECT
    popup.popup_id,
    popup.popup_type,
    popup.title,
    popup.display_start_at,
    popup.display_end_at,
    popup.display_mode,
    popup.period_mode,
    popup.size_mode,
    popup.popup_width,
    popup.popup_height,
    popup.show_header_yn,
    popup.show_close_button_yn,
    popup.show_footer_yn,
    popup.show_do_not_show_again_yn,
    popup.hide_days,
    popup.completion_ratio,
    popup.passing_score,
    popup.allow_close_before_complete_yn,
    content.content_title,
    content.description,
    content.content_body,
    content.media_url,
    content.link_url,
    content.content_options,
    template.question_template_id,
    template.template_group_id,
    template.template_name,
    template.template_version,
    COALESCE
    (
        (
            SELECT JSONB_AGG
            (
                JSONB_BUILD_OBJECT
                (
                    'questionId', question.question_id,
                    'questionType', question.question_type,
                    'questionTitle', question.question_title,
                    'questionDescription', question.question_description,
                    'required', question.required_yn = 'Y',
                    'scored', question.scored_yn = 'Y',
                    'questionScore', question.question_score,
                    'sortOrder', question.sort_order,
                    'options', COALESCE
                    (
                        (
                            SELECT JSONB_AGG
                            (
                                JSONB_BUILD_OBJECT
                                (
                                    'optionId', option.option_id,
                                    'optionValue', option.option_value,
                                    'optionText', option.option_text,
                                    'correct', option.correct_yn = 'Y',
                                    'sortOrder', option.sort_order
                                )
                                ORDER BY option.sort_order
                            )
                            FROM popup_option option
                            WHERE option.question_id = question.question_id
                        ),
                        '[]'::JSONB
                    )
                )
                ORDER BY question.sort_order
            )
            FROM popup_question question
            WHERE question.question_template_id = popup.question_template_id
        ),
        '[]'::JSONB
    ) AS questions
FROM eligible_popup_distinct eligible
JOIN popup_notice popup
  ON popup.popup_id = eligible.popup_id
LEFT JOIN popup_content content
  ON content.popup_id = popup.popup_id
LEFT JOIN question_template template
  ON template.question_template_id = popup.question_template_id
ORDER BY popup.popup_id;

COMMIT;
