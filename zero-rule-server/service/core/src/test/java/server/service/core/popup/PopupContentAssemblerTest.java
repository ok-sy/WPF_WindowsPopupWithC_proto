package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * POL-13-01 : 콘텐츠와 관리 상태
 * POL-03-01 : 저장·표시 경계
 * ■ PopupContentAssembler content 조립 규칙 테스트
 * - Oracle 전환으로 Java에서 하는 content 조립 규칙을 확인한다. 정규 컬럼이 CONTENT_OPTIONS 사본보다 우선하고,
 * 완료 비율·통과 점수·문항 같은 파생 키는 content에 싣지 않는다.
 */
class PopupContentAssemblerTest {

    private final PopupContentAssembler assembler = new PopupContentAssembler(new ObjectMapper());

    /** POL-04-01 : 공통 크기 입력 — 구 IMAGE 저장 형태를 중복 크기 없이 현재 계약으로 변환한다. */
    @Test void image23ConvertsLegacyStorageWithoutDuplicateDimensions() {
        var content = assembler.assemble(entity("IMAGE", "제목", "설명", null, "http://x/a.png",
                "{\"imageSizeMode\":\"FIT_TO_IMAGE\",\"imageWidth\":600,\"imageHeight\":400,\"descriptionPosition\":\"RIGHT\",\"imageAreaRatio\":0.75}", null, null));
        assertEquals(600, content.get("width"));
        assertEquals(400, content.get("height"));
        assertEquals(true, content.get("keepAspectRatio"));
        for (String key : new String[]{"imageWidth", "imageHeight", "descriptionPosition", "imageAreaRatio"})
            assertFalse(content.containsKey(key));
        var fill = assembler.assemble(entity("IMAGE", "제목", "설명", null, "http://x/a.png",
                "{\"imageSizeMode\":\"FILL\"}", null, null));
        assertEquals("ADAPTIVE", fill.get("imageSizeMode"));
        var current = assembler.assemble(entity("IMAGE", "제목", "설명", null, "http://x/a.png",
                "{\"imageSizeMode\":\"FIT_TO_IMAGE\",\"width\":900,\"imageWidth\":600,\"keepAspectRatio\":false}", null, null));
        assertEquals(900, current.get("width"));
        assertEquals(false, current.get("keepAspectRatio"));
        var original = assembler.assemble(entity("IMAGE", "제목", "설명", null, "http://x/a.png",
                "{\"imageSizeMode\":\"ORIGINAL\",\"width\":900,\"height\":600,\"keepAspectRatio\":true}", null, null));
        assertFalse(original.containsKey("width"));
        assertFalse(original.containsKey("height"));
        assertFalse(original.containsKey("keepAspectRatio"));
    }

    private PopupEntity entity(String type, String title, String description, String body, String media,
                               String options, BigDecimal completionRatio, BigDecimal passingScore) {
        return new PopupEntity("P1", type, "제목", null, null, "SEQUENTIAL", "FIXED",
                null, null, null, null, null, null, null, null,
                "Y", "Y", "Y", "N", "N",
                title, description, body, media, options,
                100, null, "FIXED", null, null, null, null,
                completionRatio, passingScore);
    }

    /** 동영상+퀴즈는 저장·조립을 거쳐도 영상·푸터 옵션을 유지한다. */
    @Test void videoQuizKeepsVideoAndFooterOptionsThroughStorage() {
        var content = assembler.assemble(entity("QUIZ", "교육", "설명", null, "https://example.com/lesson.mp4",
                "{\"videoEnabled\":true,\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"https://example.com/\"}",
                new BigDecimal("0.8"), BigDecimal.TEN));
        assertEquals("https://example.com/lesson.mp4", content.get("videoUrl"));
        assertEquals("교육", content.get("surveyTitle"));
        assertEquals(true, content.get("videoEnabled"));
        assertEquals("LINK_AND_CLOSE", content.get("footerAction"));
        assertEquals("https://example.com/", content.get("footerLinkUrl"));
        var stored = PopupContentAssembler.withoutStoredCopies(content);
        assertFalse(stored.containsKey("videoUrl"));
        assertEquals(true, stored.get("videoEnabled"));
        assertEquals("https://example.com/", stored.get("footerLinkUrl"));
    }

