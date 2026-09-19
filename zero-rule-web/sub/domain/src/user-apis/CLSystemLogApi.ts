import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  CL_SYSTEM_LOG_API_URL,
  splitParams,
} from '..';
import { CLAuditLogKindKey, CLLogLevelKey } from '../enum-types';
import { AppLog, AuditLog, CLJobLog, PagerData } from '../model';

/**
 * clover framework 시스템 로그 API
 * 세 종류의 로그가 있다.
 * JobLog, AuditLog, AppLog
 */
export class CLSystemLogApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * Job 로그 목록 조회 - 페이징
   */
  jobLogList = (
    params: {
      pageNumber: number;
      rowsPerPage: number;
      jobId?: string;
      logYyyymmdd?: string;
      logLevels: CLLogLevelKey[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<CLJobLog> }>> => {
    const url = CL_SYSTEM_LOG_API_URL.jobLogList;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * App 로그 목록 조회 - 페이징
   */
  appLogList = (
    params: {
      pageNumber: number;
      rowsPerPage: number;
      logLevels?: CLLogLevelKey[];
      userName?: string;
      title?: string;
      logTag?: string;
      logYyyymmdd?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<AppLog> }>> => {
    const url = CL_SYSTEM_LOG_API_URL.appLogList;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * Audit 로그 목록 조회 - 페이징
   */
  auditLogList = (
    params: {
      pageNumber: number;
      rowsPerPage: number;
      logLevels?: CLLogLevelKey[];
      logKind?: CLAuditLogKindKey;
      title?: string;
      jobId?: string;
      pageId?: string;
      operatorName?: string;
      logTag?: string;
      clientIp?: string;
      logYyyymmdd?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<AuditLog> }>> => {
    const url = CL_SYSTEM_LOG_API_URL.auditLogList;
    return this.withData.postJson(url, ...splitParams(params));
  };
}
