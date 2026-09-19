package server.service.core.nav;

import cl.cloverframework.CLException;
import cl.cloverframework.impl.repo.CLSequenceMapper;
import com.google.common.base.Functions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.nav.Nav;
import server.domain.entity.nav.NavItem;
import server.domain.entity.nav.Page;
import server.domain.entity.nav.PageSection;
import server.domain.vo.nav.*;
import server.repo.core.mapper.nav.NavItemMapper;
import server.repo.core.mapper.nav.NavMapper;
import server.repo.core.mapper.nav.PageMapper;
import server.repo.core.mapper.nav.PageSectionMapper;
import server.sql.nav.ParamsNavItem;
import server.sql.nav.ParamsPageSection;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NavService {

	@Autowired
	NavMapper navMapper;

	@Autowired
	NavItemMapper navItemMapper;

	@Autowired
	PageSectionMapper pageSectionMapper;

	@Autowired
	PageMapper pageMapper;

	@Autowired
	CLSequenceMapper sequenceMapper;


	/**
	 * CLNav 신규 등록
	 */
	@Transactional
	public void createNav(long navId, @NonNull String navNm, @Nullable String expl) {
		navMapper.insert(
				Nav.builder()
						.navId(navId)
						.navNm(navNm)
						.expl(expl)
						.build()
		);
	}


	/**
	 * CLNav 업데이트
	 */
	@Transactional
	public int updateNav(long navId, @NonNull String navNm, @Nullable String expl) {
		return navMapper.update(
				Nav.builder()
						.navId(navId)
						.navNm(navNm)
						.expl(expl)
						.build()
		);
	}

	/**
	 * CLNav 삭제 by PK
	 */
	@Transactional
	public int deleteNavByPk(long navId) {
		return navMapper.deleteById(navId);
	}

	/**
	 * CLNavItems 삭제
	 */
	@Transactional
	public int deleteNavItemsByNavId(long navId) {
		return navMapper.navItemDeleteById(navId);
	}

	/**
	 * CLNavVo 단건 조회
	 */
	@Nullable
	public NavVo findNavVoById(long navId) {
		return navMapper.findVoById(navId);
	}

	/**
	 * CLNavVo 다건 조회
	 */
	public List<NavVo> findNavVoListAll() {
		return navMapper.findVoList();
	}

	/**
	 * CLNav 존재 여부 체크
	 */
	public boolean existsNavById(long navId) {
		return navMapper.existsById(navId);
	}

	// findNavItems 내부
	public List<INavItem> findNavItems(long navId, boolean withUnusedItems) {
		List<NavPageItemVo> pageItems = navItemMapper.findPageItemsByNavId(navId);

		Map<Long, Page> allPageMap = new HashMap<>();
		if (withUnusedItems) {
			allPageMap = pageMapper.findAll().stream()
					.collect(Collectors.toMap(Page::getPageId, Functions.identity()));
			if (pageItems.isEmpty()) return Collections.emptyList();
		}

		Map<Long, NavSectionItemVo> sectionCache = new HashMap<>();
		List<INavItem> results = new ArrayList<>();

		for (NavPageItemVo page : pageItems) {
			page.setHidden(false);
			if (withUnusedItems) allPageMap.remove(page.getPageId());

			Long sectionId = page.getSectionId();
			if (sectionId == null) {
				results.add(page);
			} else {
				NavSectionItemVo leafSection = buildOrGetSectionTree(sectionId, sectionCache);
				if (leafSection.getSubitems().stream().noneMatch(p -> p instanceof NavPageItemVo &&
						((NavPageItemVo) p).getPageId().equals(page.getPageId()))) {
					leafSection.getSubitems().add(page);
				}
			}
		}

		// 루트 섹션만 추가
		Set<Long> childSectionIds = sectionCache.values().stream()
				.flatMap(sec -> sec.getSubitems().stream())
				.filter(s -> s instanceof NavSectionItemVo)
				.map(s -> ((NavSectionItemVo) s).getSectionId())
				.collect(Collectors.toSet());

		for (NavSectionItemVo sec : sectionCache.values()) {
			if (!childSectionIds.contains(sec.getSectionId())) {
				results.add(sec);
			}
		}

		// 사용하지 않는 페이지
		if (withUnusedItems) {
			long sortNo = pageItems.isEmpty() ? 1 : 1 + pageItems.get(pageItems.size() - 1).getSortNo();
			for (Page page : allPageMap.values()) {
				results.add(NavPageItemVo.builder()
						.pageId(page.getPageId())
						.sectionId(null)
						.pageNm(page.getPageNm())
						.pageKey(page.getPageKey())
						.url(page.getUrl())
						.icon(page.getIcon())
						.sortNo(sortNo++)
						.hidden(true)
						.build());
			}
		}

		// 정렬: 최상위 sectionSortNo → sortNo (사용자 저장 순서 보장)
		sortNavItems(results);

		return results;
	}

	private void sortNavItems(List<INavItem> items) {
		if (items == null || items.isEmpty()) return;

		// 먼저 자식 정렬
		for (INavItem item : items) {
			if (item instanceof NavSectionItemVo) {
				sortNavItems(((NavSectionItemVo) item).getSubitems());
			}
		}

		// 현재 레벨 정렬 (sortNo만 사용)
		items.sort((a, b) -> {
			long sortA = (a instanceof NavPageItemVo)
					? ((NavPageItemVo) a).getSortNo()
					: (((NavSectionItemVo) a).getSectionSortNo() != null
					? ((NavSectionItemVo) a).getSectionSortNo()
					: Long.MAX_VALUE);

			long sortB = (b instanceof NavPageItemVo)
					? ((NavPageItemVo) b).getSortNo()
					: (((NavSectionItemVo) b).getSectionSortNo() != null
					? ((NavSectionItemVo) b).getSectionSortNo()
					: Long.MAX_VALUE);

			return Long.compare(sortA, sortB);
		});
	}

	private NavSectionItemVo buildOrGetSectionTree(Long sectionId, Map<Long, NavSectionItemVo> cache) {
		if (cache.containsKey(sectionId)) return cache.get(sectionId);

		PageSectionVo section = pageSectionMapper.findVoById(sectionId);
		if (section == null) return null;

		// null-safe 처리
		long sectionSortNo = section.getSectionSortNo() != null
				? section.getSectionSortNo()
				: (section.getUpSectionId() != null
				? pageSectionMapper.findVoById(section.getUpSectionId()).getSectionSortNo()
				: Long.MAX_VALUE);

		NavSectionItemVo current = NavSectionItemVo.builder()
				.sectionId(section.getSectionId())
				.sectionNm(section.getSectionNm())
				.icon(section.getIcon())
				.sectionSortNo(sectionSortNo)
				.subitems(new ArrayList<>())
				.build();

		cache.put(sectionId, current);

		if (section.getUpSectionId() != null) {
			NavSectionItemVo parent = buildOrGetSectionTree(section.getUpSectionId(), cache);
			if (parent != null && parent.getSubitems().stream()
					.noneMatch(s -> s instanceof NavSectionItemVo &&
							((NavSectionItemVo) s).getSectionId().equals(current.getSectionId()))) {
				parent.getSubitems().add(current);
			}
		}

		return current;
	}

	private boolean nullOrEqual(Long v1, Long v2) {
		if (v1 == null && v2 == null) {
			return true;
		} else if (v1 == null || v2 == null) {
			return false;
		}
		return v1.equals(v2);
	}

	/**
	 * 정렬을 저장한다
	 */
	@Transactional
	public void saveSort(long navId, List<ItemSortRequestVo> items) {
		Nav nav = navMapper.findById(navId);
		if (nav == null) {
			throw new CLException("NO_SUCH_NAV", "해당 메뉴가 없습니다");
		}

		Map<Long, NavPageItemVo> oldPageItemMap = navItemMapper.findPageItemsByNavId(navId)
				.stream()
				.collect(Collectors.toMap(NavPageItemVo::getPageId, Functions.identity()));

		// 삭제 대상 페이지 정리
		Set<Long> oldPageIdSet = oldPageItemMap.keySet();
		Set<Long> newPageIdSet = items.stream()
				.filter(it -> it.getPageId() != null)
				.map(ItemSortRequestVo::getPageId)
				.collect(Collectors.toSet());
		Set<Long> toRemovePageIds = new HashSet<>(oldPageIdSet);
		toRemovePageIds.removeAll(newPageIdSet);
		if (!toRemovePageIds.isEmpty()) {
			navItemMapper.deleteByNavIdAndPageIdIn(
					ParamsNavItem.DeleteByNavIdAndPageIdIn.builder()
							.navId(navId)
							.pageIds(toRemovePageIds)
							.build()
			);
		}

		// 사용자가 넘겨준 순서 그대로 저장
		for (int i = 0; i < items.size(); i++) {
			ItemSortRequestVo item = items.get(i);
			long sortNo = i + 1; // 1부터 증가

			if (item.getPageId() == null) {
				// --- 섹션 ---
				pageSectionMapper.updateUpSectionId(item.getUpSectionId(), sortNo, item.getSectionId());

			} else {
				// --- 페이지 ---
				final Long pageId = item.getPageId();
				final Long sectionId = item.getSectionId();
				final NavPageItemVo old = oldPageItemMap.get(pageId);

				if (old == null) {
					navItemMapper.insert(
							NavItem.builder()
									.itemId(sequenceMapper.nextCommonSeq())
									.navId(navId)
									.pageId(pageId)
									.sectionId(sectionId)
									.sortNo(sortNo) // 리스트 순서 그대로
									.build()
					);
				} else {
					if (!Objects.equals(sectionId, old.getSectionId()) ||
							!Objects.equals(sortNo, old.getSortNo())) {
						navItemMapper.updateSectionIdAndSortNo(
								ParamsNavItem.UpdateSectionIdAndSortNo.builder()
										.navId(navId)
										.pageId(pageId)
										.sectionId(sectionId)
										.sortNo(sortNo) // 갱신
										.build()
						);
					}
				}
			}
		}
	}

	@Transactional
	public void createSection(long sectionId, @NonNull String sectionNm, @Nullable String icon) {
		pageSectionMapper.insert(
				PageSection.builder()
						.sectionId(sectionId)
						.sectionNm(sectionNm)
						.icon(icon)
						.build()
		);
	}


	@Transactional
	public void updateSection(long sectionId, @NonNull String sectionNm, @Nullable String icon) {
		int updatedRows = pageSectionMapper.update(
				ParamsPageSection.Update.builder()
						.sectionId(sectionId)
						.sectionNm(sectionNm)
						.icon(icon)
						.build()
		);
		if (updatedRows <= 0) {
			log.warn("update section fail: sectionId={}, sectionNm={}", sectionId, sectionNm);
		}
	}


	@Transactional
	public void deleteSectionByNavIdAndSectionId(long navId, long sectionId) {
		// navId에서 사용중인 sectionId를 null로 업데이트
		navItemMapper.updateSectionId(ParamsNavItem.UpdateSectionId.builder()
				.navId(navId)
				.sectionId(sectionId)
				.newSectionId(null)
				.build());

		// sectionId를 사용하는 곳이 없다면, 삭제
		if (!navItemMapper.existsBySectionId(sectionId)) {
			pageSectionMapper.deleteById(sectionId);
		}
	}


	@Nullable
	public PageSectionVo findSectionVoById(long sectionId) {
		return pageSectionMapper.findVoById(sectionId);
	}

	@Transactional
	public void deletePage(long pageId) {
		navItemMapper.deleteByPageId(pageId);
		pageMapper.deleteById(pageId);
	}

	@Transactional
	public void createPage(Page page) {
		pageMapper.insert(page);
	}


	@Transactional
	public void updatePage(Page page) {
		int updatedRows = pageMapper.update(page);
		if (updatedRows <= 0) {
			log.warn("update page fail: pageId={}, pageNm={}", page.getPageId(), page.getPageNm());
		}
	}


	@Nullable
	public PageVo findPageVoById(long pageId) {
		return pageMapper.findVoById(pageId);
	}

	/**
	 * 전체 페이지 목록 조회
	 */
	@Nullable
	public List<PageVo> findPageVoList() {
		return pageMapper.findVoList();
	}
}
