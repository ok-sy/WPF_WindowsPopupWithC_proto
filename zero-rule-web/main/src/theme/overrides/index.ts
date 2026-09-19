import type { ThemeOptions } from '@mui/material';
import { MuiTableCell } from './MuiTableCell';
import { MuiTextField } from './MuiTextField';
import { MuiInputBase } from './MuiInputBase';

export const overrides: ThemeOptions['components'] = {
  MuiTableCell,
  MuiTextField,
  MuiInputBase,
};
