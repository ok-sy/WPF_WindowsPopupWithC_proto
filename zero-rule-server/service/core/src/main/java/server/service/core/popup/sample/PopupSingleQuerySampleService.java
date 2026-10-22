package server.service.core.popup.sample;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.domain.popup.sample.PopupContentRow;
import server.repo.core.mapper.popup.sample.PopupSingleQuerySampleMapper;

/**
 * [TODO65] 실테이블 연계 단건 조회 샘플 흐름: SQL(정렬 후 ROWNUM 1) → VO → 공통 헤더/옵션 매핑 → CLOB JSON 파싱
 * → 기본값 → 기존 WPF 단건 응답 {@code {pollingIntervalSeconds, popup}}.
 *
 * <p>Bean 등록은 {@link PopupSingleQuerySampleConfig}({@code popup.sample.single-query.enabled=true})에서만 한다.
 * 기존 {@code WpfPopupService}(POPUP 스키마 조회·전달 건 처리)를 대체하지 않는다.</p>
 *
 * <p>[담당 구현] 대상자·게시 일정·완료·숨김·나중에 보기 후보 판단(SQL 조건), 전달 건 생성/재사용·소유권·중복 처리
 * ({@link PopupPorts.DeliveryPort}), SURVEY·QUIZ 문항 조회({@link PopupPorts.QuestionPort})는 실제 서버 구현으로 교체한다.</p>
 */
public class PopupSingleQuerySampleService {

    private static final Logger log = LoggerFactory.getLogger(PopupSingleQuerySampleService.class);

    private final PopupSingleQuerySampleMapper mapper;
    private final PopupContentJsonParser parser;
    private final PopupSingleResponseAssembler assembler;
    private final PopupPorts.DeliveryPort deliveryPort;
    private final PopupPorts.QuestionPort questionPort;

    public PopupSingleQuerySampleService(PopupSingleQuerySampleMapper mapper, PopupContentJsonParser parser,
                                         PopupSingleResponseAssembler assembler, PopupPorts.DeliveryPort deliveryPort,
                                         PopupPorts.QuestionPort questionPort) {
        this.mapper = mapper;
        this.parser = parser;
        this.assembler = assembler;
        this.deliveryPort = deliveryPort;
        this.questionPort = questionPort;
    }

    /**
     * @param userId          인증된 사번(요청 본문 값을 쓰지 않는다)
     * @param contentId       [샘플 조건] 확인용 콘텐츠 ID(null = 조건 없음)
     * @param contentTypeCode [샘플 조건] 유형 코드(null = 조건 없음)
     */
    public ObjectNode nextPopup(String userId, String contentId, String contentTypeCode) {
        PopupContentRow row = mapper.selectNextCandidate(userId, contentId, contentTypeCode);
        if (row == null) {
            return assembler.empty(deliveryPort.pollingIntervalSeconds());
        }
        try {
            ObjectNode content = parser.parse(row.getContentJson(), row.getContentId());
            String popupType = PopupCodeTable.popupType(row.getContentTypeCode(), row.getContentId());
            ArrayNode questions = questionPort.questions(row, popupType);
            // 응답 조립이 끝난 뒤(데이터 오류가 없을 때)만 전달 건을 발급해 실패한 응답에 전달 건이 남지 않게 한다.
            ObjectNode response = assembler.assemble(row, content, questions, "", deliveryPort.pollingIntervalSeconds());
            ((ObjectNode) response.get("popup")).put("deliveryId", deliveryPort.issueDeliveryId(row, userId));
            return response;
        } catch (PopupSampleException ex) {
            log.error("단건 조회 샘플 데이터 오류 contentId={} reason={} message={}", ex.contentId(), ex.reason(), ex.getMessage());
            throw ex;
        }
    }
}
