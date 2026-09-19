import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_ETC_API_URL,
  splitParams,
} from '..';
import { CLErrorMeta } from '../model';

/**
 * clover framework 기타 API
 */
export class CLEtcApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  errorMetas = (
    params: BaseRequest,
  ): Promise<ApiResponseWithData<{ errorMetaList: CLErrorMeta[] }>> => {
    const url = CL_ETC_API_URL.errorMetas;
    return this.withData.post(url, ...splitParams(params));
  };
}
