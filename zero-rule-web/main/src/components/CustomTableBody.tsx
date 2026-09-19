import { flatSx } from '@local/ui';
import type { TableBodyProps } from '@mui/material';
import { TableBody } from '@mui/material';
import clsx from 'clsx';

type Props = {
  loading?: boolean;
  stripe?: boolean;
} & TableBodyProps;

export default function CustomTableBody(props: Props) {
  const { sx, className, loading, stripe, ...otherProps } = props;

  return (
    <TableBody
      className={clsx('CustomTableBody-root', className, {
        'CustomTableBody-stripe': !!stripe,
        'CustomTableBody-loading': !!loading,
      })}
      sx={flatSx(
        {
          '&.CustomTableBody-loading': {
            opacity: 0.5,
          },
          '&.CustomTableBody-stripe': {
            '& .MuiTableRow-root:nth-of-type(even)': {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          },
        },
        sx,
      )}
      {...otherProps}
    />
  );
}
