import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import { mainLayoutConstants } from '@/lib/main-layout-constants';
import { flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import clsx from 'clsx';
import * as React from 'react';

const { sidemenu } = mainLayoutConstants;

type Props = {
  sx?: SxProps;
  className?: string;
  icon?: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  depth1?: boolean;
};

export default function SideMenuItem(props: Props) {
  const { sx, className, icon, title, active, onClick, depth1 } = props;

  return (
    <ListItemButton
      onClick={onClick}
      className={clsx('SideMenuItem-root', className, {
        'Mui-active': active,
      })}
      sx={flatSx(
        {
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
          },

          // 제목 부분
          '& .SideMenuItem-title': {
            fontWeight: 400,
            fontSize: sidemenu.fontSize,
            color: sidemenu.fgColor,
          },

          // 아이콘 부분
          '& .MuiListItemIcon-root': {
            color: sidemenu.fgColor,
          },

          '&.Mui-active': {
            color: (theme) => theme.palette.primary.dark,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.3),
            },

            // 제목 부분
            '& .SideMenuItem-title': {
              color: (theme) => theme.palette.primary.dark,
            },

            // 아이콘 부분
            '& .MuiListItemIcon-root': {
              color: (theme) => sidemenu.sectionSelectColor,
            },
          },
        },
        sx,
      )}
    >
      <>
        {icon && (
          <ListItemIcon>
            <StringToMuiIcon iconName={icon + ''} />
          </ListItemIcon>
        )}
        <ListItemText inset={depth1 && !icon} className="SideMenuItem-title">
          {title}
        </ListItemText>
      </>
    </ListItemButton>
  );
}
