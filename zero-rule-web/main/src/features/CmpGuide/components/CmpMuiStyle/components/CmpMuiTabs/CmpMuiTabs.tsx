import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Tabs, Typography } from '@mui/material';
import Tab from '@mui/material/Tab';
import React from 'react';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  '& .CmpMuiTabs-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiTabs() {
  const [value, setValue] = React.useState('one');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={rootSx} className="CmpMuiTabs-root">
      <Box className="CmpMuiTabs-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 3 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Tabs
          </Typography>
          <Tabs value={value} onChange={handleChange} aria-label="wrapped label tabs example">
            <Tab value="one" label="Item one" />
            <Tab value="two" label="Item Two" />
            <Tab value="three" label="Item Three" />
          </Tabs>
        </Stack>
      </Box>
    </Box>
  );
}
