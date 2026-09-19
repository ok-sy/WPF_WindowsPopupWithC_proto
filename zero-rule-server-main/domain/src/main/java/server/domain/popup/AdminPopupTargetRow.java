package server.domain.popup;

import java.time.LocalDate;

/** DB의 대상 그룹과 조건을 한 번에 읽어 서비스에서 중첩 구조로 조립하기 위한 행이다. */
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
