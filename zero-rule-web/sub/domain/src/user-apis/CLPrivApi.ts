import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_PRIV_API_URL,
  splitParams,
} from '..';
import { CLPriv, CLRole, CLRolePageDetail } from '../model';

/**
 * clover framework ROLE API
 */
export class CLPrivApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * priv 목록
   */
  privPList = (params: BaseRequest): Promise<ApiResponseWithData<{ privList: CLPriv[] }>> => {
    const url = CL_PRIV_API_URL.privPList;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * priv 신규
   */
  createPriv = (
    params: {
      privId: string;
      privNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ role: CLPriv }>> => {
    const url = CL_PRIV_API_URL.createPriv;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * priv 업뎃
   */
  updatePriv = (
    params: {
      privId: string;
      privNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ role: CLRole }>> => {
    const url = CL_PRIV_API_URL.updatePriv;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * priv 삭제
   */
  deletePriv = async (
    params: {
      privId: string;
    } & BaseRequest,
  ) => {
    const url = CL_PRIV_API_URL.deletePriv;
    await this.helper.post(url, ...splitParams(params));
  };
}
