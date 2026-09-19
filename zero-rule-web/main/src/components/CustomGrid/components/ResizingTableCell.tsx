import { Stack, TableCell } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import type {
  CustomGridColumnFilter,
  CustomGridFilterNumType,
  CustomGridFilterType,
  CustomGridSortingType,
} from '../grid-type';
import ColumnCommonStack from './ColumnCommonStack';
import ColumnCommonStackOld from './ColumnCommonStackOld';
type Size = {
  width: number;
  height: number;
};
type Props = {
  data: CustomGridColumnFilter;
  sortMode: boolean;
  sorting?: CustomGridSortingType;
  textFilterMode: boolean;
  setFiltering: (data: CustomGridFilterType) => void;
  setSorting: (data: CustomGridSortingType) => void;
  setNumFiltering: (data: CustomGridFilterNumType, minMax: string) => void;
};
/**
 * table head 의 컴포넌트화 형 resizing table cell 드래그로 컬럼 사이즈 조절
 * @param props
 * @author sim jin woo
 */
export default function ResizingTableCell(props: Props) {
  const { data, sortMode, sorting, textFilterMode, setSorting, setFiltering, setNumFiltering } =
    props;
  const [cellSize, setCellSize] = useState<Size>({ width: 0, height: 0 });
  const [reSize, setResize] = useState<boolean>(false);

  const tableCellRef = useRef<HTMLTableHeaderCellElement | null>();
  useEffect(() => {
    if (tableCellRef.current) {
      const { width, height } = tableCellRef.current.getBoundingClientRect();
      setCellSize({ width, height });
    }
  }, []);

  useEffect(() => {
    if (textFilterMode === false || textFilterMode === undefined) {
      setCellSize((p) => ({ height: 42, width: p?.width ?? 0 }));
    } else {
      if (!tableCellRef.current) return;
      const { width, height } = tableCellRef.current.getBoundingClientRect();
      setCellSize({ width, height: 86 });
    }
  }, [textFilterMode]);

  return (
    <TableCell
      ref={tableCellRef}
      sx={{
        fontWeight: 600,
        p: 0,
        borderTop: '1px solid #e0e0e0',
        '& .react-resizable': {
          width: '100%',
        },
        '& .react-resizable-handle': {
          '&:hover': { backgroundColor: '#5d69ba' },
          backgroundColor: reSize ? '#5d69ba' : 'white',
          height: '100%',
          width: '3px',
          transform: 'none',
          top: 0,
          mt: 0,
          ml: 1.5,
        },
      }}
    >
      {cellSize.width !== 0 && (
        <ResizableBox
          width={200} // 초기 너비
          height={textFilterMode ? 86 : 42} // 초기 높이
          minConstraints={[cellSize?.width ?? 200, textFilterMode ? 86 : 42]} // 최소 너비와 높이
          maxConstraints={[9999, textFilterMode ? 86 : 42]} // 최대 너비와 높이
          resizeHandles={['e']}
          onResizeStart={() => {
            setResize(true);
          }}
          onResizeStop={() => setResize(false)}
        >
          <Stack sx={{ height: '100%', width: '100%' }} justifyContent="center">
            <ColumnCommonStackOld
              data={data}
              sortMode={sortMode ?? false}
              sorting={sorting}
              textFilterMode={textFilterMode ?? false}
              setFiltering={(data: CustomGridFilterType) => setFiltering({ ...data })}
              setSorting={(data: CustomGridSortingType) => setSorting({ ...data })}
              setNumFiltering={(data: CustomGridFilterNumType, minMax: string) => {
                setNumFiltering(data, minMax);
              }}
              onNumOperator={(data: CustomGridFilterNumType, minMax: string) => {
                setNumFiltering(data, minMax);
              }}
            />
          </Stack>
        </ResizableBox>
      )}
    </TableCell>
  );
}
