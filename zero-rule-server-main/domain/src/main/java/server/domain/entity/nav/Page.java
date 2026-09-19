package server.domain.entity.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * 메뉴 페이지
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Page {

	/**
	 * PK1, 페이지ID, 일련번호
	 */
	private long pageId;

	/**
	 * 메뉴 키
	 * ex) 0001, 0002
	 */
	@Nullable
	private String pageKey;

	/**
	 * 메뉴 이름
	 * ex) AUDIT 로그
	 */
	@NonNull
	private String pageNm;

	@NonNull
	private String url;

	/**
	 * 메뉴 ICON
	 */
	@Nullable
	private String icon;

	/**
	 * 설명
	 */
	@Nullable
	private String dtlExpl;
}
