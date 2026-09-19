import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_NAV_API_URL,
  splitParams,
} from '..';
import { CLNav, CLNavItem, CLPage, CLPageSection } from '../model';

/**
 * clover framework NAV API
 */
export class CLNavApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  createNav = (
    params: {
      navNm: string;
      expl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ nav: CLNav }>> => {
    const url = CL_NAV_API_URL.createNav;
    return this.withData.postJson(url, ...splitParams(params));
  };

  updateNav = (
    params: {
      navId: number;
      navNm: string;
      expl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ nav: CLNav }>> => {
    const url = CL_NAV_API_URL.updateNav;
    return this.withData.postJson(url, ...splitParams(params));
  };

  navList = (params: BaseRequest): Promise<ApiResponseWithData<{ navList: CLNav[] }>> => {
    const url = CL_NAV_API_URL.navList;
    return this.withData.postJson(url, ...splitParams(params));
  };

  deleteNav = async (
    params: {
      navId: number;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_NAV_API_URL.deleteNav;
    await this.helper.post(url, ...splitParams(params));
  };

  items = (
    params: {
      /**
       * NAV ID
       */
      navId: number;
      /**
       * 숨겨진 항목 포함해서 조회 할지 여부
       */
      withHidden: boolean;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ nav: CLNav; navItemList: CLNavItem[] }>> => {
    const url = CL_NAV_API_URL.items;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 아이템 정렬
   */
  sortItems = (
    params: {
      navId: number;
      items: Array<{
        pageId: number;
        sectionId?: number;
      }>;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ nav: CLNav; navItemList: CLNavItem[] }>> => {
    const url = CL_NAV_API_URL.sortItems;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 페이지 신규 등록
   */
  createPage = (
    params: {
      pageNm: string;
      pageKey?: string;
      url: string;
      icon?: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ page: CLPage }>> => {
    const url = CL_NAV_API_URL.createPage;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 페이지 업데이트
   */
  updatePage = (
    params: {
      pageId: number;
      pageNm: string;
      pageKey?: string;
      url: string;
      icon?: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ page: CLPage }>> => {
    const url = CL_NAV_API_URL.updatePage;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 페이지 삭제
   */
  deletePage = async (
    params: {
      pageId: number;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_NAV_API_URL.deletePage;
    await this.helper.post(url, ...splitParams(params));
  };
  /**
   * 페이지 전체 목록
   */
  pages = (params: BaseRequest): Promise<ApiResponseWithData<{ pageList: CLPage[] }>> => {
    const url = CL_NAV_API_URL.pages;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 섹션 신규 등록
   */
  createSection = (
    params: {
      sectionNm: string;
      icon?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ section: CLPageSection }>> => {
    const url = CL_NAV_API_URL.createSection;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 섹션 업데이트
   */
  updateSection = (
    params: {
      sectionId: number;
      sectionNm: string;
      icon?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ section: CLPageSection }>> => {
    const url = CL_NAV_API_URL.updateSection;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 섹션 삭제
   */
  deleteSection = async (
    params: {
      navId: number;
      sectionId: number;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_NAV_API_URL.deleteSection;
    await this.helper.post(url, ...splitParams(params));
  };
  /**
   * 섹션 단건조회
   */
  sectionInfo = (
    params: {
      sectionId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ section: CLPageSection }>> => {
    const url = CL_NAV_API_URL.sectionInfo;
    return this.withData.post(url, ...splitParams(params));
  };
}
