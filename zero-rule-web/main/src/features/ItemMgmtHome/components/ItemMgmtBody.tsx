import { Portlet, PortletContent, PortletHeader, TitleWithReloadButton } from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Box, Button, Stack, Table, TableCell, TableContainer, TableRow } from '@mui/material';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';

export type Dialogs = 'itemDialog' | 'itemRefDialog' | '';

type Props = {
  openDialog: (dialog: Dialogs) => void;
};

const ItemMgmtBody = (props: Props) => {
  const { openDialog } = props;
  const handleClickRefresh = () => {};

  return (
    <Box sx={{ mb: 5 }}>
      <Portlet sx={{ position: 'relative' }}>
        <PortletHeader sx={{ height: 45, minHeight: 45 }}>
          <TitleWithReloadButton title="항목 조회" onClickRefresh={handleClickRefresh} />

          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<AddCircleOutlineIcon />}
              color="success"
              onClick={() => openDialog('itemDialog')}
            >
              신규
            </Button>
          </Stack>
        </PortletHeader>
        <PortletContent noPadding sx={{ minHeight: 250 }}>
          <TableContainer
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            <Table>
              <CLDocTableHead yPadding="small">
                <TableRow>
                  <TableCell>항목ID</TableCell>
                  <TableCell>항목이름</TableCell>
                  <TableCell>데이터타입</TableCell>
                  <TableCell>항목별칭</TableCell>
                  <TableCell>항목설명</TableCell>
                  <TableCell>등록자ID</TableCell>
                  <TableCell>등록일시</TableCell>
                  <TableCell>수정자ID</TableCell>
                  <TableCell>수정일시</TableCell>
                  <TableCell>사용여부</TableCell>
                  <TableCell>수정</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody stripe>
                {/* {elements.map((user, i) => (
                    <UserTableRow onClickRow={userInfoDialogHandle} key={user.userId} user={user} />
                    ))} */}
              </CLDocTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
      </Portlet>
    </Box>
  );
};

export default ItemMgmtBody;
