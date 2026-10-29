import { Alert, Box, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import GuideCodeRunner from '../GuideCodeRunner';
import { COMPONENTS } from '../guideData';
import { COMPONENT_RUNNERS, RUNNER_NOTES } from '../guideRunners';
import { Bullets, CODE_FONT, CodeBlock, FieldTable, Section } from '../GuideUi';

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 컴포넌트 탭
 * - in : initial(string?) 처음 열 컴포넌트 이름(공지의 영향 컴포넌트 링크에서 넘김)
 * - out: 화면: 컴포넌트 선택 탭, props·출력·다루는 값·재사용 예제, 오른쪽 실행기(INPUT → 실행 결과 → OUTPUT)
 * - 선택을 바꾸면 실행기를 key로 새로 만든다(이전 입력이 섞이지 않게).
 */
export default function GuideComponentTab({ initial }: { initial?: string }) {
  const [selected, setSelected] = useState(() => COMPONENTS.find((item) => item.name === initial)?.name ?? COMPONENTS[0].name);
  const component = COMPONENTS.find((item) => item.name === selected) ?? COMPONENTS[0];
  const runner = COMPONENT_RUNNERS[component.name];
  return (
    <Stack spacing={2.5}>
      {/* 컴포넌트 선택: 가로 목록(설명과 실행기에 폭을 쓰려고 세로 목록 대신 위에 둔다) */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Tabs value={selected} onChange={(_, value) => setSelected(value)} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', minHeight: 44, fontFamily: CODE_FONT, fontSize: 13.5 } }}>
          {COMPONENTS.map((item) => <Tab key={item.name} value={item.name} label={item.name} />)}
        </Tabs>
      </Paper>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 480px', xl: 'minmax(0, 1fr) 560px' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Typography sx={{ fontFamily: CODE_FONT, fontSize: 22, fontWeight: 700 }}>{component.name}</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>{component.file}</Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.75, mt: 1.5 }}>{component.summary}</Typography>
          </Paper>
          <Section title="입력 props" description="* 표시는 필수입니다."><FieldTable fields={component.props} empty="없음" /></Section>
          <Section title="출력 (콜백·화면)"><FieldTable fields={component.outputs} empty="없음" /></Section>
          <Section title="다루는 값"><Bullets items={component.values} /></Section>
          <Section title="재사용 방법">
            <Bullets items={component.reuse} />
            <Box sx={{ mt: 2 }}><CodeBlock>{`import { ${component.name} } from '@/features/PopupcommonComponent';\n\n${component.example}`}</CodeBlock></Box>
          </Section>
        </Stack>
        {/* 오른쪽: INPUT → 실행 결과 → OUTPUT. 컴포넌트를 바꾸면 key로 실행기를 새로 만든다. */}
        <Box sx={{ position: { lg: 'sticky' }, top: 0, minWidth: 0 }}>
          {runner
            ? <GuideCodeRunner key={component.name} definition={runner} title={`${component.name} 실행기`} />
            : <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>{RUNNER_NOTES[component.name] ?? '이 컴포넌트는 실행기가 없습니다.'}</Alert>}
        </Box>
      </Box>
    </Stack>
  );
}
