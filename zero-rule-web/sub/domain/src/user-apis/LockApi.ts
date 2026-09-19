import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import { Lock } from '../model';

/**
 * clover framework 코드 API
 */
export class LockApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 다건조회
   */
  list = (
    params: {
      lockcode?: string;
      userid?: string;
      userNm?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      locks: Lock[];
    }>
  > => {
    const url = '/apis/lock/list';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 삭제
   */
  delete = (
    params: {
      delList: string[];
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/lock/delete';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 등록
   */
  insert = (
    params: {
      lockcode: string;
      lockkey: string;
      locktypecode: string;
      locknote: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/lock/insert';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 락 상태 체크
   */
  ruleForUserLock = (
    params: {
      lockkey: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/lock/select-rule';
    return this.withData.post(url, params);
  };

  /**
   * 배포자 락 삭제
   */
  deleteDep = (
    params: {
      delKey: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/lock/delete-dep';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 배포자 락 삭제
   */
  lockCheck = (
    params: {
      lockKey: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/lock/check';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 배포자 락 삭제
   */
  ruleLockCheck = (
    params: BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/lock/rule-dep-check';
    return this.withData.post(url, ...splitParams(params));
  };
}
