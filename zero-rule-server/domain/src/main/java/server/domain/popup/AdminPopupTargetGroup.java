package server.domain.popup;

import java.util.List;

/** 내부 조건은 AND, 다른 그룹과는 OR로 평가되는 대상 조건 그룹이다. */
public record AdminPopupTargetGroup(
        String targetName,
        String targetDescription,
        List<AdminPopupTargetCondition> conditions
) {
}
