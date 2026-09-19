import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { CLMsgMngCreateParams } from '@local/domain';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TableCell,
  TableRow,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import CustomCodeSelect from './CustomCodeSelect';

const rootSx: SxProps = {
  '& .MuiTextField-root': { my: -1 },
  '& .MuiSelect-root': { my: -1 },
};
type MsgClsf = 'ER' | 'NM';
type OccrClsfCd = 'BE' | 'SY' | 'FW';
type MsgPrntCd = '1' | '2';
type Props = {
  onRefreshTocken: (value: number) => void;
};
export default function MsgMngInsertRow(props: Props) {
  const { onRefreshTocken } = props;
  const onRefreshTockenFnRef = useRef<Props['onRefreshTocken']>();
  onRefreshTockenFnRef.current = onRefreshTocken;
  const api = useApi();
  // 메시지 구분
  const [msgClsf, setMsgClsf] = useState<MsgClsf>('ER');
  // 메시지 내용
  const [msgCn, setMsgCn] = useState<string>();
  // 업무구분 코드 select
  const [tskClsfCd, setTskClsfCd] = useState<string | string[]>('000');
  // 발생구분코드 select
  const [occrClsfCd, setOccrClsfCd] = useState<OccrClsfCd>('BE');
  // 팀정보 select
  const [teamSel, setTeamSel] = useState<string | string[]>('1');
  // 메시지 출력코드 select
  const [msgPrntCd, setMsgPrntCd] = useState<MsgPrntCd>('1');
  // 등록 버튼 활성/비활성
  const [btnTf, setBtnTf] = useState<boolean>(false);

  // 등록
  const doSave = useCallback(
    async (params: { insertArrs: CLMsgMngCreateParams[] }): Promise<number | null> => {
      try {
        const { body } = await api.clMsgMngApi.create(params);
        const { insertCnt } = body;
        return insertCnt;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        onRefreshTockenFnRef.current?.(Date.now());
      }
      return null;
    },
    [api],
  );

  const onSubmitHandle = () => {
    if (!msgCn) return;
    const dataSet: CLMsgMngCreateParams[] = [
      {
        msgClsf: String(msgClsf),
        tskClsfCd: tskClsfCd as string,
        teamId: teamSel === '0' ? undefined : (teamSel as string),
        occrClsfCd: String(occrClsfCd),
        msgPrntCd: String(msgPrntCd),
        msgCn: msgCn,
      },
    ];
    doSave({ insertArrs: dataSet });
  };

  // 등록버튼 disable 체크
  useEffect(() => {
    if (!msgCn || tskClsfCd === '00') {
      return setBtnTf(true);
    } else {
      return setBtnTf(false);
    }
  }, [msgCn, teamSel, tskClsfCd]);

  return (
    <TableRow sx={rootSx} className="MsgMngInsertRow-root">
      <TableCell colSpan={2}>
        <Stack alignItems="center">
          <Button disabled={btnTf} sx={{ py: 0 }} size="small" onClick={() => onSubmitHandle()}>
            등록
          </Button>
        </Stack>
      </TableCell>
      {/* 메시지구분 */}
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>메시지ID 자동생성</Box>
      </TableCell>
      {/* 메시지 */}
      <TableCell>
        <TextField
          size="small"
          fullWidth
          placeholder="메시지를 입력해주세요"
          onChange={(e) => setMsgCn(e.target.value)}
        />
      </TableCell>
      {/* 메시지 종류 */}
      <TableCell>
        <Select
          value={msgClsf}
          onChange={(e) => setMsgClsf(e.target.value as MsgClsf)}
          size="small"
          sx={{ borderRadius: 0, my: -1, maxWidth: 120 }}
          fullWidth
        >
          <MenuItem value={'ER'}>ERROR</MenuItem>
          <MenuItem value={'NM'}>NORMAL</MenuItem>
        </Select>
      </TableCell>
      {/* 업무구분 */}
      <TableCell>
        <CustomCodeSelect
          codeType="123"
          selectValue={tskClsfCd + ''}
          selectOnChange={(selectValue) => {
            setTskClsfCd(selectValue);
          }}
        />
      </TableCell>
      {/* 발생구분코드 */}
      <TableCell>
        <Select
          fullWidth
          sx={{ my: -1, borderRadius: 0 }}
          size="small"
          value={occrClsfCd}
          onChange={(e) => {
            setOccrClsfCd(e.target.value as OccrClsfCd);
          }}
        >
          <MenuItem value={'BE'}>BUSINESS</MenuItem>
          <MenuItem value={'SY'}>SYSTEM</MenuItem>
          <MenuItem value={'FW'}>FRAMEWORK</MenuItem>
        </Select>
      </TableCell>
      {/* 팀정보 */}
      <TableCell>
        <CustomCodeSelect
          codeType="111"
          selectValue={teamSel + ''}
          selectOnChange={(selectValue) => {
            setTeamSel(selectValue);
          }}
        />
      </TableCell>
      <TableCell>
        <Select
          value={msgPrntCd}
          onChange={(e) => setMsgPrntCd(e.target.value as MsgPrntCd)}
          size="small"
          sx={{ borderRadius: 0, my: -1, maxWidth: 120 }}
          fullWidth
        >
          <MenuItem value={'1'}>하단</MenuItem>
          <MenuItem value={'2'}>팝업</MenuItem>
        </Select>
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>자동</Box>
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>-</Box>
      </TableCell>
      <TableCell>
        <Box sx={{ textAlign: 'center' }}>-</Box>
      </TableCell>
    </TableRow>
  );
}
