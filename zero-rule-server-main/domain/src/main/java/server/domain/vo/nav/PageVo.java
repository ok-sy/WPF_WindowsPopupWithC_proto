package server.domain.vo.nav;

import lombok.Data;


@Data
public class PageVo {

	/**
	 * PK1, 페이지ID, 일련번호
	 */
	private long pageId;

	/**
	 * 메뉴 이름
	 * ex) AUDIT 로그
	 */
	private String pageNm;

	/**
	 * 메뉴 키
	 * ex) 0001, 0002
	 */
	private String pageKey;

	/**
	 * 메뉴 ICON
	 */
	private String icon;

	private String url;

	/**
	 * 설명
	 */
	private String dtlExpl;

	/**
	 * 업무구분코드
	 */
	private String tskClsfCd;

	/**
	 *
	 */
	private String screTpcd;
}