    /** TEXT는 plainText 컬럼을 쓰고 옵션 JSON의 오래된 사본보다 컬럼 값이 우선한다. */
    @Test void textUsesPlainTextAndColumnWinsOverStaleOptionCopy() {
        Map<String, Object> content = assembler.assemble(entity("TEXT", null, null, "본문", null,
                "{\"showPlainText\":true,\"description\":\"오래된 사본\",\"plainText\":\"오래된 본문\"}", null, null));
        assertEquals("본문", content.get("plainText"), "[설계 18 L-3] 정규 컬럼이 옵션 JSON의 사본보다 우선");
        assertFalse(content.containsKey("description"), "[설계 37] TEXT는 설명 필드를 제공하지 않고 옵션 사본도 싣지 않는다");
        assertFalse(content.containsKey("contentTitle"));
        assertFalse(content.containsKey("textBlocks"), "제목·설명이 없는 기존 일반 본문은 그대로 둔다");
        assertEquals(true, content.get("showPlainText"));
        assertFalse(content.containsKey("imageUrl"));
    }

    /** POL-03-01 : 저장·표시 경계 — 통합 전 TEXT의 제목·설명은 본문 앞 문단이 된다. */
    @Test void legacyTextTitleAndDescriptionBecomeLeadingParagraphs() {
        // 통합 전 행: 서식 본문 없이 plainText만 있는 경우
        Map<String, Object> plain = assembler.assemble(entity("TEXT", "안내", "설명\r\n둘째 줄", "본문1\n\n본문2", null,
                "{\"showContentHeader\":true}", null, null));
        assertEquals(List.of(
                block(Map.of("text", "안내", "bold", true, "size", 24)),
                block(Map.of("text", "설명\n둘째 줄")),
                block(Map.of("text", "본문1")),
                Map.of("alignment", "LEFT", "runs", List.of()),
                block(Map.of("text", "본문2"))), plain.get("textBlocks"));
        assertEquals("안내\n설명\n둘째 줄\n본문1\n\n본문2", plain.get("plainText"));
        assertEquals(plain.get("plainText"), PopupRichText.validateAndDerivePlainText(plain.get("textBlocks")),
                "합친 본문은 저장 검증을 통과하고 파생 plainText와 같다");
        assertFalse(plain.containsKey("showContentHeader") || plain.containsKey("contentTitle") || plain.containsKey("description"));

        // 서식 본문이 이미 있는 경우: 앞에 붙이고 기존 문단은 유지
        Map<String, Object> rich = assembler.assemble(entity("TEXT", "안내", null, "기존", null,
                "{\"textBlocks\":[{\"alignment\":\"CENTER\",\"runs\":[{\"text\":\"기존\",\"italic\":true}]}]}", null, null));
        assertEquals(2, ((List<?>) rich.get("textBlocks")).size());
        assertEquals(Map.of("alignment", "CENTER", "runs", List.of(Map.of("text", "기존", "italic", true))),
                ((List<?>) rich.get("textBlocks")).get(1));
        assertEquals("안내\n기존", rich.get("plainText"));

        // 제목·설명을 숨겼던 행은 표시하지 않던 값이므로 합치지 않는다
        Map<String, Object> hidden = assembler.assemble(entity("TEXT", "안내", "설명", "본문", null,
                "{\"showContentHeader\":false}", null, null));
        assertFalse(hidden.containsKey("textBlocks") || hidden.containsKey("showContentHeader"));
        assertEquals("본문", hidden.get("plainText"));
    }

