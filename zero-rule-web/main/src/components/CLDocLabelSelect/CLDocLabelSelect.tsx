import { flatSx } from '@local/ui';
import type { SelectProps } from '@mui/material';
import { Box, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import clsx from 'clsx';
import React, { useState } from 'react';
import { rootSx } from './style';

type Props = {
  title: string;
  arr?: string[];
  listFontSize?: string;
  readOnly?: boolean;
  children?: React.ReactNode;
  required?: boolean;
} & SelectProps;

const CLDocLabelSelect: React.FC<Props> = (props) => {
  const {
    arr,
    title,
    sx,
    className,
    readOnly,
    fullWidth = true,
    listFontSize = '0.75rem',
    children,
    required,
    ...rest
  } = props;

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLDocLabelSelect-root', className)}>
      <Box className="CLDocLabelSelect-titleBox">
        <Typography fontSize="0.75rem">{title}</Typography>
        {required && <Typography ml={1}>*</Typography>}
      </Box>
      <Box className="CLDocLabelSelect-input">
        <Select
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
          fullWidth={fullWidth}
          size="small"
          {...rest}
        >
          {children}
        </Select>
      </Box>
    </Box>
  );
};

CLDocLabelSelect.displayName = 'CLDocLabelSelect';
export default CLDocLabelSelect;
