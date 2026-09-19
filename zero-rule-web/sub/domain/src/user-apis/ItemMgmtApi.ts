import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import {
  CLCode,
  ItemMgmt,
  ItemMgmtUsedRuleInfo,
  ItemRef,
  PagerData,
  Rule,
  RuleName,
  RuleReturnItemAndItemInfo,
} from '../model';

/**
 * clover framework 코드 API
 */
export class ItemMgmtApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 등록
   */
  itemMgmtinsert = (
    params: {
      itemNm: string;
      itemAliasNm: string;
      itemExplanDesc: string;
      dataTypeCd: string;
      itemUseYn: string;
      ifid: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ insertCnt: number }>> => {
    const url = '/apis/item-mgmt/item-insert';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 목록 조회
   */
  itemMgmtSelect = (
    params: {
      itemNm?: string;
      itemAliasNm?: string;
      itemUseYn?: string;
      ifid?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ itemMgmt: ItemMgmt[] }>> => {
    const url = '/apis/item-mgmt/item-select';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 사용중인룰 조회
   */
  itemMgmtUsedRuleInfo = (
    params: { itemid: string } & BaseRequest,
  ): Promise<ApiResponseWithData<{ usedRuleInfo: ItemMgmtUsedRuleInfo[] }>> => {
    const url = '/apis/item-mgmt/item-select/used-rule-info';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 목록 조회
   */
  itemMgmtModify = (
    params: {
      itemid: string;
      itemNm?: string;
      itemAliasNm?: string;
      itemUseYn?: string;
      itemExplanDesc?: string;
      dataTypeCd?: string;
      ifid?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ insertCnt: number }>> => {
    const url = '/apis/item-mgmt/item-modify';
    return this.withData.postJson(url, ...splitParams(params));
  };

  itemRefList = (
    params: {
      itemid: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ itemRefs: ItemRef[] }>> => {
    const url = '/apis/item-ref/list';
    return this.withData.postJson(url, ...splitParams(params));
  };
  itemRefInsert = (
    params: {
      itemid: string;
      itemrefCd?: string;
      itemrefNm?: string;
      itemrefaliasNm?: string;
      itemrefexprDesc?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ insertCnt: number }>> => {
    const url = '/apis/item-ref/insert';
    return this.withData.postJson(url, ...splitParams(params));
  };
  itemRefModify = (
    params: {
      itemid?: string;
      itemrefCd?: string;
      itemrefNm?: string;
      itemrefaliasNm?: string;
      itemrefexprDesc?: string;
      asisInputItemrefCd?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ insertCnt: number }>> => {
    const url = '/apis/item-ref/modify';
    return this.withData.postJson(url, ...splitParams(params));
  };
  itemRefDel = (
    params: {
      itemid: string;
      itemrefCd?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ insertCnt: number }>> => {
    const url = '/apis/item-ref/del';
    return this.withData.postJson(url, ...splitParams(params));
  };
}
