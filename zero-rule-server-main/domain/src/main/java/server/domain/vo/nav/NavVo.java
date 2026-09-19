package server.domain.vo.nav;

import lombok.Data;


@Data
public class NavVo {

	/**
	 * PK1, 메뉴ID, 일련번호
	 */
	private long navId;

	/**
	 * 메뉴 이름
	 */
	private String navNm;

	/**
	 * 설명
	 */
	private String expl;
}
