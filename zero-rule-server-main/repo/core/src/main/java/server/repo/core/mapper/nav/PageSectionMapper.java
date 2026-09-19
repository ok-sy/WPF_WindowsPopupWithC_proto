package server.repo.core.mapper.nav;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import server.domain.entity.nav.PageSection;
import server.domain.vo.nav.PageSectionVo;
import server.sql.nav.ParamsPageSection;


@Mapper
public interface PageSectionMapper {
	/**
	 * 등록
	 */
	void insert(@NonNull PageSection section);

	@Nullable
	PageSectionVo findVoById(long sectionId);

	int update(ParamsPageSection.Update section);

	int deleteById(long sectionId);

	void updateUpSectionId(@Param("upSectionId")@Nullable Long upSectionId, @Param("sectionSortNo") Long sectionSortNo, @Param("sectionId") Long sectionId);
}
