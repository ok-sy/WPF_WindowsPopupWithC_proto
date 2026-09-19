import ReplayIcon from '@mui/icons-material/Replay';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { ruleDeploySx } from '../../style';
import { useCallback, useEffect, useState } from 'react';
import type { RuleUsedItemDialogProps } from '@/dialogs/RuleUsedItemDialog';
import RuleUsedItemDialog from '@/dialogs/RuleUsedItemDialog';
import type { RuleUsedRuleStateDialogProps } from '@/dialogs/RuleUsedRuleStateDialog';
import RuleUsedRuleStateDialog from '@/dialogs/RuleUsedRuleStateDialog';
import { sxTableRowSelection, useElementLeftTop } from '@local/ui';
import type { ApiRequestContext, RuleDeployWaitVo } from '@local/domain';
import { useApi } from '@/provider';
import errorCustomHandle from '@/lib/error-custom-handle';
import RuleDeployRow from './components/RuleDeployRow';
import type { RuleProgressHstDialogProps } from '@/dialogs/RuleProgressHstDialog';
import RuleProgressHstDialog from '@/dialogs/RuleProgressHstDialog';
import CustomSwitch from '@/components/RuleComponents/CustomSwitc';
import { useLoginProfile } from '@/auth/useLoginProfile';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import { useObservable } from 'react-use';
import { toast } from 'react-toastify';

