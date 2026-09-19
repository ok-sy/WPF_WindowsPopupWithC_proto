import CLDateRangePicker from '@/components/CLDateRangePicker';
import CLDocLabelAny from '@/components/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import { isEnterKeyEvent } from '@local/ui';
import { Box, Button, MenuItem, Stack } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { ParamData } from '../EmailTransInfoHome';
import { formatDate } from '../EmailTransInfoHome';
import { searchSx } from '../styls';

type Props = {
  data: ParamData;
  onSubmitData: (data: ParamData) => void;
  scrollToTop: () => void;
};
export default function EmailTransInfoSearch(props: Props) {
  const { data, onSubmitData, scrollToTop } = props;
  const onSubmitDataFnRef = useRef<Props['onSubmitData']>();
  onSubmitDataFnRef.current = onSubmitData;
  const [pendingSubmitToken, setPendingSubmitToken] = useState(0);
  const [searchData, setSearchData] = useState<ParamData>({
    ...data,
    emailTransceiveTypeCd: data.emailTransceiveTypeCd === '' ? 'A' : data.emailTransceiveTypeCd,
  });
  const searchDataFnRef = useRef<ParamData>();
  searchDataFnRef.current = searchData;
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

  useEffect(() => {
    if (!searchDataFnRef.current) return;
    if (pendingSubmitToken > 0) {
      onSubmitDataFnRef.current?.({
        ...searchDataFnRef.current,
        fromDt: formatDate(srtDtFnRef.current),
        toDt: formatDate(endDtFnRef.current),
      });
    }
  }, [onSubmitDataFnRef, searchDataFnRef, pendingSubmitToken, srtDtFnRef, endDtFnRef]);
  const handleClickSearchBtn = () => {
    setPendingSubmitToken(Date.now());
  };
  const handleClickResetBtn = () => {
    setSearchData({ ...data, emailTransceiveTypeCd: 'A', empId: '' });
    setSrtDt(sevenDaysAgo);
    setEndDt(currentDate);
    setPendingSubmitToken(Date.now());
    setDateRefreshToken(Date.now());
    scrollToTop();
  };
  return (
    <Box sx={searchSx} className="EmailTransInfoSearch">
      <SubTitleAndIcon labelTitle="조회" />
      <Stack direction="row" spacing={1} alignItems="center">
        <CLDocLabelInput
          className="empId-label"
          title="사번"
          type="search"
          value={searchData?.empId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length === 0) {
              setPendingSubmitToken(Date.now());
            }
            setSearchData({ ...searchData, empId: value });
          }}
          onKeyDown={(e) => {
            if (isEnterKeyEvent(e)) setPendingSubmitToken(Date.now());
          }}
        />
        <CLDocLabelSelect
          className="emailTransceiveTypeCd-select"
          title="송수신타입"
          value={searchData?.emailTransceiveTypeCd ?? 'A'}
          onChange={(e) =>
            setSearchData({ ...searchData, emailTransceiveTypeCd: e.target.value as string })
          }
        >
          <MenuItem value="A">전체</MenuItem>
          <MenuItem value="S">송신</MenuItem>
          <MenuItem value="R">수신</MenuItem>
        </CLDocLabelSelect>
        <CLDocLabelAny title="송수신기간">
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
        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="contained" onClick={handleClickSearchBtn}>
            검색
          </Button>
          <Button size="small" variant="outlined" onClick={handleClickResetBtn}>
            초기화
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
