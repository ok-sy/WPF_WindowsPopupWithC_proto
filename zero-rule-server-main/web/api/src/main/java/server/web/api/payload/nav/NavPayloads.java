package server.web.api.payload.nav;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import server.domain.vo.nav.*;

import java.util.List;


abstract public class NavPayloads {
	@Data
	@NoArgsConstructor(force = true)
	public static class CreateRequest {

		@NonNull
		private String navNm;

		@Nullable
		private String expl;
	}

	@Data
	@NoArgsConstructor(force = true)
	public static class UpdateRequest {

		private long navId;

		@NonNull
		private String navNm;

		@Nullable
		private String expl;
	}

	@Data
	@Builder
	public static class InfoResponse {
		@NonNull
		private NavVo nav;
	}

	@Data
	@Builder
	public static class SectionInfoResponse {
		@NonNull
		private PageSectionVo section;
	}

	@Data
	@Builder
	public static class PageInfoResponse {
		@NonNull
		private PageVo page;
	}

	@Data
	@Builder
	public static class PageListResponse {
		@NonNull
		private List<PageVo> pageList;
	}

	@Data
	@Builder
	public static class NavListResponse {
		private List<NavVo> navList;
	}


	@Data
	@Builder
	public static class ItemListResponse {
		@NonNull
		private NavVo nav;

		private List<INavItem> navItemList;
	}


	@Data
	@NoArgsConstructor
	public static class ItemSortRequest {
		private long navId;

		private List<ItemSortRequestVo> items;
	}

	@Data
	@NoArgsConstructor(force = true)
	public static class SectionCreateRequest {

		@NonNull
		private String sectionNm;

		@Nullable
		private String icon;
	}

	@Data
	@NoArgsConstructor(force = true)
	public static class SectionUpdateRequest {
		private long sectionId;

		@NonNull
		private String sectionNm;

		@Nullable
		private String icon;
	}


	@Data
	@NoArgsConstructor(force = true)
	public static class PageUpdateRequest {

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


	@Data
	@NoArgsConstructor(force = true)
	public static class PageCreateRequest {

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
}
