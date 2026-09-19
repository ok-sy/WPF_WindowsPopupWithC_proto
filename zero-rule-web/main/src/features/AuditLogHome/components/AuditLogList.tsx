import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import {
  Box,
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import type { AuditLog, PagerData } from '@local/domain';
import AuditLogRow from './AuditLogRow';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableCellNowrap,
  sxTableRowSelection,
} from '@local/ui';
import CustomTableBody from '@/components/CustomTableBody';

type Props = {
  pagerData?: PagerData<AuditLog>;
  loading: boolean;
  onChangePageNumber: (page: number) => void;
};

export default function AdminAccessLogResult(props: Props) {
  const { pagerData, loading, onChangePageNumber } = props;
  const {
    totalPages = 0,
    pageNumber = 0,
    elements = [],
    offset = 0,
    totalElements = 0,
  } = pagerData ?? {};

  const itemNumMax = totalElements - offset;

  return (
    <>
      <Typography variant="body2" sx={{ mt: 4, mb: 1 }}>
        검색 결과 {totalElements}건
      </Typography>
      <Portlet>
        {totalPages > 1 && (
          <PortletHeader>
            <Box>
              <Pagination
                page={pageNumber + 1}
                count={totalPages}
                onChange={(e, page) => onChangePageNumber(page)}
              />
            </Box>
          </PortletHeader>
        )}
        <PortletContent noPadding>
          <TableContainer>
            <Table>
              <CustomColoredTableHead sx={sxTableCellNowrap}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>로그레벨</TableCell>
                  <TableCell>종류</TableCell>
                  <TableCell>실행자</TableCell>
                  <TableCell>실행시간</TableCell>
                  <TableCell>내용</TableCell>
                  <TableCell>관련 JOB</TableCell>
                  <TableCell>관련 PAGE</TableCell>
                  <TableCell>로그 Tag</TableCell>
                  <TableCell>실행자 IP</TableCell>
                  <TableCell>실행 서버</TableCell>
                </TableRow>
              </CustomColoredTableHead>
              <CustomTableBody
                loading={loading}
                sx={flatSx(sxTableCellNowrap, sxTableRowSelection)}
              >
                {elements.map((auditLog, idx) => (
                  <AuditLogRow key={auditLog.logId} seq={itemNumMax - idx} auditLog={auditLog} />
                ))}
              </CustomTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
      </Portlet>
    </>
  );
}
