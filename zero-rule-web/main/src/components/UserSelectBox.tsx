import type { UserPickerDialogProps } from '@/dialogs/UserPickerDialog';
import UserPickerDialog from '@/dialogs/UserPickerDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLUser } from '@local/domain';
import { flatSx, isEnterKeyEvent } from '@local/ui';
import SearchIcon from '@mui/icons-material/Search';
import type { SxProps } from '@mui/material';
import { alpha, Box, IconButton, InputBase, Stack, Typography } from '@mui/material';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type DialogId = 'UserPickerDialog';

type Props = {
  initValue?: { lgonId: string; userNm: string };
  sx?: SxProps;
  className?: string;
  style?: CSSProperties;
  onSelected?: (user: CLUser) => void;
  placeholder?: string;
  readOnly?: boolean;
};
/**
 * 
 * @Author JinWooSim
 * 사용자를 선택할수 있는 컴포넌트입니다
 * 사용자 목록을 확인할 수 있습니다.
 * 초기값을 넣어줄 수 있고, readOnly를 지원합니다. 
 * onSelected를 이용해 CLUser타입을 리턴합니다.
 * @returns CLUser

 */
export default function UserSelectBox(props: Props) {
  const { initValue, sx, className, style, placeholder, onSelected, readOnly = false } = props;
  const api = useApi();
  // 유저이름 엔티티
  const [userEntity, setUserEntity] = useState<{ lgonId?: string; userNm?: string } | undefined>(
    initValue,
  );
  const [loading, setLoading] = useState(false);

  // focus 여부, focus되었을때 강조하기 위해서
  const [focused, setFocused] = useState(false);
  // 팀 선택 다이얼로그
  const [dialogId, setDialogId] = useState<DialogId>();
  const [userPickerDialogProps, setUserPickerDialogProps] = useState<UserPickerDialogProps>();
  const [inputValue, setInputValue] = useState<string>();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const apiCtxRef = useRef<ApiRequestContext | null>({ canceled: false });

  const cancelApiCall = useCallback(() => {
    if (apiCtxRef.current) {
      apiCtxRef.current.canceled = true;
      apiCtxRef.current.cancel?.();
      apiCtxRef.current = null;
    }
  }, []);

  // unmount시 api 호출 cancel
  useEffect(() => {
    return cancelApiCall;
  }, [cancelApiCall]);

  const closeDialog = () => {
    setDialogId(undefined);
    setUserPickerDialogProps(undefined);
  };

  // 사용자 선택 다이어로그
  const openUserPickerDialog = (keyword?: string) => {
    setDialogId('UserPickerDialog');
    setUserPickerDialogProps({
      open: true,
      onClose: closeDialog,
      onSubmit: (user: CLUser) => {
        const userEntity = { lgonId: user.lgonId, userNm: user.userNm };
        setUserEntity(userEntity);
        setInputValue(undefined);
        if (!user) return;
        onSelected?.(user);
      },
      initialKeyword: keyword,
    });
  };

  // 연락처 이름으로 검색, 최대 2건 조회
  const doSearch = useCallback(
    async (keyword: string): Promise<CLUser[] | null> => {
      cancelApiCall();
      const ctx = { canceled: false } as ApiRequestContext;
      apiCtxRef.current = ctx;
      try {
        setLoading(true);
        const { body } = await api.userManage.list({
          keyword: keyword,
          rowsPerPage: 999,
          pageNumber: 0,
        });
        const { pagerData } = body;
        return pagerData.elements;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api, cancelApiCall],
  );

  // 입력값 변경시
  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = (e.target.value ?? '') as string;
    setInputValue(value);
    if (value.length === 0) {
      // 입력값을 지웠으면 엔티티도 제거
      setUserEntity(undefined);
    }
  };

  // 검색버튼 클릭시 다이얼로그 띄우기
  const handleClickSearchBtn = () => {
    openUserPickerDialog();
  };

  // 엔터키 입력하면 검색 시작
  // 값이 하나라면
  const handleKeydown = (e: React.KeyboardEvent) => {
    if (!inputValue) return;
    if (!isEnterKeyEvent(e)) return;
    doSearch(inputValue).then((results) => {
      if (!results) return;
      if (results.length === 1) {
        setInputValue(undefined);
        const userEntity = {
          lgonId: results[0].lgonId,
          userNm: results[0].userNm,
        };
        setUserEntity(userEntity);
        onSelected?.(results[0]);
      } else {
        openUserPickerDialog(inputValue);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
  };

  const currentValue = inputValue ?? userEntity?.userNm ?? '';
  return (
    <Box
      className={clsx('ContactInputBox-root', className, {
        x_focused: focused,
      })}
      ref={rootRef}
      sx={flatSx(
        {
          display: 'flex',
          width: '100%',
          maxWidth: 250,
          pr: 1,
          borderRadius: 0,
          overflow: 'hidden',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          '&.x_focused': {
            border: (theme) => `1px solid ${theme.palette.primary.main}`,
          },
        },
        sx,
      )}
      style={style}
    >
      <InputBase
        value={userEntity?.lgonId ?? ''}
        sx={{
          width: 70,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          px: 2,
          '& .MuiInputBase-input': {
            textAlign: 'center',
          },
        }}
        readOnly
        size="small"
        margin="none"
      />

      {readOnly ? (
        <Stack sx={{ width: '60%' }} justifyContent="center" alignItems="center">
          <Typography variant="body2">{userEntity?.userNm ?? ''}</Typography>
        </Stack>
      ) : (
        <>
          <IconButton
            onClick={handleClickSearchBtn}
            disabled={loading}
            size="small"
            color="primary"
          >
            <SearchIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={currentValue}
            onChange={handleChangeInput}
            onKeyDown={handleKeydown}
            type="search"
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            sx={{
              flex: 1,
            }}
            size="small"
            margin="none"
          />
        </>
      )}

      {dialogId === 'UserPickerDialog' && userPickerDialogProps && (
        <UserPickerDialog {...userPickerDialogProps} />
      )}
    </Box>
  );
}
