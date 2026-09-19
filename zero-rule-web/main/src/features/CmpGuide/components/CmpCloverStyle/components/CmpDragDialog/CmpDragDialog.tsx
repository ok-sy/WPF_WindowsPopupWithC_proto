import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import { Box, Button, DialogContent, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { rootSx } from './style';

type DialogId = 'DragDialog';

export default function CmpDragDialog() {
  const [dialogId, setDialogId] = useState<DialogId>();
  const [dragDialogProps, setDragDialogProps] = useState<DragDialogProps>();

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setDialogId(undefined);
    setDragDialogProps(undefined);
  };

  // 다이얼로그 열기
  const openDialog = () => {
    setDialogId('DragDialog');
    setDragDialogProps({
      open: true,
      onClose: handleCloseDialog,
    });
  };
  return (
    <Box sx={rootSx} className="CmpDragDialog-root">
      <Box className="CmpDragDialog-container">
        <Stack spacing={1} direction="row" alignItems="center" sx={{ ml: 3, my: 3.3 }}>
          <Button variant="contained" onClick={openDialog}>
            Open Dialog
          </Button>
        </Stack>
      </Box>
      {dialogId === 'DragDialog' && dragDialogProps && <DragDialog {...dragDialogProps} />}
    </Box>
  );
}

type DragDialogProps = {
  open: boolean;
  onClose: () => void;
};

function DragDialog(props: DragDialogProps) {
  const { onClose, open } = props;
  return (
    <CustomDragableDialog disableEscapeKeyDown open={open} onClose={onClose}>
      <CustomDialogTitle title="다이얼로그" onClose={onClose} />
      <DialogContent dividers>
        <Typography variant="h4">상단 부분을 잡고 드래그를 해보세요</Typography>
      </DialogContent>
    </CustomDragableDialog>
  );
}
