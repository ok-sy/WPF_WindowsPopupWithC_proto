import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_JOB_API_URL,
  splitParams,
} from '..';
import { CLJob } from '../model';

/**
 * clover framework 잡 API
 */
export class CLJobApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * JOB 목록 조회
   * 데이터가 몇개 안되므로 전체 조회
   */
  list = (params: BaseRequest): Promise<ApiResponseWithData<{ jobList: CLJob[] }>> => {
    const url = CL_JOB_API_URL.list;
    return this.withData.post(url, ...splitParams(params));
  };
}
