import { flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { rootSx } from './style';

type Props = {
  sx?: SxProps;
  className?: string;
  title: string;
  children?: React.ReactNode;
  readOnly?: boolean;
  required?: boolean;
};

const CLDocLabelAny = React.forwardRef<HTMLDivElement, Props>((props, ref): JSX.Element | null => {
  const { sx, className, title, children, readOnly, required } = props;

  return (
    <Box
      className={clsx('CLDocLabelAny-root', className)}
      sx={flatSx(rootSx, sx)} //
      ref={ref}
    >
      <Box className="CLDocLabelAny-titleBox">
        <Typography fontSize="0.75rem">{title}</Typography>
        {required && <Typography ml={1}>*</Typography>}
      </Box>
      <Box
        className="CLDocLabelAny-children"
        sx={
          readOnly
            ? {
                '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' },

                '& .MuiInputBase-input': {
                  WebkitTextFillColor: '#666',
                },
              }
            : {}
        }
      >
        {children}
      </Box>
    </Box>
  );
});

CLDocLabelAny.displayName = 'CLDocLabelAny';
export default CLDocLabelAny;
