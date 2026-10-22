package server.domain.popup.sample;

import java.math.BigDecimal;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * ■ 단건 조회 결과 VO(샘플)
 * - in : MyBatis resultMap {@code popupContentRow} 컬럼(아래 표)
 * - out: 표시 후보 1건(getter/setter)
 * - 단건 조회 결과 VO(MyBatis resultMap {@code popupContentRow}). 한 행 = 표시 후보 1건.
 *
 * <p>컬럼은 팝업콘텐츠기본 DTIY3111 사진 정의(docs/interfaces/DTIY3111_SCHEMA_OCR.md)를 따른다. 사진 판독이며 확정 DDL이 아니므로
 * <b>미확인</b> 표시는 최신 정의에서 이름·타입을 확인해 교체한다.</p>
 *
 * <table>
 *   <tr><th>필드</th><th>컬럼</th><th>의미</th></tr>
 *   <tr><td>postId</td><td>(미확인) 게시 테이블 ID</td><td>게시(대상·일정) 식별자. 응답 필드가 아니라 전달 건 발급 포트 입력</td></tr>
 *   <tr><td>contentId</td><td>POPU_CNTN_ID</td><td>콘텐츠 ID → 응답 {@code popupId}(결과 집계 기준 식별자)</td></tr>
 *   <tr><td>contentTypeCode</td><td>POPU_CNTN_TP_CD</td><td>유형 공통 코드 → {@code popupType}</td></tr>
 *   <tr><td>headerTitle</td><td>HDR_TITL</td><td>Header 제목 → {@code title}</td></tr>
 *   <tr><td>width / height</td><td>POPU_WDTH_SZ / POPU_LNTH_SZ</td><td>창 크기 → {@code width}/{@code height}</td></tr>
 *   <tr><td>afterConfirmYn</td><td>AFTR_CNFM_OBJ_YN</td><td>나중에 확인 대상 여부 Y/N → {@code showLater}</td></tr>
 *   <tr><td>footerButtonTypeCode</td><td>FTR_BTN_TP_CD</td><td>푸터 버튼 공통 코드 → {@code footerAction}</td></tr>
 *   <tr><td>footerUrl</td><td>FTR_URL</td><td>바로가기 URL → {@code footerLinkUrl}</td></tr>
 *   <tr><td>imageFilePath / imageFileName</td><td>IMG_FILE_PATH_CN / IMG_FILE_NM</td><td>IMAGE 파일 → {@code content.imageUrl}</td></tr>
 *   <tr><td>videoFilePath / videoFileName</td><td>VDO_FILE_PATH_CN / VDO_FILE_NM</td><td>VIDEO·영상+퀴즈 파일 → {@code content.videoUrl}</td></tr>
 *   <tr><td>attachFileId</td><td>APND_FILE_ID</td><td>첨부파일 ID. 현재 URL 생성에 미사용 — 첨부 ID 방식이면 FileUrlResolver 교체 시 사용</td></tr>
 *   <tr><td>contentJson</td><td>CNTN_CN (CLOB)</td><td>콘텐츠 JSON 객체 → {@code content}</td></tr>
 * </table>
 */
public class PopupContentRow {

    private String postId;
    private String contentId;
    private String contentTypeCode;
    private String headerTitle;
    private BigDecimal width;
    private BigDecimal height;
    private String afterConfirmYn;
    private String footerButtonTypeCode;
    private String footerUrl;
    private String imageFilePath;
    private String imageFileName;
    private String videoFilePath;
    private String videoFileName;
    private String attachFileId;
    /** CLOB을 MyBatis ClobTypeHandler(jdbcType=CLOB, javaType=String)로 문자열로 읽는다. */
    private String contentJson;

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public String getContentTypeCode() { return contentTypeCode; }
    public void setContentTypeCode(String contentTypeCode) { this.contentTypeCode = contentTypeCode; }
    public String getHeaderTitle() { return headerTitle; }
    public void setHeaderTitle(String headerTitle) { this.headerTitle = headerTitle; }
    public BigDecimal getWidth() { return width; }
    public void setWidth(BigDecimal width) { this.width = width; }
    public BigDecimal getHeight() { return height; }
    public void setHeight(BigDecimal height) { this.height = height; }
    public String getAfterConfirmYn() { return afterConfirmYn; }
    public void setAfterConfirmYn(String afterConfirmYn) { this.afterConfirmYn = afterConfirmYn; }
    public String getFooterButtonTypeCode() { return footerButtonTypeCode; }
    public void setFooterButtonTypeCode(String footerButtonTypeCode) { this.footerButtonTypeCode = footerButtonTypeCode; }
    public String getFooterUrl() { return footerUrl; }
    public void setFooterUrl(String footerUrl) { this.footerUrl = footerUrl; }
    public String getImageFilePath() { return imageFilePath; }
    public void setImageFilePath(String imageFilePath) { this.imageFilePath = imageFilePath; }
    public String getImageFileName() { return imageFileName; }
    public void setImageFileName(String imageFileName) { this.imageFileName = imageFileName; }
    public String getVideoFilePath() { return videoFilePath; }
    public void setVideoFilePath(String videoFilePath) { this.videoFilePath = videoFilePath; }
    public String getVideoFileName() { return videoFileName; }
    public void setVideoFileName(String videoFileName) { this.videoFileName = videoFileName; }
    public String getAttachFileId() { return attachFileId; }
    public void setAttachFileId(String attachFileId) { this.attachFileId = attachFileId; }
    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }
}
