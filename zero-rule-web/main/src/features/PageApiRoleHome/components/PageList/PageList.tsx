import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { CLPage } from '@local/domain';
import { flatSx, PortletContent, sxTableRowSelection, useElementLeftTop } from '@local/ui';
import { Box, TableCell, TableContainer, TableRow } from '@mui/material';
import { useRef, useState } from 'react';
import PageRow from './components/PageRow';

type Props = {
  pageList?: CLPage[];
  onClickRow: (selectedPrivData: CLPage) => void;
  selectedPageId: number;
};

export default function PageList(props: Props) {
  const { pageList: pageList, onClickRow, selectedPageId } = props;
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const rootRef = useRef<HTMLDivElement>();

  const handleClickRoleRow = (page: CLPage) => {
    onClickRow(page);
  };

  return (
    <Box className="PageList-root" ref={rootRef}>
      <PortletContent noPadding>
        <TableContainer
          ref={setBodyElement}
          sx={{
            height: `calc(100vh - ${bodyTop}px - 35px)`,
            whiteSpace: 'nowrap',
          }}
        >
          <CLStyledTable noMargin>
            <CLDocTableHead>
              <TableRow>
                <TableCell>PAGE 키</TableCell>
                <TableCell>이름</TableCell>
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
              {pageList?.map((el, idx) => (
                <PageRow
                  seq={idx + 1}
                  onClickRow={handleClickRoleRow}
                  key={el.pageId}
                  data={el}
                  selected={selectedPageId === el.pageId}
                />
              ))}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </PortletContent>
    </Box>
  );
}
