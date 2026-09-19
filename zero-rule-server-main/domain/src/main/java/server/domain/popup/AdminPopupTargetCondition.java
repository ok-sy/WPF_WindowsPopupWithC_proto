package server.domain.popup;

/** 관리자 화면에서 입력한 팝업 대상 조건 한 줄이다. */
public record AdminPopupTargetCondition(
        String conditionType,
        String conditionOperator,
        String value,
        boolean includeChild
) {
}
