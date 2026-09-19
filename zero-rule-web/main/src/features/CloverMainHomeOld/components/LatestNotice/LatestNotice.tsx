import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import type { Theme, SxProps } from '@mui/material';
import {
  Button,
  Card,
  CardActions,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { NOTICE_DATAS } from '../sample-data';

const rootSx: SxProps<Theme> = {
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  background: 'rgb(255, 255, 255)',
  borderRadius: '20px',
  boxShadow: 'rgba(0,0,0,0.04) 0px 5px 22px ,rgba(0,0,0,0.03) 0px 0px 0px 0.5px',
};

export default function LatestNotice() {
  return (
    <Card sx={rootSx} className="LatestNotice-root">
      <CardHeader title="Latest Notice" sx={{ mt: 2, maxHeight: 50, minHeight: 50 }} />
      <TableContainer sx={{ flex: 1 }}>
        <Table
          stickyHeader
          sx={{
            '& .MuiTableHead-root': {
              '& .MuiTableCell-root': {
                backgroundColor: '#f8f9fa',
              },
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                '& .MuiTableCell-root': { fontSize: '0.8rem', fontWeight: 600, color: '#2f3746' },
              }}
            >
              <TableCell>EXPL</TableCell>
              <TableCell>COSTOMER</TableCell>
              <TableCell sortDirection="desc">DATE</TableCell>
              <TableCell>STATUS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {NOTICE_DATAS.map((el, idx) => {
              const color =
                el.status === 'PENDING'
                  ? '#b54708'
                  : el.status === 'DELIVERED'
                    ? '#0b815a'
                    : '#bb372d';
              const bgColor =
                el.status === 'PENDING'
                  ? '#f6eada'
                  : el.status === 'DELIVERED'
                    ? '#daeee9'
                    : '#f5e0e0';
              return (
                <TableRow key={el.expl} sx={{ ':hover': { backgroundColor: '#f6f6f7' } }}>
                  <TableCell>{el.expl}</TableCell>
                  <TableCell>{el.costomer}</TableCell>
                  <TableCell>{el.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={el.status}
                      sx={{ color: color, bgcolor: bgColor, fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <CardActions sx={{ justifyContent: 'flex-end', maxHeight: 50, minHeight: 50 }}>
        <Button
          color="inherit"
          variant="text"
          size="small"
          endIcon={<ArrowRightAltIcon fontSize="small" />}
          sx={{ p: 1 }}
        >
          <Typography sx={{ fontSize: '0.7rem' }} variant="h6">
            View all
          </Typography>
        </Button>
      </CardActions>
    </Card>
  );
}
