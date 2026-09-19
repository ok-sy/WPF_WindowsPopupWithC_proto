import { flatSx } from '@local/ui';
import type { TextFieldProps } from '@mui/material';
import { Box } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import clsx from 'clsx';
import React, { useState } from 'react';
import { popperProps, rootSx } from './style';

type Props = {
  readonly?: boolean;
  fulllWidth?: boolean;
  newDateSubmit: (date: Date) => void;
} & TextFieldProps;

const CLDocDatePicker = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    newDateSubmit,
    sx,
    className,
    disabled,
    fullWidth = false,
    readonly,
    ...restProps
  } = props;

  const initialDate = new Date();
  const [date, setDate] = useState<Date>(initialDate);

  return (
    <Box sx={flatSx(rootSx, sx)} className={clsx('CLDocDatePicker-root', className)}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DesktopDatePicker
          readOnly={readonly}
          slotProps={{
            popper: popperProps,
          }}
          className="CLDocDatePicker-picker"
          value={date}
          onChange={(newValue) => {
            if (newValue) setDate(newValue);
            newDateSubmit(date);
          }}
        />
      </LocalizationProvider>
    </Box>
  );
});

CLDocDatePicker.displayName = 'CLDocDatePicker';
export default CLDocDatePicker;
