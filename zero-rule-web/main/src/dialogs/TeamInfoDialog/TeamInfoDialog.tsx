import BbsButton from '@/components/BbsButton';
import CLCodeListView from '@/components/CLCodeListView';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import type { ApiRequestContext, Team, TeamForUser } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  LinearProgress,
  Paper,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { teamUpdateDialogFormType } from './TeamUpdateDialog-form-schema';
import { teamUpdateDialogFormSchema } from './TeamUpdateDialog-form-schema';
import TeamOfUserTableRow from './components/TeamOfUserTableRow/TeamOfUserTableRow';

const rootSx: SxProps<Theme> = (theme) => ({
  '& .TeamInfoDialog-body': {
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
    '& .TeamInfoDialog-content': {
      display: 'flex',
    },
  },
});

export type TeamInfoDialogProps = {
  open: boolean;
  onClose: () => void;
  teamId: number;
};

export default function TeamInfoDialog(props: TeamInfoDialogProps) {
  const { teamId, open, onClose } = props;
  const api = useApi();
  const rootRef = useRef();

  const [loading, setLoading] = useState(false);
  // 편집모드 핸들러
  const [editHandler, setEditHandler] = useState(false);

  // 서버에서 불러와진 팀 상세정보
  const [teamInfo, setTeamInfo] = useState<Team>();

  // TextField label의 표시오류: form을 리마운트 하기 위한 key값
  const [formResetToken, setFormResetToken] = useState(0);

  // 팀 업무 구분
  const [teamTskClsfValue, setTeamTskClsfValue] = useState<number>();

  // 팀별 사용자 목록 데이터
  const [teamForUserData, setTeamForUserData] = useState<TeamForUser[]>([]);

  const handleCloseDialog = () => {
    onClose();
  };
  const formConfig = useForm<teamUpdateDialogFormType>({
    resolver: yupResolver(teamUpdateDialogFormSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
    defaultValues: { teamExpl: '', teamNm: '' },
  });
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  //포커스 이동 함수
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  const doLoadInfo = useCallback(
    async (ctx: ApiRequestContext, paramTeamId: number) => {
      try {
        setLoading(true);
        const { body: body1 } = await api.team.info({ ctx, teamId: paramTeamId });
        const { team } = body1;
        setTeamInfo(team);
        setTeamTskClsfValue(team.teamTskClsf);
        reset({ teamExpl: team.teamExpl, teamNm: team.teamNm });
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api, reset],
  );
  // 팀별 사용자 목록 조회
  const teamForUser = useCallback(
    async (ctx: ApiRequestContext, teamId: number) => {
      try {
        setLoading(true);
        const { body } = await api.team.teamForUser({ ctx, teamId });
        const { teamForUser } = body;
        setTeamForUserData(teamForUser);
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadInfo(ctx, teamId);
    teamForUser(ctx, teamId);
    return () => {
      ctx.cancel?.();
      ctx.canceled = true;
    };
  }, [teamId, doLoadInfo, editHandler, formResetToken, teamForUser]);

  const doUpdate = useCallback(
    async (params: {
      teamId: number;
      teamNm: string;
      teamExpl?: string;
      teamTskClsf?: number;
    }): Promise<number | null> => {
      setLoading(true);
      try {
        const { body } = await api.team.update(params);
        const { uptCnt } = body;
        toast.success('수정이 완료되었습니다');
        return uptCnt;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );

  const onSubmitHandle = (data: teamUpdateDialogFormType) => {
    const updateData = {
      teamId: teamInfo?.teamId ?? 0,
      teamNm: data.teamNm,
      teamExpl: data.teamExpl,
      teamTskClsf: teamTskClsfValue,
    };
    doUpdate(updateData).then((result) => {
      if (result) {
        onClose();
      }
    });
  };

  const canEdit = !isSubmitting && !loading;

  return (
    <CustomDialog
      className="TeamInfoDialog-root"
      maxWidth="lg"
      fullWidth
      sx={rootSx}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleCloseDialog();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
    >
      <CustomDialogTitle title="TEAM 정보" onClose={handleCloseDialog}></CustomDialogTitle>
      <DialogContent dividers className="TeamInfoDialog-body">
        {teamInfo && (
          <Stack className="TeamInfoDialog-content" direction="row" spacing={2} height={400}>
            <Box sx={{ flex: 1 }} ref={rootRef}>
              <Typography variant="caption">*팀 정보</Typography>
              <Paper sx={{ p: 4, height: 370 }}>
                <Stack spacing={5}>
                  <TextField
                    {...register('teamNm')}
                    label="팀명"
                    size="small"
                    fullWidth
                    error={!!errors.teamNm}
                    helperText={errors.teamNm?.message}
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=teamExpl]');
                        }
                      }
                    }}
                  />
                  <TextField
                    {...register('teamExpl')}
                    label="팀 설명"
                    size="small"
                    fullWidth
                    multiline
                    maxRows={5}
                    minRows={5}
                    error={!!errors.teamExpl}
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=teamExpl]');
                        }
                      }
                    }}
                  />

                  <CLCodeListView
                    displayType="radio"
                    codeType="503"
                    radioValues={teamInfo?.teamTskClsf}
                    radioOnChange={(e) => {
                      setTeamTskClsfValue(e);
                    }}
                  />
                </Stack>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption">*팀원 정보</Typography>
              <Paper>
                <TableContainer sx={{ backgroundColor: '#fff', height: 370 }}>
                  <CLStyledTable noMargin>
                    <CLDocTableHead>
                      <TableRow>
                        <TableCell>사용자 아이디</TableCell>
                        <TableCell>로그인 아이디</TableCell>
                        <TableCell>사용자 이름</TableCell>
                      </TableRow>
                    </CLDocTableHead>
                    <CLDocTableBody>
                      {teamForUserData.map((el, idx) => {
                        return <TeamOfUserTableRow key={el.userId} data={el} seq={idx + 1} />;
                      })}
                    </CLDocTableBody>
                  </CLStyledTable>
                </TableContainer>
              </Paper>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Stack direction="row" flex={1} justifyContent="flex-end">
          <Button
            disabled={!isValid}
            size="small"
            variant="contained"
            onClick={handleSubmit(onSubmitHandle)}
          >
            저장
          </Button>
          <Button size="small" variant="outlined" onClick={handleCloseDialog}>
            닫기
          </Button>
        </Stack>
      </DialogActions>
      {loading && (
        <Box sx={{ position: 'absolute', top: 50, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
    </CustomDialog>
  );
}
