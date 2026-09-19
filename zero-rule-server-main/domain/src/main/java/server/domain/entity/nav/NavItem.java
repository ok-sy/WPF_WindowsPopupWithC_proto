package server.domain.entity.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;

/**
 * 메뉴 아이템
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavItem {

	/**
	 * PK1, 아이템ID
	 * 일련번호
	 */
	private long itemId;

	private long navId;

	private long pageId;

	@Nullable
	private Long sectionId;

	/**
	 * 정렬번호
	 */
	private long sortNo;
}
