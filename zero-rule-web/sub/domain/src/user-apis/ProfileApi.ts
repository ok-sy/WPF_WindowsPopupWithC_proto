import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  PROFILE_API_URL,
  splitParams,
} from '..';
import { UserProfile } from '../model/UserProfile';

export class ProfileApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 로그인한 사용자의 사용자 프로필 조회
   */
  profileMe = (params: BaseRequest): Promise<ApiResponseWithData<{ profile: UserProfile }>> => {
    const url = PROFILE_API_URL.profileMe;
    return this.withData.post(url, ...splitParams(params));
  };
}
