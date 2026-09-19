import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CustomTableBody from '@/components/CustomTableBody';
import type { AppLog } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableCellNowrap,
  sxTableRowSelection,
} from '@local/ui';
import {
  alpha,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import AppLogTableRow from './AppLogTableRow';

type Props = {
  appLogList: AppLog[];
  loading: boolean;
  pageNumber: number;
  totalPages: number;
  onPageClick: (pageNumber: number) => void;
};

export default function AppLogTable(props: Props) {
  const { appLogList, loading, totalPages, pageNumber, onPageClick } = props;

  return (
    <Portlet
      className="AppLogTable-root"
      sx={{
        '& .MuiTableRow-root:hover': {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      {totalPages > 1 && (
        <PortletHeader>
          <Pagination
            page={pageNumber + 1}
            count={totalPages}
            onChange={(_, page) => onPageClick(page - 1)}
          />
        </PortletHeader>
      )}
      <PortletContent noPadding>
        <TableContainer>
          <Table>
            <CustomColoredTableHead sx={sxTableCellNowrap}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Log Level</TableCell>
                <TableCell>Log</TableCell>
                <TableCell>실행자</TableCell>
                <TableCell>사용자</TableCell>
                <TableCell>태그</TableCell>
                <TableCell>브라우저</TableCell>
                <TableCell>실행서버</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            {appLogList.length === 0 && (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="h6">로그가 존재하지 않습니다.</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
            {appLogList.length > 0 && (
              <CustomTableBody
                loading={loading}
                sx={flatSx(sxTableCellNowrap, sxTableRowSelection)}
              >
                {appLogList?.map((appLog, i) => (
                  <AppLogTableRow key={appLog.logId} appLog={appLog} seq={i + 1} />
                ))}
              </CustomTableBody>
            )}
          </Table>
        </TableContainer>
      </PortletContent>
    </Portlet>
  );
}
