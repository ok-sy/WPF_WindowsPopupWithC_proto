import { useLoginProfile } from '@/auth/useLoginProfile';
import BbsButton from '@/components/BbsButton';
import CLCodeListView from '@/components/CLCodeListView';
import CLStyledButton from '@/components/CLStyledButton';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { yupResolver } from '@hookform/resolvers/yup';
import { CustomDialog, CustomDialogTitle, flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Grid2,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { rootSx } from './style';
import type { TeamMgmtDialogDataType } from './team-mgmt-schema';
import { teamMgmtDialogFormSchema } from './team-mgmt-schema';
import errorCustomHandle from '@/lib/error-custom-handle';

export type TskClsf = {
  value: number;
  name: string;
};
export const TSK_CLSF_MAP: TskClsf[] = [
  {
    value: 0,
    name: '무소속',
  },
  {
    value: 1,
    name: '카드',
  },
  {
    value: 2,
    name: '회원',
  },
  {
    value: 3,
    name: '가맹점',
  },
  {
    value: 4,
    name: '승인',
  },
];

export type TeamInputDialogProps = {
  sx?: SxProps;
  className?: string;
  open: boolean;
  onClose: () => void;

  // onSubmit
};

type psnlStupAcceYnCheckedType = 'Y' | 'N';
type TeamStatSelectedType = 0 | 1;
export default function TeamInputDialog(props: TeamInputDialogProps) {
  const { sx, className, open, onClose } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const login = useLoginProfile();

  // 개인설정 허용 여부
  const [psnlStupAcceYnChecked, setPsnlStupAcceYnChecked] =
    useState<psnlStupAcceYnCheckedType>('Y');

  // 팀 상태
  const [teamStatSelected, setTeamStatSelected] = useState<TeamStatSelectedType>(0);

  // 팀 업무 구분
  const [teamTskClsfRadio, setTeamTskClsfRadio] = useState('');
  const [teamTskClsfValue, setTeamTskClsfValue] = useState<number>();

  const formConfig = useForm<TeamMgmtDialogDataType>({
    resolver: yupResolver(teamMgmtDialogFormSchema),
    mode: 'all',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formConfig;

  const handleCloseDialog = () => {
    onClose();
  };

  // 포커스 이동 함수

  // 저장하기 서버 전송
  const doSave = useCallback(
    async (params: {
      teamNm: string;
      teamExpl?: string;
      psnlStupAcceYn: 'Y' | 'N';
      teamCmmnStupCn?: string; // null 값 들어가면 됨
      teamStat?: number;
      teamTskClsf?: number; // 공통코드 들어갈 부분
      regrId: string;
      chgrId: string;
    }): Promise<number | null> => {
      try {
        const { body } = await api.team.create(params);
        const { instCnt } = body;
        toast.success('등록되었습니다.');
        return instCnt;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
      }
      return null;
    },
    [api],
  );

  // const  = () => {}
  const onSubmitHandle = (data: TeamMgmtDialogDataType) => {
    const regrId = login?.profile.userId ?? 'master';
    const chgrId = login?.profile.userId ?? 'master';

    if (!data.teamNm) return;
    const dataSet = {
      teamNm: data.teamNm,
      teamExpl: data.teamExpl,
      psnlStupAcceYn: psnlStupAcceYnChecked,
      teamCmmnStupCn: data.teamCmmnStupCn,
      teamStat: teamStatSelected,
      teamTskClsf: teamTskClsfValue as number,
      regrId: String(regrId),
      chgrId: String(chgrId),
    };

    doSave(dataSet).then((result) => {
      if (result) {
        onClose();
      }
    });
    onClose();
  };

  const canEdit = !isSubmitting && !loading && !saving;

  return (
    <CustomDialog
      className={clsx('TeamInputDialog-root', className)}
      sx={flatSx(rootSx, sx)}
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
      <CustomDialogTitle title="TEAM 신규등록" onClose={handleCloseDialog} />
      <DialogContent dividers>
        <FormProvider {...formConfig}>
          <Grid2 container rowSpacing={2.5} columnSpacing={2}>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                {...register('teamNm')}
                label="팀 이름"
                placeholder="팀 이름을 입력해주세요"
                size="small"
                fullWidth
                disabled={!canEdit}
                error={!!errors.teamNm}
                helperText={errors.teamNm?.message}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                {...register('teamExpl')}
                label="팀 설명"
                placeholder="팀 설명을 입력해주세요"
                size="small"
                fullWidth
              />
            </Grid2>
            <Grid2 size={{ xs: 3 }}>
              <FormControl fullWidth>
                <FormLabel>개인설정 허용 여부</FormLabel>
                <RadioGroup>
                  <Stack direction="row">
                    <FormControlLabel
                      checked={psnlStupAcceYnChecked === 'Y'}
                      onChange={(e) => setPsnlStupAcceYnChecked('Y')}
                      control={<Radio size="small" />}
                      label="Y"
                    />
                    <FormControlLabel
                      checked={psnlStupAcceYnChecked === 'N'}
                      onChange={(e) => setPsnlStupAcceYnChecked('N')}
                      control={<Radio size="small" />}
                      label="N"
                    />
                  </Stack>
                </RadioGroup>
              </FormControl>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                {...register('teamCmmnStupCn')}
                label="팀 공통 설정 내용"
                size="small"
                fullWidth
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>팀 상태</InputLabel>
                <Select
                  label="팀 상태"
                  size="small"
                  value={teamStatSelected}
                  onChange={(e) => {
                    setTeamStatSelected(e.target.value as TeamStatSelectedType);
                  }}
                >
                  <MenuItem value={0}>0</MenuItem>
                  <MenuItem value={1}>1</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <CLCodeListView
                displayType="radio"
                codeType="503"
                radioOnChange={(radioValue) => {
                  const tmp = TSK_CLSF_MAP.filter((el) => el.value === radioValue);
                  setTeamTskClsfRadio(tmp[0]?.name);
                  setTeamTskClsfValue(tmp[0]?.value);
                }}
              />
            </Grid2>
          </Grid2>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button
          size="small"
          onClick={handleSubmit(onSubmitHandle)}
          color="secondary"
          variant="outlined"
        >
          등록
        </Button>
        <Button onClick={handleCloseDialog} size="small" variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
