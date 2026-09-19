import type { CLJobStatusKey } from '@local/domain';
import { flatSx } from '@local/ui';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import type { SvgIconProps, SxProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';

type Props = {
  sx?: SxProps;
  className?: string;
  status: CLJobStatusKey;
  hideLabel?: boolean;
  iconProps?: SvgIconProps;
};

function getTint(status: CLJobStatusKey): string {
  if (status === 'SUCCESS') return 'success.main';
  if (status === 'ERROR') return 'error.main';
  if (status === 'RUNNING') return 'info.main';
  return 'success.main';
}

export default function JobStatusLabel(props: Props) {
  const { sx, status, hideLabel = false, iconProps } = props;
  const color = getTint(status);

  return (
    <Stack
      className="JobStatusLabel-root"
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={flatSx(
        {
          color,
          fontSize: '0.75rem',
          '& .MuiTypography-root': {
            fontSize: '0.75rem',
            color,
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.1rem',
            fill: color,
          },
        },
        sx,
      )}
    >
      {status === 'SUCCESS' && <SentimentSatisfiedIcon {...iconProps} />}
      {status === 'ERROR' && <MoodBadIcon {...iconProps} />}
      {status === 'RUNNING' && <DirectionsRunIcon {...iconProps} />}
      {status === 'FIRST' && <SentimentSatisfiedIcon {...iconProps} />}
      {!hideLabel && <Typography>{status}</Typography>}
    </Stack>
  );
}
