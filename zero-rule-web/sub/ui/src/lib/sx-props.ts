import { alpha, SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';

/**
 * SxProps를 flatten 한 배열로 만든다.
 * @param sxArray SxProps<T>의 배열
 * @returns SxProps
 */
export function flatSx<T extends Theme = Theme>(
  ...sxArray: Array<SxProps<T> | undefined | null | false>
): SxProps<T> {
  return sxArray
    .filter((it) => !!it) // filter undefined
    .flatMap((sx) => (Array.isArray(sx) ? sx : [sx ?? false]))
    .filter((it) => it !== false);
}

export function firstSx<T extends Theme = Theme>(...sxArray: Array<SxProps<T> | undefined>) {
  return sxArray
    .filter((it) => !!it) // filter undefined
    .flatMap((sx) => (Array.isArray(sx) ? sx : [sx ?? false]))
    .filter((it) => it !== false)[0];
}

/**
 * 다이얼로그 높이 SxProps
 * @param key key of height
 * @param heightInPercent height in percent [0~100]
 * @returns Mui Dialog의 높이 설정 SxProps
 */
export const sxDialogHeight = (
  key: 'height' | 'minHeight' | 'maxHeight' = 'height',
  heightInPercent = 100,
) => {
  return {
    '& .MuiDialog-paperScrollPaper': {
      [key]: `calc(${heightInPercent}% - 64px)`,
    },
  };
};

/**
 * TableCell의 whiteSpace를 nowrap으로 설정하는 스타일
 * TableBody에서 설정한다.
 * TableBody의 인접한 TableRow의 인접한 TableCell에만 적용된다.(direct children only)
 *
 * @example
 * <TableBody sx={sxTableCellNowrap}>...</TableBody>
 */
export const sxTableCellNowrap = {
  '& > .MuiTableRow-root > .MuiTableCell-root': {
    whiteSpace: 'nowrap',
  },
};

/**
 * TableRow의 선택 상태 스타일
 * TableBody에서 설정한다.
 * TableBody의 인접한 children에만 적용된다.(direct children only)
 * 선택된 테이블 행에 'x_selected' 클래스가 설정되어야 한다
 * @example
 <TableBody sx={sxTableRowSelection}>
     <TableRow className='x_selected'>...</TableRow>
     <TableRow>...</TableRow>
 </TableBody>
 */
export const sxTableRowSelection = (theme: Theme) => {
  return {
    '& > .MuiTableRow-root': {
      borderLeft: '2px solid transparent',
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      },

      '&.x_selected': {
        '& > .MuiTableCell-root': {
          color: theme.palette.primary.dark,
          background: alpha(theme.palette.primary.main, 0.05),
        },
        '& > .MuiTableCell-root:first-of-type': {
          borderLeft: `2px solid ${theme.palette.primary.main}`,
        },
      },
    },
  };
};
