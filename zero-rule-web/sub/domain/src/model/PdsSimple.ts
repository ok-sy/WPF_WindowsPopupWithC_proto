/**
 * @interface PdsSimple
 *
 * 자료실 Simple
 * 목록 조회용으로 사용, substance가 없음
 */
export interface PdsSimple {
  /**
   * 자료ID
   */
  pdsId: number;

  /**
   * 제목
   */
  title: string;

  /**
   * 첨부파일수
   */
  attachFileCount: number;

  /**
   * 생성사용자ID
   */
  createUserId?: string;

  /**
   * 등록일시
   */
  createdAt: number;

  /**
   * 변경일시
   */
  changedAt: number;
}
