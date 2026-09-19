import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_ROLE_API_URL,
  splitParams,
} from '..';
import { CLRole, CLRolePageDetail } from '../model';

/**
 * clover framework ROLE API
 */
export class CLRoleApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 롤 페이지 권한 목록 조회
   */
  rolePages = (
    params: {
      roleId: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ rolePageList: CLRolePageDetail[] }>> => {
    const url = CL_ROLE_API_URL.rolePages;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 롤 목록 조회
   */
  roles = (params: BaseRequest): Promise<ApiResponseWithData<{ roleList: CLRole[] }>> => {
    const url = CL_ROLE_API_URL.roles;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 롤 정보 단건조회
   */
  roleInfo = (
    params: {
      roleId: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ role: CLRole }>> => {
    const url = CL_ROLE_API_URL.roleInfo;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 롤 정보 존재 여부 체크
   * 신규 등록할 때 체크
   */
  existsRoleById = async (
    params: {
      roleId: string;
    } & BaseRequest,
  ): Promise<boolean> => {
    try {
      await this.roleInfo(params);
      return true;
    } catch (err: any) {
      if (err['errorCode'] === 'E1_NO_SUCH_DATA') {
        return false;
      }
      throw err;
    }
  };

  /**
   * 롤 정보 신규 등록
   */
  createRole = (
    params: {
      roleId: string;
      roleNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ role: CLRole }>> => {
    const url = CL_ROLE_API_URL.createRole;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 롤 정보 수정
   */
  updateRole = (
    params: {
      roleId: string;
      roleNm: string;
      dtlExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ role: CLRole }>> => {
    const url = CL_ROLE_API_URL.updateRole;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 롤 정보 삭제
   */
  deleteRole = async (
    params: {
      roleId: string;
    } & BaseRequest,
  ) => {
    const url = CL_ROLE_API_URL.deleteRole;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 롤 페이지 권한 저장
   */
  saveRolePage = async (
    params: {
      roleId: string;
      pageId: number;
      c: boolean;
      r: boolean;
      u: boolean;
      d: boolean;
    } & BaseRequest,
  ): Promise<void> => {
    const url = CL_ROLE_API_URL.saveRolePage;
    await this.helper.postJson(url, ...splitParams(params));
  };

  /**
   * 주어진 롤에 모든 페이지의 권한을 저장한다.
   */
  grantAllRolePage = async (
    params: {
      roleId: string;
    } & BaseRequest,
  ) => {
    const url = CL_ROLE_API_URL.grantAllRolePage;
    await this.helper.post(url, ...splitParams(params));
  };

  /**
   * 주어진 롤에 모든 페이지의 권한을 제거한다.
   */
  revokeAllRolePage = async (
    params: {
      roleId: string;
    } & BaseRequest,
  ) => {
    const url = CL_ROLE_API_URL.revokeAllRolePage;
    await this.helper.post(url, ...splitParams(params));
  };
}
