/**
 * POL-02-03 : 푸터 역할
 * ■ 링크 주소 정규화
 * - in : value(unknown) 입력한 링크 주소
 * - out: string | undefined 정규화한 HTTP/HTTPS 주소. 공백 포함·다른 스킴·계정 정보 포함·해석 불가면 undefined
 * - 입력한 주소를 받아 스킴이 없으면 https를 붙이고, 미리보기와 저장이 같은 HTTP/HTTPS 주소를 쓰게 한다.
 */
export default function normalizePopupLink(value: unknown): string | undefined {
  const input = String(value ?? '').trim();
  if (!input || /\s/.test(input)) return undefined;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(input);
  try {
    const url = new URL(hasScheme ? input : input.startsWith('//') ? 'https:' + input : 'https://' + input);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
