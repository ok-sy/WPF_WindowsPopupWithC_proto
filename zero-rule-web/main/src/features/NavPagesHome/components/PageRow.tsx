import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import type { CLPage } from '@local/domain';
import { alpha, TableCell, TableRow } from '@mui/material';
type Props = {
  seq: number;
  data: CLPage;
  onClickRow: (pageData: CLPage) => void;
};
export default function PageRow(props: Props) {
  const { data, seq, onClickRow } = props;
  const { pageId, pageNm, url, icon, pageKey } = data;
  return (
    <TableRow
      sx={{
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
        },
      }}
      onClick={(_) => onClickRow(data)}
    >
      <TableCell>{pageKey ?? '-'}</TableCell>
      <TableCell>{pageNm}</TableCell>
      <TableCell>
        <StringToMuiIcon iconColor="GrayText" iconName={icon ?? ''} />
      </TableCell>
      <TableCell>{url ?? '-'}</TableCell>
    </TableRow>
  );
}
