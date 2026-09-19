package server.sql.nav;

import org.springframework.lang.Nullable;

import java.util.Collection;

/**
 * CLNavItemMapper에서 사용하는 SQL Parameters
 */
abstract public class ParamsNavItem {

	@lombok.Data
	@lombok.Builder
	public static class UpdateSectionIdAndSortNo {
		private long navId;

		private long pageId;

		@Nullable
		private Long sectionId;

		private long sortNo;
	}


	@lombok.Data
	@lombok.Builder
	public static class DeleteByNavIdAndPageIdIn {
		private long navId;
		private Collection<Long> pageIds;
	}


	@lombok.Data
	@lombok.Builder
	public static class UpdateSectionId {
		private long navId;

		private long sectionId;

		@Nullable
		private Long newSectionId;
	}


}
