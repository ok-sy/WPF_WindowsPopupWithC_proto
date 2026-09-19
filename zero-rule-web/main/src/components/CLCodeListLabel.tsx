import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCode } from '@local/domain';
import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

// 보내는 파라미터 타입
type SearchParams = {
  codeType?: string;
  rowsPerPage: number;
  pageNumber: number;
};

type Props = {
  codeType: string; // 코드 그룹선택
  code: string;
  onSubmitCodeNm?: (codeNm: string) => void;
} & TypographyProps;
/**
 * @Author jinWoo
 * 공통코드 타입과 공통코드 번호를 받아 그에맞는 코드 이름을 Typograpy로 출력하는 컴포넌트
 * @param props
 * @returns
 */
export default function CLCodeListLabel(props: Props) {
  const api = useApi();
  const { codeType, code, sx, className, onSubmitCodeNm, ...rest } = props;
  const [codeList, setCodeList] = useState<CLCode[]>();

  const [resultValue, setResultValue] = useState('');
  // 검색 파라미터 값
  const [searchParams, setSearchParams] = useState<SearchParams>({
    codeType: codeType,
    rowsPerPage: 9999,
    pageNumber: 0,
  });

  useEffect(() => {
    if (!codeList) return;
    const el = codeList.find((el) => el.code === code);
    if (!el) return;
    setResultValue(el.codeNm);
    if (!onSubmitCodeNm) return;
    onSubmitCodeNm(el.codeNm);
  }, [codeList, onSubmitCodeNm, code]);

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
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
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
  }, [doLoad, searchParams, codeType, code]);

  return (
    <Typography className={className} sx={sx} {...rest}>
      {resultValue}
    </Typography>
  );
}
