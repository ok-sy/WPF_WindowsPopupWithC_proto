import { flatSx } from '@local/ui';
import type { CheckboxProps } from '@mui/material';
import { Checkbox } from '@mui/material';
import type { SxProps } from '@mui/material';
import { Box, TextField, TextFieldProps } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type Props = {} & CheckboxProps;

const rootSx: SxProps = {
  '& .MuiButtonBase-root': {
    // ml: 1,
    width: 15,
    height: 15,
  },
};

export default function CLStyledTableCheckBox(props: Props) {
  const { sx, className, ...rest } = props;

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLStyledTableCheckBox-root', className)}>
      <Checkbox
        {...rest}
        size="small" //
      />
    </Box>
  );
}
