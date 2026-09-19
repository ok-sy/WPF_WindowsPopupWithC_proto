import { CLLogLevelKey } from '../enum-types';

/**
 * @interface CLJobLog clover job 로그
 */
export interface CLJobLog {
  /**
   * Log Id
   */
  logId: number;

  /**
   * JobId
   */
  jobId: string;

  /**
   * 잡을 실행한 서버
   */
  nodeId: string;

  /**
   * 로그 내용
   */
  msg?: string;

  /**
   * 로그 레벨
   */
  logLevel: CLLogLevelKey;

  /**
   * 생성 시각
   */
  createdAt: number;
}
