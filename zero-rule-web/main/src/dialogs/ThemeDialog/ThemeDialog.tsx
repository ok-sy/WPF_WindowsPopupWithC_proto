import useCustomTheme, { DEFAULT_CUSTOM_PALETTE } from '@/hooks/useCustomTheme';
import { switchingPalettes } from '@/lib/switching-palettes';
import { CustomDialogTitle, CustomDragableDialog, flatSx } from '@local/ui';
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { PaletteColor } from '@mui/material';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';
import { rootSx } from './style';

export type ThemeDialogProps = {
  className?: string;
  open: boolean;
  onClose: () => void;
};

export default function ThemeDialog(props: ThemeDialogProps) {
  const { open, onClose, className } = props;
  const [palettes, setPalettes] = useState<PaletteColor[]>(switchingPalettes);
  const [customTheme, setCustomPalette] = useCustomTheme();

  const clickColor = customTheme.palette.primary;
  const handleCloseDialog = () => {
    onClose();
  };
  const handleClickColor = (_: React.MouseEvent<HTMLDivElement>, el: PaletteColor) => {
    setCustomPalette(el);
  };
  const defaultColorHandle = () => {
    setCustomPalette(DEFAULT_CUSTOM_PALETTE);
  };

  return (
    <CustomDragableDialog
      backLightOn
      className={clsx('ThemeDialog-root', className)}
      sx={flatSx(rootSx)}
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
    >
      <CustomDialogTitle title="테마 색상 변경" onClose={handleCloseDialog}>
        <Tooltip onClick={defaultColorHandle} sx={{ ml: 1 }} title="기본 색상으로 변경">
          <IconButton>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </CustomDialogTitle>
      <DialogContent dividers sx={{ backgroundColor: '#e7ebf0' }}>
        <Stack direction="row">
          <Box className="ThemeDialog-myBoxs">
            {palettes.map((el) => (
              <Box
                key={el.main}
                onClick={(e) => handleClickColor(e, el)}
                className="ThemeDialog-myBox"
                sx={{
                  backgroundColor: el.main,
                  fontSize: '4rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {el.main === clickColor.main && (
                  <CheckIcon sx={{ color: '#fff', width: '80%', height: '80%' }} />
                )}
              </Box>
            ))}
          </Box>
          <Stack sx={{ flex: 1 }}>
            <Stack
              className="ThemeDialog-mainColor"
              sx={{
                backgroundColor: clickColor.main,
              }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: '#fff' }} variant="subtitle1">
                  Main Color
                </Typography>
                <Typography sx={{ color: '#fff' }} variant="subtitle1">
                  {clickColor.main + ''}
                </Typography>
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconButton size="large" sx={{ py: 1, backgroundColor: '#fff' }}>
                  <Typography variant="h4">P</Typography>
                </IconButton>
              </Box>
            </Stack>
            <Stack sx={{ flex: 1 }} direction="row">
              <Box className="ThemeDialog-dark" sx={{ backgroundColor: clickColor.dark }}>
                <Typography sx={{ color: '#fff' }} variant="subtitle1">
                  Dark{' '}
                </Typography>
              </Box>
              <Box className="ThemeDialog-light" sx={{ backgroundColor: clickColor.light }}>
                <Typography sx={{ color: '#fff' }} variant="subtitle1">
                  White
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
        <Stack sx={{ mt: 3, width: '100%' }} alignItems="center">
          <Box sx={{ width: '60%' }}>
            <Box sx={{ transition: '0.5s', height: 20, backgroundColor: clickColor.dark }} />
            <Box className="ThemeDialog-topbar" sx={{ backgroundColor: clickColor.main }}>
              <IconButton sx={{ color: '#fff' }}>
                <MenuIcon />
              </IconButton>
              <Typography sx={{ ml: 2 }} variant="h5">
                Color
              </Typography>
            </Box>
            <Box sx={{ backgroundColor: '#fff', height: 135 }}></Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>닫기</Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
