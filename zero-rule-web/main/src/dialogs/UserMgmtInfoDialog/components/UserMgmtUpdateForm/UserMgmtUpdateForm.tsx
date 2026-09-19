import BbsButton from '@/components/BbsButton';
import LocalTellPrifixSelectBox from '@/components/LocalTellPrifixSelectBox';
import PhonePrifixSelectBox from '@/components/PhonePrifixSelectBox';
import TeamSelectBox from '@/components/TeamSelectBox';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import type { CLUser, CLUserStateKey } from '@local/domain';
import { CLUserState } from '@local/domain';
import { yupResolver } from '@hookform/resolvers/yup';
import { formatEpochSeconds, isEnterOrTabKeyEvent, requestFocusSelector } from '@local/ui';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  Grid2,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { UserUpdateSchemaType } from './user-update-schema';
import { userUpdateSchema } from './user-update-schema';
import errorCustomHandle from '@/lib/error-custom-handle';
import CLCodeListLabel from '@/components/CLCodeListLabel';

const rootSx: SxProps<Theme> = (theme) => ({
  '& .UserMgmtInfoForm-basicInfo': {
    '& > .MuiGrid2-root': {
      '& .MuiTypography-subtitle1': {
        minWidth: 170,
        fontSize: '0.9rem',
        color: theme.palette.primary.main,
      },
      '& .MuiTypography-h5': {
        flex: 1,
      },
    },
  },
});

type Props = {
  userData: CLUser;
  onClose: () => void;
};

