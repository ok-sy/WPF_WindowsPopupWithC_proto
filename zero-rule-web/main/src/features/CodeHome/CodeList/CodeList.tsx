import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { CodeTypePickerDialogProps } from '@/dialogs/CodeTypePickerDialog';
import CodeTypePickerDialog from '@/dialogs/CodeTypePickerDialog';
import type { CommonCodeEditDialogProps } from '@/dialogs/CommonCodeEditDialog';
import CommonCodeEditDialog from '@/dialogs/CommonCodeEditDialog';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLCode, CLCodeType, PagerData } from '@local/domain';
import { Portlet, PortletContent, PortletHeader, TitleWithReloadButton } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  Pagination,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import CodeSearchBox from './components/CodeSearchBox';
import CodeTableRow from './components/CodeTableRow';
import type { SearchParams } from './types';
import { DEFAULT_SEARCH_PARAMS } from './types';
import errorCustomHandle from '@/lib/error-custom-handle';

type CodeSection = {
  codeType: string;
  codeTypeNm: string;
  codes: CLCode[];
};
// 그룹별 섹션 나누기
function buildCodeSections(codes?: CLCode[]): CodeSection[] {
  if (!codes || codes.length === 0) return [];
  const results = {} as Record<string, CodeSection>;
  codes.forEach((it) => {
    let group = results[it.codeType];
    if (!group) {
      group = { codeType: it.codeType, codeTypeNm: it.codeTypeNm, codes: [] };
      results[it.codeType] = group;
    }
    group.codes.push(it);
  });
  return Object.values(results);
}

type Props = {
  sx?: SxProps;
};

type DialogId = 'CommonCodeEditDialog' | 'CodeTypePickerDialog';

export default function CodeList(props: Props) {
  const { sx } = props;
  const api = useApi();
  const [searchParams, setSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  //원본배열이다~
  const [pagerData, setPagerData] = useState<PagerData<CLCode>>();

  const codeSections = useMemo(() => buildCodeSections(pagerData?.elements), [pagerData?.elements]);
  const [dialogId, setDialogId] = useState<DialogId>();

  // 코드 등록 다이얼로그
  const [commonCodeEditDialogProps, setCommonCodeEditDialogProps] =
    useState<CommonCodeEditDialogProps>();

  // 코드 타입 선택 다이얼로그
  const [codeTypePickerDialogProps, setCodeTypePickerDialogProps] =
    useState<CodeTypePickerDialogProps>();

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setCommonCodeEditDialogProps(undefined);
    setCodeTypePickerDialogProps(undefined);
  };

  // 코드 에디트 다이얼로그 오픈
  const openCodeEditDialog = (codeType: string) => {
    setDialogId('CommonCodeEditDialog');
    setCommonCodeEditDialogProps({
      open: true,
      onClose: closeDialog,
      onSaved: () => {
        setRefreshToken(Date.now());
        closeDialog();
      },
      codeType,
    });
  };

  // 코드 타입 선택 다이얼로그
  const openCodeTypeSelectDialog = (): Promise<CLCodeType | null> => {
    return new Promise((resolve) => {
      let resolved = false;
      setDialogId('CodeTypePickerDialog');
      setCodeTypePickerDialogProps({
        open: true,
        onSelected: (codeTypeEntity: CLCodeType) => {
          resolved = true;
          resolve(codeTypeEntity);
          closeDialog();
        },
        onClose: () => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
          closeDialog();
        },
      });
    });
  };

  // 코드 신규 등록 다이얼로그
  const handleClickNewCode = () => {
    alert('코드 그룹을 선택해주세요');
    openCodeTypeSelectDialog().then((codeTypeEntity) => {
      if (codeTypeEntity) {
        openCodeEditDialog(codeTypeEntity.codeType);
      }
    });
  };

  // 리스트 데이터 불러오기
  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: SearchParams) => {
      setLoading(true);
      try {
        const { body } = await api.clCode.search({
          ctx,
          ...params,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        //원본배열에 가져온값 그냥 넣는거
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

  // 리스트 데이터 리로드
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    //정작 중요한 함수
    doReload(ctx, searchParams);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, searchParams]);

  // 새로고침
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  const handleSearchSubmit = (values: Omit<SearchParams, 'pageNumber'>) => {
    setSearchParams({ ...values, pageNumber: 0 });
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
    <Box className="CodeList-root" sx={sx}>
      <CodeSearchBox loading={loading} onSubmit={handleSearchSubmit} />

      <Portlet sx={{ whiteSpace: 'nowrap' }}>
        <PortletHeader>
          <TitleWithReloadButton
            title={
              <Stack direction="row" alignItems="center">
                <Typography variant="h5">공통 코드</Typography>
                {totalElements > 0 && (
                  <Typography variant="caption">({totalElements} 건)</Typography>
                )}
              </Stack>
            }
            onClickRefresh={handleClickRefresh}
          />
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                page={pageNumber + 1}
                count={totalPages}
                onChange={(_, page) => setSearchParams((p) => ({ ...p, pageNumber: page - 1 }))}
              />
            </Box>
          )}

          <Button onClick={handleClickNewCode}>신규</Button>
        </PortletHeader>
        <PortletContent noPadding>
          <TableContainer>
            <CLStyledTable noMargin>
              <CLDocTableHead yPadding="small">
                <TableRow>
                  <TableCell width="40px">#</TableCell>
                  <TableCell>코드 그룹</TableCell>
                  <TableCell>상세 코드</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell>최종 변경</TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody>
                {codeSections.map((section, i) => (
                  <CodeSectionView
                    key={section.codeType}
                    section={section}
                    seq={itemNumMax - i}
                    onClickEditBtn={openCodeEditDialog}
                  />
                ))}
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        </PortletContent>
      </Portlet>

      {dialogId === 'CommonCodeEditDialog' && commonCodeEditDialogProps && (
        <CommonCodeEditDialog {...commonCodeEditDialogProps} />
      )}
      {dialogId === 'CodeTypePickerDialog' && codeTypePickerDialogProps && (
        <CodeTypePickerDialog {...codeTypePickerDialogProps} />
      )}
    </Box>
  );
}

function CodeSectionView({
  seq,
  section,
  onClickEditBtn,
}: {
  seq: number;
  section: CodeSection;
  onClickEditBtn: (codeType: string, codeTypeNm: string) => void;
}) {
  const rowSpan = section.codes.length;
  return (
    <>
      {section.codes.map((it, i) => (
        <CodeTableRow
          key={it.code}
          rowSpan={rowSpan}
          firstRow={i === 0}
          onClickEditBtn={onClickEditBtn}
          seq={seq - i}
          code={it}
        />
      ))}
    </>
  );
}
