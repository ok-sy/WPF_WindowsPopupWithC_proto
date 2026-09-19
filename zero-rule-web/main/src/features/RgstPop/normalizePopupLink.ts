/** 미리보기와 저장에서 동일한 HTTP/HTTPS 주소를 사용한다. */
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
