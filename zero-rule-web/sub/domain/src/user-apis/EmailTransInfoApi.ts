import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import { EmailTransInfo, PagerData } from '../model';

/**
 * 이메일송수신 API
 */
export class EmailTransInfoApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 목록 조회
   */
  emailTransInfoList = (
    params: {
      empId?: string;
      emailTransceiveTypeCd?: string;
      fromDt: string;
      toDt: string;
      // pageNumber: number
      // rowsPerPage: number
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ list: EmailTransInfo[] }>> => {
    const url = '/apis/email-trans-info/list';
    return this.withData.postJson(url, ...splitParams(params));
  };
}
