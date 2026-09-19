import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, CLCode } from '@local/domain';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

// 보내는 파라미터 타입
type SearchParams = {
  codeType?: string;
  rowsPerPage: number;
  pageNumber: number;
};

type Props = {
  displayType: 'checkbox' | 'radio' | 'select' | 'button'; // ui 컴포넌트 종류 선택
  codeType: string; // 코드 그룹선택
  checkedValues?: string[] | string; // 체크박스 전용
  radioValues?: number; // 라디오 초기값
  selectValue?: string; // 셀렉트 초기값
  checkedOnChange?: (checkedValues?: string[] | string) => void;
  radioOnChange?: (radioValue: number) => void;
  selectOnChange?: (selectValue: string) => void;
  selectSx?: SxProps<Theme>;
  noLabel?: boolean;
  fullWidth?: boolean;
  noSpacing?: boolean; // Stack spacing 잡혀있어 Grid2 사용시 사용할수있음
  label?: 'outLabel' | 'inputLabel';
  labelText?: string;
};

/**
 * @Author sangbinlee
 * 공통코드를 다양한 컴포넌트 형태로 표시하는 컴포넌트
 * 체크박스, 라디오, 콤보박스, 버튼 형태를 지원합니다.
 * @param props
 * @returns
 */
export default function CLCodeListView(props: Props) {
  const api = useApi();
  const {
    displayType = 'checkbox',
    codeType,
    checkedValues,
    radioOnChange,
    checkedOnChange: onChange,
    radioValues,
    selectSx,
    selectValue,
    selectOnChange,
    noLabel,
    fullWidth,
    noSpacing,
    label,
    labelText,
  } = props;
  // 받아와지는 코드리스트
  const [codeList, setCodeList] = useState<CLCode[]>([]);

  const [checkListHandle, setCheckListHandle] = useState<string[] | string>(checkedValues ?? '');

  // 검색 파라미터 값
  const [searchParams, setSearchParams] = useState<SearchParams>({
    codeType: codeType,
    rowsPerPage: 9999,
    pageNumber: 0,
  });
  // 검색 리스트 함수
  const doLoad = useCallback(
    async (ctx: ApiRequestContext, params: SearchParams) => {
      try {
        const { body } = await api.clCode.search({
          ctx,
          ...params,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        setCodeList(pagerData.elements);
        return pagerData.elements;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
      }
    },
    [api],
  );
  // 데이터 리로드
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoad(ctx, searchParams).then((result) => {
      if (!result) return;
      setCheckListHandle(result[0]?.codeNm ?? '');
    });
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doLoad, searchParams, setCheckListHandle]);

  if (displayType === 'checkbox') {
    return (
      <FormControl>
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormLabel>
            <Typography variant="h6">{codeList[0]?.codeTypeNm}</Typography>
          </FormLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {codeList.map((code) => (
              <FormControlLabel
                key={code.code}
                value={code.codeNm}
                control={
                  <Checkbox
                    onChange={(e) => {
                      if (!onChange) return;
                      onChange(e.target.value);
                    }}
                    size="small"
                  />
                }
                label={code.codeNm}
              />
            ))}
          </Box>
        </Stack>
      </FormControl>
    );
  } else if (displayType === 'radio') {
    return (
      <FormControl>
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormLabel>
            <Typography variant="h6">{codeList[0]?.codeTypeNm}</Typography>
          </FormLabel>
          <RadioGroup
            onChange={(e) => {
              if (!radioOnChange) return;
              radioOnChange(Number(e.target.value));
            }}
            defaultValue={radioValues}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {codeList.map((code) => (
                <FormControlLabel
                  key={code.code}
                  value={code.code}
                  control={<Radio />}
                  label={code.codeNm}
                />
              ))}
            </Box>
          </RadioGroup>
        </Stack>
      </FormControl>
    );
  } else if (displayType === 'select') {
    return (
      <Box sx={selectSx}>
        <FormControl fullWidth>
          <Stack direction="row" alignItems="center" spacing={noSpacing ? 0 : 2}>
            {label === 'outLabel' ? (
              <FormLabel sx={{ display: noLabel ? 'none' : '' }}>
                <Typography variant="h6">{codeList[0]?.codeTypeNm}</Typography>
              </FormLabel>
            ) : (
              <InputLabel>{labelText}</InputLabel>
            )}
            <Select
              fullWidth
              size="small"
              label={labelText}
              value={selectValue === undefined ? '선택' : selectValue}
              onChange={(e) => {
                if (!selectOnChange) return;
                selectOnChange(e.target.value);
              }}
            >
              <MenuItem value={'선택'}>선택</MenuItem>
              {codeList.map((code) => (
                <MenuItem key={code.code} value={code.code}>
                  {code.codeNm}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </FormControl>
      </Box>
    );
  } else if (displayType === 'button') {
    return (
      <div>
        <FormControl>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormLabel>
              <Typography variant="h6">{codeList[0]?.codeTypeNm}</Typography>
            </FormLabel>
            <Stack direction="row" spacing={1.5}>
              {codeList.map((code) => (
                <Button size="small" variant="contained" key={code.code}>
                  {code.codeNm}
                </Button>
              ))}
            </Stack>
          </Stack>
        </FormControl>
      </div>
    );
  }
  return <Box></Box>;
}
