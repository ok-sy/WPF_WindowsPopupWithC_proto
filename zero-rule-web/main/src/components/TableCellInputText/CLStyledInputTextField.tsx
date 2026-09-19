import { flatSx } from '@local/ui';
import type { TableCellProps, TextFieldProps } from '@mui/material';
import { TableCell, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React from 'react';

const StyledTextField = withStyles({
  root: {
    '& .MuiOutlinedInput-root': {
      border: 'none',
      margin: 0,
      padding: 0,
      textAlign: 'right',
      fontSize: '0.75rem',
    },
    '& .MuiOutlinedInput-input': {
      padding: '0px !important', // Input padding 설정
      margin: 0,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  },
})(TextField);

type CLTextProps = {
  fullWidth?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'number'; // 추가된 type 속성
} & TextFieldProps;
export const CLStyledInputTextField = React.forwardRef<HTMLInputElement, CLTextProps>(
  (props: CLTextProps, ref) => {
    const {
      sx,
      fullWidth = false,
      readOnly,
      size = 'small',
      className,
      type = 'text',
      ...rest
    } = props;

    const inputStyle = type === 'number' ? { direction: 'rtl' } : {};
    return (
      <StyledTextField
        className={clsx('CLStyledTextField-root', className)}
        ref={ref}
        {...rest}
        size={size}
        margin="none" //
        fullWidth={fullWidth} //
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
          inputStyle,
          sx,
        )}
      />
    );
  },
);

CLStyledInputTextField.displayName = 'CLStyledInputTextField';

type CLCellProps = {} & TableCellProps;

export const CLStyledInputTableCell = styled(TableCell)<CLCellProps>(({ ...rest }) => {
  return {
    root: {
      padding: 0,
      margin: 0,
    },
  };
});

CLStyledInputTableCell.displayName = 'CLStyledInputTableCell';
