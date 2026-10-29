package server.service.core.popup.sample.fulljson;

import java.util.List;

import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * POL-01-02 : 기본값의 적용
 * POL-14-03 : 서버 인계 예제
 * ■ 등록·수정 JSON 검증 결과
 * - in : 정책 버전 · 정규화 popup(오류면 null) · 오류 목록 · 변경(경고) 목록
 * - out: 불변 결과. 저장 가능 여부는 오류 유무로만 정한다(경고는 저장 가능).
 * - 원본 입력은 바꾸지 않는다. {@link #normalized()}는 매번 깊은 복사본을 돌려준다.
 */
public final class PopupJsonValidationResult {

    private final String policyVersion;
    private final ObjectNode normalized;
    private final List<PopupJsonIssue> errors;
    private final List<PopupJsonChange> changes;

    PopupJsonValidationResult(String policyVersion, ObjectNode normalized, List<PopupJsonIssue> errors, List<PopupJsonChange> changes) {
        this.policyVersion = policyVersion;
        this.normalized = errors.isEmpty() ? normalized : null;
        this.errors = List.copyOf(errors);
        this.changes = List.copyOf(changes);
    }

    /** ■ 저장 가능 여부(오류 0건). */
    public boolean valid() { return errors.isEmpty(); }

    /** ■ 검증 정책 버전(규칙·기본값을 바꾸면 올린다). */
    public String policyVersion() { return policyVersion; }

    /** ■ 정규화한 popup 객체 복사본. 오류가 있으면 null(부분 보정 결과를 저장하지 못하게). */
    public ObjectNode normalized() { return normalized == null ? null : normalized.deepCopy(); }

    /** ■ 오류 목록(저장 불가 사유). */
    public List<PopupJsonIssue> errors() { return errors; }

    /** ■ 기본값 적용·제거·이동 이력(경고). 오류가 있을 때도 그때까지의 이력을 담는다. */
    public List<PopupJsonChange> changes() { return changes; }
}
