export type SearchParams = {
  codeType?: string;
  codeTypeNm?: string;
  dtlExpl?: string;
  rowsPerPage: number;
  pageNumber: number;
};

export const DEFAULT_SEARCH_PARAMS: SearchParams = {
  pageNumber: 0,
  rowsPerPage: 20,
};
