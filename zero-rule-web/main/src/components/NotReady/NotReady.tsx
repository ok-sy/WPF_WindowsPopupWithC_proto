import { LgOrUp } from '@local/ui';
import { flatSx, Link } from '@local/ui';
import HomeIcon from '@mui/icons-material/Home';
import type { SxProps } from '@mui/material';
import { Box, Button, Stack, Typography } from '@mui/material';
import imgUnderConstruction from '@public/images/under_construction1.svg';
import clsx from 'clsx';
import Image from 'next/image';
import { rootSx } from './style';

type Props = {
  sx?: SxProps;
  className?: string;
};

export default function NotReady(props: Props) {
  const { sx, className } = props;

  return (
    <Box className={clsx('NotReady-root', className)} sx={flatSx(rootSx, sx)}>
      <Box className="NotReady-wrapper">
        <Box className="NotReady-details" sx={{ color: '#fff' }}>
          <Box
            sx={{
              mx: 'auto',
            }}
          >
            <Typography variant="h2" className="NotReady-systemNamePart">
              Fraud
            </Typography>
            <Typography variant="h2" className="NotReady-systemNamePart">
              Detection
            </Typography>
            <Typography variant="h2" className="NotReady-systemNamePart">
              System
            </Typography>
            <Typography variant="body1" sx={{ mt: 4 }}>
              개발중입니다. 조금만 기다려주세요
            </Typography>
            <Button
              component={Link}
              href="/"
              color="inherit"
              variant="outlined"
              size="large"
              sx={{ mt: 4 }}
              startIcon={<HomeIcon />}
            >
              HOME
            </Button>
          </Box>
        </Box>
        <LgOrUp>
          <Box className="NotReady-details">
            <Stack className="NotReady-artBox" direction="column" alignItems="center" spacing={2}>
              <img
                src="/images/under_construction_animated.gif"
                width={70}
                height={63}
                alt="under construction art"
              />
              <img src={imgUnderConstruction} width={300} alt="under construction art" />
            </Stack>
          </Box>
        </LgOrUp>
      </Box>
      <Box
        component="a"
        href="https://ecreditline.co.kr/"
        target="_blank"
        rel="noreferrer"
        sx={{
          color: {
            xs: '#fff',
            lg: '#000',
          },
          position: 'absolute',
          bottom: 8,
          right: 24,
          borderRadius: 1,
          px: 2,
          py: 0.5,
        }}
      >
        <img src="https://ecreditline.co.kr/kor/images/common/logo.png" alt="creditline" />
      </Box>
    </Box>
  );
}
