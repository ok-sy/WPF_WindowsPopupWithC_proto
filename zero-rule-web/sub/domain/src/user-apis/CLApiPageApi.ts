import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_API_PAGE_API_URL,
  splitParams,
} from '..';
import { CLPageApi } from '../model';

/**
 * clover framework NAV API
 */
export class CLApiPageApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  pageApiList = (
    params: {
      pageId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pageApiList: CLPageApi[] }>> => {
    const url = CL_API_PAGE_API_URL.pageApiList;
    return this.withData.post(url, ...splitParams(params));
  };
  /**
   * page API 정보 업데이트
   */
  pageApiUpdate = (
    params: {
      pageId: number;
      pageApiList: CLPageApi[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ uptCnt: number }>> => {
    const url = CL_API_PAGE_API_URL.pageApiUpdate;
    return this.withData.postJson(url, ...splitParams(params));
  };
}
