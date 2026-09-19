import {
  AUTH_API_URL,
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  splitParams,
} from '..';
import { UserProfile } from '../model';

/**
 * 인증 관련 API
 */
export class AuthApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 로그인
   */
  signIn = (
    params: {
      lgonId: string;
      passwd: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      profile: UserProfile;
      needPwdChange: boolean;
      isLock: number;
      currentTime: number;
    }>
  > => {
    const url = AUTH_API_URL.signIn;
    const [data, extra] = splitParams(params);
    extra.header = { Authorization: '' };
    return this.withData.postJson(url, data, extra);
  };

  /**
   * 회원가입
   */
  signUp = (
    params: {
      lgonId: string;
      userNm: string;
      passwd: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ profile: UserProfile }>> => {
    const url = AUTH_API_URL.signUp;
    const [data, extra] = splitParams(params);
    extra.header = { Authorization: '' };
    return this.withData.postJson(url, data, extra);
  };

  /**
   * 사용자 ID 이용가능 체크
   * true를 리턴하면, 이용가능
   */
  isAvailableUserId = (
    params: {
      lgonId: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<boolean>> => {
    const url = AUTH_API_URL.isAvailableUserId;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 로그아웃
   */
  signOut = async (params: BaseRequest): Promise<void> => {
    const url = AUTH_API_URL.signOut;
    await this.helper.post(url, ...splitParams(params));
  };
}
