import { flatSx } from '@local/ui';
import type { SelectProps } from '@mui/material';
import { OutlinedInput, Select } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React from 'react';

const StyledSelect = withStyles({
  root: {
    '& .MuiOutlinedInput-root': {
      border: 'none',
      margin: 0,
      padding: 0,
    },
    '& .MuiOutlinedInput-input': {
      padding: '0px !important', // Input padding 설정
      margin: 0,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '& .MuiSelect-icon': {
      right: '-4px', // 아이콘을 오른쪽으로 이동
    },
  },
})(Select);

type CLSelectProps = {
  fullWidth?: boolean;
  readOnly?: boolean;
} & SelectProps;

export const CLStyleInputSelect = React.forwardRef<HTMLDivElement, CLSelectProps>(
  (props: CLSelectProps, ref) => {
    const { sx, fullWidth = false, readOnly, className, ...rest } = props;

    return (
      <StyledSelect
        className={clsx('CLStyleInputSelect-root', className)}
        ref={ref}
        {...rest}
        displayEmpty
        // input={<OutlinedInput label="sad" />}
        fullWidth={fullWidth}
        disabled={readOnly}
        sx={flatSx(
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
              },
          { fontSize: '0.75rem' },
          sx,
        )}
      />
    );
  },
);

CLStyleInputSelect.displayName = 'CLStyleInputSelect';
