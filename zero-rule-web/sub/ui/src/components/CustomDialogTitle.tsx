import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, SxProps, Typography } from '@mui/material';
import clsx from 'clsx';
import * as React from 'react';
import { flatSx } from '../lib/sx-props';

type Props = {
  sx?: SxProps;
  style?: React.CSSProperties;
  title?: React.ReactNode;
  onClose?: () => void;
  size?: 'small' | 'medium';
  children?: React.ReactNode;
};

export const CustomDialogTitle = React.forwardRef<HTMLElement, Props>(
  (props: Props, ref): JSX.Element => {
    const { sx, title, style, size = 'medium', onClose, children } = props;

    return (
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        className={clsx('CustomDialogTitle-root', {
          'CustomDialogTitle-medium': size === 'medium',
          'CustomDialogTitle-small': size === 'small',
        })}
        style={style}
        sx={flatSx(
          {
            pr: 1,
            pl: {
              xs: 2,
              md: 3,
            },
            '&.CustomDialogTitle-medium': {
              minHeight: 52,
            },
            '&.CustomDialogTitle-small': {
              minHeight: 48,
            },
          },
          sx,
        )}
      >
        <Box display="flex" alignItems="center">
          {title &&
            (typeof title === 'string' ? (
              <Typography variant={size === 'small' ? 'h6' : 'h5'}>{title}</Typography>
            ) : (
              title
            ))}
          {children}
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size={size} sx={{ ml: 3 }} color="inherit">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  },
);

CustomDialogTitle.displayName = 'CustomDialogTitle';
