import CLCustomDataGrid from '@local/ui/src/components/CLCustomDataGrid/CLCustomDataGrid';
import { Box, Stack, Typography } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import type { SamplePadRule } from './sample-data';
import { SAMPLE_PAD_RULE } from './sample-data';
import { rootSx } from './style';

const defaultColumns: ColumnDef<SamplePadRule>[] = [
  {
    header: '카드번호',
    accessorKey: 'cardNum',
    cell: (data) => <Typography sx={{ textAlign: 'center' }}>{data.getValue() + ''}</Typography>,
  },
  {
    header: '국내외여부',
    accessorKey: 'koreanType',
    cell: (data) => <Typography sx={{ textAlign: 'center' }}>{data.getValue() + ''}</Typography>,
  },
  {
    header: '승인금액',
    accessorKey: 'money',
    cell: (data) => <Typography sx={{ textAlign: 'right' }}>{data.getValue() + ''}</Typography>,
  },
  {
    header: '종료일',
    accessorKey: 'endDate',
    cell: (data) => <Typography sx={{ textAlign: 'center' }}>{data.getValue() + ''}</Typography>,
  },
  {
    header: '적용여부',
    accessorKey: 'commitType',
    cell: (data) => <Typography sx={{ textAlign: 'center' }}>{data.getValue() + ''}</Typography>,
  },
  {
    header: '수정반영여부',
    accessorKey: 'modifyType',
    cell: (data) => <Typography sx={{ textAlign: 'center' }}>{data.getValue() + ''}</Typography>,
  },
  {
    header: '수정일자',
    accessorKey: 'modifyDate',
    cell: (data) => <Typography sx={{ textAlign: 'center' }}>{data.getValue() + ''}</Typography>,
  },
];

export default function CmpDocSortTable() {
  const [checkedList, setCheckedList] = useState<number[]>([]);
  const sampleArray: string[] = Array(20).fill(1);
  const allCheckedHandle = (checked: boolean) => {
    if (checked) {
      setCheckedList((p) => sampleArray.map((_, idx) => idx));
    } else {
      setCheckedList([]);
    }
  };
  const checkHandle = (idx: number, checked: boolean) => {
    if (checked) {
      setCheckedList((p) => [...p, idx]);
    } else {
      setCheckedList((p) => p.filter((el) => el !== idx));
    }
  };
  return (
    <Box sx={rootSx} className="CmpDocSortTable-root">
      <Box className="CmpDocSortTable-container">
        <Stack spacing={3} sx={{ ml: 3, my: 4 }}>
          <Typography variant="h6">HEAD 부분 클릭시 정렬가능합니다.</Typography>
          <CLCustomDataGrid
            sx={{ height: 300 }}
            tableCellMinWidth="50px"
            defaultColumns={defaultColumns}
            defaultData={SAMPLE_PAD_RULE}
          />
        </Stack>
      </Box>
    </Box>
  );
}
