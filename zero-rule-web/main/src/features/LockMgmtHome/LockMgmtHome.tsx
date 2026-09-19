import CLDocLabelAny from '@/components/CLDocLabelAny/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput/CLDocLabelInput';
import CLStyledSelect from '@/components/CLStyledSelect/CLStyledSelect';
import CLStyledTextField from '@/components/CLStyledTextField/CLStyledTextField';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext, Lock } from '@local/domain';
import { Rule, RuleReturnItemAndItemInfo, RuleName } from '@local/domain';
import { Portlet, PortletContent, useElementLeftTop } from '@local/ui';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import CLDocTableHead from '@/components/CLDocTableHead/CLDocTableHead';
import CLDocTableBody from '@/components/CLDocTableBody/CLDocTableBody';
import CLCodeListView from '@/components/CLCodeListView';
import LcokTabelRow from './components/LcokTabelRow';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox/CLStyledTableCheckBox';
import errorCustomHandle from '@/lib/error-custom-handle';

export default function LockMgmtHome() {
  const api = useApi();
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [selectedLockcode, setSelectedLockcode] = useState<string>('선택');
  const selectedLockcodeFnRef = useRef<string>();
  selectedLockcodeFnRef.current = selectedLockcode;
  const [inputUserId, setInputUserId] = useState<string>();
  const inputUserIdFnRef = useRef<string>();
  inputUserIdFnRef.current = inputUserId;
  const [selectedUserNm, setSelectedUserNm] = useState<string>();
  const selectedUserNmFnRef = useRef<string>();
  selectedUserNmFnRef.current = selectedUserNm;
  const [deleteList, setDeleteList] = useState<string[]>([]);

  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);

  const doReload = useCallback(
    async (
      ctx: ApiRequestContext,
      param: { lockcode?: string; userid?: string; userNm?: string },
    ) => {
      try {
        setLoading(true);
        const { body } = await api.lock.list({ ctx: ctx, ...param });
        if (ctx.canceled) return;
        setLocks(body.locks);
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
    let lockCode: string | undefined = selectedLockcodeFnRef.current;
    if (selectedLockcodeFnRef.current === '선택') {
      lockCode = undefined;
    }
    const userId = inputUserIdFnRef.current === '' ? undefined : inputUserIdFnRef.current;
    const userNm = selectedUserNmFnRef.current === '' ? undefined : selectedUserNmFnRef.current;
    doReload(ctx, { lockcode: lockCode, userid: userId, userNm: userNm });
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, selectedLockcodeFnRef, refreshToken, inputUserIdFnRef, selectedUserNmFnRef]);

  const doDelete = useCallback(
    async (deleteList: string[]) => {
      try {
        setLoading(true);
        const { body } = await api.lock.delete({ delList: deleteList });
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const deleteClickHandle = () => {
    doDelete(deleteList).then(() => {
      setDeleteList([]);
      setRefreshToken(Date.now());
    });
  };

  return (
    <Box className="LockMgmtHome-root" sx={{ p: 2, pr: 3 }}>
      <Portlet>
        <PortletContent sx={{ px: 0, py: 2, position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
              <LinearProgress />
            </Box>
          )}
          <Box pl={1}>
            <SubTitleAndIcon labelTitle="LOCK 조회" />
          </Box>
          <Stack px={2} py={1} direction="row" alignItems="center" maxWidth={990} spacing={1}>
            <CLDocLabelAny title="LOCK 종류">
              <CLCodeListView
                selectSx={{ '& .MuiInputBase-root': { ml: 0, height: 28.9 } }}
                selectOnChange={(e) => {
                  setSelectedLockcode(e);
                }}
                selectValue={selectedLockcode}
                displayType="select"
                codeType="100"
              />
            </CLDocLabelAny>
            <CLDocLabelAny title="사용자 ID">
              <Stack direction="row">
                <CLStyledTextField
                  onChange={(e) => {
                    setInputUserId(e.target.value);
                  }}
                  value={inputUserId}
                  fullWidth
                />
              </Stack>
            </CLDocLabelAny>
            <CLDocLabelAny title="사용자 이름">
              <Stack direction="row">
                <CLStyledTextField
                  onChange={(e) => {
                    setSelectedUserNm(e.target.value);
                  }}
                  value={selectedUserNm}
                  fullWidth
                />
              </Stack>
            </CLDocLabelAny>
            <Button
              onClick={() => {
                setRefreshToken(Date.now);
              }}
              size="small"
              variant="contained"
              startIcon={<SearchIcon />}
            >
              조회
            </Button>
            <Button
              onClick={() => {
                setSelectedLockcode('선택');
                setInputUserId('');
                setSelectedUserNm('');
                setRefreshToken(Date.now);
              }}
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
            >
              새로고침
            </Button>
          </Stack>
          <Divider sx={{ my: 1, position: 'relative' }}></Divider>
          <Stack direction="row" justifyContent="space-between" pl={1} pr={3} pb={1}>
            <SubTitleAndIcon labelTitle="LOCK 조회 결과" />
            <Button
              onClick={deleteClickHandle}
              size="small"
              variant="outlined"
              startIcon={<DeleteIcon />}
            >
              선택삭제
            </Button>
          </Stack>
          <Box px={2} pb={2} ref={setBodyElement}>
            <TableContainer
              sx={{
                whiteSpace: 'nowrap',
                border: '1px solid #e0e0e0',
                height: {
                  xs: 'auto',
                  md: `calc(100vh - ${bodyTop}px - 110px)`,
                },
              }}
            >
              <Table>
                <CLDocTableHead yPadding="small">
                  <TableRow>
                    <TableCell sx={{ pl: 0.5, pr: 0 }}>
                      <CLStyledTableCheckBox
                        checked={deleteList.length === locks.length}
                        onChange={(e, check) => {
                          if (check) {
                            setDeleteList(locks.map((el) => el.lockkey));
                          } else {
                            setDeleteList([]);
                          }
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>설정일시</TableCell>
                    <TableCell>사용자ID</TableCell>
                    <TableCell>사용자이름</TableCell>
                    <TableCell>종류</TableCell>
                    <TableCell>타입</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell>KEY</TableCell>
                  </TableRow>
                </CLDocTableHead>
                <CLDocTableBody stripe>
                  {locks.map((el, i) => (
                    <LcokTabelRow
                      delList={deleteList}
                      onDel={(key, check) => {
                        if (check) {
                          setDeleteList((prev) => prev.concat(key));
                        } else {
                          setDeleteList((prev) => prev.filter((k) => k !== key));
                        }
                      }}
                      key={el.lockkey}
                      seq={i + 1}
                      data={el}
                    />
                  ))}
                </CLDocTableBody>
              </Table>
            </TableContainer>
          </Box>
        </PortletContent>
      </Portlet>
    </Box>
  );
}
