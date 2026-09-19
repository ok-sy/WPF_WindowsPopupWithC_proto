import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  USER_API_URL,
  splitParams,
} from '..';
import { UserProfile } from '../model';

/**
 * 사용자 API
 */
export class UserApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 사용자 비밀번호 변경
   * 비밀번호 강제 변경 페이지에서 호출함
   * 본인 비밀번호 변경
   */
  updatePassword = (
    params: {
      oldPswd: string;
      pswd: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ profile: UserProfile }>> => {
    const url = USER_API_URL.updatePassword;
    return this.withData.postJson(url, ...splitParams(params));
  };
}
