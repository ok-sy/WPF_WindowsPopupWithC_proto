import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { readTextBlocks, RICH_INDENT_STEP, richFontCss, type RichBlock } from './popupRichText';

/**
 * [TODO55] 서식(textBlocks 스키마)이 유효하고 글자가 있으면 문단 배열을, 아니면 null을 돌려준다.
 * WPF PopupRichText·서버 PopupSurveyRichText와 같이 null·[]·글자 없는 문단만이면 서식 없음(일반 문자열 표시)이다.
 */
export function richBlocksOrNull(value: unknown): RichBlock[] | null {
  const blocks = readTextBlocks(value);
  return blocks && blocks.some((block) => block.runs.length > 0) ? blocks : null;
}

interface Props {
  blocks: RichBlock[];
  /** 마지막 문단 끝에 붙일 요소(문항 필수 표시 `*`·선택 안내). WPF도 마지막 문단 끝에 붙인다. */
  trailing?: ReactNode;
  id?: string;
}

/**
 * [설계 28·TODO55] 서식 문단 표시. React 요소로만 만든다(innerHTML 사용 안 함). 빈 문단도 한 줄 높이를 유지하고,
 * [설계 49] 들여쓰기는 문단 전체 왼쪽 여백(WPF 40 DIP와 같은 40px 단위)이다. 구간에 지정이 없는 글꼴·크기·색·굵기는
 * 바깥(일반 문자열 자리)의 값을 이어받는다.
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
              textDecoration: run.underline ? 'underline' : undefined, color: run.color,
              fontSize: run.size ? `${run.size}px` : undefined, fontFamily: richFontCss(run.font),
            }}>{run.text}</Box>
          ))}
          {index === blocks.length - 1 && trailing}
        </Typography>
      ))}
    </Box>
  );
}
