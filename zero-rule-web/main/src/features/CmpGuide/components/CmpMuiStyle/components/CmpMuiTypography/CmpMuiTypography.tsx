import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  justifyContent: 'space-around',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  display: 'flex',
  minHeight: 466,
  '& .CmpMuiTypography-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiTypography() {
  return (
    <Box sx={rootSx} className="CmpMuiTypography-root">
      <Box className="CmpMuiTypography-container">
        <Stack spacing={3} direction="column" alignItems="flex-start" sx={{ ml: 3, my: 2 }}>
          <Typography variant="h1">H1.abcdefghijklmnop</Typography>
          <Typography variant="h2">H2.ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ</Typography>
          <Typography variant="h3">H3.ㅏㅑㅓㅕㅗㅠㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ</Typography>
          <Typography variant="h4">
            H4. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
          </Typography>
          <Typography variant="h5">
            H5. 그 중은 신비로운 기운이 느껴지는 범상치 않은 인물이었는데, 양소유와 화담을 나누며
          </Typography>
          <Typography variant="subtitle1">
            SubTitle1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis
          </Typography>
          <Typography variant="subtitle2">
            SubTitle2. 대사의 자비하심을 입어 하룻밤 꿈에 크게 깨달았다는 말을 꺼내며 얼굴의
            연지분을 씻고,
          </Typography>
          <Typography variant="body1">
            body1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos
          </Typography>
          <Typography variant="body2">
            body2. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
          </Typography>
          <Typography variant="caption">
            caption. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
