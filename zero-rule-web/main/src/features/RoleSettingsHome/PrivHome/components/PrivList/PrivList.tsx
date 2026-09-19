import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { CLPriv } from '@local/domain';
import { flatSx, PortletContent, sxTableRowSelection, useElementLeftTop } from '@local/ui';

import { Box, TableCell, TableContainer, TableRow } from '@mui/material';
import { useRef, useState } from 'react';
import PrivRow from './components/PrivRow';

type Props = {
  privData?: CLPriv[];
  onClickRow: (selectedPrivData: CLPriv) => void;
  selectedPrivId: string;
};

export default function PrivList(props: Props) {
  const { privData, onClickRow, selectedPrivId } = props;
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const rootRef = useRef<HTMLDivElement>();

  const handleClickRoleRow = (priv: CLPriv) => {
    // setSelectedPrivId(priv.privId)
    onClickRow(priv);
  };

  return (
    <Box className="PrivList-root" ref={rootRef}>
      <PortletContent noPadding>
        <TableContainer
          ref={setBodyElement}
          sx={{
            height: `calc(100vh - ${bodyTop}px - 35px)`,
            whiteSpace: 'nowrap',
            '& .MuiTableRow-root > .MuiTableCell-root': {
              '&:nth-of-type(1)': {
                minWidth: 40,
                maxWidth: 40,
                width: 40,
              },
              '&:nth-of-type(2)': {
                maxWidth: 100,
                minWidth: 100,
                width: 100,
              },
              '&:nth-of-type(3)': {
                maxWidth: 100,
                minWidth: 100,
                width: 100,
              },
              '&:nth-of-type(4)': {
                minWidth: 40,
                maxWidth: 40,
                width: 40,
              },
            },
          }}
        >
          <CLStyledTable noMargin>
            <CLDocTableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>권한 ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </CLDocTableHead>
            <CLDocTableBody
              sx={flatSx(
                {
                  cursor: 'default',
                },
                sxTableRowSelection,
              )}
            >
              {privData?.map((el, idx) => (
                <PrivRow
                  seq={idx + 1}
                  onClickRow={handleClickRoleRow}
                  key={el.privId}
                  data={el}
                  selected={selectedPrivId === el.privId}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </PortletContent>
    </Box>
  );
}
