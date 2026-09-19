import { routerBack } from '@/lib/urls';
import type { ButtonProps } from '@mui/material';
import { Button } from '@mui/material';

type Props = Omit<ButtonProps, 'onClick' | 'children'>;

export default function NaviBackButton(props: Props) {
  const { variant = 'outlined', color = 'primary', size = 'small', ...restProps } = props;
  return (
    <Button {...restProps} variant={variant} color={color} size={size} onClick={routerBack}>
      이전
    </Button>
  );
}
