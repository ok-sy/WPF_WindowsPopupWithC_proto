package server.domain.vo.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;
import server.base.nav.NavItemType;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NavPageItemVo implements INavItem {
	/**
	 * PK1, 페이지ID, 일련번호
	 */
	private Long pageId;

	@Nullable
	@Builder.Default
	private Long sectionId = null;

	/**
	 * 페이지 이름
	 */
	private String pageNm;

	/**
	 * 페이지 Key
	 */
	private String pageKey;

	/**
	 * 페이지 URL
	 */
	private String url;

	/**
	 * 아이콘
	 */
	private String icon;

	/**
	 * 정렬번호
	 */
	private Long sortNo;

	/**
	 * 숨김여부
	 */
	@Builder.Default
	private boolean hidden = false;

	/**
	 * 아이템 타입, 고정값 PAGE
	 */
	@Override
	public NavItemType getItemType() {
		return NavItemType.PAGE;
	}
}
