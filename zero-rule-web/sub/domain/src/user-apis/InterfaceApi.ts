import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import { InterfaceVo, RuleInterfaceMapVo } from '../model';

/**
 * clover framework 코드 API
 */
export class InterfaceApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 인터페이스 정보 목록조회
   */
  interfaceInfoList = (
    params: {
      ifid: string;
      ifNm: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ interfaceInfos: InterfaceVo[] }>> => {
    const url = '/apis/interface/info-list';
    return this.withData.postJson(url, ...splitParams(params));
  };
  /**
   * 인터페이스 정보 단건 수정
   */
  interfaceInfoUpdate = (
    params: {
      ifid: string;
      ifNm: string;
      ifDesc: string;
      ifProcessTypeCd: string;
      ifConnectionTypeCd: string;
      ruleUseYn: string;
      docLength: number;
      characterset: string;
      eaiid: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ result: number }>> => {
    const url = '/apis/interface/info-update';
    return this.withData.postJson(url, ...splitParams(params));
  };
  /**
   * 인터페이스 등록
   */
  interfaceInsert = (
    params: {
      ifNm: string;
      ifDesc: string;
      ifProcessTypeCd: string;
      ifConnectionTypeCd: string;
      ruleUseYn: string;
      docLength: number;
      characterset: string;
      eaiid: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ result: number }>> => {
    const url = '/apis/interface/info-insert';
    return this.withData.postJson(url, ...splitParams(params));
  };
  /**
   * 인터페이스 컬럼정보 목록조회
   */
  interfaceMapList = (
    params: {
      ifid: string;
      ifNm: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ interfaceMaps: RuleInterfaceMapVo[] }>> => {
    const url = '/apis/interface/map-list';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 인터페이스 필드정보 등록
   */
  interfaceMapAllInsert = (
    params: {
      interfaceMaps: RuleInterfaceMapVo[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ result: number }>> => {
    const url = '/apis/interface/map-all-save';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 인터페이스 필드정보 등록
   */
  interfaceDel = (
    params: {
      delInterfaceList: string[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ result: number }>> => {
    const url = '/apis/interface/del-all';
    return this.withData.postJson(url, ...splitParams(params));
  };
}
