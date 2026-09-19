import { pstring } from '@cp949/pjs';
import type { Team } from '@local/domain';
import { flatSx } from '@local/ui';
import { alpha, TableCell, TableRow } from '@mui/material';
import { useRef } from 'react';
import Highlighter from 'react-highlight-words';

type Props = {
  data: Team;
  onClose: () => void;
  onSubmit: (teamNm: string, teamId: number) => void;
  keyword?: string;
};

export default function TeamPickerTableRow(props: Props) {
  const { data, onClose, onSubmit, keyword } = props;
  const { teamId, teamNm } = data;

  const tableRowRef = useRef<HTMLTableRowElement>(null);

  const onSubmitHandle = (teamNm: string, teamId: number) => {
    const teamName = pstring.trim(data.teamNm);
    onSubmit(teamName, teamId);
    onClose();
  };
  return (
    <TableRow
      ref={tableRowRef}
      sx={flatSx({
        '&:hover': {
          background: (theme) => alpha(theme.palette.primary.main, 0.05),
        },
        '& .CodeTypeTableRow-highlight': {
          background: '#7bea19EE',
        },
      })}
      className="TeamPickerTableRow-root"
      onClick={(e) => onSubmitHandle(teamNm ?? '', Number(teamId))}
    >
      <TableCell>{teamId}</TableCell>
      <TableCell>
        {keyword ? (
          <Highlighter
            searchWords={[keyword]}
            autoEscape
            textToHighlight={teamNm ?? ''}
            highlightClassName="CodeTypeTableRow-highlight"
          />
        ) : (
          teamNm
        )}
      </TableCell>
    </TableRow>
  );
}
