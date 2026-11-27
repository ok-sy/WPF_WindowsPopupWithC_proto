import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupPreview from '../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview';
import { registerPopupRichFonts } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupRichText';

/* POL-16-02 : 재현 가능한 검증
 * ■ TODO62-5 취소선 위치 실측 진입점(2026-11-28)
 * - 관리자 미리보기(PopupPreview) TEXT 팝업을 width×height 상자에 그린다(verify-popup-parity-entry와 같은 테마).
 * - 폐쇄망처럼 글꼴 이름을 등록한다. 유앤아이Modern은 이 PC에 설치되어 있지 않아 웹·WPF 모두 대체 글꼴로 그려진다(기록용).
 * - window.analyzeStrike(기준 png, 비교 png): 두 캡처를 캔버스로 읽어 글자 잉크 상자와 달라진 줄(취소선·밑줄)을 잰다.
 */
registerPopupRichFonts([
  { family: 'Noto Sans KR', css: "'Noto Sans KR', sans-serif" },
  { family: 'Noto Serif KR', css: "'Noto Serif KR', serif" },
  { family: '유앤아이Modern', css: "'유앤아이Modern', sans-serif" },
  // 폐쇄망 글꼴 이름(2026-11-28 사진: 미리보기 취소선이 글자 윗부분에 걸림). 이 PC에도 같은 이름의 라틴 글꼴이 설치되어 있다.
  { family: 'Noto Sans', css: "'Noto Sans', sans-serif" },
  { family: 'Noto Serif', css: "'Noto Serif', serif" },
  // 폐쇄망 등록 방식(family = WPF 패밀리 이름, faces = 굵기별 서체 local 이름). 이 PC 사용자 글꼴: HeadRegular·HeadExtraBold·TextBold.
  { family: 'YouandiModern Head', faces: { regular: 'YouandiModern HeadRegular', bold: 'YouandiModern HeadExtraBold' } },
  { family: 'YouandiModern TextBold', faces: { regular: 'YouandiModern TextBold' } },
]);
const root = createRoot(document.getElementById('root')!);
const theme = createTheme({ typography: { fontFamily: '"Malgun Gothic", Arial, sans-serif', body1: { fontSize: '0.85rem' } } });
const w = window as any;
w.mountStrike = (popup: any) => {
  root.render(<ThemeProvider theme={theme}><CssBaseline />
    <div id="frame" style={{ width: popup.width, height: popup.height, display: 'flex' }}>
      <PopupPreview key={popup.popupId + JSON.stringify(popup.content.textBlocks)} popup={popup} showBackground={false} />
    </div>
  </ThemeProvider>);
};

const load = async (url: string) => {
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
};
const luminance = (d: Uint8ClampedArray, i: number) => {
  // 투명 픽셀(WPF 흰 판 밖)은 흰색으로 본다.
  const a = d[i + 3] / 255;
  return (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) * a + 255 * (1 - a);
};
/**
 * 기준(base: 장식 없음)과 비교(variant: 취소선·밑줄 등) 캡처를 비교한다.
 * - ink: 기준의 어두운 픽셀(밝기 < 128) 상자 = 글자 잉크 영역
 * - lines: 두 캡처가 크게 다른(밝기 차 > 48) 픽셀이 잉크 폭의 40% 이상인 행을 이어 붙인 줄 목록(위에서부터). 줄마다 위·아래·두께·가로 범위.
 */
w.analyzeStrike = async (baseUrl: string, variantUrl: string) => {
  const [a, b] = await Promise.all([load(baseUrl), load(variantUrl)]);
  if (a.width !== b.width || a.height !== b.height) return { error: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  let top = -1, bottom = -1, left = a.width, right = -1;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    if (luminance(a.data, (y * a.width + x) * 4) < 128) { if (top < 0) top = y; bottom = y; left = Math.min(left, x); right = Math.max(right, x); }
  }
  if (top < 0) return { error: 'no ink' };
  const inkWidth = right - left + 1;
  const rows: { y: number; from: number; to: number }[] = [];
  for (let y = 0; y < a.height; y++) {
    let count = 0, from = a.width, to = -1;
    for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      if (Math.abs(luminance(a.data, i) - luminance(b.data, i)) > 48) { count++; from = Math.min(from, x); to = Math.max(to, x); }
    }
    if (count >= inkWidth * 0.4) rows.push({ y, from, to });
  }
  const lines: { top: number; bottom: number; thickness: number; center: number; left: number; right: number }[] = [];
  for (const row of rows) {
    const last = lines[lines.length - 1];
    if (last && row.y === last.bottom + 1) { last.bottom = row.y; last.left = Math.min(last.left, row.from); last.right = Math.max(last.right, row.to); }
    else lines.push({ top: row.y, bottom: row.y, thickness: 0, center: 0, left: row.from, right: row.to });
  }
  for (const line of lines) { line.thickness = line.bottom - line.top + 1; line.center = (line.top + line.bottom + 1) / 2; }
  return { size: { width: a.width, height: a.height }, ink: { top, bottom, left, right, height: bottom - top + 1, width: inkWidth }, lines };
};
