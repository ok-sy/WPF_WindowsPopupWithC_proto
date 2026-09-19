import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import { ExportToExcelWithButton } from '@/components/ExportToExcelWithButton';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { RuleUploadExcelFileDialogProps } from '@/dialogs/RuleUploadExcelFileDialog';
import RuleUploadExcelFileDialog from '@/dialogs/RuleUploadExcelFileDialog/RuleUploadExcelFileDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { sxTableRowSelection } from '@local/ui';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Button,
  Divider,
  Grid2,
  LinearProgress,
  MenuItem,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import type { ApiRequestContext, RuleInterfaceMapVo } from '@local/domain';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { InterfaceInfoParams } from '../../InterfaceMgmtHome';
import { mgmtMapSx } from '../../style';
import InterfaceMapRow from './components/InterfaceMapRow';
import { EXCEL_DATA_SET, excelFromData, interfaceValiDali } from './excel-sample';

type Props = {
  doubleClickId: { ifid: string; ifNm: string };
};
type DialogId = 'RuleUploadExcelFileDialog';
export default function InterfaceMapMgmt(props: Props) {
  const { doubleClickId } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // 인터페이스 컬럼정보 목록 데이터
  const [interfaceMapListData, setInterfaceMapListData] = useState<RuleInterfaceMapVo[]>([]);

  const [selectedInterfaceMap, setSelectedInterfaceMap] = useState<RuleInterfaceMapVo>();
  const [selectedIdx, setSelectedIdx] = useState<number>();

  const [checkedList, setCheckedList] = useState<number[]>([]);

  const [dialogId, setDialogId] = useState<DialogId>();
  const [ruleUploadExcelFileDialogProps, setRuleUploadExcelFileDialogProps] =
    useState<RuleUploadExcelFileDialogProps>();

  const closeDialog = () => {
    setDialogId(undefined);
    setRuleUploadExcelFileDialogProps(undefined);
  };

  const fileUploadOpen = () => {
    setDialogId('RuleUploadExcelFileDialog');
    setRuleUploadExcelFileDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
      },
      onUploaded: (data) => {
        setInterfaceMapListData([...interfaceMapListData, ...data]);
        closeDialog();
      },
      ifInfo: { ifid: doubleClickId.ifid, ifNm: doubleClickId.ifNm },
    });
  };

  const interfaceMapList = useCallback(
    async (params: InterfaceInfoParams, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.interface.interfaceMapList({ ctx, ...params });
        setInterfaceMapListData(body.interfaceMaps);
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    // if (doubleClickId !== undefined) {
    //   endSearchOption = { ifid: doubleClickId, ifNm: '' }
    // }
    const ctx = { canceled: false } as ApiRequestContext;
    interfaceMapList({ ifid: doubleClickId.ifid, ifNm: doubleClickId.ifNm }, ctx);
  }, [refreshToken, doubleClickId, interfaceMapList]);

  const {
    characterset,
    fieldCodeType,
    fieldEngNm,
    fieldKorNm,
    fieldLength,
    fieldOrder,
    fieldScale,
    fieldStartNo,
    trimYn,
  } = selectedInterfaceMap ?? {};

  // 행추가 버튼 클릭
  const handleClickAddRow = () => {
    const newRow: RuleInterfaceMapVo = {
      crudGubun: 'C',
      ifid: '',
      fieldEngNm: '',
      fieldKorNm: '',
      fieldOrder: 0,
      fieldLength: 0,
      fieldStartNo: 0,
      fieldCodeType: '',
      datatypeCd: 'number',
      fieldScale: 0,
      trimYn: 'Y',
      characterset: '',
      ifNm: '',
    };
    setInterfaceMapListData([...interfaceMapListData, newRow]);
  };
  // 상세수정 input값 변경
  const onChangeInputData =
    (field: keyof RuleInterfaceMapVo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedInterfaceMap) return;
      const value = e.target.value ?? '';
      setSelectedInterfaceMap({ ...selectedInterfaceMap, [field]: value });
    };
  // 상세수정 select 데이터 값 변경
  const onChangeSelectData =
    (field: keyof RuleInterfaceMapVo) => (e: SelectChangeEvent<unknown>) => {
      if (!selectedInterfaceMap) return;
      let defaultValue = '';
      if (field === 'datatypeCd') {
        // 20250123 jjfive 수정필요, 의도를 알수 없음
        // defaultValue = '0' ? 'number' : 'string'
        defaultValue = 'number';
      } else {
        defaultValue = 'Y';
      }
      const value = e.target.value ?? defaultValue;
      // console.log('e.target.valuee.target.value', e.target.value)
      setSelectedInterfaceMap({ ...selectedInterfaceMap, [field]: value });
    };

  // 수정버튼 클릭
  const handleClickUptBtn = () => {
    if (!selectedInterfaceMap) return;
    const uptDataindex = interfaceMapListData.findIndex(
      (el) =>
        el.ifid === selectedInterfaceMap.ifid &&
        el.ifNm === selectedInterfaceMap.ifNm &&
        el.fieldEngNm === selectedInterfaceMap.fieldEngNm,
    );
    const newInterfaceMapListData = [...interfaceMapListData];
    newInterfaceMapListData.splice(uptDataindex, 1, { ...selectedInterfaceMap, crudGubun: 'U' });
    setInterfaceMapListData(newInterfaceMapListData);
  };

  // 등록API
  const allInsert = useCallback(
    async (params: { interfaceMaps: RuleInterfaceMapVo[] }): Promise<number> => {
      try {
        const { body } = await api.interface.interfaceMapAllInsert(params);
        return body.result;
      } catch (err) {
        errorCustomHandle(err);
      }
      return 0;
    },
    [api],
  );
  // 등록버튼
  const handleClickInsertBtn = () => {
    const vali = interfaceValiDali(interfaceMapListData);
    if (vali === 1) {
      toast.warn('순번은 최대 5자리 입니다');
      return;
    } else if (vali === 2) {
      toast.warn('길이는 최대 5자리 입니다');
      return;
    } else if (vali === 3) {
      toast.warn('시작위치번호는 최대 5자리입니다.');
      return;
    } else if (vali === 4) {
      toast.warn('코드ID는 최대 1자리입니다.');
      return;
    } else if (vali === 4) {
      toast.warn('소수점자리수 최대 2자리입니다.');
      return;
    }

    allInsert({ interfaceMaps: interfaceMapListData }).then((result) => {
      if (result === 1) {
        setCheckedList([]);
        setRefreshToken(Date.now());
        return;
      }
    });
  };
  return (
    <Box sx={mgmtMapSx} className="InterfaceMapMgmt-root">
      <Box className="mgmt-map-list">
        {loading && (
          <Box className="loading-box">
            <LinearProgress />
          </Box>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <SubTitleAndIcon labelTitle="조회결과" />
          <Stack direction="row" spacing={0.5}>
            <Button variant="contained" size="small" onClick={handleClickInsertBtn}>
              저장
            </Button>
          </Stack>
        </Stack>
        <TableContainer className="table-container">
          <CLStyledTable noMargin>
            <CustomColoredTableHead yPadding="small" className="table-head">
              <TableRow>
                <TableCell>
                  <CLStyledTableCheckBox
                    checked={checkedList.length === interfaceMapListData.length}
                    onChange={(_, checked) => {
                      if (checked) {
                        const idxArr = interfaceMapListData.map((_, idx) => idx);
                        setCheckedList(idxArr);
                      } else {
                        setCheckedList([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>수정구분</TableCell>
                {/* <TableCell>인터페이스ID</TableCell>
                <TableCell>인터페이스명</TableCell> */}
                <TableCell>필드영문명</TableCell>
                <TableCell>필드한글명</TableCell>
                <TableCell>순번</TableCell>
                <TableCell>길이</TableCell>
                <TableCell>시작위치번호</TableCell>
                <TableCell>코드ID</TableCell>
                <TableCell>데이타타입</TableCell>
                <TableCell>소수점자리수</TableCell>
                <TableCell>TRIM여부</TableCell>
                <TableCell>캐릭터셋</TableCell>
              </TableRow>
            </CustomColoredTableHead>

            <CLDocTableBody yPadding="small" sx={sxTableRowSelection}>
              {interfaceMapListData.map((el, idx) => (
                <InterfaceMapRow
                  isChecked={checkedList.includes(idx)}
                  onClickChecked={(idx2) => {
                    const isCheck = checkedList.find((el) => el === idx2);
                    if (isCheck === undefined) {
                      setCheckedList(checkedList.concat(idx2));
                    } else {
                      setCheckedList(checkedList.filter((el) => el !== idx2));
                    }
                  }}
                  onClickRow={(data, idx2) => {
                    if (data.crudGubun === 'C') return;
                    setSelectedIdx(idx2);
                    setSelectedInterfaceMap(data);
                  }}
                  key={idx}
                  data={el}
                  selected={idx === selectedIdx}
                  idx={idx}
                  onChangeValue={(data, idx) => {
                    const tmpArr = [...interfaceMapListData];
                    tmpArr.splice(idx, 1, data);
                    setInterfaceMapListData(tmpArr);
                  }}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>

        <Stack direction="row" mt={0.5} spacing={0.5} justifyContent="flex-end">
          <ExportToExcelWithButton
            variant="outlined"
            size="small"
            data={excelFromData(interfaceMapListData)}
            btnTitle="엑셀출력"
            fileName="인터페이스_컬럼정보_출력"
          ></ExportToExcelWithButton>
          <ExportToExcelWithButton
            variant="outlined"
            size="small"
            data={EXCEL_DATA_SET}
            btnTitle="엑셀업로드 양식"
            fileName="인터페이스_컬럼정보_업로드양식"
            isFirstRowOnly
          ></ExportToExcelWithButton>
          <Button onClick={() => fileUploadOpen()} variant="outlined" size="small">
            엑셀업로드
          </Button>
          <Stack pl={3} direction="row" spacing={0.5}>
            <Button variant="outlined" size="small" onClick={handleClickAddRow}>
              행추가
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setInterfaceMapListData(
                  interfaceMapListData.map((el, idx) => {
                    if (checkedList.includes(idx)) {
                      return { ...el, crudGubun: 'D' };
                    } else {
                      return el;
                    }
                  }),
                );
              }}
            >
              선택삭제
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />
      <Box className="InterfaceMgmtInfo-root">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <SubTitleAndIcon labelTitle="상세수정" />
        </Stack>
        <Grid2 container spacing={0.5} mt={0.5}>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput readOnly value={fieldEngNm} title="필드영문명" />
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('fieldKorNm')}
              value={fieldKorNm}
              title="필드한글명"
            />
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('fieldOrder')}
              value={fieldOrder}
              title="순번"
            />
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('fieldLength')}
              value={fieldLength}
              valueType="number"
              maxLength={5}
              title="전문길이"
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={0.5}>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('fieldStartNo')}
              value={fieldStartNo}
              valueType="number"
              maxLength={5}
              title="전문시작위치"
            />
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('fieldCodeType')}
              value={fieldCodeType}
              title="코드ID"
            />
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelSelect
              title="데이타타입"
              value={selectedInterfaceMap?.datatypeCd === 'number' ? '0' : '1'}
              onChange={onChangeSelectData('datatypeCd')}
            >
              <MenuItem value="0">number</MenuItem>
              <MenuItem value="1">string</MenuItem>
            </CLDocLabelSelect>
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('fieldScale')}
              value={fieldScale}
              valueType="number"
              maxLength={2}
              title="소수점자리수"
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={0.5}>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              // onChange={onChangeInputData('fieldEngNm')}
              title="변환데이타포멧"
            />
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            {/* <CLDocLabelInput
              onChange={onChangeInputData('trimYn')}
              value={trimYn}
              title="TRIM여부"
            /> */}
            <CLDocLabelSelect
              title="TRIM여부"
              value={trimYn}
              onChange={onChangeSelectData('trimYn')}
            >
              <MenuItem value="Y">Y</MenuItem>
              <MenuItem value="N">N</MenuItem>
            </CLDocLabelSelect>
          </Grid2>
          <Grid2 size={{ xs: 3 }}>
            <CLDocLabelInput
              onChange={onChangeInputData('characterset')}
              value={characterset}
              title="캐릭터셋"
            />
          </Grid2>
          <Grid2 size={{ xs: 3 }} textAlign="right">
            <Button variant="outlined" size="small" onClick={handleClickUptBtn}>
              수정
            </Button>
          </Grid2>
        </Grid2>
        <Stack direction="row" justifyContent="flex-end" mt={0.5}></Stack>
      </Box>
      {dialogId === 'RuleUploadExcelFileDialog' && ruleUploadExcelFileDialogProps && (
        <RuleUploadExcelFileDialog {...ruleUploadExcelFileDialogProps} />
      )}
    </Box>
  );
}
