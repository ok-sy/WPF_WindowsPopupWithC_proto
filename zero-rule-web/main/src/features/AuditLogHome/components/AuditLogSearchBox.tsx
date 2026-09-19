import type { CLAuditLogKindKey, CLLogLevelKey } from '@local/domain';
import { CLAuditLogKind, CLLogLevel } from '@local/domain';
import { isEnterKeyEvent } from '@local/ui';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  LinearProgress,
  Grid2,
} from '@mui/material';
import clsx from 'clsx';
import React, { useCallback, useRef, useState } from 'react';
import { useDebounce } from 'react-use';
import type { SearchOption } from '../common-data';
import { DEFAULT_SEARCH_OPTION } from '../common-data';
type InputValues = Omit<SearchOption, 'pageNumber'>;

type Props = {
  onSubmit: (values: InputValues) => void;
  loading: boolean;
};

function isIncludes<T>(value: T, array?: T[]) {
  if (!array) return false;
  return array.includes(value);
}

export default function AuditLogSearchBox(props: Props) {
  const { loading } = props;
  // expended가 true 이면 search조건 다 보여주기 / false이면 감사로그종류만 보여주기
  const [expand, setExpanded] = useState(false);

  // 처음에 자동으로 호출되지 않기 위한 flag
  const skipFirstSubmitRef = useRef(true);

  // 검색조건 입력 값들
  const [inputValues, setInputValues] = useState<InputValues>({
    rowsPerPage: DEFAULT_SEARCH_OPTION.rowsPerPage,
    logLevels: [],
  });

  // pendingSubmitToken이 변경되면 검색한다. 0일때는 무시
  const [pendingSubmitToken, setPendingSubmitToken] = useState(0);

  // 페이지당 조회건수
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_SEARCH_OPTION.rowsPerPage);

  const onSubmitFn = useRef<Props['onSubmit']>();
  onSubmitFn.current = props.onSubmit;

  // pendingSubmitToken이 변경되면 onSubmit()을 호출하여 검색한다.
  useDebounce(
    () => {
      if (pendingSubmitToken > 0) {
        onSubmitFn.current?.({ ...inputValues });
      }
    },
    100,
    [pendingSubmitToken],
  );

  // 페이지당 조회건수 변경시 자동으로 검색
  useDebounce(
    () => {
      if (skipFirstSubmitRef.current) {
        skipFirstSubmitRef.current = false;
        return;
      }
      updateInput({ rowsPerPage });
      setPendingSubmitToken(Date.now());
    },
    300,
    [rowsPerPage],
  );

  // 검색 조건 입력값 갱신
  const updateInput = useCallback((part: Partial<InputValues>) => {
    setInputValues((p) => ({ ...p, ...part }));
  }, []);

  // input 컴포넌트의 값 변경
  const handleChangeInput =
    (field: keyof InputValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      updateInput({ [field]: event.target.value ?? '' });
    };

  // input 컴포넌트에서 엔터키를 누르면 검색한다
  const handleInputValueKeyDown = (e: React.KeyboardEvent) => {
    if (isEnterKeyEvent(e)) {
      setPendingSubmitToken(Date.now());
    }
  };

  // 검색 버튼 클릭
  const handleClickSearchBtn = () => {
    setPendingSubmitToken(Date.now());
  };

  // 리셋버튼 클릭
  const handleClickResetBtn = () => {
    setInputValues({
      rowsPerPage: DEFAULT_SEARCH_OPTION.rowsPerPage,
      logLevels: [],
    });
    setPendingSubmitToken(Date.now());
  };

  // 로그레벨 체크박스 변경
  const handleChangeLogLevel =
    (logLevel: CLLogLevelKey) => (e: React.SyntheticEvent, checked: boolean) => {
      const logLevelSet = new Set(inputValues.logLevels ?? []);
      if (checked) {
        logLevelSet.add(logLevel);
      } else {
        logLevelSet.delete(logLevel);
      }
      updateInput({ logLevels: Array.from(logLevelSet) });
      setPendingSubmitToken(Date.now());
    };

  // 감사 로그 종류 체크박스 변경
  const handleChangeLogKind =
    (logKind: CLAuditLogKindKey) => (e: React.SyntheticEvent, checked: boolean) => {
      updateInput({
        logKind: checked ? logKind : undefined,
      });
      setPendingSubmitToken(Date.now());
    };

  const { logLevels, title, logKind, jobId, pageId, operatorName, logTag, clientIp, logYyyymmdd } =
    inputValues ?? {};

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        maxWidth: 'lg',
        mt: 1,
        position: 'relative',
      }}
      className={clsx('AuditLogSearchBox-root', {})}
    >
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack direction="row" spacing={2}>
          <Box>
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
          <Box>
            {Object.entries(CLAuditLogKind).map(([key, value]) => (
              <FormControlLabel
                key={key}
                label={value}
                control={
                  <Checkbox
                    checked={logKind === key}
                    onChange={handleChangeLogKind(key as CLAuditLogKindKey)}
                    value={key}
                  />
                }
              />
            ))}
          </Box>
        </Stack>
        <Grid2 container columnSpacing={2} rowSpacing={0}>
          {expand && (
            <>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  value={title ?? ''}
                  onChange={handleChangeInput('title')}
                  onKeyDown={handleInputValueKeyDown}
                  fullWidth
                  size="small"
                  margin="dense"
                  label="로그 내용"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  value={operatorName ?? ''}
                  onChange={handleChangeInput('operatorName')}
                  onKeyDown={handleInputValueKeyDown}
                  fullWidth
                  size="small"
                  margin="dense"
                  label="실행자 이름"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  value={clientIp ?? ''}
                  onChange={handleChangeInput('clientIp')}
                  onKeyDown={handleInputValueKeyDown}
                  fullWidth
                  type="search"
                  size="small"
                  margin="dense"
                  label="실행자 IP"
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ display: 'block', mt: 3 }}>
                  기타 정보
                </Typography>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  value={jobId ?? ''}
                  onChange={handleChangeInput('jobId')}
                  onKeyDown={handleInputValueKeyDown}
                  fullWidth
                  size="small"
                  margin="dense"
                  label="잡 ID"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  value={pageId ?? ''}
                  onChange={handleChangeInput('pageId')}
                  onKeyDown={handleInputValueKeyDown}
                  fullWidth
                  size="small"
                  margin="dense"
                  label="페이지ID"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  value={logTag ?? ''}
                  onChange={handleChangeInput('logTag')}
                  onKeyDown={handleInputValueKeyDown}
                  fullWidth
                  size="small"
                  margin="dense"
                  label="로그 태그"
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ display: 'block', mt: 3 }}>
                  로그 레벨
                </Typography>
                {Object.entries(CLLogLevel).map(([key, value]) => (
                  <FormControlLabel
                    label={value}
                    key={key}
                    control={<Checkbox checked={isIncludes(key, logLevels)} value={key} />}
                    onChange={handleChangeLogLevel(key as CLLogLevelKey)}
                  />
                ))}
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
            </>
          )}
        </Grid2>
      </Paper>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={3} sx={{ mt: 2 }}>
        <Button variant="contained" size="small" onClick={handleClickSearchBtn}>
          검색
        </Button>

        <Button variant="outlined" size="small" onClick={handleClickResetBtn}>
          초기화
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
