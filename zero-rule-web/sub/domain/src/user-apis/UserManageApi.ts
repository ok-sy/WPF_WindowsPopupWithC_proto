import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  USER_MANAGE_API_URL,
  splitParams,
} from '..';
import { CLUserStateKey } from '../enum-types';
import { CLUser, CLUserCreateParam, PagerData } from '../model';

/**
 * 사용자 관리 API
 */
export class UserManageApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 사용자 목록 조회 - 페이징
   */
  list = (
    params: {
      lgonId?: string;
      userName?: string;
      // 둘중에 하나로 검색
      keyword?: string;
      rowsPerPage: number;
      pageNumber: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<CLUser> }>> => {
    const url = USER_MANAGE_API_URL.list;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 사용자 정보 조회
   */
  info = (
    params: {
      userId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ user: CLUser }>> => {
    const url = USER_MANAGE_API_URL.info;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 사용자 신규등록
   */
  create = (
    params: CLUserCreateParam & BaseRequest,
  ): Promise<ApiResponseWithData<{ lgonId: string }>> => {
    const url = USER_MANAGE_API_URL.create;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 사용자 업데이트
   */
  update = (
    params: {
      userId: number;
      userName: string;
      userState: CLUserStateKey;
      pswdInitYn?: string;
      bryyMndy?: string;
      userTno?: string;
      userExno?: string;
      userGd?: string;
      ctiUserNtno?: string;
      prtPosbYn?: string;
      dwnlPosbYn?: string;
      atntYn?: string;
      memo?: string;
      teamId?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ lgonId: string }>> => {
    const url = USER_MANAGE_API_URL.update;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 관리자용 사용자 비밀번호 변경
   * 사용자 정보 페이지에서 호출함
   * 해당 사용자 초기 비밀번호로 변경
   */
  updatePassword = (
    params: {
      userId: number;
      pswd: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ user: CLUser }>> => {
    const url = USER_MANAGE_API_URL.updatePassword;
    return this.withData.postJson(url, ...splitParams(params));
  };
}
