import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { COMPONENTS, PROCESSES, type GuideProcess, type GuideScope } from '../guideData';
import { Bullets, C, Page, RichText, ScopeChip, Section } from '../GuideUi';

const SCOPE_TITLES: Record<GuideScope, string> = {
  COMMON: '공통 사용 — 입력값 받기 → 미리보기 → 필요한 항목만 가져와 저장',
  PROTO: '기존 팝업 등록 — 기존 팝업 등록 화면에서 사용하는 방식',
};

function ProcessSection({ process }: { process: GuideProcess }) {
  const related = COMPONENTS.filter((component) => component.processes.includes(process.id));
  return (
    <Section id={`guide-process-${process.id}`} title={<Stack direction="row" spacing={1} alignItems="center" component="span">
      <span>{process.title}</span><ScopeChip scope={process.scope} /></Stack>} description={process.summary}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 3 }}>
        {/* 단계: 세로 타임라인 */}
        <Stack spacing={0}>
          {process.steps.map((step, index) => (
            <Stack key={step.actor} direction="row" spacing={1.5}>
              <Stack alignItems="center">
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: process.scope === 'COMMON' ? 'primary.main' : 'warning.main', color: '#fff',
                  fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index + 1}</Box>
                {index < process.steps.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
              </Stack>
              <Box sx={{ pb: index < process.steps.length - 1 ? 2 : 0, minWidth: 0 }}>
                <C>{step.actor}</C>
                <Typography sx={{ fontSize: 14, lineHeight: 1.75, mt: 0.5 }}><RichText text={step.description} /></Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        {/* 부모 책임·참고·관련 컴포넌트 */}
        <Box sx={{ bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, alignSelf: 'start' }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, mb: 0.5 }}>사용하는 화면에서 할 일</Typography>
          <Bullets items={process.parent} />
          {process.notes && process.notes.length > 0 && (
            <>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, mt: 1.5, mb: 0.5 }}>알아둘 점</Typography>
              <Bullets items={process.notes} />
            </>
          )}
          {related.length > 0 && (
            <>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, mt: 1.5, mb: 0.75 }}>관련 컴포넌트</Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{related.map((component) => <C key={component.name}>{component.name}</C>)}</Stack>
            </>
          )}
        </Box>
      </Box>
    </Section>
  );
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 사용 순서 탭
 * - in : 없음(guideData.PROCESSES)
 * - out: 화면: 공통 사용 순서(먼저)와 기존 팝업 등록 방식(따로)의 단계·사용하는 화면에서 할 일·관련 컴포넌트
 * - 데이터가 어떤 순서로 흐르는지 보여 준다. proto 흐름(createDefaultPopup·toSaveRequest)은 범용 흐름과 구분해 표시한다.
 */
export default function GuideProcessTab() {
  const jump = (id: string) => document.getElementById(`guide-process-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <Page>
      {(['COMMON', 'PROTO'] as GuideScope[]).map((scope) => {
        const processes = PROCESSES.filter((process) => process.scope === scope);
        return (
          <Stack key={scope} spacing={2}>
            <Typography component="h3" sx={{ fontSize: 18, fontWeight: 700, mt: scope === 'PROTO' ? 2 : 0 }}>{SCOPE_TITLES[scope]}</Typography>
            {scope === 'PROTO' && (
              <Alert severity="warning" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                기존 팝업 등록 화면(<C>features/RgstPop</C>)에서만 쓰는 방식입니다. 다른 화면은 위 공통 사용 순서를 따르면 됩니다.
              </Alert>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {processes.map((process) => <Chip key={process.id} label={process.title} onClick={() => jump(process.id)} variant="outlined"
                color={scope === 'COMMON' ? 'primary' : 'warning'} sx={{ fontSize: 13.5 }} />)}
            </Stack>
            {processes.map((process) => <ProcessSection key={process.id} process={process} />)}
          </Stack>
        );
      })}
    </Page>
  );
}
