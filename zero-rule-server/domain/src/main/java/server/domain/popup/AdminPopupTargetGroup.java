package server.domain.popup;

import java.util.List;

/**
 * POL-11-01 : 노출 판단 소유
 * ■ 팝업 대상 조건 그룹
 * - in : targetName·targetDescription(String) 그룹 정보 · conditions(List) 조건 목록
 * - out: 대상 조건 그룹(record)
 * - 내부 조건은 AND, 다른 그룹과는 OR로 평가되는 대상 조건 그룹이다.
 */
public record AdminPopupTargetGroup(
        String targetName,
        String targetDescription,
        List<AdminPopupTargetCondition> conditions
) {
}
