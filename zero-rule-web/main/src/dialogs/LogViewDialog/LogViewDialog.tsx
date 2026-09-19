import { CustomDialog, CustomDialogTitle, formatDateOrNull, MdOrUp } from '@local/ui';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import TimeAgo from 'timeago-react';
import { rootSx } from './style';

const formatEpochSeconds = (epochSeconds: number): [string, Date] => {
  const date = new Date(epochSeconds * 1000);
  const now = new Date();
  let fmt = '';
  if (date.getFullYear() === now.getFullYear()) {
    fmt = 'MM월 dd일 HH시 mm분 ss초';
  } else {
    fmt = 'yyyy년 MM월 dd일 HH시 mm분 ss초';
  }

  const formattedStr = formatDateOrNull(date, fmt);
  if (formattedStr) {
    return [formattedStr, date];
  }
  return ['', date];
};

export type LogViewDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  msg?: string;
  logTimestamp: number;
};

export default function LogViewDialog(props: LogViewDialogProps) {
  const { open, onClose, title, msg, logTimestamp } = props;
  const [logDateStr, logDate] = formatEpochSeconds(logTimestamp);

  const [wide, setWide] = useState(() => !!msg && msg.length > 800);

  const handleCloseDialog = () => {
    onClose();
  };

  return (
    <CustomDialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleCloseDialog();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
      fullWidth
      maxWidth={wide ? 'md' : 'sm'}
      sx={rootSx}
      className="LogViewDialog-root"
    >
      <CustomDialogTitle onClose={handleCloseDialog} style={{ paddingLeft: 8 }}>
        <Stack direction="row" alignItems="center">
          <MdOrUp>
            {wide ? (
              <IconButton onClick={() => setWide(false)}>
                <FullscreenExitIcon />
              </IconButton>
            ) : (
              <IconButton onClick={() => setWide(true)}>
                <FullscreenIcon />
              </IconButton>
            )}
          </MdOrUp>
          <Box>
            <Typography variant="h5">로그 내용</Typography>
          </Box>
        </Stack>
      </CustomDialogTitle>

      <DialogContent dividers sx={{ wordBreak: 'break-all' }}>
        <Box className="LogViewDialog-dialogBody">
          <Stack direction="row" alignItems="center">
            {logDate && (
              <Typography variant="caption">
                <TimeAgo datetime={logDate} locale="ko" />
              </Typography>
            )}
            {logDateStr && <Typography ml={1}>{logDateStr}</Typography>}
          </Stack>

          <Stack direction="column" alignItems="flex-start" sx={{ mt: 3 }} spacing={2}>
            {title && (
              <Typography variant="subtitle2" className="LogViewDialog-title">
                {title}
              </Typography>
            )}

            {msg && <Typography className="LogViewDialog-msg">{msg}</Typography>}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCloseDialog}>
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
