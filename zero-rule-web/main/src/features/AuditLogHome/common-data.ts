import type { CLAuditLogKindKey, CLLogLevelKey } from '@local/domain';

export type SearchOption = {
  pageNumber: number;
  rowsPerPage: number;
  logLevels: CLLogLevelKey[];
  logKind?: CLAuditLogKindKey;
  title?: string;
  jobId?: string;
  pageId?: string;
  operatorName?: string;
  logTag?: string;
  clientIp?: string;
  logYyyymmdd?: string;
};

// 조회 옵션 기본값
export const DEFAULT_SEARCH_OPTION: SearchOption = {
  pageNumber: 0,
  rowsPerPage: 20,
  logLevels: [],
  // sortKey: {
  //   field: 'name',
  //   direction: 'asc',
  // },
};
