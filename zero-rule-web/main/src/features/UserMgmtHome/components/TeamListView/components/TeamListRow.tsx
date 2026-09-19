import type { Team } from '@local/domain';
import { TableCell, TableRow } from '@mui/material';

type Props = {
  data: Team;
  teamTskClsfData: string;
  onClickRow: (teamId: number) => void;
};
export default function TeamListRow(props: Props) {
  const { data, onClickRow, teamTskClsfData } = props;
  const { teamId, userCnt, teamExpl, teamNm } = data;

  return (
    <TableRow className="TeamListRow-root" onClick={(e) => onClickRow(teamId)}>
      <TableCell>{teamId}</TableCell>
      <TableCell>{teamNm}</TableCell>
      <TableCell>{teamExpl}</TableCell>
      <TableCell>{teamTskClsfData}</TableCell>
      <TableCell>{userCnt}</TableCell>
    </TableRow>
  );
}
