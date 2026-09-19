import { flatSx } from '@local/ui';
import type { SelectProps, SxProps } from '@mui/material';
import { Box, Select } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type Props = {
  children?: React.ReactNode;
  value?: string;
  readOnly?: boolean;
} & SelectProps;

const rootSx: SxProps = {
  '& .MuiInputBase-root': {
    fontSize: '0.7rem',
    borderRadius: 0,
    minWidth: '100%',
    '& .MuiInputBase-input': {
      p: 0.8,
      width: '100%',
      minWidth: 50,
    },
  },
  '& .MuiMenuItem-root': {
    fontSize: '0.75rem',
  },
};

export default function CLStyledSelect(props: Props) {
  const { sx, value, onChange, fullWidth = false, children, readOnly, className, ...rest } = props;

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLStyledSelect-root', className)}>
      <Select
        {...rest}
        size="small" //
        margin="none" //
        value={value}
        onChange={onChange}
        fullWidth={fullWidth} //
        disabled={readOnly}
        sx={
          readOnly
            ? {
                '& .MuiSelect-select': {
                  backgroundColor: '#f5f5f5',
                  WebkitTextFillColor: '#666',
                },
              }
            : {}
        }
      >
        {children}
      </Select>
    </Box>
  );
}
