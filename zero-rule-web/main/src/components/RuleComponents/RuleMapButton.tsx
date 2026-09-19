import type { ButtonProps } from '@mui/material';
import { Button, styled } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

type RuleMapButtonProps = {
  text?: string;
  onClick?: () => void;
} & ButtonProps;

const MyButton = styled(Button)({
  borderRadius: '5px',
  fontSize: '0.75rem',
  '& .MuiButton-label': {
    textTransform: 'none',
  },
});
export function RuleMapButton(props: RuleMapButtonProps) {
  const { text, sx, className, onClick, ...restProps } = props;
  return (
    <MyButton
      variant="outlined"
      className={clsx('BbsButton-root', className)}
      onClick={onClick}
      size="small"
      sx={[...(Array.isArray(sx) ? sx : [sx ?? false])]}
      {...restProps}
    >
      {text}
    </MyButton>
  );
}
