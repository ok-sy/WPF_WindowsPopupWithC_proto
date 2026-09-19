import { useLoginProfile } from '@/auth/useLoginProfile';
import BufferProgress from '@/components/BufferProgress/BufferProgress';
import CustomSwitch from '@/components/RuleComponents/CustomSwitc';
import { RuleMapButton } from '@/components/RuleComponents/RuleMapButton';
import errorCustomHandle from '@/lib/error-custom-handle';
import { openNextPageStorageSetData } from '@/lib/popup-handle';
import { useApi } from '@/provider';
import { Portlet, PortletContent, useElementLeftTop } from '@local/ui';
import { Box, Button, Divider, LinearProgress, MenuItem, Select, Stack } from '@mui/material';
import type {
  ApiRequestContext,
  ItemMgmt,
  Rule,
  RuleInfoCondition,
  RuleInfoInputType,
  RuleInterface,
  RuleProgressHistory,
  RuleVerstionData,
  TreeIfRules,
  UpdateInsertAllData,
} from '@local/domain';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RuleConditionList from './components/RuleConditionList';
import RuleHstList from './components/RuleHstList';
import RuleInfo from './components/RuleInfo';
import RuleMap from './components/RuleMap';
import RuleReturnList from './components/RuleReturnList';
import type { RuleSavedValidSameValid } from './rule-valid';
import { checkValid, sameValidForSaveJsonComparison } from './rule-valid';
import { rootSx } from './style';
import { useObservable } from 'react-use';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import type { RuleProgressHstDialogProps } from '@/dialogs/RuleProgressHstDialog';
import RuleProgressHstDialog from '@/dialogs/RuleProgressHstDialog';

