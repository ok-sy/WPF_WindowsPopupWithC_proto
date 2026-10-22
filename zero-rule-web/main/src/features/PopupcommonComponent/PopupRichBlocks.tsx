import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { readTextBlocks, RICH_INDENT_STEP, richFontCss, type RichBlock } from './popupRichText';

/**
 * POL-03-01 : 저장·표시 경계
 * POL-06-01 : 문항·서식
 * ■ 표시할 서식 본문 고르기
 * - in : value(unknown) 저장·수신한 textBlocks 값
 * - out: RichBlock[] | null 글자가 있는 정리된 문단 배열, 서식 없음이면 null
 * - 서식 값을 받아 textBlocks 형식이 유효하고 글자가 있으면 문단 배열을, 아니면 null을 돌려준다.
 *   WPF PopupRichText·서버 PopupSurveyRichText와 같이 null·[]·글자 없는 문단만이면 서식 없음(일반 문자열 표시)이다.
 */
export function richBlocksOrNull(value: unknown): RichBlock[] | null {
  const blocks = readTextBlocks(value);
  return blocks && blocks.some((block) => block.runs.length > 0) ? blocks : null;
}

interface Props {
  /** 표시할 서식 문단 */
  blocks: RichBlock[];
  /** 마지막 문단 끝에 붙일 요소(문항 필수 표시 `*`·선택 안내). WPF도 마지막 문단 끝에 붙인다. */
  trailing?: ReactNode;
  /** 바깥 span의 id(aria-labelledby 연결용) */
  id?: string;
}

/**
 * POL-03-01 : 저장·표시 경계
 * POL-06-01 : 문항·서식
 * ■ 서식 본문 표시
 * - in : blocks(RichBlock[]) 표시할 문단 · trailing?(ReactNode) 마지막 문단 끝에 붙일 요소 · id?(string) 바깥 요소 id
 * - out: 화면: 문단별 정렬·들여쓰기·글자 서식을 적용한 span 묶음
 * - 서식 문단을 받아 React 요소로만 그린다(innerHTML 사용 안 함). 빈 문단도 한 줄 높이를 유지한다.
 *   들여쓰기는 문단 전체 왼쪽 여백(WPF 40 DIP와 같은 40px 단위)이다. 구간에 지정이 없는 글꼴·크기·색·굵기는
 *   바깥(일반 문자열 자리)의 값을 이어받는다.
 */
export default function PopupRichBlocks({ blocks, trailing, id }: Props) {
  return (
    <Box id={id} component="span" sx={{ display: 'block' }}>
      {blocks.map((block, index) => (
        <Typography key={index} component="span" sx={{
          display: 'block', whiteSpace: 'pre-wrap', textAlign: block.alignment.toLowerCase(), minHeight: '1.5em',
          pl: `${(block.indent ?? 0) * RICH_INDENT_STEP}px`, font: 'inherit', color: 'inherit',
        }}>
          {block.runs.map((run, runIndex) => (
            <Box key={runIndex} component="span" sx={{
              fontWeight: run.bold ? 700 : undefined, fontStyle: run.italic ? 'italic' : undefined,
              textDecoration: [run.underline && 'underline', run.strikethrough && 'line-through'].filter(Boolean).join(' ') || undefined, color: run.color,
              fontSize: run.size ? `${run.size}px` : undefined, fontFamily: richFontCss(run.font),
            }}>{run.text}</Box>
          ))}
          {index === blocks.length - 1 && trailing}
        </Typography>
      ))}
    </Box>
  );
}
