import type { CLCodeType } from '@local/domain';
import { alpha, TableCell, TableRow } from '@mui/material';
import { useRef } from 'react';
import Highlighter from 'react-highlight-words';

type Props = {
  data: CLCodeType;
  onClickRow: (clickData: CLCodeType) => void;
  keyword?: string;
};

export default function CodeTypeTableRow(props: Props) {
  const { data, onClickRow, keyword } = props;
  const { codeType, codeTypeNm } = data;
  const tableRowRef = useRef<HTMLTableRowElement>(null);

  return (
    <TableRow
      className="CodeTypeTableRow-root"
      ref={tableRowRef}
      onClick={(e) => {
        onClickRow(data);
      }}
      sx={{
        '& .CodeTypeTableRow-highlight': {
          background: '#7bea19EE',
        },
      }}
    >
      <TableCell>
        {keyword ? (
          <Highlighter
            searchWords={[keyword]}
            autoEscape
            textToHighlight={codeType}
            highlightClassName="CodeTypeTableRow-highlight"
          />
        ) : (
          codeType
        )}
      </TableCell>
      <TableCell>
        {keyword ? (
          <Highlighter
            searchWords={[keyword]}
            autoEscape
            textToHighlight={codeTypeNm}
            highlightClassName="CodeTypeTableRow-highlight"
          />
        ) : (
          codeTypeNm
        )}
      </TableCell>
    </TableRow>
  );
}