export default function RuleHome() {
  const api = useApi();
  const login = useLoginProfile();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [treeRefreshToken, setTreeRefreshToken] = useState(0);
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const { sceneManager } = useMainLayoutContext();

  const currentPage = useObservable(sceneManager.observeCurrentSceneOrNull(), null);

  // x트리 전체 데이터
  const [treeIfRules, setTreeIfRules] = useState<TreeIfRules[]>();
  // 읽기/편집 상태관리
  const [readChecked, setReadChecked] = useState(false);
  // 선택한 룰의 상세정보
  const [selectedRuleId, setSelectedRuleId] = useState<string>(); // 얜 그냥 선택된 룰 정보
  // 선택한 룰의 인터페이스정보
  const [selectedInterfaceInfo, setSelectedInterfaceInfo] = useState<RuleInterface>(); // 얜 그냥 선택된 인터페이스 정보
  // 전체 인풋 데이터
  const [updateInsertAllData, setUpdateInsertAllData] = useState<UpdateInsertAllData>(); // 전체 인포데이터
  // 룰테스트버튼 활성비활성 여부
  // const [ruleTestDisabled, setRuleTestDisabled] = useState<boolean>(false)
  const [ruleHisData, setRuleHisData] = useState<RuleVerstionData[]>([]);
  const [saveRefreshToken, setSaveRefreshToken] = useState<number>(0);
  // 룰진행이력 props
  const [ruleProgressHstDialogProps, setRuleProgressHstDialogProps] =
    useState<RuleProgressHstDialogProps>();
  // 배포상태변경 select
  const [chngDeployStateSelData, setChngDeployStateSelData] = useState<string>('Y');
  // 비교값
  const [asisRuleValid, setAsisRuleValid] = useState<RuleSavedValidSameValid>();
  // 진행이력 데이터
  const [listData, setListData] = useState<RuleProgressHistory[]>([]);

  // 화면 전체 초기화
  const ruleScreenReset = () => {
    setUpdateInsertAllData(undefined);
    setSelectedRuleId(undefined);
    setSelectedInterfaceInfo(undefined);
    setRuleHisData([]);
    setChngDeployStateSelData('Y');
    setAsisRuleValid(undefined);
    setTreeRefreshToken(Date.now());
    setReadChecked(false);
  };
  // API 함수 =================================================================
  // 룰 상세 목록 조회 API
  const doRuleInfo = useCallback(
    async (
      params: { ruleid: string },
      ctx: ApiRequestContext,
      selectedInterfaceInfo: RuleInterface,
    ) => {
      try {
        setLoading(true);
        const { body } = await api.rule.detailInfo({ ctx, ...params });
        const { ruleInfo, ruleHistory, ruleInfoCondition, ruleInfoRuleReturn, ruleUseType } = body;
        if (ctx.canceled) return;
        if (!ruleInfo) return;
        setUpdateInsertAllData({
          ruleid: ruleInfo.ruleid,
          ifNm: selectedInterfaceInfo.ifNm,
          ruleVerno: ruleInfo.ruleVerno,
          ruleState: ruleInfo.ruleState,
          ruleNm: ruleInfo.ruleNm,
          rulealiasNm: ruleInfo.rulealiasNm,
          ruleDesc: ruleInfo.ruleDesc,
          rulesortCd: ruleInfo.rulesortCd,
          ruleusageCd: ruleInfo.ruleusageCd,
          rulereturnType: ruleInfo.rulereturnType,
          allreturnYn: ruleInfo.allreturnYn,
          updateDatetime: ruleInfo.updateDatetime,
          updateUserid: ruleInfo.updateUserid,
          returnItem: ruleInfoRuleReturn.filter((el) => el.uptGubun !== 'D'),
          conditionList: ruleInfoCondition.filter((el) => el.uptGubun !== 'D'),
          deployUserid: ruleInfo.deployUserid ?? '',
          deployDatetime: ruleInfo.deployDatetime ?? '',
          ruleApplyYn: ruleInfo.ruleApplyYn,
          deployWaitStateAppyYn: ruleInfo.deployWaitStateAppyYn,
        });
        setAsisRuleValid({
          ruleNm: ruleInfo.ruleNm,
          rulealiasNm: ruleInfo.rulealiasNm,
          ruleDesc: ruleInfo.ruleDesc,
          rulereturnType: ruleInfo.rulereturnType,
          allreturnYn: ruleInfo.allreturnYn,
          returnItem: ruleInfoRuleReturn.filter((el) => el.uptGubun !== 'D'),
          conditionList: ruleInfoCondition.filter((el) => el.uptGubun !== 'D'),
        });
        // setChngDeployStateSelData(ruleInfo.ruleApplyYn)
        setRuleHisData(body.ruleHistory);
        if (ruleUseType === 'Y') {
          setReadChecked(true);
        } else {
          setReadChecked(false);
        }
      } catch (e) {
        errorCustomHandle(e);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    if (!updateInsertAllData?.ruleApplyYn) return;
    if (listData[0]?.deployWaitStateApplyYn === null) {
      setChngDeployStateSelData(updateInsertAllData.ruleApplyYn);
    } else {
      setChngDeployStateSelData(listData[0]?.deployWaitStateApplyYn);
    }
  }, [listData, updateInsertAllData?.ruleApplyYn]);

  // 룰 저장 API
  const doSave = useCallback(
    async (
      params: {
        ruleid?: string;
        ruleInfo: RuleInfoInputType;
        ruleInfoRuleReturn: ItemMgmt[];
        ruleInfoCondition: RuleInfoCondition[];
      },
      lgonId: string,
    ) => {
      try {
        setSaveLoading(true);
        const { body } = await api.rule.ruleCreateOrModify({ ...params });
        const { updateRuleId } = body;
        if (params.ruleid === undefined) {
          const dataSet = {
            lockcode: '002',
            lockkey: updateRuleId,
            locktypecode: '2',
            locknote: `${lgonId}가 룰ID: ${updateRuleId} 편집중`,
          };

          await api.lock.insert({ ...dataSet });
        }

        return updateRuleId;
      } catch (e) {
        errorCustomHandle(e);
      } finally {
        // setTreeRefreshToken(Date.now())
        setSaveLoading(false);
      }
    },
    [api],
  );
  // 룰 삭제 API
  const ruleDelete = useCallback(
    async (params: { ruleid: string }) => {
      try {
        await api.rule.ruleDel(params);
        await api.lock.delete({ delList: [params.ruleid] });
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setTreeRefreshToken(Date.now());
      }
    },
    [api],
  );
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
  // 락테이블에 해당룰 존재여부 체크API
  const lockCheck = useCallback(
    async (params: { lockkey: string }) => {
      try {
        const { body } = await api.lock.ruleForUserLock({ ...params });
        return body.result;
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  // 락테이블 삭제API
  const lockDel = useCallback(
    async (delList: string[]) => {
      try {
        await api.lock.delete({ delList });
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  // 룰 배포대기 API
  const ruleDeployWait = useCallback(
    async (params: { ruleid?: string; ruleApplyYn: string }) => {
      try {
        await api.rule.ruleDeployWait({ ...params });
        setTreeRefreshToken(Date.now());
        toast.success('배포 대기가 완료되었습니다.');
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  // 룰 배포취소 API
  const ruleDeployWaitCancel = useCallback(
    async (params: { ruleid?: string; beforeRuleVerno: number }) => {
      try {
        await api.rule.ruleDeployWaitCancel({ ...params });
        setTreeRefreshToken(Date.now());
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );

  // 룰 배포 락걸려있는지 체크 API
  const ruleLockChecked = useCallback(async () => {
    try {
      const { body } = await api.lock.ruleLockCheck({});
      return body.result;
    } catch (err) {
      errorCustomHandle(err);
    }
  }, [api]);
  // =================================================================
  // useEffect =======================================================
  // 룰상세 목록조회
  useEffect(() => {
    if (!selectedRuleId) return;
    if (!selectedInterfaceInfo) return;
    if (!treeIfRules) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doRuleInfo({ ruleid: selectedRuleId }, ctx, selectedInterfaceInfo);
  }, [selectedInterfaceInfo, selectedRuleId, treeIfRules, saveRefreshToken, doRuleInfo]);

  // 룰테스트 활성/비활성 처리
  // useEffect(() => {
  //   if (!updateInsertAllData?.ruleVerno) return setRuleTestDisabled(true)
  //   if (updateInsertAllData?.ruleVerno < 1) {
  //     setRuleTestDisabled(true)
  //   } else {
  //     setRuleTestDisabled(false)
  //   }
  // }, [updateInsertAllData?.ruleVerno])
  // =================================================================
  // 버튼 함수 =======================================================

  // 진행이력 목록조회 API
  const doReload = useCallback(
    async (params: { ruleid?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.rule.ruleProgressList({
          ctx,
          ...params,
        });
        setListData(body.ruleProgressHistoryVo);
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  useEffect(() => {
    if (!updateInsertAllData?.ruleid) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doReload({ ruleid: updateInsertAllData.ruleid }, ctx);
  }, [updateInsertAllData?.ruleid, doReload, treeRefreshToken]);
  // 진행이력팝업 버튼
  const openProgressHstDialog = () => {
    if (!updateInsertAllData) return;
    setRuleProgressHstDialogProps({
      open: true,
      onClose: () => {
        setRuleProgressHstDialogProps(undefined);
      },
      data: listData,
    });
  };
  // 트리에 룰 선택 함수
  const handleClickTreeRule = (info: Rule, inertVal: RuleInterface) => {
    if (readChecked) {
      if (!updateInsertAllData?.ruleid) {
        setSelectedRuleId(info.ruleid);
        setSelectedInterfaceInfo(inertVal);
      } else if (
        !confirm(
          `수정모드에서 읽기모드로 변환되며 수정데이터는 초기화됩니다.\n그래도 이동하시겠습니까?`,
        )
      ) {
        return;
      } else {
        setSelectedRuleId(info.ruleid);
        setSelectedInterfaceInfo(inertVal);
        lockDel([updateInsertAllData.ruleid]);
      }
    } else {
      setSelectedRuleId(info.ruleid);
      setSelectedInterfaceInfo(inertVal);
    }
  };
  // 저장버튼 클릭 함수
  const handleClickRuleSaveBtn = () => {
    if (!updateInsertAllData) return;
    if (!login) return;
    const valid = checkValid(updateInsertAllData);
    const insertDataSet = {
      ruleid: updateInsertAllData?.ruleid,
      ruleInfoCondition:
        updateInsertAllData?.conditionList?.filter((el) => el.uptGubun !== 'D') ?? [],
      ruleInfo: {
        ...updateInsertAllData,
        ifid: selectedInterfaceInfo?.ifid,
      },
      ruleInfoRuleReturn:
        updateInsertAllData?.returnItem?.filter((el) => el.uptGubun !== 'D') ?? [],
    };
    if (valid) {
      doSave(insertDataSet, login?.profile.lgonId).then((result: string | undefined) => {
        if (result !== undefined) {
          setSelectedRuleId(result);
          toast.success('저장되었습니다.');
          setTreeRefreshToken(Date.now());
          setSaveRefreshToken(Date.now());
        }
      });
    }
  };

  // 룰 추가버튼 클릭 함수
  const handleClickRuleInsertBtn = () => {
    if (!selectedInterfaceInfo) {
      toast.warning('인터페이스 정보가 없습니다.');
      return;
    } else {
      setSelectedRuleId(undefined);
      setUpdateInsertAllData({
        ...updateInsertAllData,
        ruleid: undefined,
        ifNm: selectedInterfaceInfo?.ifNm,
        ruleVerno: 0.01,
        ruleState: '신규등록',
        ruleNm: '',
        rulealiasNm: '',
        ruleDesc: '',
        rulesortCd: '0',
        ruleusageCd: 'M',
        rulereturnType: '0',
        allreturnYn: 'N',
        deployDatetime: '',
        deployUserid: '',
        conditionList: [],
        returnItem: [],
        updateDatetime: '',
        updateUserid: '',
        ruleApplyYn: '',
      });
      setReadChecked(true);
    }
  };

  // 읽기/편집 토글 버튼클릭 함수
  const handleClickRUBtn = () => {
    setReadChecked((p) => !p);
    if (!readChecked) {
      if (!updateInsertAllData?.ruleid) return;
      const dataSet = {
        lockcode: '002',
        lockkey: updateInsertAllData?.ruleid,
        locktypecode: '2',
        locknote: `${login?.profile.lgonId}가 룰ID: ${updateInsertAllData?.ruleid} 편집중`,
      };
      lockCheck({ lockkey: updateInsertAllData?.ruleid }).then((result) => {
        if (result === 0) {
          lockInsert(dataSet);
        } else {
          setReadChecked(false);
        }
      });
    } else {
      if (!updateInsertAllData?.ruleid) return;
      lockDel([updateInsertAllData.ruleid]);
    }
  };
  // 룰 삭제 버튼클릭 함수
  const handleClickRuleDel = () => {
    if (!updateInsertAllData?.ruleid) return;
    if (!confirm(`정말로 삭제하시겠습니까?`)) {
      return;
    }
    ruleDelete({ ruleid: updateInsertAllData?.ruleid }).then((result) => {
      ruleScreenReset();
    });
  };
  // 배포대기 버튼클릭 함수
  const handleClickDepWaitBtn = (depYn: string) => {
    if (!updateInsertAllData) return;
    if (!updateInsertAllData.ruleVerno) return;
    const dataSet = {
      ruleid: updateInsertAllData?.ruleid,
      ruleApplyYn: chngDeployStateSelData,
    };
    if (depYn === 'Y') {
      ruleDeployWait(dataSet);
    } else {
      ruleDeployWaitCancel({
        ruleid: dataSet.ruleid,
        beforeRuleVerno: updateInsertAllData.ruleVerno,
      });
    }
  };
  // ===============================================================
  // 컴포넌트 props 데이터 ==========================================
  // 룰 항목에서 넘어온 데이터정의 함수
  const handleSubmitRuleData = (data: RuleInfoInputType) => {
    setUpdateInsertAllData({ ...data });
  };
  // 룰반환리스트 항목에서 넘어온 데이터정의 함수
  const handleSubmitRuleReturnListData = (data: ItemMgmt[]) => {
    if (!updateInsertAllData) return;
    const conditionUpdate = [...(updateInsertAllData.conditionList ?? [])];
    if (conditionUpdate.length === 0) {
      return setUpdateInsertAllData({
        ...updateInsertAllData,
        returnItem: data,
      });
    }
    const newItems = data.filter((el) => el.uptGubun === 'C');

    newItems.forEach((item) => {
      const lastNo = conditionUpdate.sort((a, b) => a.ruleconditionno - b.ruleconditionno)[
        conditionUpdate.length - 1
      ].ruleconditionno;

      const isDuplicate = conditionUpdate.some((el) => el.returnItemid === item.itemid);
      for (let i = 1; i <= lastNo; i++) {
        if (!isDuplicate) {
          conditionUpdate.push({
            ruleid: selectedRuleId ?? '0',
            ruleconditionno: i,
            uptGubun: 'C',
            itemNm: item.itemNm ?? '',
            datatypeCd: item.dataTypeCd ?? '',
            returnitemExprDesc: '',
            returnItemid: item.itemid,
            conditionDesc: '',
            conditionInfixDesc: '',
          });
        }
      }
    });
    const delItems = data.filter((el) => el.uptGubun === 'D').map((el) => el.itemid);
    const finalArr = conditionUpdate
      .filter((con) => !delItems.includes(con.returnItemid))
      .sort((a, b) => a.ruleconditionno - b.ruleconditionno);

    setUpdateInsertAllData({
      ...updateInsertAllData,
      returnItem: data,
      conditionList: finalArr,
    });
  };
  // 조건식리스트 항목에서 넘어온 데이터정의 함수
  const handleSubmitRuleConditionListData = (data: RuleInfoCondition[]) => {
    setUpdateInsertAllData({ ...updateInsertAllData, conditionList: data });
  };
  // =================================================================

  // 읽기/편집버튼
  const readCheckBtnDisable = selectedRuleId === undefined;
  // 저장버튼
  const saveBtnDisable =
    !readChecked ||
    updateInsertAllData?.ruleState === '배포대기' ||
    sameValidForSaveJsonComparison(asisRuleValid, {
      ruleNm: updateInsertAllData?.ruleNm,
      rulealiasNm: updateInsertAllData?.rulealiasNm,
      ruleDesc: updateInsertAllData?.ruleDesc,
      rulereturnType: updateInsertAllData?.rulereturnType,
      allreturnYn: updateInsertAllData?.allreturnYn,
      returnItem: updateInsertAllData?.returnItem,
      conditionList: updateInsertAllData?.conditionList,
    });
  // 룰테스트버튼
  const ruleTstBtnDisable =
    updateInsertAllData?.ruleid === undefined ||
    !readChecked ||
    updateInsertAllData?.ruleState === '배포대기' ||
    updateInsertAllData?.ruleState === '테스트완료' ||
    updateInsertAllData?.ruleState === '배포대기취소' ||
    updateInsertAllData?.ruleState === '배포완료';
  // 삭제버튼
  const delBtnDisable =
    updateInsertAllData?.ruleid === undefined ||
    !readChecked ||
    updateInsertAllData?.ruleState === '배포대기' ||
    updateInsertAllData?.ruleApplyYn === 'Y';
  // 룰적용버튼
  const deployBtnDisable = updateInsertAllData?.ruleState === '신규등록';
  // 적용/미적용 콤보
  const depUnDepSelectDiable =
    !readChecked ||
    updateInsertAllData?.ruleState === '배포대기' ||
    updateInsertAllData?.ruleState === '저장완료' ||
    updateInsertAllData?.ruleid === undefined;
  // 배포대기버튼
  const depWaitBtnDisable =
    !readChecked ||
    updateInsertAllData?.ruleState === '배포대기' ||
    updateInsertAllData?.ruleState === '저장완료' ||
    updateInsertAllData?.ruleid === undefined ||
    (updateInsertAllData?.ruleApplyYn === 'N' && chngDeployStateSelData === 'N') ||
    (!Number.isInteger(updateInsertAllData?.ruleVerno) && chngDeployStateSelData === 'N') ||
    (Number.isInteger(updateInsertAllData?.ruleVerno) &&
      updateInsertAllData?.ruleApplyYn === 'Y' &&
      chngDeployStateSelData === 'Y');

  return (
    <Box sx={rootSx} className="RuleHome-root">
      {saveLoading && <BufferProgress text="잠시만 기다려주세요." />}
      <Portlet className="RuleHome-portlet">
        <PortletContent noPadding>
          <RuleMap
            treeSelecteding={selectedRuleId}
            deployBtnDisable={deployBtnDisable}
            onSubmitSelectedIfId={setSelectedInterfaceInfo}
            onSubmitSelectedRuleId={handleClickTreeRule}
            treeIfRules={treeIfRules ?? []}
            setTreeIfRules={(val) => setTreeIfRules(val)}
            refresh={treeRefreshToken}
            onSubmitRefresh={setTreeRefreshToken}
            onSubmitCreatePage={handleClickRuleInsertBtn}
          />
        </PortletContent>
      </Portlet>
      {loading && (
        <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
      <Box sx={{ flex: 1 }} key={treeRefreshToken}>
        <Portlet className="RuleHome-portlet-rule" sx={{ borderTopLeftRadius: '0' }}>
          <PortletContent
            noPadding
            className="RuleHome-portlet-ruleContent"
            ref={setBodyElement}
            sx={{
              minHeight: `calc(100vh - ${bodyTop}px - 40px)`,
              maxHeight: `calc(100vw - ${bodyTop}px - 40px)`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" m={1} spacing={0.5}>
              <Stack alignItems="center" alignSelf="center">
                <CustomSwitch
                  checked={readChecked}
                  disabled={readCheckBtnDisable}
                  onClick={handleClickRUBtn}
                  activeText="편집"
                  unActiveText="읽기"
                  size="medium"
                />
              </Stack>
              <Stack direction="row" my={-1} maxHeight={30} spacing={0.5}>
                <Stack direction="row" my={-1} maxHeight={30} spacing={0.5}>
                  <RuleMapButton
                    variant="contained"
                    text="저장"
                    disabled={saveBtnDisable}
                    onClick={() => {
                      handleClickRuleSaveBtn();
                    }}
                  />
                  <RuleMapButton
                    text="룰테스트"
                    disabled={ruleTstBtnDisable}
                    onClick={() => {
                      if (!selectedRuleId) {
                        toast.warning('선택된 룰이 없습니다.');
                        return;
                      }
                      openNextPageStorageSetData(
                        'rule/rule-test',
                        'width=1200,height=800',
                        'ruleInfo',
                        {
                          ruleid: selectedRuleId,
                        },
                      );
                      window.addEventListener('message', (event) => {
                        const { data } = event;
                        if (data === undefined) return;
                        if (data.sendData === undefined) return;
                        if (data.sendData.message === undefined) return;
                        if (data.sendData.message > 0) {
                          // toast.success('테스트 성공')
                          setTreeRefreshToken(Date.now());
                        } else {
                          return;
                        }
                      });
                    }}
                  />
                  <Stack direction="row" spacing={0.5} alignItems="center" pr={2}>
                    <Select
                      disabled={depUnDepSelectDiable}
                      value={chngDeployStateSelData}
                      onChange={(e) => {
                        setChngDeployStateSelData(e.target.value as string);
                      }}
                      size="small"
                      sx={{
                        height: 30,
                        '& .MuiInputBase-input': {
                          p: 0.8,
                          minWidth: 45,
                          maxWidth: 45,
                        },
                      }}
                    >
                      <MenuItem value="Y">적용</MenuItem>
                      <MenuItem value="N">미적용</MenuItem>
                    </Select>
                    {updateInsertAllData?.ruleState !== '배포대기' ? (
                      <Button
                        disabled={depWaitBtnDisable}
                        size="small"
                        variant="contained"
                        onClick={() => handleClickDepWaitBtn('Y')}
                      >
                        배포대기
                      </Button>
                    ) : (
                      <Button
                        disabled={!readChecked}
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => {
                          ruleLockChecked().then((result) => {
                            if (result === 1) {
                              if (!confirm('배포대기를 취소하시겠습니까?')) return;
                              if (!updateInsertAllData?.ruleApplyYn) return;
                              handleClickDepWaitBtn('N');
                              setChngDeployStateSelData(updateInsertAllData.ruleApplyYn);
                            }
                          });
                        }}
                      >
                        배포대기취소
                      </Button>
                    )}
                  </Stack>
                  <RuleMapButton
                    text="삭제"
                    color="warning"
                    disabled={delBtnDisable}
                    onClick={handleClickRuleDel}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={openProgressHstDialog}
                    disabled={!selectedRuleId}
                  >
                    진행이력
                  </Button>
                </Stack>
              </Stack>
            </Stack>
            <Divider />
            <Stack p={1} spacing={1} overflow={'hidden'}>
              <RuleInfo
                asisData={updateInsertAllData}
                onSubmitData={handleSubmitRuleData}
                readChecked={!readChecked || updateInsertAllData?.ruleState === '배포대기'}
              />
              {/* rule 반환리스트 */}
              <RuleReturnList
                asisData={updateInsertAllData?.returnItem ?? []}
                readChecked={!readChecked || updateInsertAllData?.ruleState === '배포대기'}
                onSubmitData={handleSubmitRuleReturnListData}
                ifid={selectedInterfaceInfo?.ifid ?? ''}
              />
              {/* 조건식 리스트 */}
              <RuleConditionList
                asisData={updateInsertAllData?.conditionList ?? []}
                readChecked={!readChecked || updateInsertAllData?.ruleState === '배포대기'}
                ruleReturnData={updateInsertAllData?.returnItem ?? []}
                onSubmitData={handleSubmitRuleConditionListData}
                ifid={selectedInterfaceInfo?.ifid ?? ''}
              />
              {updateInsertAllData?.ruleid !== undefined && (
                <RuleHstList
                  key={updateInsertAllData.ruleid}
                  data={ruleHisData.length < 1 ? [] : ruleHisData}
                  ifNm={updateInsertAllData?.ifNm ?? ''}
                />
              )}
              {/* 변경이력 */}
            </Stack>
          </PortletContent>
        </Portlet>
      </Box>
      {ruleProgressHstDialogProps && <RuleProgressHstDialog {...ruleProgressHstDialogProps} />}
    </Box>
  );
}
