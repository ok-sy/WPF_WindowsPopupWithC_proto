package server.sql.nav;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * CLPageSectionMapper에서 사용하는 SQL Parameters
 */
abstract public class ParamsPageSection {

	@lombok.Data
	@lombok.Builder
	public static class Update {
		private long sectionId;

		@NonNull
		private String sectionNm;

		@Nullable
		private String icon;

		@Nullable
		private long upSectionId;
	}

}
