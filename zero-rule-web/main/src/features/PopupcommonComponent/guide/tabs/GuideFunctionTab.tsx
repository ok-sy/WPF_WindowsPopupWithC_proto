import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { FUNCTIONS, type GuideScope } from '../guideData';
import { C, CODE_FONT, Page, ScopeChip, Section } from '../GuideUi';

const SCOPE_TITLES: Record<GuideScope, string> = {
  COMMON: '범용 — 어느 업무 화면에서든 쓰는 함수',
  PROTO: 'proto 전용 — RgstPop 등록 화면의 편집값 생성·저장 변환',
};

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 변환·유틸 탭
 * - in : 없음(guideData.FUNCTIONS)
 * - out: 화면: 범위(범용/proto 전용)별·파일별 함수 입력 → 반환
 */
export default function GuideFunctionTab() {
  return (
    <Page>
      <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
        React를 쓰지 않는 일반 함수입니다. 입력 객체를 바꾸지 않고 새 값을 돌려줍니다. <b>proto 전용</b> 함수는 RgstPop 등록 화면의 편집값·저장 요청 형식을 만들며, 다른 업무 화면의 필수 처리가 아닙니다.
      </Alert>
      {(['COMMON', 'PROTO'] as GuideScope[]).map((scope) => {
        const functions = FUNCTIONS.filter((fn) => fn.scope === scope);
        const files = Array.from(new Set(functions.map((fn) => fn.file)));
        return (
          <Section key={scope} title={<Stack direction="row" spacing={1} alignItems="center" component="span"><span>{SCOPE_TITLES[scope]}</span><ScopeChip scope={scope} /></Stack>}>
            <Stack spacing={2}>
              {files.map((file) => (
                <Box key={file}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>{file}</Typography>
                  {functions.filter((fn) => fn.file === file).map((fn, index, list) => (
                    <Box key={fn.name} sx={{ py: 1.5, borderBottom: index < list.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}>
                      <Typography sx={{ fontFamily: CODE_FONT, fontWeight: 700, fontSize: 15 }}>{fn.name}</Typography>
                      <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.25 }}>{fn.description}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>입력</Typography><C>{fn.input}</C>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>반환</Typography><C>{fn.output}</C>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              ))}
            </Stack>
          </Section>
        );
      })}
    </Page>
  );
}
