import type { TeamPickerDialogProps } from '@/dialogs/TeamPickerDialog';
import TeamPickerDialog from '@/dialogs/TeamPickerDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { Team } from '@local/domain';
import { flatSx, isEnterKeyEvent } from '@local/ui';
import SearchIcon from '@mui/icons-material/Search';
import type { SxProps } from '@mui/material';
import { alpha, Box, IconButton, InputBase, Stack, Theme, Typography } from '@mui/material';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type DialogId = 'TeamPickerDialog';

type Props = {
  initialValue?: { teamId?: number; teamNm?: string };
  sx?: SxProps;
  className?: string;
  style?: CSSProperties;
  onSelected?: (value?: { teamNm: string; teamId: number }) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export default function TeamSelectBox(props: Props) {
  const {
    initialValue,
    sx,
    className,
    style,
    placeholder,
    onSelected: onChange,
    readOnly = false,
  } = props;
  const api = useApi();

  //팀선택 엔티티
  const [teamEntity, setTeamEntity] = useState<{ teamNm: string; teamId?: number }>();

  useEffect(() => {
    setTeamEntity({
      teamNm: initialValue?.teamNm ?? '',
      teamId: initialValue?.teamId ?? undefined,
    });
  }, [initialValue]);

  const [loading, setLoading] = useState(false);

  // focus 여부, focus되었을때 강조하기 위해서
  const [focused, setFocused] = useState(false);
  // 팀 선택 다이얼로그
  const [dialogId, setDialogId] = useState<DialogId>();
  const [teamPickerDialogProps, setTeamPickerDialogProps] = useState<TeamPickerDialogProps>();

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
    setTeamPickerDialogProps(undefined);
  };

  // 팀 선택 다이어로그
  const openTeamPickerDialog = (keyword?: string) => {
    setDialogId('TeamPickerDialog');
    setTeamPickerDialogProps({
      open: true,
      onClose: closeDialog,
      onSubmit: (teamNm: string, teamId: number) => {
        const newValue = { teamNm, teamId };
        setTeamEntity(newValue);
        setInputValue(undefined);
        onChange?.(newValue);
      },
      initialKeyword: keyword,
    });
  };

  // 연락처 이름으로 검색, 최대 2건 조회
  const doSearch = useCallback(
    async (keyword: string): Promise<Team[] | null> => {
      cancelApiCall();
      const ctx = { canceled: false } as ApiRequestContext;
      apiCtxRef.current = ctx;
      try {
        setLoading(true);
        const { body } = await api.team.list({
          teamNm: keyword,
        });
        const { teamList } = body;
        return teamList;
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
      setTeamEntity({
        teamNm: '',
        teamId: undefined,
      });
      onChange?.(undefined);
    }
  };

  // 검색버튼 클릭시 다이얼로그 띄우기
  const handleClickSearchBtn = () => {
    openTeamPickerDialog();
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
        const teamEntity = {
          teamId: results[0].teamId,
          teamNm: results[0].teamNm ?? '',
        };
        setTeamEntity({ teamNm: teamEntity.teamNm, teamId: Number(teamEntity.teamId) });
        onChange?.({ teamNm: teamEntity.teamNm, teamId: Number(teamEntity.teamId) });
      } else {
        openTeamPickerDialog(inputValue);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
  };

  const { teamId, teamNm = '' } = teamEntity ?? {};
  const currentValue = inputValue ?? teamNm ?? '';
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
          maxWidth: 260,
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
        value={teamId}
        sx={{
          width: 100,
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
          <Typography variant="body2">{teamNm ?? ''}</Typography>
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

      {dialogId === 'TeamPickerDialog' && teamPickerDialogProps && (
        <TeamPickerDialog {...teamPickerDialogProps} />
      )}
    </Box>
  );
}
