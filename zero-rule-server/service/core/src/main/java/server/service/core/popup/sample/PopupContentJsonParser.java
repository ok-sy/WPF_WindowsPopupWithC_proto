package server.service.core.popup.sample;




import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * [TODO65] CNTN_CN(CLOB → String) JSON을 {@link ObjectNode}로 파싱한다.
 *
 * <p>응답 content에는 이 ObjectNode를 그대로 넣는다. {@code content: "{\"plainText\":...}"}처럼 JSON 문자열을 다시 감싸는
 * 이중 직렬화를 하지 않으며, TEXT 문단·Run 같은 중첩 구조와 false·0·null 값을 그대로 보존한다.
 * 잘못된 JSON·객체가 아닌 JSON(배열·문자열·숫자)·빈 값은 오류로 처리한다(빈 content로 대체하지 않는다).</p>
 */
public class PopupContentJsonParser {

    private final ObjectMapper objectMapper;

    public PopupContentJsonParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ObjectNode parse(String contentJson, String contentId) {
        if (contentJson == null || contentJson.isBlank()) {
            throw new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, contentId, "CNTN_CN이 비었습니다.");
        }
        JsonNode node;
        try {
            node = objectMapper.readTree(contentJson);
        } catch (JsonProcessingException ex) {
            throw new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, contentId,
                    "CNTN_CN JSON 구문 오류(line " + ex.getLocation().getLineNr() + ")", ex);
        }
        if (node == null || !node.isObject()) {
            throw new PopupSampleException(PopupSampleException.Reason.CONTENT_NOT_OBJECT, contentId,
                    "CNTN_CN은 JSON 객체여야 합니다: " + (node == null ? "empty" : node.getNodeType()));
        }
        return (ObjectNode) node;
    }
}
