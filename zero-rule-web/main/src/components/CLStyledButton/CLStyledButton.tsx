import { flatSx } from '@local/ui';
import type { ButtonProps, SxProps, Theme } from '@mui/material';
import { alpha, Button } from '@mui/material';

type Without<T, K> = Pick<T, Exclude<keyof T, K>>;

type Props = Without<ButtonProps, 'size' | 'variant'> & {
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  readOnly?: boolean;
};

const rootSx: SxProps<Theme> = {
  boxShadow: 'none',
  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
  color: (theme) => theme.palette.primary.dark,
  whiteSpace: 'nowrap',
  fontSize: '0.8rem',
  borderRadius: 0,
  pl: 1.5,
  '&:hover': {
    backgroundColor: (theme) => alpha(theme.palette.primary.dark, 0.7),
    color: '#fff',
    fontSize: '0.8rem',
    '& svg': {
      color: '#fff',
    },
  },
};

export default function CLStyledButton(props: Props) {
  const { sx, size = 'small', readOnly, variant = 'contained', ...rest } = props;

  return <Button sx={flatSx(rootSx, sx)} {...rest} disabled={readOnly} />;
}
