import { PdsSimple } from './PdsSimple';
import { UploadedFile } from './UploadedFile';

/**
 * @interface Pds
 *
 * 자료실
 */
export interface Pds extends PdsSimple {
  /**
   * 게시물내용
   */
  substance: string;

  attachFiles?: UploadedFile[];
}
