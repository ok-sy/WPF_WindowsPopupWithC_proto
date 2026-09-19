import type { CLCode } from '@local/domain';
import { alpha, TableCell, TableRow } from '@mui/material';
import { useRef } from 'react';
type Props = {
  data: CLCode;
  onClickRow: (clickData: CLCode) => void;
};

export default function CodeSelectRow(props: Props) {
  const { data, onClickRow } = props;
  const { chngDttm, code, codeNm, codeType, codeTypeNm, regDttm, chgrId, dtlExpl, regrId } = data;
  const tableRowRef = useRef<HTMLTableRowElement>(null);

  return (
    <TableRow
      className="CodeSelectRow-root"
      ref={tableRowRef}
      onClick={(e) => {
        onClickRow(data);
      }}
      data-word-id={code}
      sx={{
        '&.CodeSelectRow-selected': {
          '& td': {
            color: 'primary.main',
            background: (theme) => alpha(theme.palette.primary.main, 0.05),
          },
          '& td:first-of-type': {
            borderLeft: (theme) => `2px solid ${theme.palette.primary.main}`,
          },
        },
        '&:hover': {
          background: (theme) => alpha(theme.palette.primary.main, 0.05),
        },
      }}
    >
      <TableCell>{code}</TableCell>
      <TableCell>{codeNm}</TableCell>
    </TableRow>
  );
}
