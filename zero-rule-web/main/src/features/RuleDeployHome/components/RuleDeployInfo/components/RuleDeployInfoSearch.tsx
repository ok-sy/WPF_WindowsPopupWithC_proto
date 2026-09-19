import CLDateRangePicker from '@/components/CLDateRangePicker';
import CLDocLabelAny from '@/components/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import { Box, Button, MenuItem, Stack } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParamDataType } from '../RuleDeployInfo';
import { InputSearchHandle } from '@/lib/input-search-handle';
import { formatDate } from '@/features/EmailTransInfoHome/EmailTransInfoHome';
import type { ApiRequestContext, InterfaceVo } from '@local/domain';
import type { InterfaceInfoParams } from '@/features/InterfaceMgmtHome/InterfaceMgmtHome';
import { useApi } from '@/provider';
import errorCustomHandle from '@/lib/error-custom-handle';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';

type InputValues = Omit<ParamDataType, 'fromDt' | 'toDt'>;
type Props = {
  onSubmit: (value: ParamDataType) => void;
};
export default function RuleDeployInfoSearch(props: Props) {
  const { onSubmit } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const api = useApi();
  const [dateRefreshToken, setDateRefreshToken] = useState(0);
  const currentDate: Date = new Date();
  const sevenDaysAgo: Date = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - 7);
  // 시작일, 종료일
  const [srtDt, setSrtDt] = useState<Date>(sevenDaysAgo);
  const [endDt, setEndDt] = useState<Date>(currentDate);
  const srtDtFnRef = useRef<Date>(srtDt);
  const endDtFnRef = useRef<Date>(endDt);
  srtDtFnRef.current = srtDt;
  endDtFnRef.current = endDt;
  const [ifidSelectData, setIfidSelectData] = useState<InterfaceVo[]>([]);
  const [ifid, setIfid] = useState<string>('A');

  const {
    handleChangeInput,
    handleClickReset,
    handleClickSearchBtn,
    handleKeyDownEnter,
    inputValues,
  } = InputSearchHandle<InputValues>({
    onSubmitData: (data) => {
      const ifidData = ifid === 'A' ? '' : ifid;
      const dataSet: ParamDataType = {
        deployUserid: data?.deployUserid,
        ruleNm: data?.ruleNm,
        ifid: ifidData,
        fromDt: formatDate(srtDtFnRef.current),
        toDt: formatDate(endDtFnRef.current),
      };
      onSubmitFnRef.current?.(dataSet);
    },
    reset: { deployUserid: '', ifid: 'A', ruleNm: '' },
    spaceNotReset: true,
  });

  const interfaceInfoList = useCallback(
    async (params: InterfaceInfoParams, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.interface.interfaceInfoList({ ctx, ...params });
        setIfidSelectData(body.interfaceInfos);
        if (ctx.canceled) return;
        return body.interfaceInfos;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
      return false;
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const dataSet = {
      ifid: '',
      ifNm: '',
    };
    interfaceInfoList(dataSet, ctx);
  }, []);
  return (
    <Box className="RuleDeployInfoSearch-root" sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <CLDocLabelSelect
          title="인터페이스"
          value={ifid}
          onChange={(e) => {
            setIfid(e.target.value as string);
          }}
          sx={{
            maxWidth: 250,
            '& .CLDocLabelSelect-titleBox': {
              backgroundColor: '#fff',
              width: 90,
              minWidth: 90,
            },
            '& .CLDocLabelSelect-input': { minWidth: 150, maxWidth: 150 },
          }}
        >
          <MenuItem value="A">전체</MenuItem>
          {ifidSelectData.map((el, idx) => {
            return (
              <MenuItem key={idx} value={el.ifid}>
                {el.ifid}( {el.ifNm} )
              </MenuItem>
            );
          })}
        </CLDocLabelSelect>
        {/* <CLDocLabelInput
          title="인터페이스명"
          value={inputValues?.ifNm}
          onChange={handleChangeInput('ifNm')}
          onKeyDown={handleKeyDownEnter}
          sx={{
            maxWidth: 200,
            '& .CLDocLabelInput-titleBox': {
              backgroundColor: '#fff',
              width: 90,
              minWidth: 90,
            },
          }}
        /> */}
        <CLDocLabelInput
          title="룰명"
          value={inputValues?.ruleNm}
          onChange={handleChangeInput('ruleNm')}
          onKeyDown={handleKeyDownEnter}
          sx={{
            maxWidth: 350,
            '& .CLDocLabelInput-titleBox': {
              backgroundColor: '#fff',
              width: 40,
              minWidth: 40,
            },
          }}
        />
        <CLDocLabelInput
          title="배포자"
          value={inputValues?.deployUserid}
          onChange={handleChangeInput('deployUserid')}
          onKeyDown={handleKeyDownEnter}
          sx={{
            maxWidth: 180,
            '& .CLDocLabelInput-titleBox': {
              backgroundColor: '#fff',
              width: 50,
              minWidth: 50,
            },
          }}
        />
        <CLDocLabelAny
          title="배포일"
          sx={{
            width: 350,
            minWidth: 350,
            '& .CLDocLabelAny-titleBox': {
              backgroundColor: '#fff',
              width: 50,
              minWidth: 50,
            },
          }}
        >
          <CLDateRangePicker
            key={dateRefreshToken}
            startDate={srtDt}
            endDate={endDt}
            onSubmitSrtDtEndDt={(srtDt, endDt) => {
              setSrtDt(srtDt);
              setEndDt(endDt);
            }}
          />
        </CLDocLabelAny>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button size="small" variant="contained" onClick={handleClickSearchBtn}>
            검색
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              handleClickReset();
              setSrtDt(sevenDaysAgo);
              setEndDt(currentDate);
              setDateRefreshToken(Date.now());
              setIfid('A');
            }}
          >
            초기화
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
