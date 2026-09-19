package server.domain.vo.nav;

import lombok.Builder;
import lombok.Data;
import server.base.nav.NavItemType;

import java.util.ArrayList;
import java.util.List;


@Data
@Builder
public class NavSectionItemVo implements INavItem {

	/**
	 * 섹션ID, 일련번호
	 */
	private Long sectionId;

	/**
	 * 섹션 이름
	 */
	private String sectionNm;

	/**
	 * 아이콘
	 */
	private String icon;

	/**
	 * 아이콘
	 */
	private Long sectionSortNo;


	/**
	 * 아이템 타입, 고정값 SECTION
	 */
	@Override
	public NavItemType getItemType() {
		return NavItemType.SECTION;
	}

	/**
	 * 섹션 아래의 페이지들
	 */
	@Builder.Default
	private List<INavItem> subitems = new ArrayList<>();
}
