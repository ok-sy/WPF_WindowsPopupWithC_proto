import BufferProgress from '@/components/BufferProgress';
import CLCodeListLabel from '@/components/CLCodeListLabel';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import FileDropzone from '@/components/FileDropzone';
import errorCustomHandle from '@/lib/error-custom-handle';
import { csvFileToArray, readExcelAsCsv } from '@/lib/excel-csv-array';
import { useApi } from '@/provider';
import type { CLCode, CLMsgMngCreateParams, PagerData } from '@local/domain';
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
export type MsgMngUploadDialogProps = {
  className?: string;
  open: boolean;
  onClose: () => void;
};
export default function MsgMngUploadDialog(props: MsgMngUploadDialogProps) {
  const { onClose, open, className } = props;
  const api = useApi();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [acceptFile, setAcceptFile] = useState<AcceptedFile>();
  const [strCsv, setStrCsv] = useState<Promise<string>>();
  const [uploadedMsg, setUploadedMsg] = useState<UploadMsgType[]>();
  const [loading, setLoading] = useState(false);
  const [teamApiData, setTeamApiData] = useState<PagerData<CLCode>>();
  const [tskClsfCdApiData, setTskClsfCdApiData] = useState<PagerData<CLCode>>();
  const [uploadDisableTf, setUploadDisableTf] = useState<boolean>(false);

  // 스테이지에 올라간 파일 삭제 버튼
  const handleDelete = () => {
    if (!acceptFile) return;
    setAcceptFile(undefined);
    setUploadedMsg(undefined);
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tskClsfCdApi = await api.clCode.search({
          rowsPerPage: 9999,
          pageNumber: 0,
          codeType: '111',
        });
        const teamApi = await api.clCode.search({
          rowsPerPage: 9999,
          pageNumber: 0,
          codeType: '123',
        });

        setTeamApiData(tskClsfCdApi.body.pagerData);
        setTskClsfCdApiData(teamApi.body.pagerData);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };

    fetchData(); // 컴포넌트가 마운트될 때 한 번만 데이터를 가져오도록 함
  }, [api]); // 빈 배열을 넣어 한 번만 호출하도록 함
  // 변환하기 버튼
  const handleClickDone = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const csvText = await strCsv;
      const csv = csvFileToArray(csvText as string);

      const uploadedMsg: UploadMsgType[] = csv.bodyRows.map((el) => {
        const message = msgUploadValid(el);
        return {
          message: message,
          msgCn: el[0],
          msgClsf: el[1] === 'NORMAL' ? 'NM' : el[1] === 'ERROR' ? 'ER' : '',
          tskClsfCd: el[2],
          occrClsfCd:
            el[3] === 'BUSINESS'
              ? 'BE'
              : el[3] === 'SYSTEM'
                ? 'SY'
                : el[3] === 'FRAMEWORK'
                  ? 'FW'
                  : '',
          teamId: el[4],
          msgPrntCd: el[5] === '하단' ? '1' : el[5] === '팝업' ? '2' : '',
        };
      });
      setUploadedMsg(uploadedMsg);
      const test = uploadedMsg.find((el) => el.message)?.message;
      if (test === undefined) {
        setUploadDisableTf(true);
      }
    } catch (err: any) {
      console.log('파일업로드를 실패하였습니다.');
      return;
    } finally {
      setLoading(false);
    }
  };

  // 등록
  const doSave = useCallback(
    async (params: { insertArrs: CLMsgMngCreateParams[] }): Promise<number | null> => {
      try {
        setLoading(true);
        const { body } = await api.clMsgMngApi.create({ ...params });
        const { insertCnt } = body;

        return insertCnt;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );

  const onSubmitHandle = () => {
    if (!uploadedMsg) return;
    const dataSet: CLMsgMngCreateParams[] = uploadedMsg.map((el) => {
      const tskClsfCd = tskClsfCdApiData?.elements.find((code) => code.codeNm === el.tskClsfCd);
      const teamId = teamApiData?.elements.find((code) => code.codeNm === el.teamId);
      return {
        msgClsf: el.msgClsf,
        tskClsfCd: tskClsfCd?.code ?? '',
        teamId: teamId?.code ?? '',
        occrClsfCd: el.occrClsfCd,
        msgPrntCd: el.msgPrntCd,
        msgCn: el.msgCn,
      };
    });
    doSave({ insertArrs: dataSet }).then((result) => {
      if (result) {
        onClose();
      }
    });
  };
  return (
    <Dialog
      sx={flatSx(rootSx)}
      className={clsx('MsgMngUploadDialog-root')}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        onClose();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
      maxWidth="lg"
      fullWidth
    >
      {loading && <BufferProgress />}
      <CustomDialogTitle title={'메시지 일괄 업로드'} onClose={onClose} />
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
          {acceptFile && uploadedMsg === undefined && (
            <Button onClick={handleClickDone} color="success" variant="contained">
              변환하기
            </Button>
          )}
        </Stack>
        {uploadedMsg && (
          <TableContainer
            sx={{
              '& .MuiTableRow-root': {
                '& .MuiTableCell-root': {
                  border: '1px solid #ccc',
                  alignItems: 'center',

                  px: 0,
                  '&:nth-of-type(1)': {
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                    px: 1.5,
                  },
                  '&:nth-of-type(2)': {
                    width: 300,
                    minWidth: 300,
                    maxWidth: 300,
                    px: 1.5,
                  },
                  '&:nth-of-type(3)': {
                    width: 100,
                    minWidth: 100,
                    maxWidth: 100,
                    textAlign: 'center',
                  },
                  '&:nth-of-type(4)': {
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                    textAlign: 'center',
                  },
                  '&:nth-of-type(5)': {
                    width: 110,
                    minWidth: 110,
                    maxWidth: 110,
                    textAlign: 'center',
                  },
                  '&:nth-of-type(6)': {
                    width: 110,
                    minWidth: 110,
                    maxWidth: 110,
                    textAlign: 'center',
                  },
                  '&:nth-of-type(7)': {
                    width: 80,
                    minWidth: 80,
                    maxWidth: 80,
                    textAlign: 'center',
                  },
                },
              },
            }}
          >
            <CLStyledTable noMargin>
              <CLDocTableHead yPadding="small">
                <TableRow>
                  <TableCell>비고</TableCell>
                  <TableCell>메시지</TableCell>
                  <TableCell>
                    메시지
                    <br />
                    종류
                  </TableCell>
                  <TableCell>업무구분</TableCell>
                  <TableCell>
                    발생구분
                    <br />
                    코드
                  </TableCell>
                  <TableCell>팀정보</TableCell>
                  <TableCell>
                    출력
                    <br />
                    구분
                  </TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody>
                {uploadedMsg.map((el, idx) => {
                  return (
                    <TableRow
                      key={idx}
                      sx={{ backgroundColor: el.message === undefined ? '#f6f7fc' : '#fef4f8' }}
                    >
                      <TableCell>
                        <Typography>{el.message}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{el.msgCn}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {el.msgClsf === 'NM' ? 'NORMAL' : el.msgClsf === 'ER' ? 'ERROR' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{el.tskClsfCd}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {el.occrClsfCd === 'BE'
                            ? 'BUSINESS'
                            : el.occrClsfCd === 'SY'
                              ? 'SYSTEM'
                              : el.occrClsfCd === 'FW'
                                ? 'FRAMEWORK'
                                : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{el.teamId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {el.msgPrntCd === '1' ? '하단' : el.msgPrntCd === '2' ? '팝업' : ''}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
        {uploadedMsg !== undefined && (
          <Button
            ref={buttonRef}
            disabled={!uploadDisableTf}
            id="workers-create-btn"
            color="success"
            variant="contained"
            onClick={onSubmitHandle}
          >
            일괄 등록
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
