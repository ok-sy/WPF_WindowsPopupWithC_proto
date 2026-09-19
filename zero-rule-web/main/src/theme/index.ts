import { koKR as coreLocale } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { koKR as dataGridLocale } from '@mui/x-data-grid/locales';
import { koKR as datePickerLocale } from '@mui/x-date-pickers/locales';
import { overrides } from './overrides';
import { palette } from './palette';
import { typography } from './typography';

// Create a theme instance.
const theme = createTheme(
  {
    palette,
    typography,
    components: {
      ...overrides,
    },
  },
  datePickerLocale,
  dataGridLocale,
  coreLocale,
);

export default theme;
