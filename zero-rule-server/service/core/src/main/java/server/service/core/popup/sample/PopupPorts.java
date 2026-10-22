package server.service.core.popup.sample;

import server.domain.popup.sample.PopupContentRow;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


import com.fasterxml.jackson.databind.node.ArrayNode;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * ■ 샘플 연결 지점 모음
 * - in : 조회 행(PopupContentRow)·사번·유형·파일 경로
 * - out: 전달 건 ID·폴링 주기·문항 배열·파일 URL
 * - 샘플이 직접 구현하지 않는 연결 지점. 실제 서버에서는 기존 서비스 구현으로 교체한다.
 */
public final class PopupPorts {

    private PopupPorts() {
    }

    /**
     * 전달 건 ID·폴링 주기. [교체 지점] 기존 WpfPopupService의 전달 건 생성/재사용·소유권·중복 처리와 설정값을 사용한다.
     * deliveryId를 콘텐츠 ID에서 파생하지 않는다.
     */
    public interface DeliveryPort {
        /** POL-10-01 : 전달과 제출 식별 — 조회 행·사번으로 전달 건 ID를 발급하거나 재사용한다. */
        String issueDeliveryId(PopupContentRow row, String userId);

        /** POL-09-02 : 조회 응답 — 응답에 실을 폴링 주기(초). */
        int pollingIntervalSeconds();
    }

    /**
     * SURVEY·QUIZ 문항·선택지. [교체 지점] 별도 문항/선택지 테이블 조회 후 기존 응답 {@code questions[]} 형태로 조립한다
     * (QUIZ만 정답 키 포함, SURVEY는 정답 키 제거 — 기존 WpfPopupItem.withoutAnswerKey 규칙).
     */
    public interface QuestionPort {
        /** POL-06-02 : 선택·제출 — 조회 행·유형의 문항 배열(SURVEY·QUIZ 외 유형은 null 가능). */
        ArrayNode questions(PopupContentRow row, String popupType);
    }

    /**
     * 파일 경로·이름 → WPF가 접근할 URL. [교체 지점] 실제 파일 서버·영상 Range API(samples/popup-video-range) 주소 규칙.
     * 경로 구분자(/)는 유지하고 각 세그먼트를 URL 인코딩한다.
     * 첨부 ID(APND_FILE_ID) 방식이면 이 클래스를 교체한다. 기존 서버의 첨부 URL 규칙은 {@code FileIdToUrlImpl.urlWithFileName}
     * ({@code p/file/download2/{fileId}/{fileName}})이며, 첨부 ID는 {@code PopupContentRow.attachFileId}로 이미 조회된다.
     * 계약: 파일명이 없으면(경로만 있어도) URL을 만들지 않고 null — 호출자는 content의 URL을 유지한다. 경로 없이 파일명만 있으면 기준 주소 바로 아래로 만든다.
     */
    public static class FileUrlResolver {
        private final String baseUrl;

        /** ■ 생성 - in : baseUrl(String) 파일 URL 기준 주소(끝 / 제거) - out: 변환기 인스턴스 */
        public FileUrlResolver(String baseUrl) {
            this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        }

        /**
         * ■ 파일 URL 생성
         * - in : path(String) 파일 경로 · name(String) 파일 이름
         * - out: String 인코딩된 URL(파일명이 비면 null)
         */
        public String resolve(String path, String name) {
            if (name == null || name.isBlank()) return null;
            String joined = ((path == null ? "" : path.replace('\\', '/')) + "/" + (name == null ? "" : name)).replaceAll("/+", "/");
            String encoded = Arrays.stream(joined.split("/"))
                    .filter(segment -> !segment.isEmpty())
                    .map(segment -> URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"))
                    .collect(Collectors.joining("/"));
            return baseUrl + "/" + encoded;
        }
    }

    /** 샘플 전용: 무작위 UUID와 고정 주기. 업무 전달 건이 아니며 결과 수신과 연결되지 않는다. */
    public static class SampleDeliveryPort implements DeliveryPort {
        private final int pollingIntervalSeconds;

        public SampleDeliveryPort(int pollingIntervalSeconds) {
            this.pollingIntervalSeconds = pollingIntervalSeconds;
        }

        @Override
        public String issueDeliveryId(PopupContentRow row, String userId) {
            return UUID.randomUUID().toString();
        }

        @Override
        public int pollingIntervalSeconds() {
            return pollingIntervalSeconds;
        }
    }

    /** 샘플 전용: 문항 조회 미연결. SURVEY·QUIZ는 빈 문항으로 위장하지 않고 오류로 처리한다. */
    public static class UnconnectedQuestionPort implements QuestionPort {
        @Override
        public ArrayNode questions(PopupContentRow row, String popupType) {
            if (List.of("SURVEY", "QUIZ").contains(popupType)) {
                throw new PopupSampleException(PopupSampleException.Reason.QUESTIONS_NOT_CONNECTED, row.getContentId(),
                        popupType + " 문항 조회가 연결되지 않았습니다(QuestionPort 교체 필요).");
            }
            return null;
        }
    }
}
