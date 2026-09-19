import type { TeamForUser } from '@local/domain';
import type { SxProps, Theme } from '@mui/material';
import { TableCell, TableRow } from '@mui/material';

const rootSx: SxProps<Theme> = (theme) => ({});

type Props = {
  data: TeamForUser;
  seq: number;
};
export default function TeamOfUserTableRow(props: Props) {
  const { data, seq } = props;
  const { lgonId, userId, userNm } = data;
  return (
    <TableRow sx={rootSx} className="TeamOfUserTableRow-root">
      <TableCell>{seq}</TableCell>
      <TableCell>{lgonId}</TableCell>
      <TableCell>{userNm}</TableCell>
    </TableRow>
  );
}
