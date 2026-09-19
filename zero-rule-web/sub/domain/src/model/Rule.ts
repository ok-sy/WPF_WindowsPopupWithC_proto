import { ItemMgmt } from './ItemMgmt';

/**
 * @interface RULE 전체목록
 */
export interface Rule {
  ruleNm: string;
  ruleid: string;
  rulealiasNm: string;
  ruleDesc: string;
  rulereturnType: string;
  updateDatetime: string;
  updateUserid: string;
  rulesortCd: string;
  ruleusageCd: string;
  firstregUserid: number;
  firstregDatetime: string;
  allreturnYn: string;
  useYn: string;
  ifid: string;
  ruleVerno: number;
  activateYn: string;
  activateDatetime: string;
  ruleState: string;
  deployDatetime: string;
  deployUserid: string;
  ruleApplyYn: string;
  deployWaitStateAppyYn: string;
  treeIconType: string;
}

export interface RuleName {
  ruleNm: string;
  ruleid: string;
}

export interface RuleReturnItemAndItemInfo {
  ruleid: string;
  returnItemid: string;
  returnitemNo: number;
  updateUserid: string;
  updateDatetime: string;
  itemid: string;
  itemNm: string;
  itemaliasNm: string;
  itemexplanDesc: string;
  datatypeCd: string;
}

export interface TreeIfRules {
  ifid: string;
  ifNm: string;
  iftypeCd: string;
  sourceHostNm: string;
  targetTableNm: string;
  rules: Rule[];
}

export interface RuleInterface {
  ifid: string;
  ifNm: string;
  iftypeCd: string;
  sourceHostNm: string;
  targetTableNm: string;
}

export interface RuleInfoRuleReturn {
  itemid: string;
  returnitemNo: number;
  itemNm: string;
  itemaliasNm: string;
  datatypeCd: string;
}

export interface RuleInfoCondition {
  ruleid?: string; //룰아이디
  itemNm: string;
  datatypeCd: string;
  ruleconditionno: number; //조건식번호
  returnitemExprDesc: string; // 반환값
  conditionInfixDesc: string; //중위식조건
  conditionDesc: string; //설명
  uptGubun?: string; // 룰관리 수정구분 화면에서 적용
  returnItemid: string;
}

export type RuleInfoInputType = {
  ruleid?: string;
  ifNm?: string; // 인터페이스명
  ifid?: string; // 인터페이스아이디
  ruleVerno?: number; // 룰 버전
  ruleState?: string; // 룰 상태
  ruleNm?: string; // 룰명
  rulealiasNm?: string; // 룰별칭명
  ruleDesc?: string; // 룰설명
  rulesortCd?: string; // 룰 종류
  ruleusageCd?: string; // 룰 구분
  rulereturnType?: string; // 리턴타입
  allreturnYn?: string; // 계속점검여부
  deployDatetime?: string;
  deployUserid?: string;
  updateDatetime?: string;
  updateUserid?: string;
  ruleApplyYn?: string;
  deployWaitStateAppyYn?: string;
};

export type UpdateInsertAllData = {
  returnItem?: ItemMgmt[];
  conditionList?: RuleInfoCondition[];
} & RuleInfoInputType;

export interface RuleReturnItemVerstion {
  ruleid: string;
  returnItemid: string;
  returnitemNo: number;
  updateUserid: number;
  updateDatetime: string;
  itemNm: string;
  itemaliasNm: string;
  datatypeNm: string;
  ruleVerno: number;
}
export interface RuleConditionVerstion {
  ruleid: string;
  ruleconditionno: number;
  conditionInfixDesc: string;
  conditionPostfixDesc: string;
  conditionDesc: string;
  firstregUserid: number;
  firstregDatetime: string;
  updateUserid: number;
  updateDatetime: string;
  resultValue: string;

  ruleVerno: number;
}
export interface RuleVerstionData {
  ruleid: string;
  ruleNm: string;
  rulealiasNm: string;
  ruleDesc: string;
  rulereturnType: string;
  rulesortCd: string;
  ruleusageCd: string;
  allreturnYn: string;
  useYn: string;
  ruleVerno: number;
  activateYn: string;
  activateDatetime: string;
  ruleState: string;
  deployDatetime: string;
  deployUserid: string;
  ifid: string;
  firstregUserid: number;
  firstregDatetime: string;
  updateUserid: string;
  updateDatetime: string;
  ruleversionchangecode: string;
  ruleReturnItemVerstion: RuleReturnItemVerstion[];
  ruleConditionVerstion: RuleConditionVerstion[];
}

export interface RuleTestParam {
  ruleInfo: {
    ruleNm: string;
    ruleValue: string;
  };
  ruleItemList: {
    itemNm: string;
    itemValue: string;
  }[];
}
export interface RuleTestResult {
  resCode: string;
  inspectionYn: string;
  ruleReturnList: {
    returnItemNm: string;
    returnItemValue: string;
  }[];
}

export interface ConditionRuleSelect {
  ruleid: string;
  ruleNm: string;
  datatypeCd: string;
}

export interface RuleProgressHistory {
  ruleid: string;
  ruleVerno: number;
  ruleState: string;
  currentRuleApplyYn: string;
  deployWaitStateApplyYn: string;
  updateUserid: string;
  updateDatetime: string;
}

export interface RuleDeployWaitVo {
  ruleApplyYn: string;
  ruleModifyYn: string;
  deployWaitStateAppyYn: string;
  ifid: string;
  ruleid: string;
  ruleVerno: string;
  ruleNm: string;
  updateUserid: string;
  updateDatetime: string;
  deployWaitUserid: string;
  deployWaitDatetime: string;
  usedItemCnt: string;
  usedRuleCnt: string;
  recentDeployDate: string;
}

export interface UsedItemInfo {
  useGubun: string;
  itemid: string;
  itemNm: string;
}

export interface UsedRuleDetailInfo {
  useGubun: string;
  ruleid: string;
  ruleNm: string;
  ruleState: string;
  updateUserid: string;
  updateDatetime: string;
  ruleApplyYn: string;
}

export interface RuleDeployHistory {
  deployDatetime: string;
  beforeDeployApplyYn: string;
  afterDeployApplyYn: string;
  ruleUpdateYn: string;
  ifid: string;
  ruleid: string;
  ruleNm: string;
  deployUserid: string;
  usedItemCnt: string;
  usedRuleCnt: string;
  ruleVerno: string;
  ruleCallD3: number;
  ruleCheckD3: number;
}
