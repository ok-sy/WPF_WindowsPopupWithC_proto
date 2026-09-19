import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { forwardRef, useState } from 'react';

type Props = Omit<TextFieldProps, 'type' | 'InputProps'>;

export const PasswordTextField = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const { ...rest } = props;

  return (
    <TextField
      ref={ref}
      type={visible ? 'text' : 'password'}
      {...rest}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                edge="end"
                onClick={() => {
                  setVisible((p) => !p);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                size="large"
              >
                {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
});

PasswordTextField.displayName = 'PasswordTextField';
