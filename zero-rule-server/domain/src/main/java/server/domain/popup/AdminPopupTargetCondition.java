package server.domain.popup;

/**
 * POL-11-01 : 노출 판단 소유
 * ■ 팝업 대상 조건
 * - in : conditionType·conditionOperator·value(String) 조건 · includeChild(boolean) 하위 부서 포함 여부
 * - out: 대상 조건 한 줄(record)
 * - 관리자 화면에서 입력한 팝업 대상 조건 한 줄이다.
 */
public record AdminPopupTargetCondition(
        String conditionType,
        String conditionOperator,
        String value,
        boolean includeChild
) {
}
