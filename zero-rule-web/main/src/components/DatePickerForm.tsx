import ClearIcon from '@mui/icons-material/Clear';
import { Box, FormControl, Stack, Tooltip } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

type Props = {
  selectDate?: Date | undefined;
  onDateChange: (pickedDate: Date | null) => void;
  label?: string;
  toolbarTitle?: string;
  textFieldSize?: string;
  toolTipTitle?: string;
};

export default function DatePickerForm(props: Props) {
  const { selectDate, onDateChange, label, toolbarTitle, toolTipTitle = '초기화' } = props;
  return (
    <Stack direction="row" alignItems="flex-end">
      <FormControl>
        <Box>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={label ?? ''}
              format="yyyy/MM/dd"
              value={selectDate ?? null}
              // toolbarTitle={toolbarTitle ?? ''}
              onChange={onDateChange}
              closeOnSelect
              // showToolbar
            />
          </LocalizationProvider>
        </Box>
      </FormControl>
      {selectDate && (
        <Box>
          <Tooltip title={toolTipTitle}>
            <ClearIcon
              fontSize="small"
              sx={{
                ml: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  color: '#F24C4C',
                },
              }}
              onClick={() => onDateChange(null)}
            />
          </Tooltip>
        </Box>
      )}
    </Stack>
  );
}
