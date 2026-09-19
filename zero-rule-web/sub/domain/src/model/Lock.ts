import { CLCodeKey } from './CLCodeKey';

/**
 * @interface Lock
 *
 * 공통 코드
 */
export interface Lock {
  lockcode: string;
  lockkey: string;
  lockdatetime: number;
  userid: string;
  locktypecode: string;
  locknote: string;

  userNm: string;
  lgonId: string;
}
