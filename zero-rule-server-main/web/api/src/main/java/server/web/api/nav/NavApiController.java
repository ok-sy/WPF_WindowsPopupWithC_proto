package server.web.api.nav;

import cl.cloverframework.api.CLApiResponse;
import cl.cloverframework.impl.CLRequestUserHelper;
import cl.cloverframework.impl.service.CLSequenceService;
import cl.cloverframework.log.CLAuditLogKind;
import cl.cloverframework.log.ICLAuditLogSaver;
import cl.cloverframework.web.support.CLApiBaseController;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.domain.entity.nav.Page;
import server.domain.vo.nav.NavVo;
import server.domain.vo.nav.PageVo;
import server.service.core.nav.NavService;
import server.web.api.payload.nav.NavPayloads;

@RestController
@Tag(name = "Clover Framework Menu", description = "메뉴 관리")
public class NavApiController extends CLApiBaseController {

	@Autowired
	NavService navService;

	@Autowired
	CLSequenceService sequenceService;

	@Autowired
	ICLAuditLogSaver auditLogSaver;

	@Autowired
	CLRequestUserHelper requestUserHelper;

	private NavPayloads.InfoResponse getNavResponse(long navId) {
		return NavPayloads.InfoResponse.builder()
			.nav(navService.findNavVoById(navId))
			.build();
	}

	private NavPayloads.SectionInfoResponse getSectionResponse(long sectionId) {
		return NavPayloads.SectionInfoResponse.builder()
			.section(navService.findSectionVoById(sectionId))
			.build();
	}


	private NavPayloads.PageInfoResponse getPageResponse(long pageId) {
		return NavPayloads.PageInfoResponse.builder()
			.page(navService.findPageVoById(pageId))
			.build();
	}


	@PostMapping("/apis/nav/create")
	public CLApiResponse<NavPayloads.InfoResponse> createNav(
		@RequestBody @Valid NavPayloads.CreateRequest payload
	) {
		long navId = sequenceService.nextCommonSeq();
		navService.createNav(
			navId,
			payload.getNavNm(),
			payload.getExpl()
		);
		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"새 NAV 생성",
			String.format("생성된 네비 명 : %s", payload.getNavNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);
		return CLApiResponse.success(getNavResponse(navId));
	}


	@PostMapping("/apis/nav/update")
	public CLApiResponse<NavPayloads.InfoResponse> updateNav(
		@RequestBody @Valid NavPayloads.UpdateRequest payload
	) {
		long navId = payload.getNavId();
		navService.updateNav(
			navId,
			payload.getNavNm(),
			payload.getExpl()
		);

		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"NAV 수정",
			String.format(" 수정된 네비 명 : %s", payload.getNavNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);

		return CLApiResponse.success(getNavResponse(navId));
	}


	@PostMapping("/apis/nav/list")
	public CLApiResponse<NavPayloads.NavListResponse> navList() {
		return CLApiResponse.success(
			NavPayloads.NavListResponse
				.builder()
				.navList(navService.findNavVoListAll())
				.build()
		);
	}


	@PostMapping("/apis/nav/delete")
	public CLApiResponse<Object> update(@RequestParam("navId") long navId) {
		NavVo nav = navService.findNavVoById(navId);
		
		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"NAV 삭제",
			String.format("삭제된 네비 이름 : %s", nav.getNavNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);
		navService.deleteNavItemsByNavId(navId);
		navService.deleteNavByPk(navId);
		return CLApiResponse.success();
	}


	@PostMapping("/apis/nav/items")
	public CLApiResponse<NavPayloads.ItemListResponse> navItems(
		@RequestParam("navId") long navId,
		@RequestParam(value = "withHidden",defaultValue = "false", required = false) boolean withHidden
	) {

		return CLApiResponse.success(
			NavPayloads.ItemListResponse
				.builder()
				.nav(navService.findNavVoById(navId))
				.navItemList(navService.findNavItems(navId, withHidden))
				.build()
		);
	}

