import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_CODE_TYPE_API_URL,
  splitParams,
} from '..';
import { CLCodeType, PagerData } from '../model';

/**
 * clover framework 코드그룹 API
 */
export class CLCodeTypeApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 다건 조회 - 페이지
   * 주어진 검색 조건으로 조회
   */
  search = (
    params: {
      codeType?: string;
      codeTypeNm?: string;

      /**
       * keyword가 전달되면 codeType이나 codeTypeNm으로 검색한다
       */
      keyword?: string;
      rowsPerPage: number;
      pageNumber: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<CLCodeType> }>> => {
    const url = CL_CODE_TYPE_API_URL.search;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 단건 조회 - 코드 그룹
   */
  info = (
    params: {
      codeType: string; // pk
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ codeType: CLCodeType }>> => {
    const url = CL_CODE_TYPE_API_URL.info;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 코드 그룹 등록
   */
  create = (
    params: {
      codeType: string; // pk
      codeTypeNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ codeType: CLCodeType }>> => {
    const url = CL_CODE_TYPE_API_URL.create;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 코드 그룹 업데이트
   */
  update = (
    params: {
      codeType: string; // pk
      codeTypeNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ codeType: CLCodeType }>> => {
    const url = CL_CODE_TYPE_API_URL.update;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 코드 그룹 삭제
   * 코드 그룹을 사용하는 코드들도 삭제된다
   */
  deleteWithCodes = async (
    params: {
      codeType: string; // pk
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_CODE_TYPE_API_URL.deleteWithCodes;
    await this.helper.post(url, ...splitParams(params));
  };
}
