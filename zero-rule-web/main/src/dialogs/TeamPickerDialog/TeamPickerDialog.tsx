import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import handleError from '@/lib/handle-error';
import type { ApiRequestContext } from '@local/domain';

import { useApi } from '@/provider';
import { CustomDialog, CustomDialogTitle, Portlet, PortletContent } from '@local/ui';
import Check from '@mui/icons-material/Check';
import type { SxProps } from '@mui/material';
import {
  Button,
  DialogActions,
  DialogContent,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import TeamPickerTableRow from './components/TeamPickerTableRow';
import type { Team } from '@local/domain';
import errorCustomHandle from '@/lib/error-custom-handle';

export type TeamPickerDialogProps = {
  sx?: SxProps;
  className?: string;
  open: boolean;
  onClose: () => void;
  initialKeyword?: string;
  onSubmit: (teamNm: string, teamId: number) => void;
};

export default function TeamPickerDialog(props: TeamPickerDialogProps) {
  const { sx, className, open, onClose, onSubmit } = props;
  const api = useApi();
  const [keyword, setKeyword] = useState<string | undefined>(() => props.initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState<string | undefined>(
    () => props.initialKeyword,
  );
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useDebounce(() => setDebouncedKeyword(keyword), 300, [keyword]);
  const handleChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value ?? '';
    setKeyword(keyword);
  };

  const [teamList, setTeamList] = useState<Team[]>([]);

  const handleCloseDialog = () => {
    onClose();
  };
  const createTeamPickerHandle = (teamNm: string, teamId: number) => {
    onSubmit(teamNm, teamId);
  };

  // 목록조회
  const doReload = useCallback(
    async (ctx: ApiRequestContext, keyword?: string) => {
      setLoading(true);
      try {
        const { body } = await api.team.list({
          ctx,
          teamNm: keyword ?? '',
        });
        const { teamList } = body;
        if (ctx.canceled) return;
        setTeamList(teamList);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  // 새로 불러오기
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, debouncedKeyword);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, debouncedKeyword]);

  return (
    <CustomDialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        onClose();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
      className="TeamPickerDialog-root"
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiTextField-root': {
          '& .MuiInputBase-root': { borderRadius: 0 },
          width: '100%',
        },
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <CustomDialogTitle onClose={handleCloseDialog}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">TEAM 선택</Typography>
          <TextField
            value={keyword ?? ''}
            onChange={handleChangeKeyword}
            fullWidth
            type="search"
            size="small"
            margin="none"
            label="TEAM 이름"
          />
        </Stack>
      </CustomDialogTitle>
      <DialogContent dividers>
        <Portlet>
          <PortletContent noPadding>
            <TableContainer sx={{ minHeight: '70vh' }}>
              <CLStyledTable noMargin>
                <CLDocTableHead yPadding="small">
                  <TableRow>
                    <TableCell>팀 ID</TableCell>
                    <TableCell>팀 이름</TableCell>
                  </TableRow>
                </CLDocTableHead>
                <CLDocTableBody>
                  {teamList.map((el) => (
                    <TeamPickerTableRow
                      onSubmit={createTeamPickerHandle}
                      key={el.teamId}
                      data={el}
                      onClose={onClose}
                      keyword={keyword}
                    />
                  ))}
                </CLDocTableBody>
              </CLStyledTable>
            </TableContainer>
          </PortletContent>
        </Portlet>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1}></Stack>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} variant="outlined" size="small" startIcon={<Check />}>
            닫기
          </Button>
        </Stack>
      </DialogActions>
    </CustomDialog>
  );
}
