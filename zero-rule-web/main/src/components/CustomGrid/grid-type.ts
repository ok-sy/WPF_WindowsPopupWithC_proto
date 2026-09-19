/**
 * 기본 컬럼 타입
 * @autor sim jinwoo
 */
export type CustomGridColumn = {
  columeId: string;
  columeName: string;
  columeType: 'string' | 'number' | 'boolean' | 'component';
  textAlign?: 'center' | 'left' | 'right';
  maxWidth?: number;
  onClickEvent?: (
    value: string | number | boolean,
    index: number,
    data: any,
    columeId: string,
  ) => void;
};

export type CustomGridColumnsView = {
  columnId: string;
  isVisiable: boolean;
};
/**
 * 그리드 정렬 타입
 * @autor sim jinwoo
 */
export type CustomGridSortingType = {
  columeId: string;
  columeType: 'string' | 'number' | 'boolean' | 'component';
  order: 'basic' | 'asc' | 'desc';
};

/**
 * 그리드 문자열 필터 타입
 * @autor sim jinwoo
 */
export type CustomGridFilterType = {
  columeId: string;
  keyword?: string;
  operator: 'contain' | 'equals' | 'notEquals';
};

/**
 * 그리드 숫자 필터 타입
 * @autor sim jinwoo
 */
export type CustomGridFilterNumType = {
  columeId: string;
  minValue?: number;
  maxValue?: number;
  operValue?: number;
  numOperator: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'between';
};

/**
 * 컬럼별 숨기기 타입
 * @autor sim jinwoo
 */
export type CustomGridColumnFilter = CustomGridColumn & {
  isVisiable: boolean;
};

/**
 * 소계관련 데이터
 * @autor sim jinwoo
 */
export type CustomGridSubtotal = {
  columnIds: string[];
  calculColumeId: string;
  sign: 'sum' | 'average' | 'max' | 'min' | 'count';
  autoSorting?: 'asc' | 'desc';
};

/**
 * 총계 데이터
 * @autor sim jinwoo
 */
export type CustomGridTotal = {
  calculColumeId: string;
  sign: 'sum' | 'average' | 'max' | 'min' | 'count';
};
