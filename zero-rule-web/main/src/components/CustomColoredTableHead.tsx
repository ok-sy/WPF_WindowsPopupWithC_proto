import { alpha, styled } from '@mui/material/styles';
import type { TableHeadProps } from '@mui/material/TableHead';
import TableHead from '@mui/material/TableHead';

type Props = {
  light?: boolean;
  dark?: boolean;
  bgAlpha?: number;
  yPadding?: 'inherit' | 'small' | 'medium' | 'large';
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

/**
 * TableHead에 백그라운드 색상을 넣을 수 있는 컴포넌트
 * @example
// 배경 색상, 생략가능, 기본값은 primary
// secondary,warning,success,info, error도 가능
<CustomColoredTableHead bgColor="primary">
  <TableRow>
    <TableCell>Head</TableCell>
  </TableRow>
</CustomColoredTableHead>

// light 팔레트를 이용, theme.palette.primary.light
<CustomColoredTableHead light>
  <TableRow>
    <TableCell>Head</TableCell>
  </TableRow>
</CustomColoredTableHead>

// dark 팔레트를 이용, theme.palette.primary.dark
<CustomColoredTableHead dark>
  <TableRow>
    <TableCell>Head</TableCell>
  </TableRow>
</CustomColoredTableHead>
 */
const CustomColoredTableHead = styled(TableHead)<Props>((props) => {
  const {
    theme,
    yPadding = 'inherit',
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
    // ex1) theme.palette.primary.main
    // ex2) theme.palette.primary.light
    // ex3) theme.palette.primary.dark
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

export default CustomColoredTableHead;
