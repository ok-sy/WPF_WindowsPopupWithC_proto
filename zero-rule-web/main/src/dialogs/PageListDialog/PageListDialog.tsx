import { useLoginProfile } from '@/auth/useLoginProfile';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import { CustomDialog, CustomDialogTitle, TitleWithReloadButton } from '@local/ui';
import { Button, DialogActions, DialogContent, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDebounce } from 'react-use';
import MenuList from './components/MenuList';

export type PageListDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function PageListDialog(props: PageListDialogProps) {
  const { open, onClose } = props;
  const { sceneManager } = useMainLayoutContext();
  const nav = sceneManager.nav.getMenuManager().menuItems;
  const loginProfile = useLoginProfile();
  // 검색 디바운스
  const [keyword, setKeyword] = useState<string>();
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>();
  useDebounce(() => setDebouncedKeyword(keyword), 300, [keyword]);
  const handleChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value ?? '';
    setKeyword(keyword);
  };

  const handleCloseDialog = () => {
    onClose();
  };

  const routeByPageKey = (pageKey: string) => {
    const success = sceneManager.routeByPageKey(pageKey);
    if (success) {
      handleCloseDialog();
    }
  };

  const handleClickPageKey = (pageKey: string) => {
    routeByPageKey(pageKey);
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
      maxWidth="md"
      className="PageListDialog-root"
    >
      <CustomDialogTitle
        sx={{ whiteSpace: 'nowrap' }}
        title="페이지 목록"
        onClose={handleCloseDialog}
      >
        <TextField
          sx={{ m: 1.5 }}
          onChange={handleChangeKeyword}
          fullWidth
          size="small"
          label="검색"
          placeholder="메뉴 이름으로 검색"
        />
      </CustomDialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" component="div">
          ※ 이 팝업은 ALT+SHIFT+L 단축키에 연결되어 있습니다
        </Typography>

        <MenuList
          searchKeyword={debouncedKeyword}
          navId={Number(loginProfile?.profile.navId)}
          onClickPageKey={handleClickPageKey}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
