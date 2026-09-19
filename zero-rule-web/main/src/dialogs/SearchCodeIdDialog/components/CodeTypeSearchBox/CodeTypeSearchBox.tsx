import type { SearchParams } from '@/features/CodeHome/CodeTypeList/types';
import { DEFAULT_SEARCH_PARAMS } from '@/features/CodeHome/CodeTypeList/types';
import { isEnterKeyEvent } from '@local/ui';
import { Box, LinearProgress, Stack, TextField } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

type InputValues = Omit<SearchParams, 'pageNumber'>;

const DEFAULT_INPUT_VALUE: InputValues = {
  rowsPerPage: DEFAULT_SEARCH_PARAMS.rowsPerPage,
};

type Props = {
  onSubmit: (values: InputValues) => void;
  loading: boolean;
  yPadding?: number;
};

export default function CodeTypeSearchBox(props: Props) {
  const { onSubmit, loading, yPadding } = props;

  // pendingSubmitToken이 변경되면 검색한다. 0일때는 무시
  const [pendingSubmit, setPendingSubmit] = useState(0);

  // 검색조건에 대한 입력값
  const [inputValues, setInputValues] = useState<InputValues>(DEFAULT_INPUT_VALUE);

  // 앞 컴포넌트로 값 전송(중요)
  const onSubmitFn = useRef<Props['onSubmit']>();
  onSubmitFn.current = onSubmit;

  // pendingSubmitToken이 변경되면 onSubmit()을 호출하여 검색한다.
  useDebounce(
    () => {
      onSubmitFn.current?.(inputValues);
    },
    200,
    [pendingSubmit],
  );

  // 검색 조건 입력값 갱신
  const updateInput = useCallback((part: Partial<InputValues>) => {
    setInputValues((p) => ({ ...p, ...part }));
    setPendingSubmit(Date.now());
  }, []);

  // input 컴포넌트의 값 변경
  const handleChangeInput =
    (field: keyof InputValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ?? '';
      updateInput({ [field]: value });
      if (value.length === 0) {
        setPendingSubmit(Date.now());
      }
    };

  const { codeTypeNm } = inputValues ?? {};
  return (
    <Box className="CodeTypeSearchBox-root">
      <Stack
        spacing={2}
        alignItems="flex-start"
        direction="row"
        sx={{
          py: yPadding ? yPadding : 3,
          pl: 1,
          pr: 2,
        }}
      >
        <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
          <Box>
            <TextField
              type="search"
              size="small"
              label="그룹 이름"
              fullWidth
              sx={{ maxWidth: 300 }}
              value={codeTypeNm ?? ''}
              onChange={handleChangeInput('codeTypeNm')}
              onKeyDown={(e) => {
                if (isEnterKeyEvent(e)) {
                  setPendingSubmit(Date.now());
                }
              }}
            />
          </Box>
        </Stack>
      </Stack>

      {loading && (
        <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}
