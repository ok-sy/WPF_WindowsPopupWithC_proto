import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { InterfaceInfoInsertDialogProps } from '@/dialogs/InterfaceInfoInsertDialog';
import InterfaceInfoInsertDialog from '@/dialogs/InterfaceInfoInsertDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, InterfaceVo } from '@local/domain';
import { sxTableRowSelection } from '@local/ui';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Button,
  Grid2,
  MenuItem,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import type { InterfaceInfoParams } from '../../InterfaceMgmtHome';
import { mgmtSx } from '../../style';
import InterfaceInfoRow from './components/InterfaceInfoRow';
type DialogIds = 'InterfaceInfoInsertDialog';
type Props = {
  searchOption: InterfaceInfoParams;
  onSubmitDoubleClick: (ifid: string, ifNm: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
};
export default function InterfaceMgmt(props: Props) {
  const { searchOption, onSubmitDoubleClick, loading, setLoading } = props;
  const api = useApi();
  const [refreshToken, setRefreshToken] = useState(0);
  // 상세 수정 데이터
  const [interfaceUptData, setInterfaceUptData] = useState<InterfaceVo>();
  const interfaceUptDataFnRef = useRef<InterfaceVo>();
  interfaceUptDataFnRef.current = interfaceUptData;
  const [dialogId, setDialogId] = useState<DialogIds>();
  const [interfaceInfoInsertDialogProps, setInterfaceInfoInsertDialogProps] =
    useState<InterfaceInfoInsertDialogProps>();
  const [selectChecked, setSelectChecked] = useState<string[]>([]);

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setInterfaceInfoInsertDialogProps(undefined);
  };
  // 다이어로그 열기
  const openDialog = () => {
    setDialogId('InterfaceInfoInsertDialog');
    setInterfaceInfoInsertDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
        setRefreshToken(Date.now());
      },
    });
  };

  // 인터페이스 정보 목록 데이터
  const [interfaceInfoListData, setInterfaceInfoListData] = useState<InterfaceVo[]>([]);

  const interfaceInfoList = useCallback(
    async (params: InterfaceInfoParams, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        setInterfaceUptData(undefined);
        const { body } = await api.interface.interfaceInfoList({ ctx, ...params });
        setInterfaceInfoListData(body.interfaceInfos);
        if (ctx.canceled) return;
        return body.interfaceInfos;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    interfaceInfoList(searchOption, ctx).then((data) => {
      if (data) {
        const findData = data.find((el) => el.ifid === interfaceUptDataFnRef.current?.ifid);
        setInterfaceUptData(findData);
      }
    });
  }, [refreshToken, searchOption, interfaceInfoList, interfaceUptDataFnRef]);

  // 수정
  const interfaceInfoUpdate = useCallback(
    async (params: {
      ifid: string;
      ifNm: string;
      ifDesc: string;
      ifProcessTypeCd: string;
      ifConnectionTypeCd: string;
      ruleUseYn: string;
      docLength: number;
      characterset: string;
      eaiid: string;
    }): Promise<number> => {
      try {
        await api.interface.interfaceInfoUpdate({ ...params });
        return 1;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setRefreshToken(Date.now());
      }
      return 0;
    },
    [api],
  );
  // 수정버튼
  const handleClickUptBtn = () => {
    if (!interfaceUptData) return;
    const dataSet = {
      ifid: interfaceUptData.ifid ?? '',
      ifNm: interfaceUptData.ifNm ?? '',
      ifDesc: interfaceUptData.ifDesc ?? '',
      ifProcessTypeCd: interfaceUptData.ifProcessTypeCd ?? '',
      ifConnectionTypeCd: interfaceUptData.ifConnectionTypeCd ?? '',
      ruleUseYn: interfaceUptData.ruleUseYn ?? '',
      docLength: interfaceUptData.docLength,
      characterset: interfaceUptData.characterset ?? '',
      eaiid: interfaceUptData.eaiid ?? '',
    };
    interfaceInfoUpdate(dataSet);
  };

  // input 데이터 값 변경
  const onChangeInputData =
    (field: keyof InterfaceVo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!interfaceUptData) return;
      let value = '';
      if (field === 'docLength') {
        value = e.target.value.replace(/\D/g, '0');
        if (value.length > 10) {
          value = value.substring(0, 10);
        }
      } else {
        value = e.target.value ?? '';
      }
      setInterfaceUptData({
        ...interfaceUptData,
        [field]: field === 'docLength' ? Number(value) : value,
      });
    };
  // select 데이터 값 변경
  const onChangeSelectData = (field: keyof InterfaceVo) => (e: SelectChangeEvent<unknown>) => {
    if (!interfaceUptData) return;
    let defaultValue = '';
    if (field === 'ifProcessTypeCd') {
      defaultValue = 'online';
    } else if (field === 'ifConnectionTypeCd') {
      defaultValue = 'EAI';
    } else if (field === 'ruleUseYn') {
      defaultValue = 'Y';
    }
    const value = e.target.value ?? defaultValue;
    setInterfaceUptData({ ...interfaceUptData, [field]: value });
  };

  const allRowCheckHandler = (checked: boolean) => {
    if (checked) {
      interfaceInfoListData?.map((el) => {
        setSelectChecked(interfaceInfoListData?.map((el) => el.ifid));
      });
    } else {
      setSelectChecked([]);
    }
  };

  const checkHandle = (fildId: string, checked: boolean) => {
    console.log('test', fildId);
    if (checked) {
      setSelectChecked((p) => [...p, fildId]);
    } else {
      setSelectChecked((prevState) => prevState.filter((item) => item !== fildId));
    }
  };

  // 수정
  const doDel = useCallback(
    async (delInterfaceList: string[]): Promise<number> => {
      try {
        await api.interface.interfaceDel({ delInterfaceList });
        return 1;
      } catch (err) {
        errorCustomHandle(err);
      }
      return 0;
    },
    [api],
  );
  // 삭제버튼
  const handleClickDelBtn = () => {
    if (selectChecked.length < 1) {
      return;
    }
    let isUsed = 0;
    selectChecked.forEach((el) => {
      const findData = interfaceInfoListData.find((data) => data.ifid === el);
      if (findData?.ruleUseYn === 'Y') {
        isUsed = 1;
        return;
      }
    });
    if (isUsed === 1) {
      toast.warn('사용중인 룰은 삭제할수 없습니다');
      return;
    }
    doDel(selectChecked).then(() => {
      setSelectChecked([]);
      setRefreshToken(Date.now());
    });
  };

  return (
    <Box className="InterfaceMgmt-root" sx={mgmtSx}>
      {/* 조회결과 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <SubTitleAndIcon labelTitle="조회결과" />
        <Stack direction="row" spacing={0.5}>
          <Button variant="contained" size="small" onClick={handleClickDelBtn}>
            선택삭제
          </Button>
          <Button variant="contained" size="small" onClick={openDialog}>
            신규등록
          </Button>
        </Stack>
      </Stack>
      <TableContainer className="table-container">
        <CLStyledTable noMargin>
          <CustomColoredTableHead yPadding="small" className="table-head">
            <TableRow>
              <TableCell>
                <CLStyledTableCheckBox
                  checked={
                    interfaceInfoListData.length === selectChecked.length &&
                    interfaceInfoListData.length !== 0
                  }
                  onChange={(_, checked) => {
                    allRowCheckHandler(checked);
                  }}
                />
              </TableCell>
              <TableCell>인터페이스ID</TableCell>
              <TableCell>인터페이스명</TableCell>
              <TableCell>인터페이스설명</TableCell>
              <TableCell>처리유형</TableCell>
              <TableCell>연계방식</TableCell>
              <TableCell>RULE사용여부</TableCell>
              <TableCell>전문길이수</TableCell>
              <TableCell>캐릭터셋</TableCell>
              <TableCell>EAIID</TableCell>
              <TableCell>변경사용자ID</TableCell>
              <TableCell>변경일시</TableCell>
            </TableRow>
          </CustomColoredTableHead>
          <CLDocTableBody yPadding="small" sx={sxTableRowSelection}>
            {interfaceInfoListData.map((el) => {
              return (
                <InterfaceInfoRow
                  key={el.ifid}
                  data={el}
                  onSubmitDoubleClick={() => onSubmitDoubleClick(el.ifid, el.ifNm)}
                  onSubmitClick={(data) => {
                    setInterfaceUptData(data);
                  }}
                  selected={interfaceUptData?.ifid === el.ifid}
                  checked={selectChecked}
                  checkHandle={checkHandle}
                />
              );
            })}
          </CLDocTableBody>
        </CLStyledTable>
      </TableContainer>

      {/* 상세수정 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1}>
        <SubTitleAndIcon labelTitle="상세수정" />
      </Stack>
      <Grid2 container spacing={0.5} mt={0.5}>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput title="인터페이스ID" value={interfaceUptData?.ifid ?? ''} readOnly />
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput
            title="인터페이스명"
            value={interfaceUptData?.ifNm ?? ''}
            onChange={onChangeInputData('ifNm')}
          />
        </Grid2>
        <Grid2 size={{ xs: 6 }}>
          <CLDocLabelInput
            title="인터페이스설명"
            value={interfaceUptData?.ifDesc ?? ''}
            onChange={onChangeInputData('ifDesc')}
          />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelSelect
            title="처리유형"
            value={interfaceUptData?.ifProcessTypeCd ?? 'online'}
            onChange={onChangeSelectData('ifProcessTypeCd')}
          >
            <MenuItem value="online">online</MenuItem>
            <MenuItem value="near online">near online</MenuItem>
            <MenuItem value="batch">batch</MenuItem>
          </CLDocLabelSelect>
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelSelect
            title="연계방식"
            value={interfaceUptData?.ifConnectionTypeCd ?? 'EAI'}
            onChange={onChangeSelectData('ifConnectionTypeCd')}
          >
            <MenuItem value="EAI">EAI</MenuItem>
            <MenuItem value="DBtoDB">DBtoDB</MenuItem>
            <MenuItem value="socket">socket</MenuItem>
          </CLDocLabelSelect>
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelSelect
            title="RULE사용여부"
            value={interfaceUptData?.ruleUseYn ?? 'Y'}
            onChange={onChangeSelectData('ruleUseYn')}
          >
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </CLDocLabelSelect>
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput
            title="전문길이수"
            value={interfaceUptData?.docLength ?? ''}
            onChange={onChangeInputData('docLength')}
          />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput
            title="캐릭터셋"
            value={interfaceUptData?.characterset ?? ''}
            onChange={onChangeInputData('characterset')}
          />
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput
            title="EAIID"
            value={interfaceUptData?.eaiid ?? ''}
            onChange={onChangeInputData('eaiid')}
          />
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput
            title="변경사용자ID"
            value={interfaceUptData?.updateUserid ?? ''}
            readOnly
          />
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <CLDocLabelInput
            title="변경일시"
            value={interfaceUptData?.updateDatetime ?? ''}
            readOnly
          />
        </Grid2>
      </Grid2>
      <Stack direction="row" justifyContent="flex-end" mt={0.5}>
        <Button variant="contained" size="small" onClick={handleClickUptBtn}>
          수정
        </Button>
      </Stack>
      {dialogId === 'InterfaceInfoInsertDialog' && interfaceInfoInsertDialogProps && (
        <InterfaceInfoInsertDialog {...interfaceInfoInsertDialogProps} />
      )}
    </Box>
  );
}
