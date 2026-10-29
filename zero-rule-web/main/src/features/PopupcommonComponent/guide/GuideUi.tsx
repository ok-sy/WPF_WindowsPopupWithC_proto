/*
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드 화면 공통 표시 컴포넌트
 * - 탭 파일들이 함께 쓰는 표시 전용 요소(코드 조각·코드 블록·구획·글머리·필드 표·범위 표시·탭 이동 링크).
 * - 값·이벤트 로직을 두지 않는다. 공통 컴포넌트 소스(..)를 import하지 않는다(가이드 → 공통 단방향).
 */
import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Fragment, type ReactNode } from 'react';
import { CODE_FONT } from './GuideCodeRunner';
import type { GuideField, GuideScope } from './guideData';

export { CODE_FONT };

/** 가이드 탭 ID. 탭 이동 링크(공지·시작하기)에서 쓴다. */
export type GuideTabId = 'start' | 'process' | 'component' | 'saveParts' | 'example' | 'function' | 'live' | 'notice';
/** 탭 표시 이름(화면 순서). 첫 진입은 시작하기, 공지는 맨 뒤(배지로 최근 게시 수 표시). */
export const GUIDE_TAB_LABELS: Record<GuideTabId, string> = {
  start: '시작하기', process: '사용 순서', component: '컴포넌트', saveParts: '다른 화면에서 사용하기', example: '예시', function: '데이터 처리 함수', live: '실습', notice: '공지',
};
/** 탭 이동 요청. component를 주면 컴포넌트 탭에서 해당 컴포넌트를 연다. */
export type GuideNavigate = (tab: GuideTabId, component?: string) => void;

/* 본문 최대 폭. 한 줄이 너무 길면 읽기 어려워 화면이 넓어도 이 폭까지만 쓴다(실습·컴포넌트 탭은 넓게). */
const CONTENT_MAX_WIDTH = 1120;

/** 본문 안 코드 조각(함수·키 이름). */
export function C({ children }: { children: ReactNode }) {
  return (
    <Box component="code" sx={{ fontFamily: CODE_FONT, fontSize: '0.92em', bgcolor: '#f1f5f9', color: '#0f172a',
      border: '1px solid #e2e8f0', borderRadius: 0.75, px: 0.6, py: 0.1, whiteSpace: 'nowrap' }}>{children}</Box>
  );
}

/** 설명 문자열의 `백틱` 구간을 코드 조각으로 바꾼다. */
export function RichText({ text }: { text: string }) {
  return <>{text.split('`').map((part, index) => (index % 2 === 1 ? <C key={index}>{part}</C> : <Fragment key={index}>{part}</Fragment>))}</>;
}

/** 여러 줄 코드 블록. */
export function CodeBlock({ children }: { children: string }) {
  return (
    <Box component="pre" sx={{ m: 0, p: 2, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1.5, fontSize: 13, lineHeight: 1.65,
      overflow: 'auto', whiteSpace: 'pre', fontFamily: CODE_FONT }}>{children}</Box>
  );
}

/** 제목 왼쪽 강조선이 있는 구획. */
export function Section({ title, description, children, id }: { title: ReactNode; description?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Paper id={id} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Typography component="h3" sx={{ fontSize: 17, fontWeight: 700, pl: 1.25, borderLeft: '4px solid', borderColor: 'primary.main', lineHeight: 1.3 }}>
        {title}
      </Typography>
      {description && <Typography component="div" sx={{ fontSize: 14, color: 'text.secondary', mt: 1, lineHeight: 1.7 }}>{description}</Typography>}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  );
}

/** 읽기 좋은 글머리 목록. 문자열은 `백틱`을 코드 조각으로 바꾼다. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { fontSize: 14, lineHeight: 1.8, mb: 0.5 }, '& li::marker': { color: 'primary.main' } }}>
      {items.map((item, index) => <li key={index}>{typeof item === 'string' ? <RichText text={item} /> : item}</li>)}
    </Box>
  );
}

/** 탭 본문 폭 제한. */
export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <Stack spacing={2.5} sx={{ maxWidth: wide ? 'none' : CONTENT_MAX_WIDTH }}>{children}</Stack>;
}

/** props·콜백 표. */
export function FieldTable({ fields, empty }: { fields: GuideField[]; empty: string }) {
  if (fields.length === 0) return <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{empty}</Typography>;
  return (
    <Table size="small" sx={{ '& td, & th': { fontSize: 14, py: 1.25, verticalAlign: 'top' }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
      <TableHead><TableRow><TableCell sx={{ width: 190 }}>이름</TableCell><TableCell sx={{ width: '38%' }}>타입</TableCell><TableCell>설명</TableCell></TableRow></TableHead>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.name}>
            <TableCell><C>{field.name}</C>{field.required && <Typography component="span" color="error" sx={{ ml: 0.5 }} title="필수">*</Typography>}</TableCell>
            <TableCell sx={{ fontFamily: CODE_FONT, fontSize: '13px !important', color: '#334155', wordBreak: 'break-word' }}>{field.type}</TableCell>
            <TableCell sx={{ lineHeight: 1.7 }}>{field.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** 범위 표시: 공통 사용(어느 화면이든) / 기존 팝업 등록(RgstPop 화면에서 쓰는 방식). */
export function ScopeChip({ scope }: { scope: GuideScope }) {
  return scope === 'COMMON'
    ? <Chip size="small" color="success" variant="outlined" label="공통 사용" sx={{ height: 20, fontSize: 11.5, fontWeight: 700 }} />
    : <Chip size="small" color="warning" variant="outlined" label="기존 팝업 등록" sx={{ height: 20, fontSize: 11.5, fontWeight: 700 }} />;
}

/** 다른 탭으로 이동하는 작은 버튼. */
export function TabLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button size="small" variant="text" onClick={onClick} sx={{ textTransform: 'none', px: 0.75, minWidth: 0, fontSize: 13.5 }}>{label} →</Button>;
}
