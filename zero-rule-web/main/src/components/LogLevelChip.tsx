import type { CLLogLevelKey } from '@local/domain';
import { CLLogLevel } from '@local/domain';
import { Chip } from '@mui/material';

type Props = {
  logLevel: CLLogLevelKey;
};

export default function LogLevelChip({ logLevel }: Props) {
  const label = CLLogLevel[logLevel];

  let variant: 'outlined' | 'filled' = 'outlined';
  let color: 'default' | 'secondary' | 'primary' = 'default';

  if (logLevel === 'E') {
    variant = 'filled';
    color = 'secondary';
  } else if (logLevel === 'W') {
    variant = 'outlined';
    color = 'secondary';
  } else if (logLevel === 'I') {
    variant = 'filled';
    color = 'primary';
  }

  return <Chip label={label} variant={variant} color={color} size="small" clickable={false} />;
}
