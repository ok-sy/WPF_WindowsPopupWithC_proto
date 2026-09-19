import type { CLPage } from '@local/domain';
import { Button, TableCell, TableRow } from '@mui/material';
import { useRef } from 'react';
import Highlighter from 'react-highlight-words';
type Props = {
  page: CLPage;
  onClickPageKey: (pageKey: string) => void;
  keyword?: string;
};
export default function NavPageRow(props: Props) {
  const { page, onClickPageKey, keyword } = props;
  const { pageNm, url, icon, pageKey } = page;
  const tableRowRef = useRef<HTMLTableRowElement>(null);
  return (
    <TableRow
      ref={tableRowRef}
      sx={{
        '& .NavPageRow-highlight': {
          background: '#7bea19EE',
        },
      }}
    >
      <TableCell>
        {keyword ? (
          <Highlighter
            searchWords={[keyword]}
            autoEscape
            textToHighlight={pageNm}
            highlightClassName="NavPageRow-highlight"
          />
        ) : (
          pageNm
        )}
      </TableCell>
      <TableCell>{url ?? '-'}</TableCell>
      <TableCell>
        {pageKey && (
          <Button size="small" onClick={() => onClickPageKey(pageKey)} variant="outlined">
            {pageKey}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
