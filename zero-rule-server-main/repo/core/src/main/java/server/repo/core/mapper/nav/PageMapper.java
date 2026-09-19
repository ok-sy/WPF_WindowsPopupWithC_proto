package server.repo.core.mapper.nav;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import server.domain.entity.nav.Page;
import server.domain.vo.nav.PageVo;

import java.util.List;


@Mapper
public interface PageMapper {
	/**
	 * 등록
	 */
	void insert(@NonNull Page page);

	/**
	 * 수정
	 */
	int update(@NonNull Page page);

	@Nullable
	Page findById(long pageId);

	@Nullable
	PageVo findVoById(long pageId);

	/**
	 * 다건 조회 - vo 전체
	 */
	List<PageVo> findVoList();

	/**
	 * 존재 여부 체크 by PK
	 */
	boolean existsById(long pageId);

	/**
	 * 삭제 by PK
	 */
	int deleteById(long pageId);



	/**
	 * 다건 조회 - 전체
	 */
	List<Page> findAll();
}
