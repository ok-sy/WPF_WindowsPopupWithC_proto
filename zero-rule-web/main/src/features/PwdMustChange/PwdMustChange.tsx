import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { Link, Portlet, PortletContent, PortletFooter, PortletHeader } from '@local/ui';
import type { Theme } from '@mui/material';
import { Box, Button, IconButton, Typography, Stack } from '@mui/material';
import type { NextPage } from 'next';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import PwdChangeForm from '@/components/PwdChangeForm/PwdChangeForm';
import type { SxProps } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { routerPush } from '@/lib/urls';
import { useEffect, useCallback, useState } from 'react';
import type { UserProfile } from '@local/domain';
import { isLoginError } from '@local/domain';
import handleError from '@/lib/handle-error';
import { LoginProfileEvent } from '@/auth/authentication';
import { LOGOUT_PAGE } from '@/constants';
import { toast } from 'react-toastify';
import errorCustomHandle from '@/lib/error-custom-handle';

const rootSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: 'url(/images/login/loginBg_img.png) #162A56',
};

export default function PwdMustChange() {
  const api = useApi();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oldPwd, setOldPwd] = useState<string>();
  const [pwd, setPwd] = useState<string>();
  const [profile, setProfile] = useState<UserProfile>();
  const [isValid, setIsValid] = useState<boolean>();

  const isLoggedIn = !!profile;

  const doLoadProfileMe = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.profile.profileMe({ ctx });
        const { profile } = body;
        setProfile(profile);
      } catch (err) {
        if (isLoginError(err)) {
          toast.warn('로그인이 필요합니다');
          routerPush(LOGOUT_PAGE);
          return;
        }

        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadProfileMe(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doLoadProfileMe]);

  const doSaveNewPassword = useCallback(
    async (oldPassword: string, password: string): Promise<UserProfile | null> => {
      try {
        setSaving(true);
        const { body } = await api.user.updatePassword({ oldPswd: oldPassword, pswd: password });
        const { profile } = body;
        return profile;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setSaving(false);
      }
      return null;
    },
    [api],
  );

  const handleClickSaveBtn = () => {
    if (!pwd) return;
    if (!oldPwd) return;
    doSaveNewPassword(oldPwd, pwd).then((profile) => {
      if (profile) {
        LoginProfileEvent.send(profile);
        routerPush('/');
      }
    });
  };

  return (
    <Box sx={rootSx}>
      <Portlet sx={{ position: 'relative', width: '40vw' }}>
        <PortletHeader sx={{ justifyContent: 'center' }}>
          <IconButton
            onClick={() => {
              routerPush('/login');
            }}
            sx={{ position: 'absolute', left: 5 }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography
            sx={{
              em: {
                color: 'secondary.main',
                fontStyle: 'normal',
              },
            }}
            variant="h5"
          >
            {' '}
            <em>{profile?.lgonId}</em>의 비밀번호 재설정
          </Typography>
        </PortletHeader>
        <PortletContent>
          <PwdChangeForm
            onValid={(valid) => setIsValid(valid)}
            onSubmit={(oldPwd, newPwd) => {
              setOldPwd(oldPwd);
              setPwd(newPwd);
            }}
          />
        </PortletContent>
        <PortletFooter
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography>
            본인이 아니라면 <Link href={LOGOUT_PAGE}>로그아웃</Link> 해주세요
          </Typography>
          <Button
            onClick={handleClickSaveBtn}
            disabled={loading || saving || !isValid}
            color="secondary"
          >
            변경
          </Button>
        </PortletFooter>
      </Portlet>
    </Box>
  );
}
