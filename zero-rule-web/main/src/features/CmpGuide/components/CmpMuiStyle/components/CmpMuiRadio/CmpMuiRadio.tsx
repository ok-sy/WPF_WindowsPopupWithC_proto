import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { pink } from '@mui/material/colors';

const rootSx: SxProps<Theme> = {
  display: 'flex',
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 350,
  '& .CmpMuiRadio-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiRadio() {
  return (
    <Box sx={rootSx} className="CmpMuiRadio-root">
      <Box className="CmpMuiRadio-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 2 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            basic
          </Typography>
          <FormControl>
            <FormLabel>Gender</FormLabel>
            <RadioGroup defaultValue="female" name="radio-buttons-group">
              <FormControlLabel value="female" control={<Radio />} label="Female" />
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="other" control={<Radio />} label="Other" />
            </RadioGroup>
          </FormControl>
        </Stack>

        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 2 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Size
          </Typography>
          <Radio size="small" />
          <Radio />
          <Radio
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: 28,
              },
            }}
          />
        </Stack>

        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 2 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            color
          </Typography>
          <Radio />
          <Radio color="secondary" />
          <Radio color="success" />
          <Radio color="default" />
          <Radio
            sx={{
              color: pink[800],
              '&.Mui-checked': {
                color: pink[600],
              },
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
