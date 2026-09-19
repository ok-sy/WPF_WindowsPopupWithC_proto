export interface ItemMgmtUsedRuleInfo {
  ruleid: string;
  ruleNm: string;
  ruleState: string;
  activateYn: string;
}
/**
 * @interface ItemMgmt
 *
 * 항목관리 Select
 */
export interface ItemMgmt {
  itemid: string;
  itemNm?: string;
  itemAliasNm?: string;
  itemExplanDesc?: string;
  dataTypeCd?: string;
  dataTypeNm?: string;
  updateUserID?: string;
  updateDateTime?: string;
  itemUseYn?: string;
  firstRegUserId?: string;
  firstRegDateTime?: string;
  uptGubun?: string; // 룰관리 수정구분 화면에서 적용
  ifid?: string;
  usedCnt?: number;
}

export interface ItemRef {
  itemid: string;
  itemrefCd: string;
  itemrefNm: string;
  itemrefaliasNm: string;
  itemrefexprDesc: string;
  updateUserid: string;
  updateDatetime: string;
}
