import type { CodeTypePickerDialogProps } from '@/dialogs/CodeTypePickerDialog';
import CodeTypePickerDialog from '@/dialogs/CodeTypePickerDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCodeType } from '@local/domain';
import { flatSx, isEnterKeyEvent } from '@local/ui';
import SearchIcon from '@mui/icons-material/Search';
import type { SxProps } from '@mui/material';
import { alpha, Box, IconButton, InputBase } from '@mui/material';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type DialogId = 'CodeTypePickerDialog';

type MiniCodeType = {
  codeType: string;
  codeTypeNm: string;
};

type Props = {
  initialValue?: MiniCodeType;
  sx?: SxProps;
  className?: string;
  style?: CSSProperties;
  onSelected?: (value: MiniCodeType | undefined) => void;
  placeholder?: string;
};

export default function CodeTypeSelectBox(props: Props) {
  const { sx, className, style, placeholder, onSelected: onChange } = props;
  const api = useApi();
  const [codeTypeEntity, setCodeTypeEntity] = useState<MiniCodeType | undefined>(
    props.initialValue,
  );
  const [loading, setLoading] = useState(false);

  // focus 여부, focus되었을때 강조하기 위해서
  const [focused, setFocused] = useState(false);

  // 코드 타입 선택 다이얼로그
  const [dialogId, setDialogId] = useState<DialogId>();
  const [codeTypePickerDialogProps, setCodeTypePickerDialogProps] =
    useState<CodeTypePickerDialogProps>();

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
    setCodeTypePickerDialogProps(undefined);
  };

  // 코드 그룹 선택 다이얼로드 띄우기
  const openCodeTypePicker = (keyword?: string) => {
    setDialogId('CodeTypePickerDialog');
    setCodeTypePickerDialogProps({
      open: true,
      onClose: closeDialog,
      initialKeyword: keyword,
      onSelected: (codeTypeEntity: CLCodeType) => {
        const { codeType, codeTypeNm } = codeTypeEntity;
        const newValue = { codeType, codeTypeNm };
        setCodeTypeEntity(newValue);
        setInputValue(undefined);
        closeDialog();
        onChange?.(newValue);
      },
    });
  };

  // 연락처 이름으로 검색, 최대 2건 조회
  const doSearch = useCallback(
    async (keyword: string): Promise<CLCodeType[] | null> => {
      cancelApiCall();
      const ctx = { canceled: false } as ApiRequestContext;
      apiCtxRef.current = ctx;
      try {
        setLoading(true);
        const { body } = await api.clCodeType.search({
          keyword,
          pageNumber: 0,
          rowsPerPage: 2,
        });
        const { pagerData } = body;
        if (ctx.canceled) return null;
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
      setCodeTypeEntity(undefined);
      onChange?.(undefined);
    }
  };

  // 검색버튼 클릭시 다이얼로그 띄우기
  const handleClickSearchBtn = () => {
    openCodeTypePicker();
  };

  // 엔터키 입력하면 검색 시작
  const handleKeydown = (e: React.KeyboardEvent) => {
    if (!inputValue) return;
    if (!isEnterKeyEvent(e)) return;
    doSearch(inputValue).then((results) => {
      if (!results) return;
      if (results.length === 1) {
        setInputValue(undefined);
        const codeTypeEntity = {
          codeType: results[0].codeType,
          codeTypeNm: results[0].codeTypeNm,
        };
        setCodeTypeEntity(codeTypeEntity);
        onChange?.(codeTypeEntity);
      } else {
        openCodeTypePicker(inputValue);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
  };

  const { codeType, codeTypeNm = '' } = codeTypeEntity ?? {};
  const currentValue = inputValue ?? codeTypeNm ?? '';
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
        value={codeType ?? ''}
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
      <IconButton onClick={handleClickSearchBtn} disabled={loading} size="small" color="primary">
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
      {dialogId === 'CodeTypePickerDialog' && codeTypePickerDialogProps && (
        <CodeTypePickerDialog {...codeTypePickerDialogProps} />
      )}
    </Box>
  );
}
