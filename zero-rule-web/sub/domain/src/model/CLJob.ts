import { CLJobStatusKey } from '../enum-types';

/**
 * @interface CLJob clover job 정보
 */
export interface CLJob {
  jobId: string;

  jobTitle: string;

  jobDesc: string;

  /**
   * 잡을 실행한 서버
   */
  nodeId?: string;

  /**
   * 잡의 최종 에러 메시지
   */
  errorMsg?: string;

  /**
   * 최종 JobStatus
   */
  jobStatus: CLJobStatusKey;

  /**
   * Job 시작 시간
   */
  jobStartedAt: number;

  /**
   * Job 종료 시간
   */
  jobFinishedAt: number;

  /**
   * 사용 여부
   */
  enabled: boolean;

  /**
   * 최종 JobStatus 업데이트 시간
   */
  changedAt: number;

  /**
   * 최초 등록 일시
   */
  createdAt: number;
}
