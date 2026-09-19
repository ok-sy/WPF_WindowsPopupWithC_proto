import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  TEAM_API_URL,
  splitParams,
} from '..';
import { Team, TeamForUser } from '../model';

/**
 *  팀 API
 */
export class TeamApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 팀 목록 조회
   */
  list = (
    params: {
      teamNm: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ teamList: Team[] }>> => {
    const url = TEAM_API_URL.list;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 팀 신규 등록
   */
  create = (
    params: {
      teamNm: string; // pk
      teamExpl?: string;
      psnlStupAcceYn: 'Y' | 'N';
      teamCmmnStupCn?: string;
      teamStat?: number;
      teamTskClsf?: number;
      regrId: string;
      chgrId: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ instCnt: number }>> => {
    const url = TEAM_API_URL.create;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 팀 조회
   */
  info = (
    params: {
      teamId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ team: Team }>> => {
    const url = TEAM_API_URL.info;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 팀 수정
   */
  update = (
    params: {
      teamId: number;
      teamNm: string;
      teamExpl?: string;
      teamTskClsf?: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ uptCnt: number }>> => {
    const url = TEAM_API_URL.update;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 팀별 사용자 목록
   */
  teamForUser = (
    params: {
      teamId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ teamForUser: TeamForUser[] }>> => {
    const url = TEAM_API_URL.teamForUser;
    return this.withData.post(url, ...splitParams(params));
  };
}