type DialogIds = 'RuleUsedItemDialog' | 'RuleUsedRuleStateDialog' | 'RuleProgressHstDialog';
export default function RuleDeploy() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [selectChecked, setSelectChecked] = useState<string[]>([]);
  const [dialogId, setDialogId] = useState<DialogIds>();
  // 룰에서 사용하는 항목리스트 팝업 props
  const [ruleUsedItemDialogProps, setRuleUsedItemDialogProps] = useState<RuleUsedItemDialogProps>();
  // 룰에서 사용하는 룰 현재상태 팝업 props
  const [ruleUsedRuleStateDialogProps, setRuleUsedRuleStateDialogProps] =
    useState<RuleUsedRuleStateDialogProps>();
  // 룰버전 팝업 props
  const [ruleProgressHstDialogProps, setRuleProgressHstDialogProps] =
    useState<RuleProgressHstDialogProps>();
  // 최근배포일자
  const [totalRecentDeployDate, setTotalRecentDeployDate] = useState<string>();

  const [dataLists, setDataLists] = useState<RuleDeployWaitVo[]>([]);
  const [dataList, setDataList] = useState<RuleDeployWaitVo>();
  // lock/unlock 상태관리
  const [lockChecked, setLockChecked] = useState(false);
  const login = useLoginProfile();
  const { sceneManager } = useMainLayoutContext();
  const currentPage = useObservable(sceneManager.observeCurrentSceneOrNull(), null);

  const closeDioalog = () => {
    setDialogId(undefined);
    setRuleUsedItemDialogProps(undefined);
    setRuleUsedRuleStateDialogProps(undefined);
    setRuleProgressHstDialogProps(undefined);
  };
  const openDialog = (name: string, data: RuleDeployWaitVo) => {
    if (name === 'item') {
      setDialogId('RuleUsedItemDialog');
      setRuleUsedItemDialogProps({
        open: true,
        onClose: () => {
          closeDioalog();
          setRefreshToken(Date.now());
        },
        data,
      });
    } else if (name === 'state') {
      setDialogId('RuleUsedRuleStateDialog');
      setRuleUsedRuleStateDialogProps({
        open: true,
        onClose: () => {
          closeDioalog();
          setRefreshToken(Date.now());
        },
        data,
      });
    } else if (name === 'verNo') {
      setDialogId('RuleProgressHstDialog');
      setRuleProgressHstDialogProps({
        open: true,
        onClose: () => {
          closeDioalog();
          setRefreshToken(Date.now());
        },
        ruleid: data.ruleid,
      });
    }
  };

  // 목록 조회API
  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.rule.ruleDeployWaitList({ ctx });
        setDataLists(body.waitList);
        setTotalRecentDeployDate(body.recentDeploy);
        if (!ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx);
  }, [doReload, refreshToken]);

  // 배포 API
  const apply = useCallback(
    async (params: { waitList: RuleDeployWaitVo[] }): Promise<number> => {
      try {
        await api.rule.treeApply({ ...params });
        return params.waitList.length;
      } catch (err) {
        errorCustomHandle(err);
      }
      return 0;
    },
    [api],
  );

  const handleClickApply = () => {
    const selData = dataLists.filter((item) => selectChecked.includes(item.ruleid));
    apply({ waitList: selData }).then((result) => {
      if (result > 0) {
        toast.success(`${result} 건이 배포 완료되었습니다.`);
        setRefreshToken(Date.now());
        setSelectChecked([]);
      }
    });
  };

  const allRowCheckHandler = (checked: boolean) => {
    if (checked) {
      dataLists?.map((el) => {
        setSelectChecked(dataLists?.map((el) => el.ruleid));
      });
    } else {
      setSelectChecked([]);
    }
  };
  const checkHandle = (ruleid: string, checked: boolean) => {
    if (checked) {
      setSelectChecked((p) => [...p, ruleid]);
    } else {
      setSelectChecked((prevState) => prevState.filter((item) => item !== ruleid));
    }
  };

  const deployVali =
    dataLists.filter((item) => selectChecked.includes(item.ruleid)).length < 1 ? true : false;

  // 락테이블에 해당룰 존재여부 체크API
  const lockCheck = useCallback(async () => {
    try {
      const { body } = await api.lock.ruleLockCheck({});
      return body.result;
    } catch (err) {
      errorCustomHandle(err);
    }
  }, [api]);
  // 락 테이블 등록API
  const lockInsert = useCallback(
    async (params: {
      lockcode: string;
      lockkey: string;
      locktypecode: string;
      locknote: string;
    }) => {
      try {
        await api.lock.insert({ ...params });
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  // 락테이블 삭제API
  const lockDel = useCallback(
    async (delKey: string) => {
      try {
        await api.lock.deleteDep({ delKey });
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  // 읽기/편집 토글 버튼클릭 함수
  const handleClickRUBtn = () => {
    setLockChecked((p) => !p);
    if (!login?.profile.lgonId) return;
    const logonId = login?.profile.lgonId;
    if (!lockChecked) {
      const dataSet = {
        lockcode: '003',
        lockkey: login.profile.lgonId,
        locktypecode: '3',
        locknote: `${login.profile.lgonId}가 룰배포중`,
      };
      lockCheck().then((result) => {
        if (result === 1) {
          lockInsert(dataSet);
        } else {
          setLockChecked(false);
        }
      });
    } else {
      lockDel(logonId);
    }
  };
  // 페이지 접속시 락테이블에 해당룰 존재여부 체크API
  const firstLockCheck = useCallback(
    async (params: { lockKey: string }) => {
      try {
        const { body } = await api.lock.lockCheck({ ...params });
        return body.result;
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  // 페이지 접속시 해당 유저가 배포 락 걸어놓은 상태 체크
  useEffect(() => {
    if (currentPage?.pageKey !== '0006') return;
    if (!login?.profile.lgonId) return;
    const logonId = login?.profile.lgonId;
    console.log('asdsad' + currentPage?.pageKey);
    firstLockCheck({ lockKey: logonId }).then((result) => {
      if (result === 0) {
        setLockChecked(false);
      } else {
        setLockChecked(true);
      }
    });
  }, [firstLockCheck, login, currentPage]);
  return (
    <Stack sx={ruleDeploySx(bodyTop)} className="RuleDeploy-root" spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <CustomSwitch
          checked={lockChecked}
          onClick={handleClickRUBtn}
          activeText="UNLOCK"
          unActiveText="LOCK"
          size="large"
        />
        <Button
          disabled={deployVali || !lockChecked}
          size="small"
          variant="contained"
          onClick={handleClickApply}
        >
          배포
        </Button>
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center">
          <SubTitleAndIcon labelTitle="룰배포 리스트" />
          <IconButton onClick={() => setRefreshToken(Date.now())} size="small">
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography fontSize="0.75rem" alignSelf="flex-end">
          최근배포일시: {totalRecentDeployDate}
        </Typography>
      </Stack>
      <TableContainer ref={setBodyElement} className="table-container">
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
        <CLStyledTable noMargin>
          <CustomColoredTableHead
            yPadding="small"
            sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}
          >
            <TableRow>
              <TableCell>
                <CLStyledTableCheckBox
                  checked={dataLists.length === selectChecked.length && dataLists.length !== 0}
                  onChange={(_, checked) => {
                    allRowCheckHandler(checked);
                  }}
                  disabled={!lockChecked}
                />
              </TableCell>
              <TableCell>
                <Typography>현재룰적용상태</Typography>
              </TableCell>
              <TableCell>
                <Typography>룰변경유무</Typography>
              </TableCell>
              <TableCell>
                <Typography>배포후적용상태</Typography>
              </TableCell>
              <TableCell>
                <Typography>인터페이스ID</Typography>
              </TableCell>
              <TableCell>
                <Typography>룰ID</Typography>
              </TableCell>
              <TableCell>
                <Typography>룰버전</Typography>
              </TableCell>
              <TableCell>
                <Typography>룰명</Typography>
              </TableCell>
              <TableCell>
                <Typography>룰수정자명</Typography>
              </TableCell>
              <TableCell>
                <Typography>룰수정일시</Typography>
              </TableCell>
              <TableCell>
                <Typography>배포대기변경일시</Typography>
              </TableCell>
              <TableCell>
                <Typography>배포대기변경자명</Typography>
              </TableCell>
              <TableCell>
                <Typography>사용항목수</Typography>
              </TableCell>
              <TableCell>
                <Typography>사용하는룰수</Typography>
              </TableCell>
              <TableCell>
                <Typography>최근배포일시</Typography>
              </TableCell>
            </TableRow>
          </CustomColoredTableHead>
          <CLDocTableBody yPadding="small" sx={sxTableRowSelection}>
            {dataLists.map((el, idx) => {
              return (
                <RuleDeployRow
                  disabled={!lockChecked}
                  key={idx}
                  data={el}
                  onClickOpenDialog={openDialog}
                  onSubmitClick={(data) => {
                    setDataList(data);
                  }}
                  selected={dataList?.ruleid === el.ruleid}
                  checked={selectChecked}
                  checkHandle={checkHandle}
                />
              );
            })}
          </CLDocTableBody>
        </CLStyledTable>
      </TableContainer>
      {dialogId === 'RuleUsedItemDialog' && ruleUsedItemDialogProps && (
        <RuleUsedItemDialog {...ruleUsedItemDialogProps} />
      )}
      {dialogId === 'RuleUsedRuleStateDialog' && ruleUsedRuleStateDialogProps && (
        <RuleUsedRuleStateDialog {...ruleUsedRuleStateDialogProps} />
      )}
      {dialogId === 'RuleProgressHstDialog' && ruleProgressHstDialogProps && (
        <RuleProgressHstDialog {...ruleProgressHstDialogProps} />
      )}
    </Stack>
  );
}
