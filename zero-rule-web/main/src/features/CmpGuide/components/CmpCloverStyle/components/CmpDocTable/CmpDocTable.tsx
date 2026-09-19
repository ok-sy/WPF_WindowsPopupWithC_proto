import { Box, Checkbox, Stack, TableCell, TableContainer, TableRow } from '@mui/material';
import { useState } from 'react';
import { rootSx } from './style';
import CLStyledTable from '@/components/CLStyledTable';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLDocTableBody from '@/components/CLDocTableBody';

export default function CmpDocTable() {
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
    <Box sx={rootSx} className="CmpDocTable-root">
      <Box className="CmpDocTable-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <TableContainer
            sx={{
              height: '35vh',
              overflow: {
                xs: 'auto',
                md: 'auto',
              },
            }}
          >
            <CLStyledTable sx={{ m: 0 }}>
              <CLDocTableHead>
                <TableRow>
                  <TableCell>
                    <Checkbox size="small" onChange={(_, checked) => allCheckedHandle(checked)} />
                  </TableCell>
                  <TableCell>Sample1</TableCell>
                  <TableCell>Sample2</TableCell>
                  <TableCell>Sample3</TableCell>
                  <TableCell>Sample4</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody stripe>
                {sampleArray.map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Checkbox
                        size="small"
                        checked={checkedList.includes(idx)}
                        onChange={(e, checked) => checkHandle(idx, checked)}
                      />
                    </TableCell>
                    <TableCell>index : {idx}</TableCell>
                    <TableCell>index : {idx}</TableCell>
                    <TableCell>index : {idx}</TableCell>
                    <TableCell>index : {idx}</TableCell>
                  </TableRow>
                ))}
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        </Stack>
      </Box>
    </Box>
  );
}