    /** POL-03-01 : 저장·표시 경계 — 헤더 표시·본문 숨김이던 행은 "헤더만 보이기": 보이던 제목·설명만 문단으로, 숨긴 본문은 응답에서 제외. */
    @Test void legacyVisibleHeaderWithHiddenBodyShowsHeaderOnly() {
        for (String options : List.of(
                "{\"showContentHeader\":true,\"showPlainText\":false}",
                "{\"showPlainText\":false,\"textBlocks\":[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"숨긴 본문\"}]}]}")) {
            Map<String, Object> content = assembler.assemble(entity("TEXT", "안내", "설명", "숨긴 본문", null, options, null, null));
            assertEquals(List.of(
                    block(Map.of("text", "안내", "bold", true, "size", 24)),
                    block(Map.of("text", "설명"))), content.get("textBlocks"), options);
            assertEquals("안내\n설명", content.get("plainText"), "숨긴 본문은 plainText에도 없다");
            assertEquals(true, content.get("showPlainText"), "합친 헤더가 보이도록 본문 표시로 바꾼다");
            assertEquals(content.get("plainText"), PopupRichText.validateAndDerivePlainText(content.get("textBlocks")),
                    "재저장해도 같은 본문(숨긴 본문은 삭제)");
        }
        // 제목만 / 설명만
        Map<String, Object> titleOnly = assembler.assemble(entity("TEXT", "안내", null, "숨김", null, "{\"showPlainText\":false}", null, null));
        assertEquals("안내", titleOnly.get("plainText"));
        Map<String, Object> descriptionOnly = assembler.assemble(entity("TEXT", null, "설명", "숨김", null, "{\"showPlainText\":false}", null, null));
        assertEquals(List.of(block(Map.of("text", "설명"))), descriptionOnly.get("textBlocks"));
        // 헤더도 본문도 숨김: 아무것도 합치지 않고 숨김 유지
        Map<String, Object> allHidden = assembler.assemble(entity("TEXT", "안내", "설명", "본문", null,
                "{\"showContentHeader\":false,\"showPlainText\":false}", null, null));
        assertFalse(allHidden.containsKey("textBlocks"));
        assertEquals(false, allHidden.get("showPlainText"));
        assertEquals("본문", allHidden.get("plainText"));
        // 헤더 표시·본문 표시는 기존과 같이 헤더 + 본문
        Map<String, Object> bothShown = assembler.assemble(entity("TEXT", "안내", null, "본문", null, "{\"showPlainText\":true}", null, null));
        assertEquals("안내\n본문", bothShown.get("plainText"));
        // 이미 변환된 행(컬럼 비움)을 다시 읽어도 문단이 중복되지 않는다
        Map<String, Object> resaved = assembler.assemble(entity("TEXT", null, null, "안내\n설명", null,
                "{\"showPlainText\":true,\"textBlocks\":" + json(titleOnly.get("textBlocks")) + "}", null, null));
        assertEquals(titleOnly.get("textBlocks"), resaved.get("textBlocks"));
    }

