package server.service.core.popup.sample.fulljson;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import server.repo.core.mapper.popup.sample.fulljson.PopupFullJsonRegisterSampleMapper;

/**
 * POL-01-02 : 기본값의 적용
 * POL-14-03 : 서버 인계 예제
 * ■ DTIY3117 등록·수정 샘플 서비스
 * - in : popupId(POPU_ID) · 관리자 화면/API가 보낸 popup JSON 문자열 · 등록/변경 사번
 * - out: {@link PopupJsonValidationResult}(valid면 저장 완료, 아니면 저장 안 함) · 예외: IllegalArgumentException(키·사번 누락, 수정 대상 없음)
 * - 흐름: 입력 확인 → {@link PopupJsonValidator}로 검증·기본값 생성 → 오류 0건일 때만 정규화 JSON을 INSERT/UPDATE.
 *
 * <p>오류가 있으면 DB를 호출하지 않는다(쓰기 0건). 경고(기본값 적용·서버 소유 키 제거)만 있으면 정규화 결과를 저장하고
 * 결과의 {@code changes()}로 관리자 화면에 알린다. 같은 결과를 다시 저장해도 값이 바뀌지 않는다(멱등).</p>
 *
 * <p>[교체 지점] 실제 등록 서비스에서는 이 클래스 대신 기존 저장 메서드의 DB 쓰기 직전에 {@code validator.validate(...)}를 호출한다.
 * 쓰기가 여러 테이블에 걸치면 {@code @Transactional} 경계 안에서 검증 → 쓰기 순서를 지킨다.
 * 부분 수정(PATCH)이라면 기존 저장 JSON을 읽어 병합한 <b>최종 객체</b>를 검증한다. 이 샘플의 수정은 전체 JSON 교체다.</p>
 *
 * <p>[담당 구현] 등록 권한·게시 기간·대상자(DTIY3121) 등록, 관리자 화면 오류 표시는 범위 밖이다.</p>
 */
public class PopupFullJsonRegisterSampleService {

    private static final Logger log = LoggerFactory.getLogger(PopupFullJsonRegisterSampleService.class);

    private final PopupFullJsonRegisterSampleMapper mapper;
    private final PopupJsonValidator validator;
    private final ObjectMapper objectMapper;

    /** ■ 생성 - in : 등록 매퍼·공통 검증기·ObjectMapper - out: 샘플 서비스 인스턴스 */
    public PopupFullJsonRegisterSampleService(PopupFullJsonRegisterSampleMapper mapper, PopupJsonValidator validator, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.validator = validator;
        this.objectMapper = objectMapper;
    }

    /**
     * ■ 신규 등록
     * - in : popupId · popupJson · userId
     * - out: 검증 결과(valid면 INSERT 완료) · POPU_ID 중복은 DB 예외로 전파
     */
    public PopupJsonValidationResult register(String popupId, String popupJson, String userId) {
        return save(popupId, popupJson, userId, false);
    }

    /**
     * ■ 전체 교체 수정
     * - in : popupId · popupJson(최종 전체 popup JSON) · userId
     * - out: 검증 결과(valid면 UPDATE 완료) · 예외: IllegalArgumentException(대상 POPU_ID 없음)
     */
    public PopupJsonValidationResult update(String popupId, String popupJson, String userId) {
        return save(popupId, popupJson, userId, true);
    }

    private PopupJsonValidationResult save(String popupId, String popupJson, String userId, boolean update) {
        if (popupId == null || popupId.isBlank()) throw new IllegalArgumentException("popupId가 필요합니다.");
        if (userId == null || userId.isBlank()) throw new IllegalArgumentException("등록 사번이 필요합니다.");
        String id = popupId.trim();
        PopupJsonValidationResult result = validator.validate(popupJson, id);
        if (!result.valid()) {
            // 값 원문은 남기지 않고 경로·코드만 남긴다.
            log.warn("3117 {} 검증 실패 popupId={} errors={}", update ? "수정" : "등록", id,
                    result.errors().stream().map(e -> e.path() + ":" + e.code()).toList());
            return result;
        }
        String normalized = toJson(result);
        int rows = update ? mapper.updateBulletin(id, normalized, userId.trim()) : mapper.insertBulletin(id, normalized, userId.trim());
        if (update && rows == 0) throw new IllegalArgumentException("수정할 POPU_ID가 없습니다: " + id);
        log.info("3117 {} 저장 popupId={} policy={} changes={}", update ? "수정" : "등록", id, result.policyVersion(), result.changes().size());
        return result;
    }

    private String toJson(PopupJsonValidationResult result) {
        try {
            return objectMapper.writeValueAsString(result.normalized());
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("정규화 JSON 직렬화 실패", ex);
        }
    }
}
