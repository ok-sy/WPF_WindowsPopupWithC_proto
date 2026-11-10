/*
 * POL-06-01 : 문항·서식
 * ■ UTF-8 바이트 길이 제한(TODO73-36·38)
 * - in : text(string | null | undefined) 검사할 문자열 · previous/next(string) 바뀌기 전·후 값 · maxBytes(number) 허용 바이트 수
 * - out: number UTF-8 바이트 수 · boolean 변경 허용 여부
 * - QUIZ 선택지 문구(OPTION_TEXT)는 폐쇄망 DB 컬럼이 VARCHAR2(300 BYTE)라 글자 수·UTF-16 길이가 아니라 UTF-8 바이트로 센다.
 *   영문·숫자 1, 한글 3, 이모지 4바이트. 서식 편집기 선택지는 서식(textBlocks, CLOB)이 아니라 함께 저장하는 일반 문자열(text)을 센다.
 *   QUIZ 문항 제목(CLOB)·설문 선택지에는 적용하지 않는다.
 */

/** QUIZ 선택지 문구 최대 바이트(폐쇄망 DB OPTION_TEXT VARCHAR2(300 BYTE) 기준). */
export const QUIZ_OPTION_TEXT_MAX_BYTES = 300;

const encoder = new TextEncoder();

export const utf8ByteLength = (text: string | null | undefined): number => (text ? encoder.encode(text).length : 0);

/**
 * 입력 변경을 받아들일지 정한다. 한도 이하이면 허용, 넘으면 거부한다.
 * 이미 한도를 넘은 기존 값(이전 데이터)은 줄어드는 변경(삭제)만 허용해 사용자가 직접 줄일 수 있게 한다. 자동으로 자르지 않는다.
 */
export const acceptsByteLimitedChange = (previous: string, next: string, maxBytes: number): boolean => {
  const nextBytes = utf8ByteLength(next);
  return nextBytes <= maxBytes || nextBytes < utf8ByteLength(previous);
};

export const byteLimitMessage = (maxBytes: number, currentBytes?: number): string =>
  `${maxBytes.toLocaleString()} Byte(한글 약 ${Math.floor(maxBytes / 3)}자)까지 입력할 수 있습니다.` + (currentBytes != null ? ` 현재 ${currentBytes.toLocaleString()} Byte` : '');
