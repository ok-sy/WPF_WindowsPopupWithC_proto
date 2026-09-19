import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import { GridColumnInsert, GridFilterInsert, GridList, Lock } from '../model';

/**
 * clover framework 코드 API
 */
export class GridApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 필터,컬럼 등록
   */
  gridInsert = (
    params: {
      filter: GridFilterInsert;
      columns: GridColumnInsert[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<number>> => {
    const url = '/apis/grid/insert';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 그리드 목록 조회
   */
  gridList = (
    params: {
      pageCode: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ list: GridList[] }>> => {
    const url = '/apis/grid/list';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 디폴트값 업데이트
   */
  updateDefaultYn = (
    params: {
      pageCode: string;
      filterNm?: string;
      defaultYn: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<number>> => {
    const url = '/apis/grid/update-default-yn';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 디폴트값 업데이트
   */
  deleteGrid = (
    params: {
      pageCode: string;
      filterNm: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<number>> => {
    const url = '/apis/grid/delete';
    return this.withData.postJson(url, ...splitParams(params));
  };
}
