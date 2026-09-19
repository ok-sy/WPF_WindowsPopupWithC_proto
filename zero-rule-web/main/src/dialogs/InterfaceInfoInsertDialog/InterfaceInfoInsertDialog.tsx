import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
} from '@mui/material';
import { rootSx } from './style';
import CLStyledTable from '@/components/CLStyledTable';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useState } from 'react';
import { useApi } from '@/provider';
import errorCustomHandle from '@/lib/error-custom-handle';
import TypeTextField from '@/components/TypeTextField';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';

export type InterfaceInfoInsertDialogProps = {
  open: boolean;
  onClose: () => void;
};
export type InputData = {
  ifNm: string;
  ifDesc: string;
  docLength: number;
  characterset: string;
  eaiid: string;
};
const DEFAULT_INPUT_DATA: InputData = {
  ifNm: '',
  ifDesc: '',
  docLength: 0,
  characterset: '',
  eaiid: '',
};
type ProcessTypeCd = 'O' | 'D' | 'B';
type ConnectionTypeCd = '1' | '2' | '3';
type RuleUseYn = 'Y' | 'N';
export default function InterfaceInfoInsertDialog(props: InterfaceInfoInsertDialogProps) {
  const { open, onClose } = props;
  const api = useApi();
  // 처리유형
  const [ifProcessTypeCdData, setIfProcessTypeCdData] = useState<ProcessTypeCd>('O');
  // 연계방식
  const [connectionTypeCdData, setConnectionTypeCdData] = useState<ConnectionTypeCd>('1');
  // RULE사용여부
  const [ruleUseYnData, setRuleUseYnData] = useState<RuleUseYn>('Y');
  // input 데이터
  const [insertInputData, setIsertInputData] = useState<InputData>({ ...DEFAULT_INPUT_DATA });

  // 등록API
  const doInsert = useCallback(
    async (params: {
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
        await api.interface.interfaceInsert({ ...params });
        return 1;
      } catch (err) {
        errorCustomHandle(err);
      }
      return 0;
    },
    [api],
  );
  // 등록 버튼
  const onSubmitHandle = () => {
    if (!insertInputData) return;
    const dataSet = {
      ifNm: insertInputData.ifNm,
      ifDesc: insertInputData.ifDesc,
      ifProcessTypeCd: ifProcessTypeCdData,
      ifConnectionTypeCd: connectionTypeCdData,
      ruleUseYn: ruleUseYnData,
      docLength: insertInputData.docLength,
      characterset: insertInputData.characterset,
      eaiid: insertInputData.eaiid,
    };
    doInsert(dataSet).then((result) => {
      if (result === 1) {
        onClose();
      }
    });
  };
  // input 데이터 값 변경
  const onChangeInputData =
    (field: keyof InputData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!insertInputData) return;
      const value = e.target.value;
      setIsertInputData({
        ...insertInputData,
        [field]: field === 'docLength' ? (Number(value) ?? 0) : (value ?? ''),
      });
    };
  console.log('insertInputDatainsertInputData', insertInputData);
  return (
    <CustomDragableDialog
      maxWidth="xs"
      fullWidth
      // backLightOn
      className="InterfaceInfoInsertDialog-root"
      sx={rootSx}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        onClose();
      }}
      BackdropProps={{
        // 이 핸들러는 백드롭 클릭 시 이벤트를 막기 위해 설정됨
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
    >
      <CustomDialogTitle title="인터페이스 등록" onClose={onClose}></CustomDialogTitle>

      <DialogContent
        dividers
        className="InterfaceInfoInsertDialog-content"
        sx={{ p: 2, minHeight: 300 }}
      >
        <Stack spacing={1}>
          <CLDocLabelInput
            title="인터페이스ID"
            fullWidth
            value={'인터페이스ID'}
            readOnly
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' },
              '& .MuiInputBase-root': {
                backgroundColor: '#f5f5f5',
                '& .MuiInputBase-input': {
                  WebkitTextFillColor: '#666',
                },
              },
            }}
          />
          <CLDocLabelInput
            title="인터페이스명"
            fullWidth
            value={insertInputData?.ifNm ?? ''}
            onChange={onChangeInputData('ifNm')}
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' },
            }}
          />
          <CLDocLabelInput
            title="인터페이스설명"
            fullWidth
            value={insertInputData?.ifDesc}
            onChange={onChangeInputData('ifDesc')}
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' },
            }}
          />
          <CLDocLabelSelect
            title="처리유형"
            value={ifProcessTypeCdData}
            onChange={(e) => setIfProcessTypeCdData(e.target.value as ProcessTypeCd)}
            sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
          >
            <MenuItem value="O">online</MenuItem>
            <MenuItem value="D">near online</MenuItem>
            <MenuItem value="B">batch</MenuItem>
          </CLDocLabelSelect>
          <CLDocLabelSelect
            title="연계방식"
            value={connectionTypeCdData}
            onChange={(e) => setConnectionTypeCdData(e.target.value as ConnectionTypeCd)}
            sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
          >
            <MenuItem value="1">EAI</MenuItem>
            <MenuItem value="2">DBtoDB</MenuItem>
            <MenuItem value="3">socket</MenuItem>
          </CLDocLabelSelect>
          <CLDocLabelSelect
            title="RULE사용여부"
            value={ruleUseYnData}
            onChange={(e) => setRuleUseYnData(e.target.value as RuleUseYn)}
            sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
          >
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </CLDocLabelSelect>
          <CLDocLabelInput
            title="전문길이수"
            fullWidth
            valueType="number"
            maxLength={10}
            value={insertInputData?.docLength}
            onChange={onChangeInputData('docLength')}
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' },
            }}
          />
          <CLDocLabelInput
            title="캐릭터셋"
            fullWidth
            value={insertInputData?.characterset}
            onChange={onChangeInputData('characterset')}
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' },
            }}
          />
          <CLDocLabelInput
            title="EAIID"
            fullWidth
            value={insertInputData?.eaiid}
            onChange={onChangeInputData('eaiid')}
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onSubmitHandle()} variant="contained">
          등록
        </Button>
        <Button onClick={onClose} variant="contained">
          취소
        </Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
