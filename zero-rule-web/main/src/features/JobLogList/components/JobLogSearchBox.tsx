import DatePickerForm from '@/components/DatePickerForm';
import type { CLLogLevelKey } from '@local/domain';
import { CLLogLevel } from '@local/domain';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';

type Props = {
  logLevels: CLLogLevelKey[];
  totalElements: number;
  logDate?: Date;
  loading: boolean;
  onCheckBoxChange: (logLevel: CLLogLevelKey, checked: boolean) => void;
  onDateChange: (pickedDate: Date | null) => void;
  onClick: () => void;
};

export default function JobLogSearchBox(props: Props) {
  const { logLevels, onCheckBoxChange, logDate, onDateChange, loading, onClick, totalElements } =
    props;

  return (
    <Box mb={1} className="JobLogSearchBox-root">
      <Paper sx={{ position: 'relative' }} variant="outlined">
        <Box sx={{ p: 2 }} display="flex" justifyContent="flex-start" alignItems="center">
          <FormControl>
            <FormGroup row>
              {Object.entries(CLLogLevel).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={logLevels.indexOf(key as CLLogLevelKey) >= 0}
                      onChange={(e, checked) => onCheckBoxChange(key as CLLogLevelKey, checked)}
                      value={key}
                    />
                  }
                  label={label}
                />
              ))}
            </FormGroup>
          </FormControl>
          <DatePickerForm
            selectDate={logDate}
            onDateChange={onDateChange}
            label="로그 일자"
            toolbarTitle="로그 일자"
          />
          <Box sx={{ ml: 2 }}>
            {!loading && (
              <Button variant="contained" color="primary" onClick={onClick}>
                검색
              </Button>
            )}
          </Box>
        </Box>
        {loading && (
          <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }}>
            <LinearProgress />
          </Box>
        )}
      </Paper>
      <Box mt={1}>
        <Typography variant="caption">전체 {totalElements}건</Typography>
      </Box>
    </Box>
  );
}
