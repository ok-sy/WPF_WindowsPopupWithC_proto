import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLPage, CLPageApi } from '@local/domain';
import {
  Portlet,
  PortletContent,
  PortletHeader,
  TitleWithReloadButton,
  useElementLeftTop,
} from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, Stack, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import PageApiEditRow from './components/PageApiEditRow';
import errorCustomHandle from '@/lib/error-custom-handle';
const rootSx: SxProps<Theme> = (theme) => ({});

type Props = {
  pageData?: CLPage;

  loading: boolean;
  onLoading: (loading: boolean) => void;
};

export default function PageApiEdit(props: Props) {
  const { pageData, onLoading, loading } = props;
  const rootRef = useRef<HTMLDivElement>();
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const onLoadingFnRef = useRef<Props['onLoading']>();
  onLoadingFnRef.current = onLoading;
  const [pageApiList, setPageApiList] = useState<CLPageApi[]>([]);
  const api = useApi();

  const doReload = useCallback(
    async (ctx: ApiRequestContext, pageId: number) => {
      onLoadingFnRef.current?.(true);
      try {
        const { body } = await api.clPageApi.pageApiList({ ctx, pageId });
        const { pageApiList } = body;
        if (ctx.canceled) return;
        setPageApiList(pageApiList);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        onLoadingFnRef.current?.(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    if (!pageData) return;
    const pageId = pageData.pageId;
    doReload(ctx, pageId);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, pageData]);

  // 수정
  const doUpdate = useCallback(
    async (params: { pageId: number; pageApiList: CLPageApi[] }): Promise<number> => {
      try {
        onLoadingFnRef.current?.(true);
        const { body } = await api.clPageApi.pageApiUpdate(params);
        const { uptCnt } = body;
        return uptCnt;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        onLoadingFnRef.current?.(false);
      }
      return 0;
    },
    [api],
  );
  const onClickSaveBtn = () => {
    if (!pageData) return;
    if (confirm('저장하시겠습니까?')) {
      doUpdate({ pageId: pageData.pageId, pageApiList }).then((uptCnt) => {
        if (uptCnt > 0) {
          toast.success('수정완료');
        }
      });
    }
  };

  return (
    <Box sx={rootSx} className="PageApiEdit-root" ref={rootRef}>
      <Portlet>
        <PortletHeader>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography color="secondary" variant="h5">
              {pageData?.pageNm}
            </Typography>
            <TitleWithReloadButton title="목록" />
          </Stack>
          <Button onClick={onClickSaveBtn} color="success" variant="contained" size="small">
            저장
          </Button>
        </PortletHeader>
        <PortletContent
          noPadding
          ref={setBodyElement}
          className="PageApiEdit-body"
          sx={{
            height: `calc(100vh - ${bodyTop}px - 35px)`,
          }}
        >
          <TableContainer
            sx={{
              height: `calc(100vh - ${bodyTop}px - 35px)`,
              whiteSpace: 'nowrap',
            }}
          >
            <CLStyledTable noMargin>
              <CLDocTableHead>
                <TableRow>
                  <TableCell width={'25%'}>이름</TableCell>
                  <TableCell width={'45%'}>API_URL</TableCell>
                  <TableCell width={'25%'}>권한</TableCell>
                  <TableCell width={'5%'}></TableCell>
                </TableRow>
              </CLDocTableHead>
              <CLDocTableBody>
                {pageApiList.map((el, index) => (
                  <PageApiEditRow
                    onClickDeleteBtn={() =>
                      setPageApiList((p) => p.filter((element, idx) => index !== idx))
                    }
                    key={el.apiUrl}
                    onChangeUrl={(url) => {
                      if (!pageData) return;
                      if (!url) return;
                      const tmp = [...pageApiList];
                      tmp.splice(index, 1, {
                        apiUrl: url,
                        pageId: pageApiList[index].pageId,
                        privId: pageApiList[index].privId,
                        apiUrlNm: pageApiList[index].apiUrlNm,
                      });
                      setPageApiList(tmp);
                    }}
                    onChangePId={(pid) => {
                      if (!pageData) return;
                      if (!pid) return;
                      const tmp = [...pageApiList];
                      tmp.splice(index, 1, {
                        apiUrl: pageApiList[index].apiUrl,
                        pageId: pageApiList[index].pageId,
                        privId: pid,
                        apiUrlNm: pageApiList[index].apiUrlNm,
                      });
                      setPageApiList(tmp);
                    }}
                    onChangeUrlNm={(urlNm) => {
                      if (!pageData) return;
                      if (!urlNm) return;
                      const tmp = [...pageApiList];
                      tmp.splice(index, 1, {
                        apiUrl: pageApiList[index].apiUrl,
                        pageId: pageApiList[index].pageId,
                        privId: pageApiList[index].privId,
                        apiUrlNm: urlNm,
                      });
                      setPageApiList(tmp);
                    }}
                    data={el}
                  />
                ))}

                <TableRow>
                  <TableCell colSpan={3}>
                    <Stack direction="row" alignItems="center" justifyContent="center">
                      <Button
                        onClick={() => {
                          if (!pageData) return;
                          setPageApiList((p) => [
                            ...p,
                            { apiUrl: '', pageId: pageData.pageId, privId: 'R', apiUrlNm: '' },
                          ]);
                        }}
                        size="small"
                        startIcon={<AddCircleOutlineIcon />}
                        variant="outlined"
                      >
                        행추가
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              </CLDocTableBody>
            </CLStyledTable>
          </TableContainer>
        </PortletContent>
      </Portlet>
    </Box>
  );
}
