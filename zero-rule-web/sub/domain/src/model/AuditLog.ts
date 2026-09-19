import { CLAuditLogKindKey, CLLogLevelKey } from '../enum-types';

/**
 * @interface AuditLog 감사 로그
 */
export interface AuditLog {
  /**
   * 로그ID
   */
  logId: number;

  /**
   * 로그 레벨
   */
  logLevel: CLLogLevelKey;
  /**
   * 로그 종류
   */
  logKind: CLAuditLogKindKey;

  /**
   * 제목
   */
  title: string;

  /**
   * 로그 상세 메시지
   */
  msg?: string;

  /**
   * 관련 JOB ID
   */
  jobId?: string;
  /**
   * 관련 페이지ID
   */
  pageId?: string;

  /**
   * 실행 사용자 이름 또는 ID
   */
  operatorName?: string;

  /**
   * 로그 태그
   */
  logTag?: string;

  /**
   * 실행 노드 ID
   */
  nodeId: string;

  /**
   * 실행 노드 IP
   */
  hostIp: string;

  /**
   * 클라이언트 IP 주소
   */
  clientIp?: string;

  /**
   * 클라이언트 브라우저 이름
   */
  browserName?: string;

  /**
   * 로그 등록일시
   */
  createdAt: number;
}
