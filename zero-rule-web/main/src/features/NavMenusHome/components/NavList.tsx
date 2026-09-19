import type { NavEditDialogProps } from '@/dialogs/NavEditDialog';
import NavEditDialog from '@/dialogs/NavEditDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLNav } from '@local/domain';
import { PortletContent, PortletHeader, TitleWithReloadButton } from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  SxProps,
  Theme,
  Tooltip,
} from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  onSelectNav: (selectedNavId: number) => void;
};

type DialogId = 'NavEditDialog';
export default function NavList(props: Props) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [navList, setNavList] = useState<CLNav[]>();
  const [refreshToken, setRefreshToken] = useState(0);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [navEditDialogProps, setNavEditDialogProps] = useState<NavEditDialogProps>();
  const [selectedNavId, setSelectedNavId] = useState(1);

  const onSelectNavRef = useRef<Props['onSelectNav']>();
  onSelectNavRef.current = props.onSelectNav;

  useEffect(() => {
    onSelectNavRef.current?.(selectedNavId);
  }, [selectedNavId]);

  const closeDialog = () => {
    setDialogId(undefined);
    setNavEditDialogProps(undefined);
    setRefreshToken(Date.now());
  };

  const handleClickInsertDialog = (navData?: CLNav) => {
    setDialogId('NavEditDialog');
    setNavEditDialogProps({
      open: true,
      onClose: closeDialog,
      navData,
    });
  };

  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clNav.navList({ ctx });
        const { navList } = body;
        if (ctx.canceled) return;
        setNavList(navList);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, refreshToken]);

  return (
    <>
      <PortletHeader
        sx={{
          '& .MuiTypography-root': {
            color: 'GrayText',
            fontSize: '0.85rem',
            fontWeight: 400,
          },
        }}
      >
        <TitleWithReloadButton
          onClickRefresh={() => setRefreshToken(Date.now())}
          title="Nav 목록"
        />
        <Button
          onClick={() => handleClickInsertDialog()}
          startIcon={<AddCircleOutlineIcon />}
          variant="outlined"
          size="small"
        >
          신규
        </Button>
      </PortletHeader>
      <PortletContent sx={{ overflow: 'auto' }} noPadding>
        <Box
          sx={{
            overflow: 'auto',
          }}
          className="NavList-root"
        >
          <List sx={{ py: 0, width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {navList?.map((el) => (
              <ListItem
                secondaryAction={
                  <Tooltip arrow title="정보">
                    <IconButton onClick={(_) => handleClickInsertDialog(el)} edge="end">
                      <InfoOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                }
                key={el.navId}
                disablePadding
              >
                <ListItemButton
                  selected={el.navId === selectedNavId}
                  onClick={() => {
                    setSelectedNavId(el.navId);
                  }}
                >
                  <ListItemIcon>
                    <FolderOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={el.navNm} />
                </ListItemButton>
              </ListItem>
            ))}
            {loading && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 30 }}>
                <LinearProgress />
              </div>
            )}
          </List>
          {dialogId === 'NavEditDialog' && navEditDialogProps && (
            <NavEditDialog {...navEditDialogProps} />
          )}
        </Box>
      </PortletContent>
    </>
  );
}
