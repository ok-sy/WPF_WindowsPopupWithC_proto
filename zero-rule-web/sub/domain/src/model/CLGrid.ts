/**
 * @interface CLGrid
 *
 * 그리드 요청,응답 인터페이스
 */
export interface GridFilterInsert {
  filterNm: string; //  필터명
  pageCode: string; //  화면 코드
  filterModeYn: string; //  텍스트필터모드여부
  defaultYn: string; //  기본필터 설정여부
}

export interface GridColumnInsert {
  columnId: string; // 	컬럼ID
  visiableYn: string; // 	컬럼표시여부
  filteringText?: string; // 	컬럼문자
  filteringOperCode?: string; // 	필터링 연산자
  columnSeq: number; // 	컬럼순번
  columnTypeCode?: string; // 	컬럼타입코드
  sortingInfo?: string; // 	데이터정렬방식
}

export interface GridColumn {
  columnId: string; // 	컬럼ID
  filterId?: number; // 	그리드 필터 ID
  visiableYn?: string; // 	컬럼표시여부
  filteringText?: string; // 	컬럼문자
  filteringOperCode?: string; // 	필터링 연산자
  columnSeq?: number; // 	컬럼순번
  columnTypeCode?: string; // 	컬럼타입코드
  sortingInfo?: string; // 	데이터정렬방식
}
export interface GridList {
  filterId?: number; // 	그리드 필터 ID
  filterNm?: string; // 	필터명
  userId?: number; // 	사용자ID
  pageCode?: string; // 	화면 코드
  filterModeYn?: string; // 	텍스트필터모드여부
  defaultYn?: string; // 	기본필터 설정여부
  columns: GridColumn[]; // 컬럼목록
}
