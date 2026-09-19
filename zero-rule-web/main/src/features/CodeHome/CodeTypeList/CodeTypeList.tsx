import BbsPagination from '@/components/BbsPagination';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { CommonCodeTypeEditDialogProps } from '@/dialogs/CommonCodeTypeEditDialog';
import CommonCodeTypeEditDialog from '@/dialogs/CommonCodeTypeEditDialog';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCodeType, PagerData } from '@local/domain';
import { flatSx, Portlet, PortletContent, PortletHeader, TitleWithReloadButton } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box, Button, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Zoom } from 'react-awesome-reveal';
import CodeTypeSearchBox from './components/CodeTypeSearchBox';
import CodeTypeTableRow from './components/CodeTypeTableRow';
import type { SearchParams } from './types';
import { DEFAULT_SEARCH_PARAMS } from './types';
import errorCustomHandle from '@/lib/error-custom-handle';

type DialogId = 'CommonCodeTypeEditDialog' | 'CommonCodeTypeInfoDialog';

type Props = {
  sx?: SxProps;
};

/**
 * 공통 코드 그룹 목록
 */

export default function CodeTypeList(props: Props) {
  const { sx } = props;
  const api = useApi();
  const [searchParams, setSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pagerData, setPagerData] = useState<PagerData<CLCodeType>>();
  const [dialogId, setDialogId] = useState<DialogId>();
  const [commonCodeTypeDialogProps, setCommonCodeTypeEditDialogProps] =
    useState<CommonCodeTypeEditDialogProps>();

  // 다이어로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setCommonCodeTypeEditDialogProps(undefined);
  };

  // codeType이 있으면 편집, 없으면 신규 등록
  const openCodeTypeEditDialog = (codeType?: string) => {
    setDialogId('CommonCodeTypeEditDialog');
    setCommonCodeTypeEditDialogProps({
      open: true,
      onClose: closeDialog,
      codeType,
      onDeleted: () => {
        setRefreshToken(Date.now());
        closeDialog();
      },
      onUpdated: (_newValue: CLCodeType) => {
        setRefreshToken(Date.now());
        closeDialog();
      },
    });
  };

  // 코드유형 신규 버튼 클릭
  const handleClickNewBtn = () => {
    openCodeTypeEditDialog();
  };

  // 코드유형 수정 버튼 클릭
  const handleClickCodeTypeUpdate = (codeTypeData: CLCodeType) => () => {
    openCodeTypeEditDialog(codeTypeData.codeType);
  };

  // 목록조회
  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: SearchParams) => {
      setLoading(true);
      try {
        const { body } = await api.clCodeType.search({
          ctx,
          ...params,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        setPagerData(pagerData);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  // 새로 불러오기
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, searchParams);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, searchParams]);

  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  const {
    totalPages = 0,
    pageNumber = 0,
    elements = [],
    offset = 0,
    totalElements = 0,
  } = pagerData ?? {};
  const itemNumMax = totalElements - offset;

  return (
    <Box
      className="CodeTypeList-root"
      sx={flatSx(
        {
          overflow: 'hidden',
          '& .CodeTypeList-resultCount': {
            display: 'inline-block',
            color: 'primary.main',
            ml: 1,
            fontSize: '0.9rem',
            fontWeight: 600,
          },
        },
        sx,
      )}
    >
      <CodeTypeSearchBox
        loading={loading}
        onSubmit={(values) => {
          setSearchParams((p) => ({ ...p, pageNumber: 0, ...values }));
        }}
      />
      <Typography
        variant="body2"
        component="div"
        sx={{ display: 'flex', color: '#888', ml: 1, mb: 1 }}
      >
        ※ 검색 결과{' '}
        <Zoom duration={700} className="CodeTypeList-resultCount" key={elements.length}>
          {elements.length}
        </Zoom>
        건
      </Typography>
      <Portlet>
        <PortletHeader>
          <TitleWithReloadButton title="공통코드 그룹" onClickRefresh={handleClickRefresh} />
          {totalPages > 1 && (
            <Box
              sx={{
                py: 2,
                height: 64,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <BbsPagination
                page={pageNumber ?? 0}
                count={totalPages ?? 0}
                onPageChange={(pageNumber) => setSearchParams((p) => ({ ...p, pageNumber }))}
              />
            </Box>
          )}
          <Button onClick={handleClickNewBtn}>신규</Button>
        </PortletHeader>
        <PortletContent noPadding>
          <TableContainer>
            <CLStyledTable
              noMargin
              sx={{
                '& .MuiTableRow-root > .MuiTableCell-root': {
                  '&:nth-of-type(1)': {
                    minWidth: 40,
                    maxWidth: 40,
                    width: 40,
                  },
                  '&:nth-of-type(2)': {
                    maxWidth: 120,
                    minWidth: 120,
                    width: 120,
                  },
                  '&:nth-of-type(3)': {
                    maxWidth: 250,
                    minWidth: 250,
                    width: 250,
                  },
                  '&:nth-of-type(4)': {
                    minWidth: 350,
                    width: 350,
                  },
                  '&:nth-of-type(5)': {
                    maxWidth: 160,
                    minWidth: 160,
                    width: 160,
                  },
                  '&:nth-of-type(6)': {
                    maxWidth: 160,
                    minWidth: 160,
                    width: 160,
                  },
                },
              }}
            >
              <CLDocTableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>그룹코드</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell>변경</TableCell>
                  <TableCell>등록</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody yPadding="large">
                {elements.map((it, i) => (
                  <CodeTypeTableRow
                    key={it.codeType}
                    seq={itemNumMax - i}
                    codeType={it}
                    onClickRow={handleClickCodeTypeUpdate(it)}
                  />
                ))}
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        </PortletContent>
      </Portlet>

      {dialogId === 'CommonCodeTypeEditDialog' && commonCodeTypeDialogProps && (
        <CommonCodeTypeEditDialog {...commonCodeTypeDialogProps} />
      )}
    </Box>
  );
}
