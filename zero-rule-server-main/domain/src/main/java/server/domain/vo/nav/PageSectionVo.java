package server.domain.vo.nav;

import lombok.Data;


@Data
public class PageSectionVo {

	/**
	 * PK1, 섹션ID, 일련번호
	 */
	private long sectionId;

	/**
	 * 섹션명
	 * ex) 룰 관리
	 */
	private String sectionNm;

	/**
	 * 아이콘
	 */
	private String icon;

	private Long upSectionId;

	private Long sectionSortNo;

}
