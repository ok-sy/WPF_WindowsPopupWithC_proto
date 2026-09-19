import { useLoginProfile } from '@/auth/useLoginProfile';
import LocalTellPrifixSelectBox from '@/components/LocalTellPrifixSelectBox';
import PhonePrifixSelectBox from '@/components/PhonePrifixSelectBox';
import TeamSelectBox from '@/components/TeamSelectBox';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { CLCode, CLUser, CLUserCreateParam } from '@local/domain';
import { CustomDialog, CustomDialogTitle, flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { rootSx } from './style';
import {
  birthCheck,
  isEmptyString,
  isHomeNumber,
  isPhoneNumber,
  maxTypingLength,
  saveCheck,
} from './valid';
import { toast } from 'react-toastify';

export type UserMgmtInputDialogProps = {
  sx?: SxProps;
  className?: string;
  open: boolean;
  onClose: () => void;
  users?: number;
};

export default function UserMgmtInputDialog(props: UserMgmtInputDialogProps) {
  const { sx, className, open, onClose, users } = props;
  const api = useApi();
  const rootRef = useRef();
  const login = useLoginProfile();
  // 전화번호
  const [userTnoPrifix, setUserTnoPrifix] = useState<string>('010');
  const [userTno2, setUserTno2] = useState<string>();
  const [userTno3, setUserTno3] = useState<string>();
  // 내선번호
  const [userExnoPrifix, setUserExnoPrifix] = useState<string>('02');
  const [userExno2, setUserExno2] = useState<string>();
  const [userExno3, setUserExno3] = useState<string>();
  // 팀 상태관리
  const [userGdCodeData, setUserGdCodeData] = useState<CLCode[]>([]);
  // 등록 파라미터 데이터
  const [insertParam, setInsertParam] = useState<CLUserCreateParam>({
    lgonId: '',
    userName: '',
    userState: 'ACTIVE',
    regrId: login?.profile.lgonId ?? 'master',
    bryyMndy: '',
    userTno: '',
    userExno: '',
    userGd: '',
    ctiUserNtno: '',
    prtPosbYn: 'Y',
    dwnlPosbYn: 'Y',
    atntYn: 'Y',
  });
  // 에러표시 상태관리
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({
    lgonId: false,
    userName: false,
    bryyMndy: false,
    userTno2: false,
    userTno3: false,
    userExno2: false,
    userExno3: false,
  });
  // 전화번호 합산
  useEffect(() => {
    setInsertParam({ ...insertParam, userTno: userTnoPrifix + userTno2 + userTno3 });
  }, [userTnoPrifix, userTno2, userTno3]);
  // 내선번호 합산
  useEffect(() => {
    setInsertParam({ ...insertParam, userExno: userExnoPrifix + userExno2 + userExno3 });
  }, [userExnoPrifix, userExno2, userExno3]);
  // 사용자 등급 코드 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userGd = await api.clCode.search({
          rowsPerPage: 9999,
          pageNumber: 0,
          codeType: '140',
        });
        setUserGdCodeData(userGd.body.pagerData.elements);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };
    fetchData();
  }, [api]);
  // 저장 API
  const doSave = useCallback(
    async (params: CLUserCreateParam): Promise<CLUser | null> => {
      try {
        // 신규 등록
        await api.userManage.create(params);
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
      return null;
    },
    [api],
  );
  // 저장 버튼
  const onSubmitHandle = () => {
    const valid = saveCheck(insertParam, {
      area: userExnoPrifix,
      middle: userExno2,
      end: userExno3,
    });
    if (valid === '') {
      doSave(insertParam).then((result) => {
        if (!result) {
          onClose();
        }
      });
    } else {
      toast.warn(valid);
    }
  };
  const handleFocus = (field: string) => {
    setTouchedFields({ ...touchedFields, [field]: true });
  };

  return (
    <CustomDialog
      className={clsx('UserMgmtInputDialog-root', className)}
      sx={flatSx(rootSx, sx)}
      fullWidth
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
    >
      <CustomDialogTitle title="사용자 신규등록" onClose={onClose} />
      <DialogContent dividers ref={rootRef}>
        <Grid2 container rowSpacing={2.5} columnSpacing={2}>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              value={insertParam.lgonId}
              onChange={(e) => setInsertParam({ ...insertParam, lgonId: e.target.value })}
              fullWidth
              label="로그인 ID"
              placeholder="로그인 ID를 입력해주세요"
              required
              size="small"
              onFocus={() => handleFocus('lgonId')}
              error={touchedFields.lgonId && isEmptyString(insertParam.lgonId)}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: '#e5e5e5',
                  '& .MuiInputBase-input': {
                    WebkitTextFillColor: '#666',
                  },
                },
              }}
              value="*최초 비밀번호는 자동 셋팅됩니다."
              fullWidth
              disabled
              size="small"
            />
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <TextField
              value={insertParam.userName}
              onChange={(e) => setInsertParam({ ...insertParam, userName: e.target.value })}
              label="성명"
              fullWidth
              size="small"
              placeholder="이름 입력"
              onFocus={() => handleFocus('userName')}
              error={touchedFields.userName && isEmptyString(insertParam.userName)}
            />
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <TextField
              value={insertParam.bryyMndy}
              onChange={(e) => {
                const value = maxTypingLength(e.target.value.replace(/\D/g, ''), 6);
                setInsertParam({ ...insertParam, bryyMndy: value });
              }}
              label="생년월일"
              fullWidth
              size="small"
              placeholder="ex) 960315"
              onFocus={() => handleFocus('bryyMndy')}
              error={touchedFields.bryyMndy && !birthCheck.test(insertParam.bryyMndy ?? '')}
            />
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack spacing={1} direction="row" alignItems="center">
              <PhonePrifixSelectBox
                defaultValue={userTnoPrifix}
                onSubmit={(value) => {
                  setUserTnoPrifix(value);
                }}
              />
              <Typography>-</Typography>
              <TextField
                value={userTno2}
                onFocus={() => handleFocus('userTno2')}
                error={touchedFields.userTno2 && isPhoneNumber(userTno2)}
                onChange={(e) => {
                  const value = maxTypingLength(e.target.value.replace(/\D/g, ''), 4);
                  setUserTno2(value);
                }}
                size="small"
                label="전화번호"
                placeholder="4자리입력"
                fullWidth
              />
              <Typography>-</Typography>
              <TextField
                value={userTno3}
                onFocus={() => handleFocus('userTno3')}
                error={touchedFields.userTno3 && isPhoneNumber(userTno3)}
                onChange={(e) => {
                  const value = maxTypingLength(e.target.value.replace(/\D/g, ''), 4);
                  setUserTno3(value);
                }}
                size="small"
                label="전화번호"
                placeholder="4자리입력"
                fullWidth
              />
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Stack spacing={1} direction="row" alignItems="center">
              <LocalTellPrifixSelectBox
                defaultValue={userExnoPrifix}
                onSubmit={(value) => {
                  setUserExnoPrifix(value);
                }}
                className="UserMgmtInputDialog-officePhone"
              />
              <Typography>-</Typography>
              <TextField
                value={userExno2}
                onChange={(e) => {
                  const vluae = maxTypingLength(e.target.value.replace(/\D/g, ''), 4);
                  setUserExno2(vluae);
                }}
                onFocus={() => handleFocus('userExno2')}
                error={touchedFields.userExno2 && isHomeNumber(userExno2)}
                size="small"
                fullWidth
                label="내선번호"
                placeholder="3-4자리력"
              />
              <Typography>-</Typography>
              <TextField
                value={userExno3}
                onChange={(e) => {
                  const vluae = maxTypingLength(e.target.value.replace(/\D/g, ''), 4);
                  setUserExno3(vluae);
                }}
                size="small"
                fullWidth
                onFocus={() => handleFocus('userExno3')}
                error={touchedFields.userExno3 && isPhoneNumber(userExno3)}
                label="내선번호"
                placeholder="4자리입력"
              />
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>사용자 등급</InputLabel>
              <Select
                label="사용자 등급"
                size="small"
                value={insertParam.userGd}
                onChange={(e) => {
                  setInsertParam({
                    ...insertParam,
                    userGd: e.target.value,
                  });
                }}
              >
                {userGdCodeData.map((el, idx) => {
                  return (
                    <MenuItem key={el.code} value={el.code}>
                      {el.codeNm}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <TeamSelectBox
              placeholder="팀 이름 검색"
              onSelected={(e) => {
                setInsertParam({ ...insertParam, teamId: e?.teamId });
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              value={insertParam.memo}
              onChange={(e) => setInsertParam({ ...insertParam, memo: e.target.value })}
              label="메모"
              fullWidth
              className="UserMgmtInputDialog-memo"
              multiline
              minRows={5}
              maxRows={5}
              placeholder="메모할 내용 입력"
            />
          </Grid2>

          <Grid2 size={{ xs: 4 }}>
            <FormControl fullWidth>
              <FormLabel>프린터 사용여부</FormLabel>
              <RadioGroup>
                <Stack direction="row">
                  <FormControlLabel
                    checked={insertParam.prtPosbYn === 'Y'}
                    defaultChecked
                    onChange={(e) => {
                      setInsertParam({ ...insertParam, prtPosbYn: 'Y' });
                    }}
                    control={<Radio size="small" />}
                    label="Y"
                  />
                  <FormControlLabel
                    checked={insertParam.prtPosbYn === 'N'}
                    onChange={(e) => {
                      setInsertParam({ ...insertParam, prtPosbYn: 'N' });
                    }}
                    control={<Radio size="small" />}
                    label="N"
                  />
                </Stack>
              </RadioGroup>
            </FormControl>
          </Grid2>
          <Grid2 size={{ xs: 4 }}>
            <FormControl fullWidth>
              <FormLabel>다운로드 가능여부</FormLabel>
              <RadioGroup>
                <Stack direction="row">
                  <FormControlLabel
                    checked={insertParam.dwnlPosbYn === 'Y'}
                    onChange={(e) => setInsertParam({ ...insertParam, dwnlPosbYn: 'Y' })}
                    control={<Radio size="small" />}
                    label="Y"
                  />
                  <FormControlLabel
                    checked={insertParam.dwnlPosbYn === 'N'}
                    onChange={(e) => setInsertParam({ ...insertParam, dwnlPosbYn: 'N' })}
                    control={<Radio size="small" />}
                    label="N"
                  />
                </Stack>
              </RadioGroup>
            </FormControl>
          </Grid2>
          <Grid2 size={{ xs: 4 }}>
            <FormControl fullWidth>
              <FormLabel>야간 여부</FormLabel>
              <RadioGroup>
                <Stack direction="row">
                  <FormControlLabel
                    checked={insertParam.atntYn === 'Y'}
                    onChange={(e) => setInsertParam({ ...insertParam, atntYn: 'Y' })}
                    control={<Radio size="small" />}
                    label="Y"
                  />
                  <FormControlLabel
                    checked={insertParam.atntYn === 'N'}
                    onChange={(e) => setInsertParam({ ...insertParam, atntYn: 'N' })}
                    control={<Radio size="small" />}
                    label="N"
                  />
                </Stack>
              </RadioGroup>
            </FormControl>
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmitHandle} size="small" variant="contained">
          등록
        </Button>

        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}
