import { Box, SxProps } from '@mui/material';
import React, { HTMLAttributes } from 'react';

type Props = {
  sx?: SxProps;
  noDivider?: boolean;
  noPadding?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export const PortletHeader = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { children, noDivider, className, noPadding = false, sx, ...rest } = props;

  return (
    <Box
      {...rest}
      className={className ? `PortletHeader-root ${className}` : 'PortletHeader-root'}
      ref={ref}
      sx={[
        {
          position: 'relative',
          alignItems: 'center',
          borderBottom: noDivider ? 'none' : '1px solid #E0E4EE',
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          height: 56,
          minHeight: 56,
          display: 'flex',
          justifyContent: 'space-between',
          pl: noPadding ? 0 : 3,
          pr: noPadding ? 0 : 1,
        },
        ...(Array.isArray(sx) ? sx : [sx ?? false]),
      ]}
    >
      {children}
    </Box>
  );
});

PortletHeader.displayName = 'PortletHeader';
