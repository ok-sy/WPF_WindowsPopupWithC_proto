import { isEnterKeyEvent } from '@local/ui';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Grid2,
} from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useDebounce } from 'react-use';
import type { SearchParams } from '../types';
import { DEFAULT_SEARCH_PARAMS } from '../types';

type InputValues = Omit<SearchParams, 'pageNumber'>;

const DEFAULT_INPUT_VALUE: InputValues = {
  rowsPerPage: DEFAULT_SEARCH_PARAMS.rowsPerPage,
};

type Props = {
  onSubmit: (values: InputValues) => void;
  loading: boolean;
};

export default function CodeTypeSearchBox(props: Props) {
  const { onSubmit, loading } = props;
  const [expand, setExpanded] = useState(false);

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

  // rowsPerPage 변경 - slider
  const handleChangeRowsPerPage = (_: Event, value: number | number[]) => {
    if (typeof value === 'number') {
      updateInput({ rowsPerPage: value });
      setPendingSubmit(Date.now());
    }
  };

  // 검색 버튼 클릭
  const handleClickSearchBtn = () => {
    setPendingSubmit(Date.now());
  };

  // 리셋 버튼 클릭
  const handleClickResetBtn = () => {
    setInputValues(DEFAULT_INPUT_VALUE);
    setPendingSubmit(Date.now());
  };

  const { codeType, codeTypeNm, dtlExpl, rowsPerPage } = inputValues ?? {};
  return (
    <Box
      sx={{
        whiteSpace: 'nowrap',
        mb: 2,
        width: '100%',
        maxWidth: 'md',
        position: 'relative',
        '& .MuiTextField-root': {
          width: '100%',
        },
      }}
      className="CodeTypeSearchBox-root"
    >
      <Paper square variant="outlined">
        <Stack
          spacing={2}
          alignItems="flex-start"
          direction="row"
          sx={{
            py: 3,
            pl: 1,
            pr: 2,
          }}
        >
          <Box pl={1}>
            {!expand && (
              <IconButton onClick={() => setExpanded(!expand)}>
                <Tooltip title="상세옵션">
                  <KeyboardDoubleArrowDownIcon />
                </Tooltip>
              </IconButton>
            )}
            {expand && (
              <IconButton onClick={() => setExpanded(!expand)}>
                <Tooltip title="접기">
                  <KeyboardDoubleArrowUpIcon />
                </Tooltip>
              </IconButton>
            )}
          </Box>
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
            {expand && (
              <Box>
                <Grid2 columnSpacing={2} rowSpacing={1.5} container>
                  <Grid2 size={{ xs: 12 }}>
                    <Box>
                      <TextField
                        type="search"
                        size="small"
                        label="그룹 코드"
                        value={codeType ?? ''}
                        fullWidth
                        sx={{ maxWidth: 300 }}
                        onChange={handleChangeInput('codeType')}
                        onKeyDown={(e) => {
                          if (isEnterKeyEvent(e)) {
                            setPendingSubmit(Date.now());
                          }
                        }}
                      />
                    </Box>
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <Box>
                      <Typography
                        gutterBottom
                        sx={{
                          mt: 2,
                          '& em': {
                            display: 'inline-block',
                            color: 'primary.main',
                            fontStyle: 'normal',
                            mx: '4px',
                          },
                        }}
                      >
                        ※ 페이지당 <em>{rowsPerPage}</em>건을 조회합니다.
                      </Typography>
                      <Slider
                        sx={{ maxWidth: 400 }}
                        step={10}
                        marks
                        min={20}
                        max={200}
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                      />
                    </Box>
                  </Grid2>
                </Grid2>
              </Box>
            )}
          </Stack>
        </Stack>
      </Paper>
      <Stack mt={1} spacing={1} justifyContent="center" direction="row">
        <Button onClick={handleClickSearchBtn} size="small" variant="contained">
          검색
        </Button>
        <Button onClick={handleClickResetBtn} size="small" variant="outlined">
          리셋
        </Button>
      </Stack>
      {loading && (
        <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}
