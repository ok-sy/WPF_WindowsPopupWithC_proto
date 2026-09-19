import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_CODE_API_URL,
  splitParams,
} from '..';
import { CLCode, PagerData } from '../model';

/**
 * clover framework 코드 API
 */
export class CLCodeApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 주어진 검색 조건으로 코드 목록 조회 - 페이지
   */
  search = (
    params: {
      codeType?: string;
      code?: string;
      codeNm?: string;

      /**
       * keyword는 code 또는 codeNm으로 검색한다(OR 조건)
       */
      keyword?: string;
      rowsPerPage: number;
      pageNumber: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<CLCode> }>> => {
    const url = CL_CODE_API_URL.search;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 코드 조회
   */
  info = (
    params: {
      codeType: string; // pk1
      code: string; // pk2
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ code: CLCode }>> => {
    const url = CL_CODE_API_URL.info;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 코드 등록 - 단건 등록
   * 등록하기 전에 codeType이 먼저 등록되어야 한다
   */
  create = (
    params: {
      codeType: string; // pk1
      code: string; // pk2
      codeNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ code: CLCode }>> => {
    const url = CL_CODE_API_URL.create;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 코드 업데이트 - 단건 업데이트
   */
  update = (
    params: {
      codeType: string; // pk1
      code: string; // pk2
      codeNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ code: CLCode }>> => {
    const url = CL_CODE_API_URL.update;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 코드 삭제
   */
  delete = async (
    params: {
      codeType: string; // pk1
      code: string; // pk2
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_CODE_API_URL.delete;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 코드 등록 - 다건 등록
   * 등록하기 전에 codeType이 먼저 등록되어야 한다
   */
  saveAll = async (
    params: {
      codeType: string; // pk1
      codes: Array<{
        code: string;
        codeNm: string;
        dtlExpl?: string;
      }>;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_CODE_API_URL.saveAll;
    await this.helper.postJson(url, ...splitParams(params));
  };
}