	@PostMapping("/apis/nav/sort-items")
	public CLApiResponse<Object> sortNavItems(
		@RequestBody NavPayloads.ItemSortRequest payload
	) {
		navService.saveSort(payload.getNavId(), payload.getItems());
		NavVo nav = navService.findNavVoById(payload.getNavId());
		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"NAV ITEM 정렬, 수정",
			String.format("수정된 네비 이름  : %s", nav.getNavNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);
		return CLApiResponse.success();
	}


	@PostMapping("/apis/nav/create-page")
	public CLApiResponse<NavPayloads.PageInfoResponse> createPage(
		@RequestBody NavPayloads.PageCreateRequest payload
	) {
		long pageId = sequenceService.nextCommonSeq();
		navService.createPage(
			Page.builder()
				.pageId(pageId)
				.pageNm(payload.getPageNm())
				.icon(payload.getIcon())
				.pageKey(payload.getPageKey())
				.url(payload.getUrl())
				.dtlExpl(payload.getDtlExpl())
				.build()
		);
		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"PAGE 신규 생성",
			String.format(" 신규 생성된 페이지 명 : %s",payload.getPageNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);
		return CLApiResponse.success(getPageResponse(pageId));
	}

	@PostMapping("/apis/nav/update-page")
	public CLApiResponse<NavPayloads.PageInfoResponse> updatePage(
		@RequestBody NavPayloads.PageUpdateRequest payload
	) {
		navService.updatePage(
			Page.builder()
				.pageId(payload.getPageId())
				.pageNm(payload.getPageNm())
				.icon(payload.getIcon())
				.pageKey(payload.getPageKey())
				.url(payload.getUrl())
				.dtlExpl(payload.getDtlExpl())
				.build()
		);
		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"PAGE 수정",
			String.format(" 수정된 페이지 명 : %s",  payload.getPageNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);
		return CLApiResponse.success(getPageResponse(payload.getPageId()));
	}

	@PostMapping("/apis/nav/page-list")
	public CLApiResponse<NavPayloads.PageListResponse> pageList() {
		return CLApiResponse.success(
			NavPayloads.PageListResponse.builder()
				.pageList((navService.findPageVoList()))
				.build()
		);
	}


	@PostMapping("/apis/nav/delete-page")
	public CLApiResponse<Object> deletePage(
		@RequestParam("pageId") long pageId
	) {
		PageVo page = navService.findPageVoById(pageId);
		navService.deletePage(pageId);

		auditLogSaver.i(
			CLAuditLogKind.ETC,
			"PAGE 삭제",
			String.format("삭제된 페이지 이름 : %s", page.getPageNm()),
			requestUserHelper.currentLgonIdOrNull(),
			"clover",
			null,
			null
		);
		return CLApiResponse.success();
	}


	@PostMapping("/apis/nav/create-section")
	public CLApiResponse<NavPayloads.SectionInfoResponse> createSection(
		@RequestBody NavPayloads.SectionCreateRequest payload
	) {
		long sectionId = sequenceService.nextCommonSeq();
		navService.createSection(
			sectionId,
			payload.getSectionNm(),
			payload.getIcon()
		);

		return CLApiResponse.success(
			getSectionResponse(sectionId)
		);
	}


	@PostMapping("/apis/nav/update-section")
	public CLApiResponse<NavPayloads.SectionInfoResponse> updateSection(
		@RequestBody NavPayloads.SectionUpdateRequest payload
	) {
		navService.updateSection(
			payload.getSectionId(),
			payload.getSectionNm(),
			payload.getIcon()
		);
		return CLApiResponse.success(
			getSectionResponse(payload.getSectionId())
		);
	}


	@PostMapping("/apis/nav/delete-section")
	public CLApiResponse<Object> deleteSection(
		@RequestParam("navId") long navId,
		@RequestParam("sectionId") long sectionId
	) {
		navService.deleteSectionByNavIdAndSectionId(navId, sectionId);
		return CLApiResponse.success();
	}


	@PostMapping("/apis/nav/section-info")
	public CLApiResponse<NavPayloads.SectionInfoResponse> sectionInfo(
		@RequestParam("sectionId") long sectionId
	) {
		return CLApiResponse.success(
			getSectionResponse(sectionId)
		);
	}
}
