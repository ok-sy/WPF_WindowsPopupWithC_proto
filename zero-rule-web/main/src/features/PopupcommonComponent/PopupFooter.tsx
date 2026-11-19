import { Box, Button, Stack, type ButtonProps } from '@mui/material';
import type { ReactNode } from 'react';
import { POPUP_COLORS, POPUP_LAYOUT } from './popupLayout';
import { surveySubmitSx } from './SurveyPreview';

const BUTTON = POPUP_LAYOUT.button;
const BUTTON_BASE = {
  height: BUTTON.height, minWidth: BUTTON.minWidth, px: `${BUTTON.paddingX}px`, py: 0, boxSizing: 'border-box', whiteSpace: 'nowrap',
  flexShrink: 0, fontWeight: 600, borderRadius: `${BUTTON.radius}px`,
} as const;

/**
 * POL-02-03 : 푸터 역할
 * ■ 푸터 버튼 모양 3종(TODO61-21)
 * - primary: 확인·바로가기(WPF ActionButtonStyle) · secondary: 나중에 보기·보조 닫기(SecondaryActionButtonStyle)
 *   · submit: 설문·퀴즈 제출(SurveySubmitButtonStyle 색·모서리 11·최소 132, 높이만 푸터 34)
 * - 높이 34는 푸터 버튼 공통이다. 결과 안내창 버튼(WPF 44)과는 별개다.
 */
export const POPUP_FOOTER_BUTTON_SX = {
  primary: {
    ...BUTTON_BASE, bgcolor: POPUP_COLORS.primary, color: '#FFFFFF',
    '&:hover': { bgcolor: POPUP_COLORS.primaryHover }, '&:active': { bgcolor: POPUP_COLORS.primaryPressed },
    '&.Mui-disabled': { bgcolor: POPUP_COLORS.disabledBackground, color: POPUP_COLORS.disabledText },
  },
  secondary: {
    ...BUTTON_BASE, border: `1px solid ${POPUP_COLORS.border}`, bgcolor: POPUP_COLORS.secondary, color: POPUP_COLORS.primary,
    '&:hover': { bgcolor: POPUP_COLORS.secondaryHover }, '&:active': { bgcolor: POPUP_COLORS.border }, '&:focus-visible': { borderColor: POPUP_COLORS.focus },
  },
  submit: { ...surveySubmitSx, minWidth: BUTTON.submitMinWidth, height: BUTTON.height, py: 0, whiteSpace: 'nowrap', flexShrink: 0 },
} as const;

type FooterButtonProps = Omit<ButtonProps, 'variant' | 'color'> & { kind: keyof typeof POPUP_FOOTER_BUTTON_SX };

/**
 * POL-02-03 : 푸터 역할
 * ■ 푸터 버튼
 * - in : kind('primary' | 'secondary' | 'submit') 모양 · 나머지는 MUI Button props(onClick·disabled·aria-* 등)
 * - out: 화면: 푸터 버튼. 글자 크기는 PopupFooter의 푸터 글자 크기를 이어받는다.
 */
export function PopupFooterButton({ kind, sx, ...props }: FooterButtonProps) {
  return (
    <Button
      variant={kind === 'secondary' ? 'text' : 'contained'}
      color={kind === 'secondary' ? 'inherit' : 'primary'}
      disableElevation
      sx={[POPUP_FOOTER_BUTTON_SX[kind], ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  );
}

interface FooterProps {
  /** 푸터 글자 크기(footerFontSize, 없으면 기본 14). 버튼·체크박스 글자가 이어받는다. */
  fontSize: number;
  /** 왼쪽 끝 버튼(나중에 보기). WPF FooterArea 첫 열 */
  start?: ReactNode;
  /** 안내 문구·다시 보지 않기 체크박스. WPF FooterArea 둘째 열(남는 폭) */
  status?: ReactNode;
  /** 오른쪽 버튼(보조 닫기·확인·제출). WPF FooterArea 셋째 열 */
  end?: ReactNode;
  /**
   * 좁을 때 동작. 'row'(기본): 오른쪽 버튼 묶음을 다음 줄로 내려 잘리지 않게 한다(일반 푸터).
   * 'text': 줄을 나누지 않고 안내 문구를 줄바꿈한다(설문 푸터 — 응답 진행 문구가 길어질 수 있음).
   */
  wrap?: 'row' | 'text';
}

/**
 * POL-02-03 : 푸터 역할
 * ■ 팝업 공통 푸터(TODO61-21)
 * - in : fontSize · start · status · end · wrap(FooterProps)
 * - out: 화면: WPF FooterArea와 같은 배치(최소 높이 64, 좌우 28·위아래 15, 나중에 보기 → 안내·체크박스 → 오른쪽 버튼)
 * - 일반·설문 푸터가 같은 틀을 쓴다. 구분선은 없다(WPF와 같음).
 */
export default function PopupFooter({ fontSize, start, status, end, wrap = 'row' }: FooterProps) {
  const L = POPUP_LAYOUT;
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        px: `${L.footerPaddingX}px`, py: `${L.footerPaddingY}px`, boxSizing: 'border-box', minHeight: L.footerHeight, flexShrink: 0,
        // 왼쪽 묶음과 오른쪽 버튼 사이: 일반 푸터는 좁은 인라인 미리보기에서도 한 줄에 들도록 8, 설문은 16.
        flexWrap: wrap === 'row' ? 'wrap' : 'nowrap', columnGap: wrap === 'row' ? 1 : `${L.footerGroupGap}px`, rowGap: 1,
        fontSize, '& .MuiFormControlLabel-label, & .MuiButton-root': { fontSize: 'inherit' },
        // MUI FormControlLabel 기본 여백(왼쪽 -11·오른쪽 16) 대신 묶음 간격만 쓴다 — WPF 체크박스 글자 위치와 같아진다.
        '& .MuiFormControlLabel-root': { ml: 0, mr: 0 },
      }}
    >
      {/* 왼쪽 묶음(나중에 보기 → 안내·체크박스). 줄이 바뀔 때도 함께 움직인다. */}
      <Stack direction="row" alignItems="center" sx={{ minWidth: 0, columnGap: `${L.footerGroupGap}px` }}>
        {start}
        {status != null && <Box sx={{ minWidth: 0 }}>{status}</Box>}
      </Stack>
      <Stack direction="row" alignItems="center" sx={{ ml: 'auto', columnGap: `${L.footerButtonGap}px`, flexShrink: 0 }}>{end}</Stack>
    </Stack>
  );
}
