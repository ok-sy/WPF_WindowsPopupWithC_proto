import CLCodeListLabel from '@/components/CLCodeListLabel';
import CLStyledTextField from '@/components/CLStyledTextField';
import TeamSelectBox from '@/components/TeamSelectBox';
import type { ClientPswdMustChangeDialogProps } from '@/dialogs/ClientPswdMustChangeDialog';
import ClientPswdMustChangeDialog from '@/dialogs/ClientPswdMustChangeDialog';
import type { PswdMustChangeDialogProps } from '@/dialogs/PswdMustChangeDialog';
import PswdMustChangeDialog from '@/dialogs/PswdMustChangeDialog';
import { tellFormat } from '@/lib/conversion-tell-number';
import { routerPush } from '@/lib/urls';
import { useApi } from '@/provider';
import type { CLUser } from '@local/domain';
import { CLUserState } from '@local/domain';
import { formatEpochSeconds } from '@local/ui';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, Chip, Paper, Stack, Typography, Grid2 } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';

const rootSx: SxProps<Theme> = (theme) => ({
  '& .UserMgmtInfoForm-basicInfo': {
    '& > .MuiGrid2-root': {
      '& .MuiTypography-subtitle1': {
        minWidth: 170,
        fontSize: '0.95rem',
        fontWeight: 500,
        // color: theme.palette.primary.main,
      },
      '& .MuiTypography-body1': {
        flex: 1,
        fontSize: '0.9rem',
      },
    },
  },
});

type Props = {
  userData: CLUser;
  normalUserMode: boolean;
  clientVersion?: boolean;
};

