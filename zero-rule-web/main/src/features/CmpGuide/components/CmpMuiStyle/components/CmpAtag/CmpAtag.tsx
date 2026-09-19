import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Stack, Typography } from '@mui/material';

type Props = {
  link: string;
};
export default function CmpAtag(props: Props) {
  const { link } = props;
  return (
    <a href={link} style={{ textDecoration: 'none', marginRight: 10 }}>
      <Stack spacing={0.5} direction="row" alignItems="center">
        <Typography sx={{ color: '#0091ea' }} variant="subtitle2">
          더보기
        </Typography>
        <OpenInNewIcon sx={{ fontSize: '1rem', color: '#0091ea' }} />
      </Stack>
    </a>
  );
}
