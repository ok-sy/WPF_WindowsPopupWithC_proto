package server.repo.core.mapper.nav;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.NonNull;
import server.domain.entity.nav.NavItem;
import server.domain.entity.nav.PageSection;
import server.domain.vo.nav.NavPageItemVo;
import server.sql.nav.ParamsNavItem;

import java.util.List;


@Mapper
public interface NavItemMapper {
	/**
	 * 등록
	 */
	void insert(@NonNull NavItem navItem);

	void updateSectionIdAndSortNo(@NonNull ParamsNavItem.UpdateSectionIdAndSortNo params);


	int updateSectionId(@NonNull ParamsNavItem.UpdateSectionId params);

	List<NavPageItemVo> findPageItemsByNavId(long navId);


	List<PageSection> findSectionListByNavId(long navId);

	int deleteByNavIdAndPageIdIn(@NonNull ParamsNavItem.DeleteByNavIdAndPageIdIn params);

	int deleteByPageId(long pageId);

	boolean existsBySectionId(long sectionId);
}