    private static String json(Object value) {
        try {
            return new ObjectMapper().writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static Map<String, Object> block(Map<String, Object> run) {
        return Map.of("alignment", "LEFT", "runs", List.of(run));
    }

    /** TEXT 저장 시 showContentHeader 표시 여부는 저장하지 않는다. */
    @Test void textSaveDropsContentHeaderToggle() {
        assertFalse(PopupService.storedOptions("TEXT", Map.of("showContentHeader", true, "showHighlight", true))
                .containsKey("showContentHeader"));
    }

    /** 옵션 JSON에 남은 정규 컬럼 사본·서버 파생 키는 조회 content에 싣지 않는다. */
    @Test void storedCopiesAndDerivedKeysAreIgnored() {
        Map<String, Object> content = assembler.assemble(entity("VIDEO", "영상", null, null, "http://x/v.mp4",
                "{\"completionRatio\":0.5,\"allowCloseBeforeCompletion\":true,\"passingScore\":1,"
                        + "\"validateRequiredQuestions\":true,\"questions\":[],\"linkUrl\":\"http://old\",\"autoPlay\":true}",
                new BigDecimal("0.9000"), null));
        for (String key : new String[]{"completionRatio", "allowCloseBeforeCompletion", "passingScore",
                "validateRequiredQuestions", "questions", "linkUrl"}) {
            assertFalse(content.containsKey(key), key + "는 content에 두지 않는다");
        }
        assertEquals(true, content.get("autoPlay"));
    }

    /** 저장 시 CONTENT_OPTIONS에는 확장 옵션만 남긴다. */
    @Test void saveKeepsOnlyExtensionOptions() {
        Map<String, Object> options = PopupContentAssembler.withoutStoredCopies(Map.of(
                "contentTitle", "t", "description", "d", "plainText", "p", "linkUrl", "l",
                "completionRatio", 0.8, "questions", java.util.List.of(), "showHighlight", true));
        assertEquals(Map.of("showHighlight", true), options);
    }

    /** IMAGE·VIDEO는 제목·미디어 URL·설명을 정규 컬럼에서 채운다. */
    @Test void imageAndVideoMapMediaColumns() {
        Map<String, Object> image = assembler.assemble(entity("IMAGE", "이미지", null, null,
                "https://x/img.png", "{\"linkUrl\":\"https://x/link\"}", null, null));
        assertEquals("이미지", image.get("imageTitle"));
        assertEquals("https://x/img.png", image.get("imageUrl"));
        assertFalse(image.containsKey("linkUrl"), "IMAGE 클릭 링크는 폐기되어 예전 옵션 사본도 싣지 않는다");
        assertTrue(image.containsKey("description"), "원본처럼 null 값도 키로 포함한다");

        Map<String, Object> video = assembler.assemble(entity("VIDEO", "영상", "설명", null,
                "http://x/v.mp4", "{\"autoPlay\":true}", new BigDecimal("0.9000"), null));
        assertEquals("http://x/v.mp4", video.get("videoUrl"));
        assertFalse(video.containsKey("completionRatio"), "[설계 18 L-3] 완료 비율은 응답 최상위로만");
        assertFalse(video.containsKey("allowCloseBeforeCompletion"));
        assertEquals(true, video.get("autoPlay"));
    }

    /** SURVEY·QUIZ는 surveyTitle을 쓰고 파생 키(문항·통과 점수)를 content에 싣지 않는다. */
    @Test void surveyAndQuizShareSurveyTitleWithoutDerivedKeys() {
        for (String type : new String[]{"SURVEY", "QUIZ"}) {
            Map<String, Object> content = assembler.assemble(entity(type, "설문", "설명", null, null,
                    null, null, new BigDecimal("30.00")));
            assertEquals("설문", content.get("surveyTitle"));
            assertFalse(content.containsKey("passingScore"), "[설계 18 L-3] 통과 점수는 응답 최상위로만");
            assertFalse(content.containsKey("validateRequiredQuestions"));
            assertFalse(content.containsKey("questions"), "문항은 응답 최상위 questions로만");
        }
    }

    /** 손상된 CONTENT_OPTIONS는 팝업 ID를 담은 예외로 실패한다. */
    @Test void corruptedOptionsFailWithPopupId() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                assembler.assemble(entity("TEXT", "a", null, null, null, "{not json", null, null)));
        assertTrue(ex.getMessage().contains("P1"));
    }

    /** 알 수 없는 유형은 확장 옵션만 돌려준다. */
    @Test void unknownTypeReturnsOnlyOptions() {
        Map<String, Object> content = assembler.assemble(entity("OTHER", "a", "b", null, null,
                "{\"k\":1}", null, null));
        assertEquals(Map.of("k", 1), content);
    }
}
