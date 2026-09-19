import { useApi } from '@/provider';
import type { ApiRequestContext, CLCode } from '@local/domain';
import { MenuItem, Select } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

// 보내는 파라미터 타입  코드관련
type SearchParams = {
  codeType?: string;
  rowsPerPage: number;
  pageNumber: number;
};

type Props = {
  codeType: string;
  selectValue?: string; // 셀렉트 초기값
  selectOnChange?: (selectValue: string) => void;
};
export default function CustomCodeSelect(props: Props) {
  const api = useApi();
  const { codeType, selectOnChange, selectValue } = props;
  // ===== 공통 코드 api
  // 받아와지는 코드리스트
  const [codeList, setCodeList] = useState<CLCode[]>([]);
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
      } finally {
      }
    },
    [api],
  );
  // 데이터 리로드
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoad(ctx, searchParams);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doLoad, searchParams]);
  return (
    <Select
      sx={{
        mx: '-1px',
        my: -1,
        borderRadius: 0,
      }}
      fullWidth
      size="small"
      value={selectValue}
      onChange={(e) => {
        if (!selectOnChange) return;
        selectOnChange(e.target.value);
      }}
    >
      {codeList
        .filter((el) => {
          if (codeType === '123') {
            return el.code !== '00';
          } else {
            return el.code !== '0';
          }
        })
        .map((code) => (
          <MenuItem key={code.code} value={code.code}>
            {code.codeNm}
          </MenuItem>
        ))}
    </Select>
  );
}
