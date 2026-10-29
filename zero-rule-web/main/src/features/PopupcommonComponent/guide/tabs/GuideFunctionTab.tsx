import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { FUNCTIONS, type GuideScope } from '../guideData';
import { C, CODE_FONT, Page, ScopeChip, Section } from '../GuideUi';

const SCOPE_TITLES: Record<GuideScope, string> = {
  COMMON: '공통 사용 — 어느 화면에서든 쓰는 함수',
  PROTO: '기존 팝업 등록 — 기존 팝업 등록 화면에서만 쓰는 함수',
};

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 데이터 처리 함수 탭
 * - in : 없음(guideData.FUNCTIONS)
 * - out: 화면: 범위(공통 사용/기존 팝업 등록)별·파일별 함수 입력 → 반환
 */
export default function GuideFunctionTab() {
  return (
    <Page>
      <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
        화면 없이 값만 다루는 함수입니다. 넘긴 값은 바꾸지 않고 새 값을 돌려줍니다. <b>기존 팝업 등록</b> 함수는 다른 화면에서 쓰지 않아도 됩니다.
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
