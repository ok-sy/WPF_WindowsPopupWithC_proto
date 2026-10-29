import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { Component, useCallback, useState, type ReactNode } from 'react';

/* 코드 글꼴(가이드 화면과 같음). */
export const CODE_FONT = 'Consolas, "D2Coding", "Cascadia Mono", "Courier New", monospace';

/** 실행기에서 컴포넌트가 콜백을 부를 때 출력 영역에 남기는 함수. 같은 이름은 마지막 값으로 바꾸고 호출 횟수를 센다. */
export type RunnerEmit = (name: string, payload: unknown) => void;

/** 실행기 정의 */
export interface RunnerDefinition {
  /** 입력 JSON 기본값 */
  input: unknown;
  /** 입력 설명(무엇을 바꿔 볼 수 있는지) */
  hint?: string;
  /** 입력값으로 실제 컴포넌트·함수를 그린다. 콜백은 emit으로 출력 영역에 남긴다. */
  render?: (input: any, emit: RunnerEmit) => ReactNode;
  /** 화면 없이 계산만 하는 실행기(함수용). 반환값을 출력 영역에 'return'으로 남긴다. */
  compute?: (input: any) => unknown;
  /** true면 compute가 돌려준 객체의 최상위 키마다 OUTPUT 항목을 따로 보여 준다(여러 결과를 한 번에 볼 때). */
  splitOutput?: boolean;
}

/* 잘못된 입력으로 컴포넌트가 그리다 실패해도 가이드 화면 전체가 멈추지 않게 막는다. */
class RunnerBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    return this.state.error ? <Alert severity="error">그리는 중 오류: {this.state.error.message}</Alert> : this.props.children;
  }
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', letterSpacing: 0.3 }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

const pretty = (value: unknown) => JSON.stringify(value, (_key, v) => (v === undefined ? '(undefined)' : v), 2);

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드 코드 실행기
 * - in : definition(RunnerDefinition) 입력 기본값·그리기/계산 함수 · title?(string)
 * - out: 화면: INPUT(JSON 편집) → 실행 결과(실제 컴포넌트) → OUTPUT(콜백·반환값)
 * - 입력 JSON을 고쳐 실행(Ctrl+Enter)하면 그 값으로 컴포넌트를 다시 마운트하고, 컴포넌트가 부르는 콜백 값을 출력에 보여 준다.
 *   서버 API를 부르지 않는다.
 */
export default function GuideCodeRunner({ definition, title = '코드 실행기' }: { definition: RunnerDefinition; title?: string }) {
  const initialText = pretty(definition.input);
  const [text, setText] = useState(initialText);
  const [applied, setApplied] = useState<unknown>(definition.input);
  const [runKey, setRunKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const computed = (input: unknown): Record<string, { payload: unknown; count: number }> => {
    if (!definition.compute) return {};
    const result = safeCompute(definition, input);
    if (definition.splitOutput && result && typeof result === 'object' && !Array.isArray(result)) {
      return Object.fromEntries(Object.entries(result).map(([name, payload]) => [name, { payload, count: 1 }]));
    }
    return { return: { payload: result, count: 1 } };
  };
  const [outputs, setOutputs] = useState(() => computed(definition.input));

  const emit = useCallback<RunnerEmit>((name, payload) => {
    setOutputs((previous) => ({ ...previous, [name]: { payload, count: (previous[name]?.count ?? 0) + 1 } }));
  }, []);

  const run = (source = text) => {
    try {
      const parsed = JSON.parse(source);
      setError(null);
      setApplied(parsed);
      setRunKey((key) => key + 1);
      setOutputs(computed(parsed));
    } catch (cause) {
      setError(`JSON 형식 오류: ${(cause as Error).message}`);
    }
  };
  const reset = () => { setText(initialText); run(initialText); };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, bgcolor: '#0f172a', color: '#fff' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14.5, flex: 1 }}>{title}</Typography>
        <Button size="small" variant="contained" onClick={() => run()} sx={{ textTransform: 'none' }}>실행 (Ctrl+Enter)</Button>
        <Button size="small" onClick={reset} sx={{ color: '#cbd5e1', textTransform: 'none' }}>초기화</Button>
      </Stack>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Panel title="INPUT">
          {definition.hint && <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.75, lineHeight: 1.6 }}>{definition.hint}</Typography>}
          <Box component="textarea" value={text} spellCheck={false} aria-label="입력 JSON"
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
            onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); }
            }}
            sx={{ width: '100%', minHeight: 180, maxHeight: 320, resize: 'vertical', boxSizing: 'border-box', p: 1.5, border: '1px solid #cbd5e1',
              borderRadius: 1.5, fontFamily: CODE_FONT, fontSize: 12.5, lineHeight: 1.6, bgcolor: '#f8fafc', color: '#0f172a', outline: 'none',
              '&:focus': { borderColor: 'primary.main', bgcolor: '#fff' } }} />
          {error && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{error}</Alert>}
        </Panel>
        {definition.render && (
          <Panel title="실행 결과">
            <Box sx={{ p: 1.5, border: '1px dashed #cbd5e1', borderRadius: 1.5, bgcolor: '#fff', minHeight: 60 }}>
              <RunnerBoundary key={runKey}>{definition.render(applied, emit)}</RunnerBoundary>
            </Box>
          </Panel>
        )}
        <Panel title="OUTPUT" action={Object.keys(outputs).length > 0 && !definition.compute
          ? <Button size="small" onClick={() => setOutputs({})} sx={{ textTransform: 'none', minWidth: 0, p: 0 }}>지우기</Button> : undefined}>
          {Object.keys(outputs).length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>실행 결과에서 입력·클릭하면 콜백 값이 여기에 나옵니다.</Typography>
          ) : (
            <Stack spacing={1}>
              {Object.entries(outputs).map(([name, { payload, count }]) => (
                <Box key={name}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Box component="code" sx={{ fontFamily: CODE_FONT, fontSize: 12.5, fontWeight: 700 }}>{name}</Box>
                    {!definition.compute && <Chip size="small" label={`${count}회`} sx={{ height: 18, fontSize: 11 }} />}
                  </Stack>
                  <Box component="pre" sx={{ m: 0, p: 1.25, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1.5, fontFamily: CODE_FONT,
                    fontSize: 12, lineHeight: 1.55, maxHeight: 260, overflow: 'auto' }}>{pretty(payload)}</Box>
                </Box>
              ))}
            </Stack>
          )}
        </Panel>
      </Stack>
    </Paper>
  );
}

function safeCompute(definition: RunnerDefinition, input: unknown): unknown {
  try {
    return definition.compute?.(input);
  } catch (cause) {
    return { error: (cause as Error).message };
  }
}
