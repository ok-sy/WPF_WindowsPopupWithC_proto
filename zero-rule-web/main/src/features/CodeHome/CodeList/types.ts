export type SearchParams = {
  codeType?: string;
  code?: string;
  codeNm?: string;
  rowsPerPage: number;
  pageNumber: number;
};

export const DEFAULT_SEARCH_PARAMS: SearchParams = {
  pageNumber: 0,
  rowsPerPage: 50,
};
