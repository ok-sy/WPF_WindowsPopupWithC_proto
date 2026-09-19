import {
  RuleDeployHistory,
  RuleProgressHistory,
  UsedItemInfo,
  UsedRuleDetailInfo,
} from './../model/Rule';
import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import {
  ConditionRuleSelect,
  ItemMgmt,
  Rule,
  RuleDeployWaitVo,
  RuleInfoCondition,
  RuleInfoInputType,
  RuleName,
  RuleReturnItemAndItemInfo,
  RuleTestParam,
  RuleTestResult,
  RuleVerstionData,
  TreeIfRules,
} from '../model';

/**
 * clover framework 코드 API
 */
export class RuleApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 다건조회
   */
  treeList = (
    params: { keyword: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      treeIfRules: TreeIfRules[];
    }>
  > => {
    const url = '/apis/rule/tree-list';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 룰이름과 아이디 만 다건
   */
  nameList = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      ruleNames: RuleName[];
    }>
  > => {
    const url = '/apis/rule-name/list';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 단건조회 이름과 별칭으로
   */
  info = (
    params: { ruleid: string; ruleAlias?: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      rule: Rule;
      ruleReturnItem: RuleReturnItemAndItemInfo[];
      inputItems: string[];
    }>
  > => {
    const url = '/apis/rule-test/info';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 룰 단건상세조회 (트리 클릭시 룰 상세)
   */
  detailInfo = (
    params: { ruleid: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      ruleInfo: Rule;
      ruleInfoRuleReturn: ItemMgmt[];
      ruleInfoCondition: RuleInfoCondition[];
      ruleUseType: string;
      ruleHistory: RuleVerstionData[];
    }>
  > => {
    const url = '/apis/rule/detail-info';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   */
  ruleTest = (
    params: { ruleTestParam: RuleTestParam } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      ruleTestResult: RuleTestResult;
    }>
  > => {
    const url = '/apis/rule/ruleTest';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 룰 수정 및 저장
   */
  ruleCreateOrModify = (
    params: {
      ruleid?: string;
      ruleInfo: RuleInfoInputType;
      ruleInfoRuleReturn: ItemMgmt[];
      ruleInfoCondition: RuleInfoCondition[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ updateRuleId: string }>> => {
    const url = '/apis/rule/save/create-or-modify';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 조건리스트 반환값 유효성체크(항목 & 룰명)
   */
  ruleReturnConditionValid = (
    params: {
      ruleInfoCondition: {
        itemNm: string;
        returnItemid: string;
        returnitemExprDesc?: string;
        datatypeCd: string;
        ruleconditionno?: number;
      }[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ result: string }>> => {
    const url = '/apis/validation/rule-return-condition';
    return this.withData.postJson(url, params);
  };

  /**
   * 룰 활성/비활성 업데이트
   */
  ruleActiveUpt = (
    params: {
      ruleid: string;
      activeYn: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ uptCnt: number }>> => {
    const url = '/apis/rule/active-yn/update';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 룰 삭제
   */
  ruleDel = (
    params: { ruleid: string } & BaseRequest,
  ): Promise<ApiResponseWithData<{ delCnt: number }>> => {
    const url = '/apis/rule/delete';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   */
  ruleTestSubmit = (
    params: { ruleid: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      result: number;
    }>
  > => {
    const url = '/apis/rule/ruleTest/submit-test';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 다건조회
   */
  treeApply = (
    params: { waitList: RuleDeployWaitVo[] } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      applyYn: number;
    }>
  > => {
    const url = '/apis/rule/apply/all';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 적용건 카운트
   */
  ruleApplyCnt = (): Promise<
    ApiResponseWithData<{
      applyCnt: number;
    }>
  > => {
    const url = '/apis/rule/apply/cnt-all';
    return this.withData.post(url);
  };

  /**
   * 다건조회
   */
  conditionRuleSelect = (
    params: { ifid?: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      ruleConditionInfixDescVo: ConditionRuleSelect[];
    }>
  > => {
    const url = '/apis/rule/condition-infix-desc/select-llist';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 룰 진행상태 리스트
   */
  ruleProgressList = (
    params: { ruleid?: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      ruleProgressHistoryVo: RuleProgressHistory[];
    }>
  > => {
    const url = '/apis/rule/progress-hst-list/select';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 룰 배포대기
   */
  ruleDeployWait = (
    params: { ruleid?: string; ruleApplyYn: string } & BaseRequest,
  ): Promise<ApiResponseWithData<number>> => {
    const url = '/apis/rule/deploy-wait';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 룰 배포대기취소
   */
  ruleDeployWaitCancel = (
    params: {
      ruleid?: string;
      beforeRuleVerno: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<number>> => {
    const url = '/apis/rule/deploy-wait/cancel';
    return this.withData.post(url, ...splitParams(params));
  };

  ruleDeployWaitList = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      waitList: RuleDeployWaitVo[];
      recentDeploy: string;
    }>
  > => {
    const url = '/apis/rule/deploy-list';
    return this.withData.post(url, ...splitParams(params));
  };

  usedItemList = (
    params: {
      ruleid: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      usedItem: UsedItemInfo[];
    }>
  > => {
    const url = '/apis/rule/used-item/list';
    return this.withData.post(url, ...splitParams(params));
  };
  usedRuleList = (
    params: {
      ruleid: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      usedRule: UsedRuleDetailInfo[];
    }>
  > => {
    const url = '/apis/rule/used-rule/list';
    return this.withData.post(url, ...splitParams(params));
  };

  // 룰배포내역 조회
  ruleDeployHis = (
    params: {
      ifid?: string;
      ruleNm?: string;
      deployUserid?: string;
      fromDt: string;
      toDt: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      deployHis: RuleDeployHistory[];
    }>
  > => {
    const url = '/apis/rule/deploy/list';
    return this.withData.postJson(url, ...splitParams(params));
  };

  usedHistoryItemList = (
    params: {
      ruleid: string;
      ruleVerno: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      usedItem: UsedItemInfo[];
    }>
  > => {
    const url = '/apis/rule/used-item/deploy-his/list';
    return this.withData.post(url, ...splitParams(params));
  };
  usedHistoryRuleList = (
    params: {
      ruleid: string;
      ruleVerno: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      usedRule: UsedRuleDetailInfo[];
    }>
  > => {
    const url = '/apis/rule/used-rule/deploy-his/list';
    return this.withData.post(url, ...splitParams(params));
  };
}
