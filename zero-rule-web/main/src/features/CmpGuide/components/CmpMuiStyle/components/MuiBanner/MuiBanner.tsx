import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { SxProps } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';

const rootSx: SxProps = {
  backgroundColor: '#f5f9fc',
  py: 4,
  px: 6,
  //   display: 'flex',
  position: 'relative',
  '& .MuiBanner-title1': {
    color: '#112a54',
    mb: 1,
  },
  '& .MuiBanner-title2': {
    fontSize: '2.68rem',
    color: '#0091ea',
    mb: 3,
  },
};

export default function MuiBanner() {
  return (
    <Box sx={rootSx} className="MuiBanner-root">
      <Box>
        <Stack alignItems="baseline" spacing={1} direction="row">
          <Typography className="MuiBanner-title2" variant="h1">
            MUI
          </Typography>
          <Typography className="MuiBanner-title1" variant="h1">
            Component Library
          </Typography>
        </Stack>
        <Typography sx={{ mb: 3 }} variant="subtitle1">
          프로토타이핑과 제품개발에 가장 많이 활용되는 컴포넌트 기반의 React UI 라이브러리인 MUI를
          활용했습니다.
          <br />
          컴포넌트에 대한 자세한 내용은 공식 MUI 홈페이지에서 확인할 수 있습니다.
        </Typography>

        <a
          href="https://mui.com/material-ui/react-autocomplete/"
          style={{ textDecoration: 'none' }}
        >
          <Stack spacing={0.5} direction="row" alignItems="center">
            <Box sx={{ width: 25 }} component="img" src="/images/mui/MuiLogo.png" alt="MUI" />
            <Typography sx={{ color: '#0091ea' }} variant="subtitle2">
              MUI 공식홈페이지 바로가기
            </Typography>
            <OpenInNewIcon sx={{ fontSize: '1rem', color: '#0091ea' }} />
          </Stack>
        </a>
      </Box>
    </Box>
  );
}
