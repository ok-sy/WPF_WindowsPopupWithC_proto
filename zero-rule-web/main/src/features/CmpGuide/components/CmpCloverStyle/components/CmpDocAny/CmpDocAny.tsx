import { Box, Checkbox, MenuItem, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { rootSx } from './style';
import CLStyledSelect from '@/components/CLStyledSelect';
import CLStyledTextField from '@/components/CLStyledTextField';
import CLDocLabelAny from '@/components/CLDocLabelAny';
import CLStyledFormControlLabel from '@/components/CLStyledFormControlLabel';
type AnySelectSample = 'test1' | 'test2' | 'test3';

export default function CmpDocAny() {
  const [anySelectSample, setAnySelectSample] = useState<AnySelectSample>('test1');
  return (
    <Box sx={rootSx} className="CmpDocAny-root">
      <Box className="CmpDocAny-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Radio
          </Typography>
          <CLDocLabelAny title="CLDocLabelAny">
            <RadioGroup>
              <CLStyledFormControlLabel value="1" control={<Radio />} label="Radio1" />
              <CLStyledFormControlLabel value="2" control={<Radio />} label="Radio2" />
              <CLStyledFormControlLabel value="3" control={<Radio />} label="Radio3" />
            </RadioGroup>
          </CLDocLabelAny>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            any
          </Typography>
          <CLDocLabelAny title="CLDocLabelAny">
            <Stack spacing={1}>
              <CLStyledTextField size="small" />
              <CLStyledSelect
                sx={{ ml: 1 }}
                size="small"
                value={anySelectSample}
                onChange={(e) => {
                  setAnySelectSample(e.target.value as AnySelectSample);
                }}
              >
                <MenuItem value="test1">test1</MenuItem>
                <MenuItem value="test2">test2</MenuItem>
                <MenuItem value="test3">test3</MenuItem>
              </CLStyledSelect>
            </Stack>
          </CLDocLabelAny>
        </Stack>
      </Box>
      <Box className="CmpDocAny-container" sx={{ ml: 5 }}>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Check Box
          </Typography>
          <CLDocLabelAny title="CLDocLabelAny">
            <CLStyledFormControlLabel control={<Checkbox />} label="Checkbox1" />
            <CLStyledFormControlLabel control={<Checkbox />} label="Checkbox2" />
            <CLStyledFormControlLabel control={<Checkbox />} label="Checkbox3" />
          </CLDocLabelAny>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Input Group
          </Typography>
          <CLDocLabelAny title="CLDocLabelAny">
            <CLStyledTextField size="small" />
            <CLStyledTextField size="small" />
            <CLStyledTextField size="small" />
          </CLDocLabelAny>
        </Stack>
      </Box>
    </Box>
  );
}