export default function UserMgmtUpdateForm(props: Props) {
  const { userData, onClose } = props;
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
    teamId,
    ctiUserNtno,
    userExno,
    userGd,
    teamNm,
    userTno,
    lastPswdChngDttm,
    userId,
    pswdInitYn,
    chngDttm,
    regDttm,
  } = userData;
  const api = useApi();
  const rootRef = useRef();
  const [loading, setLoading] = useState(false);
  const [changeDateStr, changeDate] = formatEpochSeconds(lastLgonDttm ?? 0);

  const [checkDwnlPosbYn, setCheckDwnlPosbYn] = useState<string>(prtPosbYn ?? 'N');
  const [checkAtntYn, setCheckAtntYn] = useState<string>(atntYn ?? 'N');
  const [checkPrtPosbYn, setCheckPrtPosbYn] = useState<string>(dwnlPosbYn ?? 'N');
  const [userTnoPrifix, setUserTnoPrifix] = useState(userTno?.substring(0, 3));
  const [userExnoPrifix, setUserExnoPrifix] = useState(
    userExno?.length === 10
      ? userExno.substring(0, 3)
      : userExno?.length === 9 && userExno.substring(0, 2),
  );
  const [checkPswdInitYn, setCheckPswdInitYn] = useState<string>(pswdInitYn ?? 'N');
  const [selectedTeamId, setSelectedTeamId] = useState<number>();
  const [lastPswdChngDttmStr, lastPwdChng] = formatEpochSeconds(lastPswdChngDttm ?? 0);
  // 등록일시
  const [regDttmStr, regDttmDate] = formatEpochSeconds(regDttm);
  // 변경일시
  const [chngDttmStr, chngDttmDate] = formatEpochSeconds(chngDttm);
  const formConfig = useForm<UserUpdateSchemaType>({
    resolver: yupResolver(userUpdateSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
    defaultValues: {
      bryyMndy,
      memo,
      userName: userNm,
      userTno1: userTno?.substring(3, 7),
      userTno2: userTno?.substring(7, 11),
      userExno1: userExno?.substring(userExno.length - 7, userExno.length - 4),
      userExno2: userExno?.slice(-4),
    },
  });

  useEffect(() => {
    setSelectedTeamId(teamId);
  }, [teamId]);

  //포커스 이동 함수
  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  const doSave = useCallback(
    async (params: {
      userId: number;
      userName: string;
      userState: CLUserStateKey;
      pswdInitYn?: string;
      bryyMndy?: string;
      userTno?: string;
      userExno: string;
      userGd?: string;
      ctiUserNtno?: string;
      prtPosbYn?: string;
      dwnlPosbYn?: string;
      atntYn?: string;
      memo?: string;
      teamId?: string;
    }): Promise<string | null> => {
      try {
        // 수정
        const { body } = await api.userManage.update(params);
        const { lgonId } = body;
        return lgonId;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      }

      return null;
    },
    [api],
  );

  //저장버튼 클릭했을때
  const onSubmitHandle = (data: UserUpdateSchemaType) => {
    if (!userExnoPrifix) return;
    const updateData = {
      userId: userId,
      userName: data.userName,
      userState: userState,
      pswdInitYn: checkPswdInitYn,
      bryyMndy: data.bryyMndy,
      userTno: userTnoPrifix + data.userTno1 + data.userTno2,
      userExno: userExnoPrifix + data.userExno1 + data.userExno2,
      userGd: userGd,
      ctiUserNtno: ctiUserNtno,
      prtPosbYn: checkPrtPosbYn,
      dwnlPosbYn: checkDwnlPosbYn,
      atntYn: checkAtntYn,
      memo: data.memo,
      teamId: selectedTeamId + '',
    };

    doSave(updateData).then((result) => {
      if (!result) {
        onClose();
      }
    });
  };

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;

  const firstLength = () => {
    if (!userExno) return;
    return userExno?.length > 9 ? 3 : 2;
  };

  const canEdit = !isSubmitting && !loading;
  return (
    <>
      <DialogContent dividers className="UserMgmtInfoDialog-content">
        <Box sx={rootSx} ref={rootRef} className="UserMgmtUpdateForm-root">
          <Stack direction="row" justifyContent="space-between" px={4}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h5">로그인 아이디</Typography>
              <Typography variant="subtitle1" color="secondary">
                {lgonId}
              </Typography>
            </Stack>
            <Paper sx={{ px: 1.5, py: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                <Typography color="primary" sx={{ fontSize: '0.85rem', fontWeight: 400 }}>
                  사용자 상태
                </Typography>
                <Chip
                  label={CLUserState[userState]}
                  variant="outlined"
                  color={userState === 'ACTIVE' ? 'success' : 'warning'}
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
                <Typography variant="body1">{}0</Typography>
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
          </Stack>
          <Typography variant="caption">*기본정보</Typography>
          <Paper sx={{ px: 3, py: 2, mb: 0.5 }}>
            <Grid2
              container
              rowSpacing={1.2}
              columnSpacing={6}
              className="UserMgmtInfoForm-basicInfo"
            >
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <TextField
                    {...register('userName')}
                    label="사용자 이름"
                    size="small"
                    fullWidth
                    placeholder="이름을 입력하세요"
                    error={!!errors.userName}
                    helperText={errors.userName?.message}
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=bryyMndy]');
                        }
                      }
                    }}
                  />
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1">팀 선택</Typography>
                  <TeamSelectBox
                    onSelected={(data) => {
                      if (data === undefined) return;
                      setSelectedTeamId(data?.teamId);
                    }}
                    initialValue={{ teamId: teamId, teamNm: teamNm }}
                  />
                </Stack>
              </Grid2>

              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <TextField
                    {...register('bryyMndy')}
                    error={!!errors.bryyMndy}
                    helperText={errors.bryyMndy?.message}
                    label="생년월일"
                    size="small"
                    fullWidth
                    placeholder="생년월일을 입력하세요"
                  />
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack spacing={1} direction="row" alignItems="center">
                  <PhonePrifixSelectBox
                    className="UserMgmtInfoForm-prifixsel"
                    defaultValue={userTno?.substring(0, 3)}
                    onSubmit={(value) => {
                      setUserTnoPrifix(value);
                    }}
                  />
                  <Typography>-</Typography>
                  <TextField
                    {...register('userTno1')}
                    error={!!errors.userTno1}
                    helperText={errors.userTno1?.message}
                    size="small"
                    fullWidth
                    label="전화번호"
                    placeholder="전화번호를 입력하세요"
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=userTno2]');
                        }
                      }
                    }}
                  />
                  <Typography>-</Typography>
                  <TextField
                    {...register('userTno2')}
                    placeholder="전화번호를 입력하세요"
                    label="전화번호"
                    error={!!errors.userTno2}
                    helperText={errors.userTno2?.message}
                    size="small"
                    fullWidth
                  />
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
                <Stack spacing={1} direction="row" alignItems="center">
                  <LocalTellPrifixSelectBox
                    defaultValue={userExno ? userExno.slice(0, firstLength()) : undefined}
                    onSubmit={(value) => {
                      setUserExnoPrifix(value);
                    }}
                  />
                  <Typography>-</Typography>
                  <TextField
                    {...register('userExno1')}
                    error={!!errors.userExno1}
                    helperText={errors.userExno1?.message}
                    label="내선번호"
                    size="small"
                    fullWidth
                    placeholder="내선번호를 입력하세요"
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('input[name=userExno2]');
                        }
                      }
                    }}
                  />
                  <Typography>-</Typography>
                  <TextField
                    {...register('userExno2')}
                    error={!!errors.userExno2}
                    helperText={errors.userExno2?.message}
                    label="내선번호"
                    size="small"
                    fullWidth
                    placeholder="내선번호를 입력하세요"
                    onKeyDown={(e) => {
                      if (isEnterOrTabKeyEvent(e)) {
                        const value = (e.target as HTMLInputElement).value;
                        if (pstring.isNotBlank(value)) {
                          e.preventDefault();
                          focus('textarea[name=memo]');
                        }
                      }
                    }}
                  />
                </Stack>
              </Grid2>
            </Grid2>
          </Paper>
          <Typography variant="caption">*상세정보</Typography>
          <Paper sx={{ px: 3, py: 2 }}>
            <Grid2
              container
              rowSpacing={1.5}
              columnSpacing={6}
              className="UserMgmtInfoForm-basicInfo"
            >
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <TextField
                    label="접속가능 IP"
                    size="small"
                    fullWidth
                    placeholder="IP를 입력하세요"
                  />
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1">다운로드 가능여부</Typography>
                  <RadioGroup value={checkDwnlPosbYn} defaultValue="Y">
                    <Box>
                      <FormControlLabel
                        value="Y"
                        control={
                          <Radio
                            size="small"
                            onChange={(e) => {
                              setCheckDwnlPosbYn(e.target.value);
                            }}
                          />
                        }
                        label="Y"
                      />
                      <FormControlLabel
                        value="N"
                        control={
                          <Radio
                            size="small"
                            onChange={(e) => {
                              setCheckDwnlPosbYn(e.target.value);
                            }}
                          />
                        }
                        label="N"
                      />
                    </Box>
                  </RadioGroup>
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1">등록일</Typography>
                  <Typography variant="body1"> {regDttmStr}</Typography>
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1">야간여부</Typography>
                  <RadioGroup value={checkAtntYn} defaultValue="Y">
                    <Box>
                      <FormControlLabel
                        value="Y"
                        control={
                          <Radio
                            size="small"
                            onChange={(e) => {
                              setCheckAtntYn(e.target.value);
                            }}
                          />
                        }
                        label="Y"
                      />
                      <FormControlLabel
                        value="N"
                        control={
                          <Radio
                            size="small"
                            onChange={(e) => {
                              setCheckAtntYn(e.target.value);
                            }}
                          />
                        }
                        label="N"
                      />
                    </Box>
                  </RadioGroup>
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1">수정일</Typography>
                  <Typography variant="body1"> {chngDttmStr}</Typography>
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1">프린트 가능여부</Typography>
                  <RadioGroup value={checkPrtPosbYn} defaultValue="Y">
                    <Box>
                      <FormControlLabel
                        value="Y"
                        control={
                          <Radio
                            size="small"
                            onChange={(e) => {
                              setCheckPrtPosbYn(e.target.value);
                            }}
                          />
                        }
                        label="Y"
                      />
                      <FormControlLabel
                        value="N"
                        control={
                          <Radio
                            size="small"
                            onChange={(e) => {
                              setCheckPrtPosbYn(e.target.value);
                            }}
                          />
                        }
                        label="N"
                      />
                    </Box>
                  </RadioGroup>
                </Stack>
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <Stack direction="row" alignItems="center">
                  <TextField
                    {...register('memo')}
                    error={!!errors.memo}
                    helperText={errors.memo?.message}
                    label="메모"
                    size="small"
                    fullWidth
                    multiline
                    maxRows={3}
                    minRows={3}
                    placeholder="내용을 입력하세요"
                  />
                </Stack>
              </Grid2>
            </Grid2>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" flex={1} justifyContent="flex-end">
          <Box>
            <BbsButton
              size="small"
              text="저장"
              onClick={handleSubmit(onSubmitHandle)}
              color="secondary"
            />
            <Button size="small" onClick={(_) => onClose()}>
              닫기
            </Button>
          </Box>
        </Stack>
      </DialogActions>
    </>
  );
}
