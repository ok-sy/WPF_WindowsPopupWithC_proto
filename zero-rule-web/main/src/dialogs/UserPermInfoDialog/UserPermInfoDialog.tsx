import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledButton from '@/components/CLStyledButton';
import CLStyledTable from '@/components/CLStyledTable';
import type { CLUser } from '@local/domain';
import { CustomDialog, CustomDialogTitle, Portlet, PortletContent } from '@local/ui';
import {
  Box,
  TableContainer,
  TableRow,
  TableCell,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
  Grid2,
  IconButton,
  Button,
} from '@mui/material';
import { userByPrivSample, userByRoleSample } from './sample-data';
import { rootSx } from './style';

export type UserPermInfoDialogProps = {
  open: boolean;
  onClose: () => void;
  userData: CLUser;
  // onSubmit
};
export default function UserPermInfoDialog(props: UserPermInfoDialogProps) {
  const { userData, open, onClose } = props;
  const { chngDttm, lgonId, regDttm, userId, userNm, userState, lastLgonDttm } = userData;
  const handleCloseDialog = () => {
    onClose();
  };
  return (
    <CustomDialog
      className="UserPermInfoDialog-root"
      sx={rootSx}
      open={open}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="md"
    >
      <CustomDialogTitle title={`${userNm}의 권한정보`} onClose={handleCloseDialog} />
      <DialogContent
        dividers
        sx={{
          '& .MuiTableRow-root > .MuiTableCell-root': {
            '& > .MuiBox-root': {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
            ':nth-of-type(2)': {
              width: 50,
              maxWidth: 70,
            },
          },
        }}
      >
        <Grid2 container columnSpacing={2}>
          <Grid2 size={{ xs: 6 }}>
            <Typography variant="h5" mb={1}>
              Role STAGE
            </Typography>

            <Portlet>
              <PortletContent noPadding>
                <TableContainer>
                  <CLStyledTable noMargin>
                    <CLDocTableHead yPadding="small">
                      <TableRow>
                        <TableCell sx={{ pr: 0 }}>
                          <Box>
                            role name
                            <Button variant="contained" sx={{ minWidth: 30, boxShadow: 0 }}>
                              추가
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <DeleteIcon />
                        </TableCell>
                      </TableRow>
                    </CLDocTableHead>
                    <CLDocTableBody>
                      {userByRoleSample.map((el) => (
                        <TableRow key={el}>
                          <TableCell>{el}</TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <CloseIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </CLDocTableBody>
                  </CLStyledTable>
                </TableContainer>
              </PortletContent>
            </Portlet>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Typography variant="h5" mb={1}>
              Priv STAGE
            </Typography>

            <Portlet>
              <PortletContent noPadding>
                <TableContainer>
                  <CLStyledTable noMargin>
                    <CLDocTableHead yPadding="small">
                      <TableRow>
                        <TableCell sx={{ pr: 0 }}>
                          <Box>
                            priv name
                            <Button variant="contained" sx={{ minWidth: 30, boxShadow: 0 }}>
                              추가
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <DeleteIcon />
                        </TableCell>
                      </TableRow>
                    </CLDocTableHead>
                    <CLDocTableBody>
                      {userByPrivSample.map((el) => (
                        <TableRow key={el}>
                          <TableCell>{el}</TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <CloseIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </CLDocTableBody>
                  </CLStyledTable>
                </TableContainer>
              </PortletContent>
            </Portlet>
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2}>
          <Button onClick={handleCloseDialog} variant="outlined">
            닫기
          </Button>
        </Stack>
      </DialogActions>
    </CustomDialog>
  );
}
