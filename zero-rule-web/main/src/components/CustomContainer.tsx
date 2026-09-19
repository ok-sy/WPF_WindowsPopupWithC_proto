import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type Props = {
  sx?: SxProps;
  className?: string;
  children?: React.ReactNode;
};

export default function CustomContainer(props: Props) {
  const { sx, className, children } = props;
  return (
    <Box className={clsx('CustomContainer-root', className)} sx={sx}>
      {children}
    </Box>
  );
}
