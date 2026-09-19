import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import CLDocLabelInput from '@/components/CLDocLabelInput';

export default function CmpDocInput() {
  return (
    <Box sx={rootSx} className="CmpDocInput-root">
      <Box className="CmpDocInput-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            inputBox
          </Typography>
          <CLDocLabelInput title="CLDocLabelInput" />
          <CLDocLabelInput
            title="CLDocLabelInput"
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'pink' },
            }}
          />
          <CLDocLabelInput title="CLDocLabelInput" multiline minRows={4} maxRows={4} />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Title
          </Typography>
          <CLDocLabelInput title="" />
          <CLDocLabelInput
            title=""
            sx={{
              '& .CLDocLabelInput-titleBox': { backgroundColor: 'pink' },
            }}
          />
          <CLDocLabelInput title="" multiline minRows={4} maxRows={4} />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            FullWidth
          </Typography>
          <Stack width={'100%'}>
            <CLDocLabelInput fullWidth title="FullWidth" />
            <CLDocLabelInput
              fullWidth
              title="FullWidth"
              sx={{
                '& .CLDocLabelInput-titleBox': { backgroundColor: 'pink' },
              }}
            />
            <CLDocLabelInput title="FullWidth" fullWidth multiline minRows={4} maxRows={4} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
