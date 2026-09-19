import { flatSx } from '@local/ui';
import type { TableBodyProps } from '@mui/material';
import { TableBody } from '@mui/material';
import clsx from 'clsx';
import { rootSx } from './style';

type Props = {
  loading?: boolean;
  stripe?: boolean;
  disableCenterAlign?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  yPadding?: 'small' | 'medium' | 'large';
} & TableBodyProps;

export default function CLDocTableBody(props: Props) {
  const {
    textAlign = 'left',
    yPadding = 'medium',
    loading,
    stripe,
    disableCenterAlign = false,
    sx,
    className,
    children,
    ...restProps
  } = props;

  const py = yPadding === 'small' ? '2px' : yPadding === 'medium' ? '8px' : '12px';
  const tA = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'rigth' : textAlign;
  return (
    <TableBody
      sx={flatSx(
        rootSx,
        {
          '& > .MuiTableRow-root > .MuiTableCell-root': {
            textAlign: tA,
            py: py,
            fontSize: '0.75rem',
          },
        },
        sx,
      )}
      className={clsx('CLDocTableBody-root', className, {
        'CLDocTableBody-stripe': !!stripe,
        'CLDocTableBody-loading': !!loading,
      })}
      {...restProps}
    >
      {children}
    </TableBody>
  );
}
