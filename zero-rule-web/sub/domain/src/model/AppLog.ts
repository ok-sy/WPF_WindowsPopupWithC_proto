import { CLLogLevelKey } from '../enum-types';

/**
 * @interface AppLog App 로그
 */
export interface AppLog {
  logId: number;
  logLevel: CLLogLevelKey;
  title: string;
  msg?: string;
  userName?: string;
  operatorName?: string;
  logTag?: string;
  nodeId: string;
  hostIp: string;
  clientIp?: string;
  browserName?: string;
  createdAt: number;
}
