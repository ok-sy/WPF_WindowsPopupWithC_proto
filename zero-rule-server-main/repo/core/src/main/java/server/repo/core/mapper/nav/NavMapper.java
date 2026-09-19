package server.repo.core.mapper.nav;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import server.domain.entity.nav.Nav;
import server.domain.vo.nav.NavVo;

import java.util.List;


@Mapper
public interface NavMapper {
	/**
	 * 등록
	 */
	void insert(@NonNull Nav nav);

	/**
	 * 수정
	 */
	int update(@NonNull Nav nav);

	@Nullable
	Nav findById(long navId);

	@Nullable
	NavVo findVoById(long navId);

	/**
	 * 존재 여부 체크 by PK
	 */
	boolean existsById(long navId);

	/**
	 * 삭제 by PK
	 */
	int deleteById(long navId);

	/**
	 * 삭제 by PK
	 */
	int navItemDeleteById(long navId);

	/**
	 * 다건 조회 - vo 전체
	 */
	List<NavVo> findVoList();
}
