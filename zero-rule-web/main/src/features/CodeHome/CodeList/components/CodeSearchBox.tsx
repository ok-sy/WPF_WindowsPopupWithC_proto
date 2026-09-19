import CodeTypeSelectBox from '@/components/CodeTypeSelectBox';
import type { CodeTypePickerDialogProps } from '@/dialogs/CodeTypePickerDialog';
import CodeTypePickerDialog from '@/dialogs/CodeTypePickerDialog';
import type { CLCodeType } from '@local/domain';
import { isEnterKeyEvent } from '@local/ui';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import type { SxProps } from '@mui/material';
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

export const rootSx: SxProps = {
  whiteSpace: 'nowrap',
  mb: 2,
  width: '100%',
  maxWidth: 'md',
  position: 'relative',
  '& .MuiTextField-root': {
    '& .MuiInputBase-root': { borderRadius: 0 },
    width: '100%',
  },
};

const TEAM_SAMPLE = ['코드타입1', '코드타입2', '코드타입3', '코드타입4'];

type InputValues = Omit<SearchParams, 'pageNumber'>;

type Props = {
  onSubmit: (values: InputValues) => void;
  loading: boolean;
};
type DialogId = 'CodeTypePickerDialog' | 'CodeSelectDialog';

export default function CodeSearchBox(props: Props) {
  const { loading, onSubmit } = props;
  const [expand, setExpanded] = useState(false);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [codeTypePickerDialogProps, setCodeTypePickerDialog] =
    useState<CodeTypePickerDialogProps>();

  // pendingSubmit이 변경되면 검색한다. 0일때는 무시
  const [pendingSubmit, setPendingSubmit] = useState(0);

  // 처음에 자동으로 호출되지 않기 위한 flag
  const skipFirstSubmitRef = useRef(true);

  // 검색조건에 대한 입력값
  const [inputValues, setInputValues] = useState<InputValues>({
    rowsPerPage: DEFAULT_SEARCH_PARAMS.rowsPerPage,
  });

  // 페이지별로 조회건수
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_SEARCH_PARAMS.rowsPerPage);

  // 앞 컴포넌트로 값 전송(중요)
  const onSubmitFn = useRef<Props['onSubmit']>();
  onSubmitFn.current = onSubmit;

  // pendingSubmitToken이 변경되면 onSubmit()을 호출하여 검색한다.
  useDebounce(
    () => {
      if (pendingSubmit > 0) {
        onSubmitFn.current?.({ ...inputValues });
      }
    },
    100,
    [pendingSubmit],
  );

  // 페이지당 조회건수 변경시 자동으로 검색
  useDebounce(
    () => {
      updateInput({ rowsPerPage });
      setPendingSubmit(Date.now());
    },
    300,
    [rowsPerPage],
  );

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setCodeTypePickerDialog(undefined);
  };

  const openCodeTypePickerDialog = () => {
    setDialogId('CodeTypePickerDialog');
    setCodeTypePickerDialog({
      open: true,
      onClose: closeDialog,
      onSelected: (data: CLCodeType) => {
        const { codeType, codeTypeNm } = data;
        setInputValues((p) => ({ ...p, codeType, codeTypeNm }));
        setPendingSubmit(Date.now());
        closeDialog();
      },
    });
  };

  // 검색 조건 입력값 갱신
  const updateInput = useCallback((part: Partial<InputValues>) => {
    setInputValues((p) => ({ ...p, ...part }));
  }, []);

  // input 컴포넌트의 값 변경
  const handleChangeInput =
    (field: keyof InputValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ?? '';
      updateInput({ [field]: value ?? '' });
      if (value.length === 0) {
        setPendingSubmit(Date.now());
      }
    };

  // 검색 버튼 클릭
  const handleClickSearchBtn = () => {
    setPendingSubmit(Date.now());
  };

  // // 코드 그룹 버튼 클릭
  // const handleClickCodeTypeBtn = () => {
  //   openCodeTypePickerDialog()
  // }

  // // 코드 그룹 clear 버튼 클릭
  // const handleClickCodeTypeClearBtn = () => {
  //   setInputValues((p) => ({
  //     ...p,
  //     codeType: undefined,
  //     codeTypeNm: undefined,
  //   }))
  //   setPendingSubmit(Date.now())
  // }

  const handleCodeTypeSelected = (value?: { codeType: string; codeTypeNm: string }) => {
    const { codeType } = value ?? {};
    updateInput({
      codeType,
    });
    setPendingSubmit(Date.now());
  };

  const { code, codeNm } = inputValues ?? {};

  return (
    <Box sx={rootSx} className="CodeSearchBox-root">
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
                value={codeNm ?? ''}
                onChange={handleChangeInput('codeNm')}
                size="small"
                label="코드 이름"
                fullWidth
                sx={{ maxWidth: 300 }}
                placeholder="ex) OO은행"
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
                    <TextField
                      type="search"
                      value={code ?? ''}
                      onChange={handleChangeInput('code')}
                      size="small"
                      label="코드"
                      fullWidth
                      sx={{ maxWidth: 300 }}
                      placeholder="ex) 0000"
                      onKeyDown={(e) => {
                        if (isEnterKeyEvent(e)) {
                          setPendingSubmit(Date.now());
                        }
                      }}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12 }}>
                    <CodeTypeSelectBox
                      onSelected={handleCodeTypeSelected}
                      placeholder="코드 그룹 또는 이름"
                      sx={{ minWidth: 300 }}
                    />
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
                        onChange={(e, value) => {
                          if (typeof value === 'number') {
                            setRowsPerPage(value);
                          }
                        }}
                      />
                    </Box>
                  </Grid2>
                </Grid2>
              </Box>
            )}
          </Stack>
        </Stack>
        {}
      </Paper>

      <Stack mt={1} spacing={1} justifyContent="center" direction="row">
        <Button sx={{ height: 30 }} onClick={handleClickSearchBtn} size="small" variant="contained">
          검색
        </Button>
        <Button
          sx={{ height: 30 }}
          onClick={(_) =>
            setInputValues({
              rowsPerPage: DEFAULT_SEARCH_PARAMS.rowsPerPage,
            })
          }
          size="small"
          variant="outlined"
        >
          리셋
        </Button>
      </Stack>
      {loading && (
        <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
      {dialogId === 'CodeTypePickerDialog' && codeTypePickerDialogProps && (
        <CodeTypePickerDialog {...codeTypePickerDialogProps} />
      )}
    </Box>
  );
}
