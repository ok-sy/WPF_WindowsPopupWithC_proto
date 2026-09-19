package server.domain.vo.nav;

import lombok.Data;
import org.springframework.lang.Nullable;


/**
 * 아이템 정렬 요청 데이터
 */
@Data
public class ItemSortRequestVo {

	/**
	 * 페이지ID
	 */
	@Nullable
	private Long pageId;

	/**
	 * 섹션 ID
	 */
	@Nullable
	private Long sectionId;

	/**
	 * 섹션 ID
	 */
	@Nullable
	private Long upSectionId;

}
