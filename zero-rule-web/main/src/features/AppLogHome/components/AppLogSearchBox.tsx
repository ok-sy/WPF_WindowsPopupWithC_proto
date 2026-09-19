import DatePickerForm from '@/components/DatePickerForm';
import type { CLLogLevelKey } from '@local/domain';
import { CLLogLevel } from '@local/domain';
import { isEnterKeyEvent } from '@local/ui';
import { KeyboardDoubleArrowDown, KeyboardDoubleArrowUp } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';

import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid2,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { useDebounce } from 'react-use';

export type SearchOptions = {
  logLevels?: CLLogLevelKey[];
  title?: string;
  userName?: string;
  logTag?: string;
  logDate?: Date;
};

type Props = {
  initialSearchOptions?: SearchOptions;
  onSearchOptionChange: (opt: SearchOptions) => void;
  onSearchClick: () => void;
  loading: boolean;
};

export default function AppLogSearchBox(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pendingSubmitToken, setPendingSubmitToken] = useState(0);

  const {
    initialSearchOptions = {},
    onSearchOptionChange,
    onSearchClick: handleClickSearch,
    loading,
  } = props;
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(initialSearchOptions);
  const { title, userName, logTag, logDate, logLevels = [] } = searchOptions ?? {};

  const notifyChange = () => {
    setPendingSubmitToken(Date.now());
  };

  const handleTextChange = (fieldName: string, value?: string) => {
    const newValues = { ...searchOptions, [fieldName]: value };
    setSearchOptions(newValues);
    // onSearchOptionChange(newValues)
  };

  const handleDateChange = (fieldName: string) => {
    return (value: Date | null) => {
      const newValues = { ...searchOptions, [fieldName]: value ?? undefined };
      setSearchOptions(newValues);
      onSearchOptionChange(newValues);
    };
  };

  // const handleLogLevelCheckChange = (checkedlogLevels: CLLogLevelKey[]) => {
  //   const newValues = { ...searchOptions, logLevels: checkedlogLevels ?? [] }
  //   setSearchOptions(newValues)
  //   onSearchOptionChange(newValues)
  // }

  // 로그레벨 체크박스
  const handleCheckChanges = (logLevel: CLLogLevelKey, checked: boolean) => {
    let newValues: CLLogLevelKey[] = [];
    if (checked) {
      newValues = logLevels.concat([logLevel]);
    } else {
      newValues = logLevels.filter((it) => it !== logLevel);
    }
    setSearchOptions((p) => ({ ...p, logLevels: newValues }));
    setPendingSubmitToken(Date.now());
  };

  // 리셋버튼 클릭
  const handleClickResetBtn = () => {
    setSearchOptions({
      logLevels: [],
    });
    setPendingSubmitToken(Date.now());
  };

  useDebounce(
    () => {
      if (pendingSubmitToken === 0) return;
      onSearchOptionChange(searchOptions);
    },
    100,
    [pendingSubmitToken],
  );

  return (
    <Box sx={{ maxWidth: 'lg' }} className="AppLogSearchBox-root">
      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          px: {
            xs: 2,
            md: 3,
          },
          py: {
            xs: 2,
            md: 2,
          },
        }}
      >
        <Box>
          <Stack direction="row" spacing={1}>
            <Box>
              {!expanded && (
                <IconButton onClick={() => setExpanded(!expanded)}>
                  <Tooltip title="상세 옵션">
                    <KeyboardDoubleArrowDown />
                  </Tooltip>
                </IconButton>
              )}
              {expanded && (
                <IconButton onClick={() => setExpanded(!expanded)}>
                  <Tooltip title="접기">
                    <KeyboardDoubleArrowUp />
                  </Tooltip>
                </IconButton>
              )}
            </Box>
            <Box>
              <FormControl>
                <FormGroup row>
                  {Object.entries(CLLogLevel).map(([logLevel, desc]) => (
                    <FormControlLabel
                      key={`AppLogLevel-${logLevel}`}
                      control={
                        <Checkbox
                          checked={logLevels.indexOf(logLevel as CLLogLevelKey) >= 0}
                          onChange={(e, checked) =>
                            handleCheckChanges(logLevel as CLLogLevelKey, checked)
                          }
                          value={logLevel}
                        />
                      }
                      label={desc}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Box>
          </Stack>
          {expanded && (
            <Grid2 container spacing={2} mt={1}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="제목"
                  variant="outlined"
                  size="small"
                  fullWidth
                  type="search"
                  placeholder="제목의 일부만 입력"
                  onChange={(e) => handleTextChange('title', e.target.value)}
                  value={title || ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  onKeyDown={(e) => {
                    if (isEnterKeyEvent(e)) {
                      e.preventDefault();
                      notifyChange();
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="사용자 이름"
                  variant="outlined"
                  size="small"
                  type="search"
                  placeholder="ex) 홍길동"
                  fullWidth
                  value={userName || ''}
                  onChange={(e) => handleTextChange('userName', e.target.value)}
                  onKeyDown={(e) => {
                    if (isEnterKeyEvent(e)) {
                      e.preventDefault();
                      notifyChange();
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="태그"
                  variant="outlined"
                  size="small"
                  type="search"
                  placeholder="ex) 태그"
                  fullWidth
                  value={logTag || ''}
                  onChange={(e) => handleTextChange('logTag', e.target.value)}
                  onKeyDown={(e) => {
                    if (isEnterKeyEvent(e)) {
                      e.preventDefault();
                      notifyChange();
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <DatePickerForm
                  label="로그일자"
                  selectDate={logDate}
                  toolbarTitle="로그일자"
                  onDateChange={handleDateChange('logDate')}
                />
              </Grid2>
            </Grid2>
          )}
        </Box>

        {loading && (
          <Box sx={{ position: 'absolute', width: '100%', top: 0, left: 0 }}>
            <LinearProgress />
          </Box>
        )}
      </Paper>
      {/* <Box display="flex" alignItems="center" justifyContent="center" sx={{ mt: 2 }}> */}
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleClickSearch}>
          검색
        </Button>
        <Button variant="outlined" color="primary" onClick={handleClickResetBtn}>
          초기화
        </Button>
      </Stack>
    </Box>
  );
}
