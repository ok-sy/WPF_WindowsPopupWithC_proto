import type { TableHeadProps } from '@mui/material';
import { TableHead } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

type Props = {
  // textAlign?: 'left' | 'center' | 'right'
  light?: boolean;
  dark?: boolean;
  bgAlpha?: number;
  yPadding?: 'inherit' | 'small' | 'medium' | 'large';
  pl?: 'small';
  bgColor?:
    | 'transparent'
    | 'white'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
} & TableHeadProps;

const CLDocTableHead = styled(TableHead)<Props>((props) => {
  const {
    theme,
    // textAlign = 'left',
    yPadding = 'inherit',
    pl = 'small',
    dark = false,
    light = false,
    bgAlpha = 0.15,
    bgColor = 'primary',
  } = props;

  let bgcolor: string;
  if (bgColor === 'white') {
    bgcolor = '#fff';
  } else if (bgColor === 'transparent') {
    bgcolor = 'transparent';
  } else {
    const level = light ? 'light' : dark ? 'dark' : 'main';
    bgcolor = alpha(theme.palette[bgColor][level], bgAlpha);
  }

  const py =
    yPadding === 'inherit'
      ? undefined // 테마 설정값을 사용
      : yPadding === 'small'
        ? theme.spacing(1)
        : yPadding === 'medium'
          ? theme.spacing(1.5)
          : theme.spacing(2);

  const sx1 = {
    backgroundColor: bgcolor,
  };

  if (!py) {
    return sx1;
  }

  return {
    ...sx1,
    '& > .MuiTableRow-root > .MuiTableCell-root': {
      paddingTop: py,
      paddingBottom: py,
    },
  };
});

export default CLDocTableHead;
