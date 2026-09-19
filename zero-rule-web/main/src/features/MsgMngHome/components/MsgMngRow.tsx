import { msgPrntCdKorean, tskClsfCdKorean } from '@/lib/common-code-data';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { CLMsgMng } from '@local/domain';
import { Check } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import CreateIcon from '@mui/icons-material/Create';
import type { SxProps } from '@mui/material';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Switch,
  TableCell,
  TableRow,
  TextField,
} from '@mui/material';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import CustomCodeSelect from './CustomCodeSelect';
import type { UseYnUptData } from '../MsgMngHome';

const rootSx: SxProps = {
  '& .MuiTextField-root': { my: -1 },
};
type MsgClsf = 'ER' | 'NM';
type OccrClsfCd = 'BE' | 'SY' | 'FW';
type MsgPrntCd = '1' | '2';
type Props = {
  data: CLMsgMng;
  seq: number;
  onRefreshToken: (value: number) => void;
  onSubmitYnUptData: (value?: UseYnUptData) => void;
};
export default function MsgMngRow(props: Props) {
  const { data, seq, onRefreshToken, onSubmitYnUptData } = props;
  const {
    msgClsf,
    msgCn,
    msgId,
    msgPrntCd,
    occrClsfCd,
    tskClsfCd,
    chgrId,
    chngDttm,
    regDttm,
    regrId,
    teamNm,
    teamId,
    useYn,
  } = data;
  const dataFnRef = useRef<Props['data']>(data);
  dataFnRef.current = data;
  const onSubmitYnUptDataFnRef = useRef<Props['onSubmitYnUptData']>();
  onSubmitYnUptDataFnRef.current = onSubmitYnUptData;
  const onRefreshTokenFnRef = useRef<Props['onRefreshToken']>();
  onRefreshTokenFnRef.current = onRefreshToken;
  const api = useApi();
  const [useYnData, setuseYnData] = useState<string>(useYn);
  const [useYnSwitch, setUseYnSwitch] = useState<boolean>(false);
  // 수정버튼 true/false
  const [uptTfBtn, setUptTfBtn] = useState<boolean>(false);
  // 메시지 input
  const [msgCnData, setMsgCnData] = useState<string>(msgCn);
  // 메시지 구분 select
  const [msgClsfData, setMsgClsfData] = useState<MsgClsf>(msgClsf as MsgClsf);
  // 발생구분코드 select
  const [occrClsfCdData, setOccrClsfCdData] = useState<OccrClsfCd>(occrClsfCd as OccrClsfCd);
  // 팀정보 select
  const [teamSel, setTeamSel] = useState<string | string[]>(String(teamId));
  // 메시지 출력코드 select
  const [msgPrntCdData, setMsgPrntCdData] = useState<MsgPrntCd>(msgPrntCd as MsgPrntCd);
  useEffect(() => {
    if (useYn === 'Y') {
      return setUseYnSwitch(true);
    } else {
      return setUseYnSwitch(false);
    }
  }, [useYn]);
  useEffect(() => {
    if (msgPrntCd === '1') {
      return setMsgPrntCdData('1');
    } else {
      return setMsgPrntCdData('2');
    }
  }, [msgPrntCd]);
  useEffect(() => {
    if (useYnSwitch === true) {
      return setuseYnData('N');
    } else {
      return setuseYnData('Y');
    }
  }, [useYnSwitch]);
  // 수정 취소시 refresh 되돌리기
  useEffect(() => {
    if (uptTfBtn) {
      setMsgCnData(dataFnRef.current.msgCn);
      setMsgClsfData(dataFnRef.current.msgClsf as MsgClsf);
      setOccrClsfCdData(dataFnRef.current.occrClsfCd as OccrClsfCd);
      setTeamSel(String(dataFnRef.current.teamId));
      setMsgPrntCdData(dataFnRef.current.msgPrntCd as MsgPrntCd);
      // onRefreshTokenFnRef.current?.(Date.now())
    }
  }, [uptTfBtn, dataFnRef]);

  const useYnonChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!confirm('변경하시겠습니까?')) {
      return;
    }
    setUseYnSwitch(e.target.checked);
    onSubmitYnUptDataFnRef.current?.({
      msgClsf: msgClsf,
      msgId: msgId,
      useYn: useYnData,
      msgCn: msgCn,
      msgPrntCd: msgPrntCd,
    });
  };

  // 수정
  const update = useCallback(
    async (params: {
      msgClsf: string;
      teamId: number; //팀 아이디
      occrClsfCd: string; //발생구분코드
      msgPrntCd: string; //메시지출력코드
      msgCn: string; //메시지내용
      msgId: string; //메시지 아이디
    }): Promise<number | null> => {
      try {
        const { body } = await api.clMsgMngApi.update(params);
        const { uptCnt } = body;
        return uptCnt;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        onRefreshTokenFnRef.current?.(Date.now());
      }
      return null;
    },
    [api],
  );

  const onClickUpdate = () => {
    const dataSet = {
      msgClsf: msgClsfData as string,
      teamId: Number(teamSel),
      occrClsfCd: occrClsfCdData as string,
      msgPrntCd: msgPrntCdData as string,
      msgCn: msgCnData as string,
      msgId: msgId,
    };
    update(dataSet);
  };

  return (
    <TableRow sx={rootSx} className="MsgMngRow-root">
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>
          <IconButton size="small" sx={{ my: -1 }} onClick={(p) => setUptTfBtn((p) => !p)}>
            {uptTfBtn ? <CloseIcon fontSize="small" /> : <CreateIcon fontSize="small" />}
          </IconButton>
        </Box>
      </TableCell>
      <TableCell>
        {uptTfBtn ? (
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              size="small"
              sx={{ my: -1 }}
              onClick={(e) => {
                if (!confirm('수정하시겠습니까?')) {
                  return;
                } else {
                  onClickUpdate();
                  setUptTfBtn(false);
                }
              }}
            >
              <Check />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>{seq}</Box>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>{msgId}</Box>
      </TableCell>
      <TableCell>
        {uptTfBtn ? (
          <TextField
            fullWidth
            size="small"
            value={msgCnData}
            onChange={(e) => setMsgCnData(e.target.value as string)}
          />
        ) : (
          <Box sx={{ textAlign: 'left', mx: 2 }}>{msgCn}</Box>
        )}
      </TableCell>
      <TableCell>
        {uptTfBtn ? (
          <Select
            value={msgClsfData}
            onChange={(e) => setMsgClsfData(e.target.value as MsgClsf)}
            size="small"
            sx={{ borderRadius: 0, my: -1, maxWidth: 120 }}
            fullWidth
          >
            <MenuItem value={'ER'}>ERROR</MenuItem>
            <MenuItem value={'NM'}>NORMAL</MenuItem>
          </Select>
        ) : (
          <Box sx={{ textAlign: 'center' }}> {msgClsf}</Box>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>{tskClsfCdKorean(tskClsfCd)}</Box>
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>{occrClsfCd}</Box>
      </TableCell>
      <TableCell>
        {uptTfBtn ? (
          <CustomCodeSelect
            codeType="111"
            selectValue={teamSel + ''}
            selectOnChange={(selectValue) => {
              setTeamSel(selectValue);
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center' }}> {teamNm}</Box>
        )}
      </TableCell>
      <TableCell>
        {uptTfBtn ? (
          <Select
            value={msgPrntCdData}
            onChange={(e) => setMsgPrntCdData(e.target.value as MsgPrntCd)}
            size="small"
            sx={{ borderRadius: 0, my: -1, maxWidth: 120 }}
            fullWidth
          >
            <MenuItem value={'1'}>하단</MenuItem>
            <MenuItem value={'2'}>팝업</MenuItem>
          </Select>
        ) : (
          <Box sx={{ textAlign: 'center' }}>{msgPrntCdKorean(msgPrntCd)}</Box>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>
          <Switch size="small" checked={useYnSwitch} onChange={useYnonChange} />
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>{regrId}</Box>
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>{chgrId}</Box>
      </TableCell>
    </TableRow>
  );
}
