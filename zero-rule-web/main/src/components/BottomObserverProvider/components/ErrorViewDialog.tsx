import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { trimAndStringLenght } from '@/lib/common-validation';
import type { ErrorType } from '@local/domain/src/ErrorHandleStore';
import { CustomDialog, CustomDialogTitle } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  DialogActions,
  DialogContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';

export const rootSx: SxProps = {
  '& .MuiTextField-root': {
    '& .MuiInputBase-root': { borderRadius: 0 },
    width: '100%',
  },
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export type ErrorViewDialogProps = {
  open: boolean;
  onClose: () => void;
  errorMsg: ErrorType | null;
  pId: string;
};

export default function ErrorViewDialog(props: ErrorViewDialogProps) {
  const { open, onClose, errorMsg, pId } = props;
  const handleCloseDialog = () => {
    onClose();
  };
  console.log(errorMsg?.url);
  const tempErrMsg =
    errorMsg?.msgId === 'E1_HTTP_500' ? '서버 오류가 발생했습니다.' : errorMsg?.msgCn;
  const msgKnMsg =
    errorMsg?.msgClsf === 'NM'
      ? '정보성 메시지'
      : errorMsg?.msgClsf === 'ER'
        ? '시스템 경고'
        : '시스템 에러';
  return (
    <CustomDialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      sx={rootSx}
      className="ErrorViewDialog-root"
    >
      <CustomDialogTitle title={msgKnMsg} onClose={handleCloseDialog}>
        {errorMsg?.msgClsf === 'ER' && (
          <Typography
            pl={2}
            variant="body1"
            sx={{ em: { fontStyle: 'normal', color: 'error.main' } }}
          >
            <em>{msgKnMsg}</em>가 발생했습니다. 관리자에게 문의하세요.
          </Typography>
        )}
      </CustomDialogTitle>
      <DialogContent dividers>
        {!errorMsg ? (
          <>
            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
              등록된 에러가 없습니다
            </Typography>
          </>
        ) : (
          <>
            <Stack
              sx={{
                border: '1px solid #000',
                px: 2,
                py: 4,
                borderRadius: 7,
                whiteSpace: 'wrap',
                mb: 1,
                backgroundColor: '#ccc',
              }}
            >
              {errorMsg?.msgCn + ' <' + errorMsg.msgId + '>'}
            </Stack>
            <TableContainer>
              <Table
                sx={{
                  '& .MuiTableRow-root > .MuiTableCell-root': {
                    ':nth-of-type(1)': {
                      minWidth: 130,
                      maxWidth: 130,
                      width: 130,
                      pl: 4,
                    },
                  },
                }}
              >
                <TableBody>
                  {errorMsg.msgClsf === 'ER' && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack flex={1} direction="row" justifyContent="flex-end">
                          <Box
                            sx={{ flex: 1, border: '1px solid #ddd', alignSelf: 'center', mx: 1 }}
                          />
                          <Typography>세부정보</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails sx={{ border: '1px solid #ddd', borderRadius: 7 }}>
                        {/* 프로그램명 */}
                        <TableRow>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                              컨트롤러명
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={1} direction="row" alignItems="center">
                              <Typography>
                                {trimAndStringLenght(errorMsg.occrPrgNm) < 1
                                  ? '컨트롤러 정보를 찾을수 없습니다.'
                                  : errorMsg.occrPrgNm}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {/* URL */}
                        <TableRow>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                              API URL
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={1} direction="row" alignItems="center">
                              <Typography>
                                {trimAndStringLenght(errorMsg.url) < 1
                                  ? 'url 을 찾을수 없음'
                                  : errorMsg.url}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {/* 함수명 */}
                        <TableRow>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                              함수명
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={1} direction="row" alignItems="center">
                              <Typography>
                                {trimAndStringLenght(errorMsg.occrMethodNm) < 1
                                  ? '함수정보 를 찾을 수 없습니다.'
                                  : errorMsg.occrMethodNm}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                              UI ID
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={1} direction="row" alignItems="center">
                              <Typography>
                                {trimAndStringLenght(pId) < 1 ? '등록된 page id 없음' : pId}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>닫기</Button>
      </DialogActions>
    </CustomDialog>
  );
}