type DialogId = 'PswdMustChangeDialog' | 'ClientPswdMustChangeDialog';
export default function UserMgmtInfoForm(props: Props) {
  const { userData, normalUserMode, clientVersion } = props;
  const {
    lgonId,
    userNm,
    userState,
    lastLgonDttm,
    atntYn,
    bryyMndy,
    dwnlPosbYn,
    memo,
    prtPosbYn,
    teamNm,
    teamId,
    userExno,
    userGd,
    userTno,
    lgonFailCnt,
    lastPswdChngDttm,
    userId,
    chngDttm,
    regDttm,
  } = userData;
  const [changeDateStr, changeDate] = formatEpochSeconds(lastLgonDttm ?? 0);
  const [lastPswdChngDttmStr, lastPwdChng] = formatEpochSeconds(lastPswdChngDttm ?? 0);
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [pswdMustChangeDialogProps, setPswdMustChangeDialogProps] =
    useState<PswdMustChangeDialogProps>();
  const [clientPswdMustChangeDialogProps, setClientPswdMustChangeDialogProps] =
    useState<ClientPswdMustChangeDialogProps>();
  // 등록일시
  const [regDttmStr, regDttmDate] = formatEpochSeconds(regDttm);

  // 변경일시
  const [chngDttmStr, chngDttmDate] = formatEpochSeconds(chngDttm);

  const closeDialog = () => {
    setDialogId(undefined);
    setPswdMustChangeDialogProps(undefined);
    setClientPswdMustChangeDialogProps(undefined);
  };

  // 비밀번호 변경 다이어로그
  const pwdChangeHandle = () => {
    setDialogId('PswdMustChangeDialog');
    setPswdMustChangeDialogProps({
      open: true,
      data: userData,
      onClose: () => {
        closeDialog();
        // 변경하고 화면에 표시될 정보가 있을시 refresh 넣으면 됨
      },
      clientVersion: clientVersion,
    });
  };

  const clientPwdChangeHandle = () => {
    setDialogId('ClientPswdMustChangeDialog');
    setClientPswdMustChangeDialogProps({
      open: true,
      data: userData,
      onClose: () => {
        closeDialog();
        // 변경하고 화면에 표시될 정보가 있을시 refresh 넣으면 됨
      },
      clientVersion: clientVersion,
    });
  };

  const handleClickChangeBtn = () => {
    pwdChangeHandle();
  };

  return (
    <Box sx={rootSx} className="UserMgmtInfoForm-root">
      <Stack spacing={1} direction="row" justifyContent="space-between" px={4}>
        <Stack flex={1} direction="row" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5">로그인 아이디 </Typography>
            <Typography variant="subtitle1" color="secondary">
              {lgonId}
            </Typography>
          </Stack>
          {!normalUserMode ? (
            <Stack spacing={0.5}>
              <Button
                sx={{ backgroundColor: '#fff' }}
                endIcon={<AutorenewIcon />}
                color="primary"
                size="small"
                variant="outlined"
                onClick={handleClickChangeBtn}
              >
                비밀번호 초기화
              </Button>
              <Button
                sx={{ backgroundColor: '#fff' }}
                endIcon={<LockOpenIcon />} //
                color="primary"
                size="small"
                variant="outlined"
              >
                사용자 잠금해제
              </Button>
            </Stack>
          ) : (
            <Stack spacing={0.5} justifyContent="center">
              <Button
                sx={{ backgroundColor: '#fff' }}
                endIcon={<AutorenewIcon />}
                color="primary"
                size="medium"
                variant="outlined"
                onClick={() => {
                  if (clientVersion) {
                    clientPwdChangeHandle();
                  } else {
                    routerPush('/pwd-must-change');
                  }
                }}
              >
                비밀번호 변경
              </Button>
            </Stack>
          )}
        </Stack>
        {!clientVersion && (
          <Paper sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
              <Typography color="primary" sx={{ fontSize: '0.85rem', fontWeight: 400 }}>
                사용자 상태
              </Typography>
              <Chip
                label={CLUserState[userState]}
                variant="outlined"
                color={userState === 'ACTIVE' ? 'secondary' : 'warning'}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
              <Typography color="primary" sx={{ fontSize: '0.85rem', fontWeight: 400 }}>
                로그인 실패횟수
              </Typography>
              <Typography variant="body1">{lgonFailCnt}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
              <Typography color="primary" sx={{ fontSize: '0.85rem', fontWeight: 400 }}>
                최종 로그인일시
              </Typography>
              <Typography variant="body1">{changeDateStr ?? '-'}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
              <Typography color="primary" sx={{ fontSize: '0.85rem', fontWeight: 400 }}>
                최종 비밀번호 변경일
              </Typography>
              <Typography variant="body1">{lastPswdChngDttmStr ?? '-'}</Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
      <Typography variant="caption">*기본정보</Typography>
      <Paper sx={{ px: 3, py: 2, mb: 0.5 }}>
        <Grid2 container rowSpacing={1.2} columnSpacing={6} className="UserMgmtInfoForm-basicInfo">
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">사용자 이름</Typography>
              <Typography variant="body1">{userNm}</Typography>
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">팀</Typography>

              <TeamSelectBox readOnly initialValue={{ teamId: teamId, teamNm: teamNm }} />
            </Stack>
          </Grid2>

          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">생년월일</Typography>
              <Typography variant="body1">
                {bryyMndy
                  ? `${bryyMndy?.substring(0, 2)}-${bryyMndy?.substring(
                      2,
                      4,
                    )}-${bryyMndy?.substring(4, 6)}`
                  : '-'}
              </Typography>
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">전화번호</Typography>
              <Typography variant="body1"> {userTno ? tellFormat(userTno) : '-'}</Typography>
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">사용자 등급</Typography>
              <Typography variant="body1">
                <CLCodeListLabel code={userGd} codeType="140" />
              </Typography>
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">내선번호</Typography>
              <Typography variant="body1"> {userExno ? tellFormat(userExno) : '-'}</Typography>
            </Stack>
          </Grid2>
        </Grid2>
      </Paper>

      <Typography variant="caption">*상세정보</Typography>
      <Paper sx={{ px: 3, py: 2 }}>
        <Grid2 container rowSpacing={1.5} columnSpacing={6} className="UserMgmtInfoForm-basicInfo">
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">접속가능 IP</Typography>
              <Typography variant="body1">-</Typography>
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">다운로드 가능여부</Typography>
              <Chip
                label={dwnlPosbYn === 'Y' ? '가능' : '불가능'}
                variant="outlined"
                color="secondary"
                size="small"
                sx={{
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
          </Grid2>
          {!clientVersion && (
            <Grid2 size={{ xs: 6 }}>
              <Stack direction="row" alignItems="center">
                <Typography variant="subtitle1">등록일</Typography>
                <Typography variant="body1">{regDttmStr}</Typography>
              </Stack>
            </Grid2>
          )}

          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">야간여부</Typography>
              <Chip
                label={atntYn === 'Y' ? '가능' : '불가능'}
                variant="outlined"
                color="secondary"
                size="small"
                sx={{
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
          </Grid2>
          {!clientVersion && (
            <Grid2 size={{ xs: 6 }}>
              <Stack direction="row" alignItems="center">
                <Typography variant="subtitle1">수정일</Typography>
                <Typography variant="body1">{chngDttmStr}</Typography>
              </Stack>
            </Grid2>
          )}

          <Grid2 size={{ xs: 6 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">프린트 가능여부</Typography>
              <Typography variant="body1">
                {}
                <Chip
                  label={prtPosbYn === 'Y' ? '가능' : '불가능'}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                  }}
                />
              </Typography>
            </Stack>
          </Grid2>
          {!clientVersion && (
            <Grid2 size={{ xs: 12 }}>
              <Stack direction="row" alignItems="center">
                <Typography variant="subtitle1">메모</Typography>
                <CLStyledTextField
                  multiline
                  maxRows={5}
                  minRows={5}
                  sx={{ flex: 1 }}
                  fullWidth
                  readOnly
                  value={memo ?? '-'}
                />
              </Stack>
            </Grid2>
          )}
        </Grid2>
      </Paper>
      {dialogId === 'PswdMustChangeDialog' && pswdMustChangeDialogProps && (
        <PswdMustChangeDialog {...pswdMustChangeDialogProps} />
      )}
      {dialogId === 'ClientPswdMustChangeDialog' && clientPswdMustChangeDialogProps && (
        <ClientPswdMustChangeDialog {...clientPswdMustChangeDialogProps} />
      )}
    </Box>
  );
}
