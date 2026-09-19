import CLCodeListView from '@/components/CLCodeListView';
import { isEnterKeyEvent } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useDebounce } from 'react-use';
import type { SearchOption } from '../MsgMngHome';
import { DEFAULT_SEARCH_OPTIONS } from '../MsgMngHome';

const rootSx: SxProps = { p: 2, mb: 1 };

type InputValues = Omit<SearchOption, 'pageNumber'>;
type MsgClsf = 'ALL' | 'ER' | 'NM';
type OccrClsfCd = 'ALL' | 'BE' | 'SY' | 'FW';
type Props = {
  onSubmit: (values: InputValues) => void;
  onSubmitMsgClsf: (values: 'ALL' | 'ER' | 'NM') => void;
  onSubmitTskClsfCd: (values: string | string[]) => void;
  onSubmitOccrClsfCd: (values: 'ALL' | 'BE' | 'SY' | 'FW') => void;
  onSubmitTeamSel: (values: string | string[]) => void;
};
export default function MsgMngSearch(props: Props) {
  const { onSubmit, onSubmitMsgClsf, onSubmitTeamSel, onSubmitTskClsfCd, onSubmitOccrClsfCd } =
    props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  // 메시지 구분
  const [msgClsf, setMsgClsf] = useState<MsgClsf>('ALL');
  const onSubmitMsgClsfFnRef = useRef<Props['onSubmitMsgClsf']>();
  onSubmitMsgClsfFnRef.current = onSubmitMsgClsf;
  // 업무구분코드
  const [tskClsfCd, setTskClsfCd] = useState<string | string[]>('00');
  const onSubmitTskClsfCdFnRef = useRef<Props['onSubmitTskClsfCd']>();
  onSubmitTskClsfCdFnRef.current = onSubmitTskClsfCd;
  // 발생구분코드
  const [occrClsfCd, setOccrClsfCd] = useState<OccrClsfCd>('ALL');
  const onSubmitOccrClsfCdFnRef = useRef<Props['onSubmitOccrClsfCd']>();
  onSubmitOccrClsfCdFnRef.current = onSubmitOccrClsfCd;
  // 팀정보
  const [teamSel, setTeamSel] = useState<string | string[]>('0');
  const onSubmitTeamSelFnRef = useRef<Props['onSubmitTeamSel']>();
  onSubmitTeamSelFnRef.current = onSubmitTeamSel;

  // 처음에 자동으로 호출되지 않기 위한 flag
  const skipFirstSubmitRef = useRef(true);
  // 검색조건 입력 값들
  const [inputValues, setInputValues] = useState<InputValues>({
    rowsPerPage: DEFAULT_SEARCH_OPTIONS.rowsPerPage,
  });
  // pendingSubmitToken이 변경되면 검색한다. 0일때는 무시
  const [pendingSubmitToken, setPendingSubmitToken] = useState(0);
  // 페이지당 조회건수
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_SEARCH_OPTIONS.rowsPerPage);

  // pendingSubmitToken이 변경되면 onSubmit()을 호출하여 검색한다.
  useDebounce(
    () => {
      if (pendingSubmitToken > 0) {
        onSubmitFnRef.current?.({ ...inputValues });
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
      const value = event.target.value ?? '';
      updateInput({ [field]: value });
      if (value.length === 0) {
        setPendingSubmitToken(Date.now());
      }
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
      rowsPerPage: DEFAULT_SEARCH_OPTIONS.rowsPerPage,
      msgCn: '',
      msgId: '',
    });
    setMsgClsf('ALL');
    setTskClsfCd('00');
    setOccrClsfCd('ALL');
    setTeamSel('0');
    setRowsPerPage(DEFAULT_SEARCH_OPTIONS.rowsPerPage);
    setPendingSubmitToken(Date.now());
  };
  const { msgCn, msgId } = inputValues ?? {};
  return (
    <Box>
      <Paper sx={rootSx} className="MsgMngSearch-root">
        <Stack spacing={2}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6">메시지구분</Typography>
              <Select
                sx={{ minWidth: 110 }}
                size="small"
                value={msgClsf}
                onChange={(e) => {
                  setMsgClsf(e.target.value as MsgClsf);
                }}
              >
                <MenuItem value={'ALL'}>전체</MenuItem>
                <MenuItem value={'ER'}>ERROR</MenuItem>
                <MenuItem value={'NM'}>NORMAL</MenuItem>
              </Select>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6">업부구분</Typography>
              <CLCodeListView
                displayType="select"
                codeType="123"
                selectValue={tskClsfCd + ''}
                selectOnChange={(selectValue) => {
                  setTskClsfCd(selectValue);
                }}
                selectSx={{
                  minWidth: 110,
                  '& .MuiInputBase-root': {
                    ml: '-1px',
                    borderRadius: 1,
                  },
                }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6">발생구분코드</Typography>
              <Select
                sx={{ minWidth: 140 }}
                size="small"
                value={occrClsfCd}
                onChange={(e) => {
                  setOccrClsfCd(e.target.value as OccrClsfCd);
                }}
              >
                <MenuItem value={'ALL'}>전체</MenuItem>
                <MenuItem value={'BE'}>BUSINESS</MenuItem>
                <MenuItem value={'SY'}>SYSTEM</MenuItem>
                <MenuItem value={'FW'}>FRAMEWORK</MenuItem>
              </Select>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6">팀정보</Typography>
              <CLCodeListView
                displayType="select"
                codeType="111"
                selectValue={teamSel + ''}
                selectOnChange={(selectValue) => {
                  setTeamSel(selectValue);
                }}
                selectSx={{
                  minWidth: 110,
                  '& .MuiInputBase-root': {
                    ml: '-1px',
                    borderRadius: 1,
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row" spacing={3} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6">메시지 ID</Typography>
              <TextField
                type="search"
                size="small"
                placeholder="메시지 ID를 입력하세요"
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: 1,
                  },
                }}
                value={msgId ?? ''}
                onChange={handleChangeInput('msgId')}
                onKeyDown={handleInputValueKeyDown}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6">메시지</Typography>
              <TextField
                type="search"
                size="small"
                placeholder="메시지를 입력하세요"
                sx={{
                  minWidth: 300,
                  '& .MuiInputBase-root': {
                    borderRadius: 1,
                  },
                }}
                value={msgCn ?? ''}
                onChange={handleChangeInput('msgCn')}
                onKeyDown={handleInputValueKeyDown}
              />
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      <Stack direction="row" justifyContent="center" spacing={1.5}>
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            handleClickSearchBtn();
            onSubmitMsgClsfFnRef.current?.(msgClsf);
            onSubmitTskClsfCdFnRef.current?.(tskClsfCd);
            onSubmitOccrClsfCdFnRef.current?.(occrClsfCd);
            onSubmitTeamSelFnRef.current?.(teamSel);
          }}
        >
          검색
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            handleClickResetBtn();
            onSubmitMsgClsfFnRef.current?.('ALL');
            onSubmitTskClsfCdFnRef.current?.('00');
            onSubmitOccrClsfCdFnRef.current?.('ALL');
            onSubmitTeamSelFnRef.current?.('0');
          }}
        >
          초기화
        </Button>
      </Stack>
    </Box>
  );
}
