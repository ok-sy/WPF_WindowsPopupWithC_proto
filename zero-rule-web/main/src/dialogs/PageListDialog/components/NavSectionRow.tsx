import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import type { CLNavSection } from '@local/domain';
import { Button, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { useRef } from 'react';
import Highlighter from 'react-highlight-words';

type Props = {
  section: CLNavSection;
  onClickPageKey: (pageKey: string) => void;
  keyword?: string;
};
export default function NavSectionRow(props: Props) {
  const { section, onClickPageKey, keyword } = props;
  const { sectionNm, subitems, icon } = section;
  const tableRowRef = useRef<HTMLTableRowElement>(null);
  return (
    <>
      <TableRow
        sx={{
          '& .MuiTableCell-root': {
            border: 0,
          },
          '& .NavSectionRow-highlight': {
            background: '#7bea19EE',
          },
        }}
        ref={tableRowRef}
      >
        <TableCell colSpan={3}>{sectionNm}</TableCell>
      </TableRow>
      {subitems.map((el, idx) => (
        <TableRow
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: subitems.length === idx + 1 ? '1px solid #e0e0e0' : 'none',
            },
          }}
          key={el.pageId}
        >
          <TableCell>
            <Typography variant="body2" ml={2}>
              {keyword ? (
                <Highlighter
                  searchWords={[keyword]}
                  autoEscape
                  textToHighlight={el.pageNm}
                  highlightClassName="NavSectionRow-highlight"
                />
              ) : (
                <span>{el.pageNm}</span>
              )}
            </Typography>
          </TableCell>
          <TableCell>{el.url}</TableCell>
          <TableCell>
            {el.pageKey && (
              <Button size="small" onClick={() => onClickPageKey(el.pageKey!)} variant="outlined">
                {el.pageKey}
              </Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
