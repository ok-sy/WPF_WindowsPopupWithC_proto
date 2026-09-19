import type { CLUser } from '@local/domain';
import { flatSx } from '@local/ui';
import { alpha, TableCell, TableRow } from '@mui/material';
import { useRef } from 'react';
import Highlighter from 'react-highlight-words';

type Props = {
  data: CLUser;
  onClose: () => void;
  onSubmit: (lgonId: string) => void;
  keyword?: string;
};

export default function UserPickerTableRow(props: Props) {
  const { data, onClose, onSubmit, keyword } = props;
  const { userNm, lgonId } = data;

  const tableRowRef = useRef<HTMLTableRowElement>(null);

  const onSubmitHandle = (userNm: string) => {
    onSubmit(lgonId);
    onClose();
  };
  return (
    <TableRow
      ref={tableRowRef}
      sx={flatSx({
        '&:hover': {
          background: (theme) => alpha(theme.palette.primary.main, 0.05),
        },
        '& .UserPickerTableRow-highlight': {
          background: '#7bea19EE',
        },
      })}
      className="UserPickerTableRow-root"
      onClick={(e) => onSubmitHandle(userNm)}
    >
      <TableCell>
        {keyword ? (
          <Highlighter
            searchWords={[keyword]}
            autoEscape
            textToHighlight={lgonId ?? ''}
            highlightClassName="UserPickerTableRow-highlight"
          />
        ) : (
          lgonId
        )}
      </TableCell>
      <TableCell>
        {keyword ? (
          <Highlighter
            searchWords={[keyword]}
            autoEscape
            textToHighlight={userNm ?? ''}
            highlightClassName="UserPickerTableRow-highlight"
          />
        ) : (
          userNm
        )}
      </TableCell>
    </TableRow>
  );
}
