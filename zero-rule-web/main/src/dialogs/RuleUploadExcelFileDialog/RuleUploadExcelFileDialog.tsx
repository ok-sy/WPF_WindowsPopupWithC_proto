import BufferProgress from '@/components/BufferProgress';
import CLCodeListLabel from '@/components/CLCodeListLabel';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import FileDropzone from '@/components/FileDropzone';
import errorCustomHandle from '@/lib/error-custom-handle';
import { csvFileToArray, readExcelAsCsv } from '@/lib/excel-csv-array';
import { useApi } from '@/provider';
import type { RuleInterfaceMapVo } from '@local/domain';
import { CLCode, CLMsgMngCreateParams, PagerData } from '@local/domain';
import { CustomDialogTitle, flatSx } from '@local/ui';
import CloseIcon from '@mui/icons-material/Close';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { msgUploadValid } from './components/valid-check';

export interface UploadMsgType {
  message?: string;
  msgCn: string; // 메시지
  msgClsf: string; // 메시지 종류
  tskClsfCd: string; // 업무구분 코드
  occrClsfCd: string; // 발생구분 코드
  teamId: string; // 팀정보
  msgPrntCd: string; // 출력구분
}
export type CheckedUploadMsgType = {
  errorMessage?: string;
} & UploadMsgType;

const rootSx: SxProps = {};
interface AcceptedFile {
  fileName: string;
  file: File;
}
export type RuleUploadExcelFileDialogProps = {
  className?: string;
  open: boolean;
  onClose: () => void;
  onUploaded: (data: RuleInterfaceMapVo[]) => void;
  ifInfo: { ifid: string; ifNm: string };
};
export default function RuleUploadExcelFileDialog(props: RuleUploadExcelFileDialogProps) {
  const { onClose, open, className, onUploaded, ifInfo } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [acceptFile, setAcceptFile] = useState<AcceptedFile>();
  const [strCsv, setStrCsv] = useState<Promise<string>>();
  const [loading, setLoading] = useState(false);
  const [uploadDisableTf, setUploadDisableTf] = useState<boolean>(false);

  // 스테이지에 올라간 파일 삭제 버튼
  const handleDelete = () => {
    if (!acceptFile) return;
    setAcceptFile(undefined);
    setStrCsv(undefined);
  };
  // 파일 Drag & Drop 시
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const fileList: AcceptedFile[] = acceptedFiles.map((el) => ({ fileName: el.name, file: el }));
    setAcceptFile(fileList[0]);
    const xlsxToString = readExcelAsCsv(fileList[0].file);
    setStrCsv(xlsxToString);
  };

  // 변환하기 버튼
  const handleClickDone = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const csvText = await strCsv;
      const csv = csvFileToArray(csvText as string);
      const uploadedMsg: RuleInterfaceMapVo[] = csv.bodyRows.map((el) => {
        return {
          crudGubun: 'C',
          ifid: ifInfo.ifid,
          ifNm: ifInfo.ifNm,
          fieldEngNm: el[0],
          fieldKorNm: el[1],
          fieldOrder: Number(el[2]),
          fieldLength: Number(el[3]),
          fieldStartNo: Number(el[4]),
          fieldCodeType: el[5],
          datatypeCd: el[6],
          fieldScale: Number(el[7]),
          trimYn: el[8],
          characterset: el[9],
        };
      });
      onUploaded(uploadedMsg);
    } catch (err: any) {
      console.log('파일업로드를 실패하였습니다.');
      return;
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog
      sx={flatSx(rootSx)}
      className={clsx('RuleUploadExcelFileDialog-root')}
      open={open}
      onClose={() => onClose()}
      maxWidth="sm"
      fullWidth
    >
      {loading && <BufferProgress />}
      <CustomDialogTitle title={'파일 업로드'} onClose={onClose} />
      <DialogContent dividers>
        <Box>
          {acceptFile ? (
            <Box sx={{ border: '1px solid #e0e0e0', p: 2 }}>
              <Stack
                key={acceptFile.fileName}
                alignItems="center"
                justifyContent="space-between"
                direction="row"
                minWidth={300}
              >
                <Stack sx={{ overflow: 'hidden' }} direction="row" spacing={1}>
                  <Typography
                    color="primary"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {acceptFile.fileName}
                  </Typography>
                </Stack>
                <IconButton
                  onClick={() => {
                    handleDelete();
                  }}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ) : (
            <FileDropzone
              // acceptedExtention={['.xls', '.xlsx']}
              onAcceptedFiles={onDrop}
              disabled={false}
            />
          )}
        </Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack
            spacing={0.5}
            component="ul"
            sx={{
              em: {
                color: 'secondary.main',
                fontStyle: 'normal',
              },
            }}
            className="HelpPaper-root"
          >
            <li>
              <em>엑셀 파일</em>만 등록할 수 있습니다. (<em>.xlsx</em>, <em>.xls</em>)
            </li>

            <li>
              <em>정해진 규칙</em>에 의해 생성된 <em>메시지 목록</em>만 정상 등록 됩니다.
            </li>

            <li>
              업로드 <em>양식</em>은 <em>업로드버튼 </em>좌측에서 클릭해서 다운로드 받으시면 됩니다.
            </li>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          닫기
        </Button>
        <Button
          ref={buttonRef}
          disabled={!acceptFile}
          id="workers-create-btn"
          color="success"
          variant="contained"
          onClick={handleClickDone}
        >
          일괄 등록
        </Button>
      </DialogActions>
    </Dialog>
  );
}
