package server.domain.popup;

import java.time.LocalDate;

/**
 * POL-11-01 : 노출 판단 소유
 * ■ 대상 그룹·조건 조회 행
 * - in : 그룹 ID·이름·순서와 조건 유형·연산자·부서/직위/사번/날짜 값·하위 포함·조건 순서
 * - out: 그룹×조건 1행(record)
 * - DB의 대상 그룹과 조건을 한 번에 읽어 서비스에서 중첩 구조로 조립하기 위한 행이다.
 */
public record AdminPopupTargetRow(
        Long targetGroupId,
        String targetName,
        String targetDescription,
        Integer groupOrder,
        String conditionType,
        String conditionOperator,
        String departmentId,
        String positionId,
        String employeeNo,
        LocalDate conditionDateValue,
        String includeChildYn,
        Integer conditionOrder
) {
}
