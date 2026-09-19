import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import BbsClipboardButton from '@/components/BbsClipboardButton';
export default function CmpAdressCopy() {
  return (
    <Box sx={rootSx} className="CmpAdressCopy-root">
      <Box className="CmpAdressCopy-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            OutLined
          </Typography>
          <BbsClipboardButton textProviderFunc={() => 'outlined 주소복사'} />
          <BbsClipboardButton color="error" textProviderFunc={() => 'outlined 주소복사'} />
          <BbsClipboardButton color="success" textProviderFunc={() => 'outlined 주소복사'} />
          <BbsClipboardButton color="warning" textProviderFunc={() => 'outlined 주소복사'} />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Text
          </Typography>
          <BbsClipboardButton variant="text" textProviderFunc={() => 'text 주소복사'} />
          <BbsClipboardButton
            color="success"
            variant="text"
            textProviderFunc={() => 'text 주소복사'}
          />

          <BbsClipboardButton
            color="error"
            variant="text"
            textProviderFunc={() => 'text 주소복사'}
          />
          <BbsClipboardButton
            color="warning"
            variant="text"
            textProviderFunc={() => 'text 주소복사'}
          />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Contained
          </Typography>
          <BbsClipboardButton variant="contained" textProviderFunc={() => 'contained 주소복사'} />

          <BbsClipboardButton
            color="error"
            variant="contained"
            textProviderFunc={() => 'contained 주소복사'}
          />

          <BbsClipboardButton
            color="success"
            variant="contained"
            textProviderFunc={() => 'contained 주소복사'}
          />

          <BbsClipboardButton
            color="warning"
            variant="contained"
            textProviderFunc={() => 'contained 주소복사'}
          />
        </Stack>
      </Box>
    </Box>
  );
}
