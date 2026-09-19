import { flatSx } from '@local/ui';
import type { FormControlLabelProps, SxProps } from '@mui/material';
import { Box, FormControlLabel } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type Props = {
  label: string;
  readOnly?: boolean;
} & FormControlLabelProps;

const rootSx: SxProps = {
  '& .MuiFormControlLabel-root': {
    ml: '-10px',
  },
  '& .MuiFormControlLabel-label': {
    fontSize: '0.8rem',
    ml: '-5px',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '0.9rem',
  },
};

const CLStyledFormControlLabel = React.forwardRef<HTMLInputElement, Props>((props: Props, ref) => {
  const { sx, readOnly, control, label, className, ...rest } = props;

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLStyledFormControlLabel-root', className)}>
      <FormControlLabel
        ref={ref}
        {...rest}
        disabled={readOnly}
        sx={
          readOnly
            ? {
                '& .MuiInputBase-root': {
                  backgroundColor: '#eee',
                  '& .MuiInputBase-input': {
                    WebkitTextFillColor: '#666',
                  },
                },
              }
            : {}
        }
        control={control}
        label={label}
      />
    </Box>
  );
});

CLStyledFormControlLabel.displayName = 'CLStyledFormControlLabel';

export default CLStyledFormControlLabel;
