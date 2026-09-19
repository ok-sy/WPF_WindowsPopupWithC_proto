import { flatSx } from '@local/ui';
import type { TextFieldProps } from '@mui/material';
import { Box, SxProps, TextField } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type Props = {
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  valueType?: 'string' | 'number';
  maxLength?: number;
  nospace?: boolean;
} & TextFieldProps;

const TypeTextField = React.forwardRef<HTMLInputElement, Props>((props: Props, ref) => {
  const {
    sx,
    readOnly,
    className,
    onChange,
    valueType = 'string',
    maxLength,
    nospace,
    ...rest
  } = props;

  const handlingOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 이것저것
    if (!onChange) return;
    if (valueType === 'string') {
      e.target.value;
      if (nospace) {
        e.target.value = e.target.value.replace(/\s/g, ''); // 공백 제거
      }
      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.substring(0, maxLength);
      }
      onChange({ ...e, target: { ...e.target, value: e.target.value } });
    } else if (valueType === 'number') {
      e.target.value = e.target.value.replace(/\D/g, '');

      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.substring(0, maxLength);
      }
      onChange({ ...e, target: { ...e.target, value: e.target.value } });
    }
  };

  return (
    <TextField
      ref={ref}
      {...rest}
      margin="none" //
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
  );
});

TypeTextField.displayName = 'TypeTextField';

export default TypeTextField;
