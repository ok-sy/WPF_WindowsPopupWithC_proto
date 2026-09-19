import CLDocLabelInput from '@/components/CLDocLabelInput';
import { InputSearchHandle } from '@/lib/input-search-handle';
import { Box, Button, Stack } from '@mui/material';
import type { InterfaceInfoParams } from '../InterfaceMgmtHome';
import { INTERFACE_INFO_DEFAULT_PARAMS } from '../InterfaceMgmtHome';
import { useEffect, useRef } from 'react';

type Props = {
  isInterfaceInfo: boolean;
  doubleClickId?: { ifid: string; ifNm: string };
  onSubmit: (data: InterfaceInfoParams) => void;
  onSubmitTabVal: (val: string) => void;
};
export default function InterfaceSearch(props: Props) {
  const { onSubmit, doubleClickId, isInterfaceInfo, onSubmitTabVal } = props;
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  const {
    handleChangeInput,
    handleClickReset,
    handleClickSearchBtn,
    handleKeyDownEnter,
    setInputValuesSetting,
    inputValues,
  } = InputSearchHandle<InterfaceInfoParams>({
    onSubmitData(data) {
      onSubmitFnRef.current?.(data);
    },
    reset: INTERFACE_INFO_DEFAULT_PARAMS,
    spaceNotReset: true,
  });
  useEffect(() => {
    setInputValuesSetting({ ifid: doubleClickId?.ifid ?? '', ifNm: doubleClickId?.ifNm ?? '' });
  }, [doubleClickId, setInputValuesSetting]);
  return (
    <Box sx={{ my: 1 }} className="InterfaceSearch-root">
      <Stack direction="row" spacing={1} alignItems="center">
        <CLDocLabelInput
          readOnly={!isInterfaceInfo}
          type="search"
          title="인터페이스ID"
          value={inputValues?.ifid}
          onChange={handleChangeInput('ifid')}
          onKeyDown={handleKeyDownEnter}
        />
        <CLDocLabelInput
          type="search"
          readOnly={!isInterfaceInfo}
          title="인터페이스명"
          value={inputValues?.ifNm}
          onChange={handleChangeInput('ifNm')}
          onKeyDown={handleKeyDownEnter}
        />
        <Button size="small" variant="contained" onClick={handleClickSearchBtn}>
          조회
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            handleClickReset();
            onSubmitTabVal('interface-mgmt');
          }}
        >
          초기화
        </Button>
      </Stack>
    </Box>
  );
}
