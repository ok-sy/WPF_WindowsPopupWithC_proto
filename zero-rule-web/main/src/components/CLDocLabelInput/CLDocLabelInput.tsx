import { flatSx } from '@local/ui';
import type { TextFieldProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import CLStyledTextField from '../CLStyledTextField';
import { rootSx } from './style';

type Props = {
  title: string;
  readOnly?: boolean;
  required?: boolean;
  valueType?: 'string' | 'number';
  maxLength?: number;
} & TextFieldProps;

const CLDocLabelInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    title,
    sx,
    className,
    readOnly,
    fullWidth = true,
    required,
    valueType = 'string',
    maxLength,
    ...restProps
  } = props;

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLDocLabelInput-root', className)}>
      <Box className="CLDocLabelInput-titleBox">
        <Typography fontSize="0.75rem">{title}</Typography>
        {required && <Typography ml={1}>*</Typography>}
      </Box>
      <Box className="CLDocLabelInput-inputBox">
        <CLStyledTextField
          {...restProps}
          ref={ref}
          fullWidth={fullWidth}
          readOnly={readOnly}
          valueType={valueType}
          maxLength={maxLength}
          sx={
            readOnly
              ? {
                  '& .MuiInputBase-root': {
                    backgroundColor: '#f5f5f5',
                    '& .MuiInputBase-input': {
                      WebkitTextFillColor: '#666',
                    },
                  },
                }
              : {}
          }
        />
      </Box>
    </Box>
  );
});

CLDocLabelInput.displayName = 'CLDocLabelInput';
export default CLDocLabelInput;
