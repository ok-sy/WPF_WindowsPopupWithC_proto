import BbsPagination from '@/components/BbsPagination';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import type { MsgMngUploadDialogProps } from '@/dialogs/MsgMngUploadDialog';
import MsgMngUploadDialog from '@/dialogs/MsgMngUploadDialog';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { useElementLeftTop } from '@local/ui';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import type { ApiRequestContext, CLMsgMng, PagerData, Pds } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import MsgMngInsertRow from './components/MsgMngInsertRow';
import MsgMngRow from './components/MsgMngRow';
import MsgMngSearch from './components/MsgMngSearch';
import { rootSx } from './style';

export type UseYnUptData = {
  msgClsf: string;
  msgId: string;
  useYn: string;
  msgCn: string;
  msgPrntCd: string;
};
export type SearchOption = {
  msgId?: string;
  msgCn?: string;
  rowsPerPage: number;
  pageNumber: number;
};
export const DEFAULT_SEARCH_OPTIONS: SearchOption = {
  rowsPerPage: 20,
  pageNumber: 0,
  msgId: '',
  msgCn: '',
};
// 임시로 주석
type DialogIds = 'MsgMngUploadDialogProps';
export default function MsgMngHome() {
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [msgMngUploadDialogProps, setMsgMngUploadDialogProps] = useState<MsgMngUploadDialogProps>();
  const [dialogId, setDialogId] = useState<DialogIds>();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [msgData, setMsgData] = useState<PagerData<CLMsgMng>>();
  const [searchOption, setSearchOption] = useState<SearchOption>({ ...DEFAULT_SEARCH_OPTIONS });
  //검색 셀렉트 옵션들
  const [msgClsf, setMsgClsf] = useState<string>('');
  const msgClsfFnRef = useRef<string>('');
  msgClsfFnRef.current = msgClsf;
  const [tskClsfCd, setTskClsfCd] = useState<string | string[]>('00');
  const tskClsfCdFnRef = useRef<string | string[]>('00');
  tskClsfCdFnRef.current = tskClsfCd;
  const [occrClsfCd, setOccrClsfCd] = useState<string>('');
  const occrClsfCdFnRef = useRef<string>('');
  occrClsfCdFnRef.current = occrClsfCd;
  const [teamSel, setTeamSel] = useState<string | string[]>('0');
  const teamSelFnRef = useRef<string | string[]>('0');
  teamSelFnRef.current = teamSel;
  // 등록 버튼 true/false
  const [addTf, setAddTf] = useState<boolean>(false);
  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setMsgMngUploadDialogProps(undefined);
  };
  const openUploadDialog = () => {
    setDialogId('MsgMngUploadDialogProps');
    setMsgMngUploadDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
        setRefreshToken(Date.now());
      },
    });
  };
  // 목록 조회
  const reload = useCallback(
    async (
      ctx: ApiRequestContext,
      params: {
        rowsPerPage: number;
        pageNumber: number;
        msgClsf?: string;
        tskClsfCd?: string;
        msgPrntCd?: string;
        occrClsfCd?: string;
        teamId?: number | null;
        msgId?: string;
        msgCn?: string;
      },
    ) => {
      setLoading(true);
      try {
        const { body } = await api.clMsgMngApi.list({
          ctx,
          ...params,
        });
        const { pagerData } = body;
        setMsgData(pagerData);
        return !!pagerData;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const dataSet = {
      rowsPerPage: searchOption.rowsPerPage,
      pageNumber: searchOption.pageNumber,
      msgId: searchOption.msgId,
      msgCn: searchOption.msgCn,
      msgClsf: msgClsfFnRef.current === 'ALL' ? undefined : msgClsfFnRef.current,
      tskClsfCd: tskClsfCdFnRef.current === '00' ? undefined : String(tskClsfCdFnRef.current),
      occrClsfCd: occrClsfCdFnRef.current === 'ALL' ? undefined : occrClsfCdFnRef.current,
      teamId: teamSelFnRef.current === '0' ? undefined : Number(teamSelFnRef.current),
    };
    reload(ctx, dataSet);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [
    reload,
    searchOption,
    msgClsfFnRef,
    tskClsfCdFnRef,
    occrClsfCdFnRef,
    teamSelFnRef,
    refreshToken,
  ]);

  const {
    totalPages = 0,
    pageNumber = 0,
    offset = 0,
    totalElements = 0,
    elements = [],
  } = msgData || {};
  const itemNumMax = totalElements - offset;

  // ===== 메시지 일괄업로드 양식 다운로드
  const [pds, setPds] = useState<Pds>();
  const downloadExcelFile = useCallback(
    async (ctx: ApiRequestContext, pdsId: number) => {
      setLoading(true);
      try {
        const { body } = await api.pds.info({ ctx, pdsId });
        const { pds } = body;
        if (ctx.canceled) return;
        setPds(pds);
      } catch (err) {
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
    downloadExcelFile(ctx, 10601);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [downloadExcelFile]);
  const { title, substance, attachFiles = [] } = pds ?? {};

  // 사용여부 수정
  const usedYnUpdate = useCallback(
    async (params: UseYnUptData): Promise<number | null> => {
      try {
        const { body } = await api.clMsgMngApi.updateUseYn(params);
        const { uptCnt } = body;
        return uptCnt;
      } catch (err) {
        errorCustomHandle(err);
      }
      return null;
    },
    [api],
  );
  const handleChangeUseYnUpt = (data?: UseYnUptData) => {
    if (data) {
      usedYnUpdate(data);
    }
  };

  return (
    <Box sx={rootSx} className="MsgMngHome-root">
      {/* 검색 박스 */}
      <MsgMngSearch
        onSubmit={(values) => {
          setSearchOption((p) => ({ ...p, pageNumber: 0, ...values }));
        }}
        onSubmitMsgClsf={(value) => setMsgClsf(value)}
        onSubmitOccrClsfCd={(value) => setOccrClsfCd(value)}
        onSubmitTeamSel={(value) => setTeamSel(value)}
        onSubmitTskClsfCd={(value) => setTskClsfCd(value)}
      />

      <Stack justifyContent="flex-end" direction="row" sx={{ mb: 1 }} spacing={1}>
        {attachFiles
          .filter((el) => el.fileId === 'pds0_b_v01_10360_xlsx')
          .map((file, idx) => {
            console.log('다운로드 경로:' + file.downloadUrl);
            return (
              <Box
                key={file.fileId}
                component="a"
                href={file.downloadUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="MsgMngHome-xlsx-download"
              >
                엑셀 양식 다운로드
              </Box>
            );
          })}
        <Button onClick={openUploadDialog} size="small" variant="outlined">
          일괄업로드
        </Button>
      </Stack>
      {/* 목록 */}
      <TableContainer
        ref={setBodyElement}
        sx={{
          border: '1px solid #ccc',
          height:
            totalPages > 1
              ? `calc(100vh - ${bodyTop}px - 124px)`
              : `calc(100vh - ${bodyTop}px - 75px)`,
        }}
      >
        <CLStyledTable stickyHeader noMargin className="MsgMngHome-table">
          <CLDocTableHead className="MsgMngHome-table-head">
            <TableRow>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={(p) =>
                    setAddTf((p) => {
                      if (p === false) {
                        setRefreshToken(Date.now());
                      }
                      return !p;
                    })
                  }
                >
                  {addTf ? <CloseIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                </IconButton>
              </TableCell>
              <TableCell>No </TableCell>
              <TableCell>메시지 ID</TableCell>
              <TableCell>메시지</TableCell>
              <TableCell>
                메시지
                <br />
                종류
              </TableCell>
              <TableCell>업무구분</TableCell>
              <TableCell>
                발생구분
                <br />
                코드
              </TableCell>
              <TableCell>팀 정보</TableCell>
              <TableCell>
                출력
                <br />
                구분
              </TableCell>
              <TableCell>
                사용
                <br />
                여부
              </TableCell>
              <TableCell>등록자 ID</TableCell>
              <TableCell>수정자 ID</TableCell>
            </TableRow>
          </CLDocTableHead>
          <CLDocTableBody>
            {/* {elements.length + ''} */}
            {addTf === true && (
              <MsgMngInsertRow
                onRefreshTocken={(value) => {
                  setAddTf(false);
                  setRefreshToken(value);
                }}
              />
            )}
            {elements.map((el, i) => (
              <MsgMngRow
                data={el}
                key={i}
                seq={offset + i + 1}
                onRefreshToken={(value) => {
                  setRefreshToken(value);
                }}
                onSubmitYnUptData={(value) => {
                  if (value) {
                    handleChangeUseYnUpt(value);
                  }
                }}
              />
            ))}
          </CLDocTableBody>
        </CLStyledTable>
      </TableContainer>
      {totalPages > 1 && (
        <Box className="MsgMngHome-page-box">
          <BbsPagination
            page={pageNumber ?? 0}
            count={totalPages ?? 0}
            onPageChange={(pageNumber) => setSearchOption((p) => ({ ...p, pageNumber }))}
          />
        </Box>
      )}
      {loading && (
        <Box className="MsgMngHome-loading-box">
          <LinearProgress />
        </Box>
      )}
      {dialogId === 'MsgMngUploadDialogProps' && msgMngUploadDialogProps && (
        <MsgMngUploadDialog {...msgMngUploadDialogProps} />
      )}
    </Box>
  );
}
