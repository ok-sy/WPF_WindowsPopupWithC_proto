import { flatSx } from '@local/ui';
import type { SxProps, TextFieldProps } from '@mui/material';
import { Box, TextField } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type Props = {
  fullWidth?: boolean;
  readOnly?: boolean;
  radius?: boolean;
  size?: 'small' | 'medium' | 'large';
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  valueType?: 'string' | 'number';
  maxLength?: number;
} & TextFieldProps;

const rootSx: SxProps = {};

const CLStyledTextField = React.forwardRef<HTMLInputElement, Props>((props: Props, ref) => {
  const {
    sx,
    fullWidth = false,
    readOnly,
    size = 'small',
    className,
    radius = false,
    onChange,
    valueType = 'string',
    maxLength,
    ...rest
  } = props;

  const handlingOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 이것저것
    if (!onChange) return;
    if (valueType === 'string') {
      e.target.value;
      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.slice(0, maxLength);
      }
      onChange({ ...e, target: { ...e.target, value: e.target.value } });
    } else if (valueType === 'number') {
      e.target.value = e.target.value.replace(/\D/g, '');

      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.slice(0, maxLength);
      }
      onChange({ ...e, target: { ...e.target, value: e.target.value } });
    }
  };

  // const changeSize = size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large'
  return (
    <Box
      sx={flatSx(
        size === 'small'
          ? {
              '& .MuiInputBase-root': {
                fontSize: '0.7rem',
                '& .MuiInputBase-input': {
                  p: 0.8,
                },
              },
              '& .MuiInputBase-multiline': {
                p: 0,
                '& .MuiInputBase-input': {
                  p: 0.8,
                },
              },
            }
          : {},
        radius
          ? { '& .MuiInputBase-root': { borderRadius: '0.2rem' } }
          : { '& .MuiInputBase-root': { borderRadius: 0 } },
        rootSx,
        sx,
      )}
      className={clsx('CLStyledTextField-root', className)}
    >
      <TextField
        ref={ref}
        {...rest}
        size={size}
        margin="none" //
        fullWidth={fullWidth} //
        disabled={readOnly}
        onChange={handlingOnChange}
        sx={
          readOnly
            ? {
                '& .MuiInputBase-formControl': {
                  pr: 0,
                },
                '& .MuiInputBase-root': {
                  backgroundColor: '#f5f5f5',
                  '& .MuiInputBase-input': {
                    WebkitTextFillColor: '#666',
                  },
                },
              }
            : {
                '& .MuiInputBase-formControl': {},
              }
        }
      />
    </Box>
  );
});

CLStyledTextField.displayName = 'CLStyledTextField';

export default CLStyledTextField;
