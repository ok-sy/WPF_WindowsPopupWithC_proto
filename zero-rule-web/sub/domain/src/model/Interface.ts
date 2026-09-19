/**
 * @interface InterfaceVo 전체목록
 */
export interface InterfaceVo {
  ifid: string; // 인터페이스ID
  ifNm: string; // 인터페이스명
  ifDesc: string; // 인터페이스설명
  ifProcessTypeCd: string; // 인터페이스처리유형
  ifConnectionTypeCd: string; // 연계방식
  ruleUseYn: string; // 룰사용여부
  docLength: number; // 전문길이수
  characterset: string; // 캐릭터셋
  eaiid: string; // EAIID
  firstregUserid: string; // 최초등록사용자ID
  firstregDatetime: string; // 최초등록일시
  updateUserid: string; // 변경사용자ID
  updateDatetime: string; // 변경일시
}

export interface RuleInterfaceMapVo {
  crudGubun?: string;
  ifid: string;
  fieldEngNm: string;
  fieldKorNm: string;
  fieldOrder: number;
  fieldLength: number;
  fieldStartNo: number;
  fieldCodeType: string;
  datatypeCd: string;
  fieldScale: number;
  trimYn: string;
  characterset: string;
  firstregUserid?: number;
  firstregDatetime?: string;
  updateUserid?: number;
  updateDatetime?: string;
  ifNm: string;
}
