/**
 * 메타 검색 필드 키
 * @deprecated
 */
export type MetaWordSearchFieldKey =
  | 'ALL' // 전체
  | 'WORD' // 단어
  | 'COMPOUND_WORD' // 용어
  | 'DOMAIN'; // 도메인

/**
 * 메타 검색 필드
 * @deprecated
 */
export const MetaWordSearchField: Record<MetaWordSearchFieldKey, string> = {
  ALL: '전체',
  WORD: '단어',
  COMPOUND_WORD: '용어',
  DOMAIN: '도메인',
};
