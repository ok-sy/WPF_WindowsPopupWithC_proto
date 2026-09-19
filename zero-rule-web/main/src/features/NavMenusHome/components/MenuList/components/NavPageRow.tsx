import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import type { CLPage } from '@local/domain';
import { TableCell, TableRow } from '@mui/material';
type Props = {
  seq: number;
  data: CLPage;
};
export default function NavPageRow(props: Props) {
  const { data, seq } = props;
  const { pageNm, url, icon, pageKey } = data;
  return (
    <TableRow>
      <TableCell>
        <StringToMuiIcon iconColor="GrayText" iconName={icon ?? ''} />
      </TableCell>
      <TableCell>{pageNm}</TableCell>
      <TableCell>{url ?? '-'}</TableCell>
      <TableCell>{pageKey}</TableCell>
    </TableRow>
  );
}
