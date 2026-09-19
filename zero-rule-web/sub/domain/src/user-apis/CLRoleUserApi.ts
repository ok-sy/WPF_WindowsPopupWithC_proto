import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_ROLE_USER_API_URL,
  splitParams,
} from '..';
import { CLRoleUser } from '..';
import { CLPriv } from './../model/CLPriv';
import { CLRole } from './../model/CLRole';

/**
 * clover framework ROLE USER API
 */
export class CLRoleUserApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 사용자에게 부여된 롤 목록 조회
   */
  roleList = (
    params: {
      userId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ grantedRoleIds: string[]; roleList: CLRole[] }>> => {
    const url = CL_ROLE_USER_API_URL.roleList;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 사용자에게 부여된 권한 목록 조회
   */
  privList = (
    params: {
      userId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ grantedPrivIds: string[]; privList: CLPriv[] }>> => {
    const url = CL_ROLE_USER_API_URL.privList;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 사용자에게 권한 부여 - grant
   */
  grantPriv = async (
    params: {
      userId: number;
      privId: string;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_ROLE_USER_API_URL.grantPriv;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 사용자에게 권한 회수 - revoke
   */
  revokePriv = async (
    params: {
      userId: number;
      privId: string;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_ROLE_USER_API_URL.revokePriv;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 사용자에게 롤 부여 - grant
   */
  grantRole = async (
    params: {
      userId: number;
      roleId: string;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_ROLE_USER_API_URL.grantRole;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 사용자에게 롤 회수 - revoke
   */
  revokeRole = async (
    params: {
      userId: number;
      roleId: string;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_ROLE_USER_API_URL.revokeRole;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 특정 룰의 사용자 목록 조회
   */
  userListByRole = (
    params: {
      roleId: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ userList: CLRoleUser[] }>> => {
    const url = CL_ROLE_USER_API_URL.userListByRole;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 특정 권한의 사용자 목록 조회
   */
  userListByPriv = (
    params: {
      privId: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ userList: CLRoleUser[] }>> => {
    const url = CL_ROLE_USER_API_URL.userListByPriv;
    return this.withData.post(url, ...splitParams(params));
  };
}
