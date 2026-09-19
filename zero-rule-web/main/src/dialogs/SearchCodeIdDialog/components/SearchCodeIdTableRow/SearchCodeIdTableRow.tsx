import theme from '@/theme';
import type { CLCodeType } from '@local/domain';
import type { SxProps, Theme } from '@mui/material';
import { TableRow, TableCell, Typography, Box } from '@mui/material';

const rootSx: SxProps<Theme> = (theme) => ({});

type Props = {
  codeType: CLCodeType;

  onClickRow: (codeType: string, codeTypeNm: string) => void;
  onClose: () => void;
};
export default function SearchCodeIdTableRow(props: Props) {
  const { onClickRow, onClose } = props;
  const { codeType, codeTypeNm } = props.codeType;
  return (
    <TableRow
      sx={rootSx}
      className="SearchCodeIdTableRow"
      onClick={(e) => {
        onClickRow(codeType, codeTypeNm);
        onClose();
      }}
    >
      <TableCell>
        <Typography>{codeType}</Typography>
      </TableCell>
      <TableCell>{codeTypeNm}</TableCell>
    </TableRow>
  );
}
