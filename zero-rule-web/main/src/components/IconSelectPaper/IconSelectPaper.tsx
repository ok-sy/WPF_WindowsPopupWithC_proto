import type * as icons from '@mui/icons-material';
import type { SxProps } from '@mui/material';
import { Box, Button, IconButton, Paper, Typography, Stack, alpha, Popover } from '@mui/material';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { StringToMuiIcon } from '../StringToMuiIcon/StringToMuiIcon';
import { DEFAULT_ICON_LIST } from './icon-collection';
import ClearIcon from '@mui/icons-material/Clear';
import { flatSx } from '@local/ui';
import { paperProps, rootSx } from './style';

/**
 * @Author jinwoo
 * 아이콘을 선택할수 있는 UI 컴포넌트 입니다.
 * icon-collection에 아이콘 이름을 넣어 아이콘을 추가할 수 있습니다.
 * 다이얼로그안에서 띄울시 다이얼로그 paper의 position속성을 제거해줘야 z-index 최상위로 올라갑니다.
 */
type IconNames = keyof typeof icons;
type Props = {
  sx?: SxProps;
  className?: string;
  iconValue?: string;
  onSubmitIcon: (selectedIcon?: string) => void;
  buttonTitle: string;
};

export function IconSelectPaper(props: Props) {
  const { sx, className, onSubmitIcon, iconValue, buttonTitle } = props;
  // const [selectedIcon, setSelectedIcon] = useState<IconNames>()

  const [popOver, setPopOver] = useState<HTMLButtonElement | null>(null);
  const handleClickPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOver(event.currentTarget);
  };
  const handleClosePopover = () => {
    setPopOver(null);
  };
  const open = Boolean(popOver);
  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('IconSelectPaper-root', className)}>
      <Box>
        <Button
          sx={{
            borderRadius: 0,
            minHeight: 40,
            borderRight: 0,
          }}
          onClick={handleClickPopover}
          variant="outlined"
        >
          {buttonTitle}
        </Button>
        <Popover
          open={open}
          anchorEl={popOver}
          onClose={handleClosePopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={paperProps}
        >
          {DEFAULT_ICON_LIST.map((el) => (
            <IconButton
              onClick={(_) => {
                onSubmitIcon(el);
                handleClosePopover();
              }}
              key={el}
              color="default"
              sx={{ minWidth: 40, maxWidth: 40 }}
            >
              <StringToMuiIcon iconName={el} />
            </IconButton>
          ))}
        </Popover>
      </Box>
      <Stack
        sx={{
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          maxHeight: 40,
          height: 40,
        }}
        flex={1}
        pl={2}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {!iconValue ? (
          <Typography color="GrayText">아이콘 없음</Typography>
        ) : (
          <Typography color="GrayText" variant="body2">
            <StringToMuiIcon iconName={iconValue} />
          </Typography>
        )}
        {iconValue && (
          <IconButton onClick={() => onSubmitIcon(undefined)}>
            <ClearIcon />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
}
