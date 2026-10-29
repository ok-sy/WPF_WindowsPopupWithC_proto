package server.service.core.popup.sample.fulljson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * POL-01-02 : 기본값의 적용
 * POL-16-02 : 재현 가능한 검증
 * ■ 유형별 기본값 전체 JSON 예시 파일 동기화 테스트
 * - docs/interfaces/examples/DTIY3117-register-defaults-full.txt의 유형별 JSON이 {@link PopupJsonValidator} 정규화 결과와 같은지 확인한다.
 * - 규칙 표·YAML 기본값을 바꾸면 이 테스트가 실패한다. 파일 재생성: {@code POPUP_REGEN_DEFAULTS_EXAMPLE=1 gradlew :service:core:test --tests "*DefaultsExampleFile*"}
 */
class PopupJsonDefaultsExampleFileTest {

    private static final String DEFAULTS = "/popup/sample/popup-full-json-defaults.yml";
    private static final Path FILE = Path.of("../../../docs/interfaces/examples/DTIY3117-register-defaults-full.txt");
    private static final String MARK = "### ";
    private final ObjectMapper json = new ObjectMapper();
    private final PopupJsonValidator validator = new PopupJsonValidator(json,
            PopupFullJsonDefaults.load(PopupJsonDefaultsExampleFileTest.class.getResourceAsStream(DEFAULTS), json, DEFAULTS));

    /** 유형별 입력: 필수 콘텐츠·문항만 넣고 나머지는 모두 기본값으로 채운다. */
    private static final Map<String, String> INPUTS = new LinkedHashMap<>();
    static {
        String choice = "[{\"questionId\":1,\"questionType\":\"SINGLE_CHOICE\",\"title\":\"문항 제목(필수 입력값)\",\"isRequired\":true,"
                + "\"options\":[{\"optionId\":1,\"text\":\"선택지 1\"},{\"optionId\":2,\"text\":\"선택지 2\"}]}]";
        String scored = "[{\"questionId\":1,\"questionType\":\"SINGLE_CHOICE\",\"title\":\"문항 제목(필수 입력값)\",\"isRequired\":true,"
                + "\"isScored\":true,\"questionScore\":100,\"options\":[{\"optionId\":1,\"text\":\"정답\",\"isCorrect\":true},"
                + "{\"optionId\":2,\"text\":\"오답\",\"isCorrect\":false}]}]";
        INPUTS.put("TEXT", "{\"popupType\":\"TEXT\",\"content\":{\"plainText\":\"본문(필수 입력값)\"}}");
        INPUTS.put("IMAGE", "{\"popupType\":\"IMAGE\",\"content\":{\"imageUrl\":\"https://files.example.com/popup/image.png\"}}");
        INPUTS.put("VIDEO", "{\"popupType\":\"VIDEO\",\"content\":{\"videoUrl\":\"https://files.example.com/popup/video.mp4\"}}");
        INPUTS.put("SURVEY", "{\"popupType\":\"SURVEY\",\"questions\":" + choice + "}");
        INPUTS.put("QUIZ", "{\"popupType\":\"QUIZ\",\"questions\":" + scored + "}");
        INPUTS.put("QUIZ_VIDEO", "{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":true,"
                + "\"videoUrl\":\"https://files.example.com/popup/video.mp4\"},\"questions\":" + scored + "}");
    }

    private String render() throws Exception {
        StringBuilder out = new StringBuilder();
        out.append("""
                # DTIY3117 등록·수정 — 유형별 기본값 전체 JSON (POPU_BLTN_CN 저장 형태)
                #
                # - 생성 기준: PopupJsonValidator 정규화 결과(정책 버전 %s), 기본값 파일 popup-full-json-defaults.yml.
                # - 각 블록은 필수 입력값(본문·이미지/영상 URL·문항)만 넣고 나머지를 모두 기본값으로 채운 결과다.
                #   "(필수 입력값)"·example.com 값만 실제 값으로 바꾸면 되고, 그 밖의 키는 기본값이라 생략해도 등록 시 같은 값이 채워진다.
                # - 저장 형태는 popup 객체 본체다. 조회 응답 envelope(pollingIntervalSeconds)와 deliveryId는 넣지 않는다(서버가 설정).
                # - popupId는 DB POPU_ID 기준(아래 SAMPLE-001은 예시). 생략하면 등록 시 POPU_ID로 채운다.
                # - null 값 키(headerFontSize·bodyFontSize·footerFontSize·hideDays)는 "WPF 기본/미사용"을 뜻하는 유효한 기본값이다.
                # - 기본값이 없는 선택 키는 블록에 없다: 본문 문구(description·videoTitle 등), QUIZ passingScore(생략 = 통과 점수 없음),
                #   footerLinkUrl(LINK_AND_CLOSE일 때만). completionRatio는 VIDEO·영상 QUIZ에만 있다(기본 1.0).
                # - IMAGE는 width/height를 채우지 않는다(크기 미지정 = 원본 기준). ORIGINAL 모드는 width/height가 필수다.
                # - SURVEY·QUIZ의 footerAction은 SUBMIT 고정, 그 밖의 유형은 CLOSE(LINK_AND_CLOSE는 footerLinkUrl 필수).
                # - 영상 QUIZ는 별도 유형이 아니라 popupType=QUIZ + content.videoEnabled=true이며 VIDEO content 기본값을 함께 갖는다.
                # - SURVEY 정답 키는 저장 시 유지되고 WPF 조회 응답에서만 제거된다.
                # - 이 파일은 PopupJsonDefaultsExampleFileTest가 코드 기본값과 대조한다. 기본값을 바꾸면 파일을 재생성한다.
                """.formatted(PopupJsonValidator.POLICY_VERSION));
        for (Map.Entry<String, String> entry : INPUTS.entrySet()) {
            PopupJsonValidationResult result = validator.validate(entry.getValue(), "SAMPLE-001");
            assertTrue(result.valid(), () -> entry.getKey() + " " + result.errors());
            out.append('\n').append(MARK).append(entry.getKey()).append('\n')
                    .append(json.writerWithDefaultPrettyPrinter().writeValueAsString(result.normalized()).replace("\r\n", "\n")).append('\n');
        }
        return out.toString();
    }

    @Test
    void exampleFileMatchesValidatorDefaults() throws Exception {
        String expected = render();
        if (System.getenv("POPUP_REGEN_DEFAULTS_EXAMPLE") != null) {
            Files.writeString(FILE, expected, StandardCharsets.UTF_8);
        }
        Assumptions.assumeTrue(Files.exists(FILE), "저장소 docs 경로 밖에서 실행");
        Map<String, JsonNode> actual = blocks(Files.readString(FILE, StandardCharsets.UTF_8));
        Map<String, JsonNode> wanted = blocks(expected);
        assertEquals(wanted.keySet(), actual.keySet());
        wanted.forEach((type, node) -> assertEquals(node, actual.get(type), type + " 블록이 코드 기본값과 다릅니다(파일 재생성 필요)"));
    }

    /** "### 유형" 다음 JSON 블록을 유형별로 읽는다. */
    private Map<String, JsonNode> blocks(String text) throws Exception {
        Map<String, JsonNode> result = new LinkedHashMap<>();
        String[] parts = text.replace("\r\n", "\n").split("\n" + MARK);
        for (int i = 1; i < parts.length; i++) {
            int newline = parts[i].indexOf('\n');
            result.put(parts[i].substring(0, newline).trim(), json.readTree(parts[i].substring(newline + 1)));
        }
        return result;
    }
}
