import { Box, Stack, Typography } from '@mui/material';
import { rootSx } from './style';

export default function CloverBanner() {
  return (
    <Box sx={rootSx} className="CloverBanner-root">
      <Box>
        <Stack alignItems="baseline" spacing={1} direction="row">
          <Typography className="CloverBanner-title2" variant="h1">
            CLOVER
          </Typography>
          <Typography className="CloverBanner-title1" variant="h1">
            Style Library
          </Typography>
        </Stack>
        <Typography variant="subtitle1">
          CLOVER 프레임워크에서 공통적으로 사용되는 컴포넌트에 대한 가이드입니다.
          <br />
          자세한 컴포넌트 속성은 소스코드에서 확인할 수 있습니다.
        </Typography>
      </Box>
    </Box>
  );
}
