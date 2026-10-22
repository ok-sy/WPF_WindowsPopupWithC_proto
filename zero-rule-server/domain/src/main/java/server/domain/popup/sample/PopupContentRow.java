package server.domain.popup.sample;

import java.math.BigDecimal;

/**
 * [TODO65] 단건 조회 결과 VO(MyBatis resultMap {@code popupContentRow}). 한 행 = 표시 후보 1건.
 *
 * <p>컬럼은 제공된 팝업콘텐츠기본 DTIY3111 정의를 시작점으로 한다. <b>미확인</b> 표시가 있는 컬럼은 최신 정의에서
 * 이름·타입을 확인해 교체한다.</p>
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
 *   <tr><td>filePath / fileName</td><td>(미확인) 첨부 파일 경로·이름</td><td>IMAGE·VIDEO 파일 → {@code content.imageUrl}/{@code videoUrl}</td></tr>
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
    private String filePath;
    private String fileName;
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
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }
}
