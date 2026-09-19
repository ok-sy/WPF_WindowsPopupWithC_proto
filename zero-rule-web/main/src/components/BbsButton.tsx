import type { ButtonProps } from '@mui/material';
import { Button, styled } from '@mui/material';
import clsx from 'clsx';

export type BbsButtonProps = {
  text?: string;
  onClick?: () => void;
} & ButtonProps;

const MyButton = styled(Button)({
  borderRadius: '16px',
  fontSize: '0.75rem',
  '& .MuiButton-label': {
    textTransform: 'none',
  },
});

export default function BbsButton(props: BbsButtonProps) {
  const { text, sx, className, onClick, ...restProps } = props;

  return (
    <MyButton
      variant="outlined"
      className={clsx('BbsButton-root', className)}
      onClick={onClick}
      size="small"
      sx={[
        {
          borderRadius: '16px',
          fontSize: '0.75rem',
        },
        ...(Array.isArray(sx) ? sx : [sx ?? false]),
      ]}
      {...restProps}
    >
      {text}
    </MyButton>
  );
}
