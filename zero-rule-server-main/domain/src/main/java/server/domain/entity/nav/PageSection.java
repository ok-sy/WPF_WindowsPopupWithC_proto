package server.domain.entity.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * 메뉴 섹션
 */
@Data
@NoArgsConstructor(force = true)
@AllArgsConstructor
@Builder
public class PageSection {

	/**
	 * PK1, 섹션ID, 일련번호
	 */
	private long sectionId;


	/**
	 * 섹션명
	 * ex) 룰 관리
	 */
	@NonNull
	private String sectionNm;


	/**
	 * 아이콘
	 * ex) face
	 */
	@Nullable
	private String icon;

	@Nullable
	private long upSectionId;

	@Nullable
	private long sectionSortNo;

}
