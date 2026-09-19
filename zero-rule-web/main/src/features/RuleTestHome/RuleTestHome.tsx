import CLDocLabelAny from '@/components/CLDocLabelAny/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput/CLDocLabelInput';
import CLStyledSelect from '@/components/CLStyledSelect/CLStyledSelect';
import CLStyledTextField from '@/components/CLStyledTextField/CLStyledTextField';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import { trimAndStringLenght } from '@/lib/common-validation';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { Portlet, PortletContent } from '@local/ui';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, LinearProgress, MenuItem, Stack } from '@mui/material';
import type {
  ApiRequestContext,
  Rule,
  RuleName,
  RuleReturnItemAndItemInfo,
  RuleTestParam,
  RuleTestResult,
} from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

type InputArrayDisplay = {
  label: string;
  value: string;
};

type RuleInfoAndItemList = {
  ruleReturnItems: RuleReturnItemAndItemInfo[];
} & Rule;

const DEFAULT_INPUTDISPLAY: InputArrayDisplay[] = new Array(10)
  .fill(0)
  .map(() => ({ label: '', value: '' }));

export default function RuleTestHome() {
  const api = useApi();
  const [ruleNames, setRuleNames] = useState<RuleName[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRuleid, setSelectedRuleid] = useState<string>('선택');
  // const selectedRuleidFnRef = useRef<string>('선택')
  // selectedRuleidFnRef.current = selectedRuleid
  const [inputAlias, setInputAlias] = useState<string>('');
  // const inputAliasFnRef = useRef<string>('')
  // inputAliasFnRef.current = inputAlias

  const [ruleInfo, setRuleInfo] = useState<RuleInfoAndItemList>();
  const [inputItem, setInputItem] = useState<InputArrayDisplay[]>(DEFAULT_INPUTDISPLAY);
  const [refreshToken, setRefreshToken] = useState(0);

  const [ruleTestResult, setRuleTestResult] = useState<RuleTestResult['ruleReturnList']>([]);

  const [popupMode, setPopupMode] = useState(false);

  const handlePopupClose = useCallback(() => {
    const sendDataToParent = {
      message: ruleTestResult.length,
    };
    window.opener.postMessage({ sendData: sendDataToParent }, '*');
  }, [ruleTestResult]);

  useEffect(() => {
    window.addEventListener('beforeunload', handlePopupClose);
    // Perform localStorage action
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('sendData');
    if (data === null) return;
    if (data === undefined) return;
    const parsedObject = JSON.parse(decodeURIComponent(data));
    if (parsedObject.ruleid !== undefined) {
      setPopupMode(true);
      setSelectedRuleid(parsedObject.ruleid);
      setRefreshToken(Date.now);
    }
    return () => {
      window.removeEventListener('beforeunload', handlePopupClose);
    };
  }, [handlePopupClose]);

  const doReload = useCallback(
    async (ctx: ApiRequestContext) => {
      try {
        const { body } = await api.rule.nameList({ ctx: ctx });
        if (ctx.canceled) return;
        setRuleNames(body.ruleNames);
      } catch (err) {
        handleError(err);
      } finally {
      }
    },
    [api],
  );

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload]);

  const doInfo = useCallback(
    async (param: { ruleid: string; ruleAlias?: string }) => {
      setLoading(true);
      try {
        const { body } = await api.rule.info({ ruleid: param.ruleid, ruleAlias: param.ruleAlias });
        setRuleInfo({
          ...body.rule,
          ruleReturnItems: body.ruleReturnItem,
        });
        if (body.inputItems.length > 0) {
          setInputItem((prev) =>
            prev.map((el, idx) => ({
              label: body.inputItems[idx],
              value: '',
            })),
          );
        }
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    setInputItem(DEFAULT_INPUTDISPLAY);
    setRuleTestResult([]);
    if (selectedRuleid === '선택') return;
    const ruleAlias = inputAlias === '' ? undefined : inputAlias;
    doInfo({ ruleid: selectedRuleid, ruleAlias: ruleAlias });
  }, [selectedRuleid, setInputItem, doInfo, inputAlias]);

  const onClickReload = () => {
    setRefreshToken(Date.now);
    setSelectedRuleid('선택');
    setInputAlias('');
    setRuleTestResult([]);
  };

  const doTest = useCallback(
    async (param: { ruleRequest: RuleTestParam }) => {
      setLoading(true);
      try {
        const { body } = await api.rule.ruleTest({ ruleTestParam: param.ruleRequest });
        // let parsedObject = JSON.parse(body.ruleTestResult)
        // const key = Object.entries(parsedObject) as [string, string][] // 객체의 첫 번째 키 가져오기
        // console.log('key', key)
        setRuleTestResult(body.ruleTestResult.ruleReturnList);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const doTestSubmit = useCallback(
    async (param: { ruleid: string }) => {
      setLoading(true);
      try {
        const { body } = await api.rule.ruleTestSubmit({ ruleid: param.ruleid });
        return body.result;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
      return 0;
    },
    [api],
  );

  const onClickTestSubmit = () => {
    if (ruleInfo?.ruleState === '2') {
      handlePopupClose();
      window.close();
      return;
    }
    if (ruleTestResult.length < 1) {
      return;
    }
    if (selectedRuleid === '선택') {
      return;
    }
    doTestSubmit({ ruleid: selectedRuleid }).then((result) => {
      if (result === 0) {
        toast.warn('테스트가 완료되지 않았습니다.');
      } else {
        handlePopupClose();
        window.close();
      }
    });
  };

  const onClickRuleTestReq = () => {
    setRuleTestResult([]);
    const test1 = '{"[룰ID]":"체권분류코드","[채권분류코드]":"3"}';
    const test2 = '{"[룰ID]":"이메일주소보안여부체크","[수신이메일메일사이트주소]":"daum.net"}';
    const test3 = '{"[룰ID]":"동물다리수추출","[동물이름]":"소"}';
    const test4 =
      '{"[룰ID]":"ERRORTEST","[수신이메일주소1]":1234,"[채권분류코드]":"12345dasdf","[이메일보안여부체크]":"Y"}';
    if (ruleInfo === undefined) return;
    if (inputItem.length < 1) return;
    const testingItems = inputItem.filter((el) => el.label !== undefined);
    if (ruleInfo.ruleReturnItems.length > 1) {
      if (testingItems.find((el) => trimAndStringLenght(el.value) === 0)) {
        toast.warning('입력항목을 전부 입력해주세요.');
        return;
      }
    }

    const paramRuleInfo = { ruleNm: '[룰ID]', ruleValue: ruleInfo.ruleNm };
    const paramRuleReturnList = testingItems.map((el) => ({
      itemNm: `[${el.label}]`,
      itemValue: el.value,
    }));

    const ruleTestParam = {
      ruleInfo: paramRuleInfo,
      ruleItemList: paramRuleReturnList,
    } as RuleTestParam;

    doTest({ ruleRequest: ruleTestParam });
  };

  const ruleReturnItemNames = ruleInfo?.ruleReturnItems.map((el) => el.itemNm).join(',');

  return (
    <Box className="RuleTestHome-root" sx={{ p: 2, pr: 3 }}>
      <Portlet>
        <PortletContent sx={{ px: 0, py: 1, position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
              <LinearProgress />
            </Box>
          )}
          {!popupMode && (
            <>
              <Box pl={1}>
                <SubTitleAndIcon labelTitle="조회" />
              </Box>
              <Stack px={2} py={1} direction="row" maxWidth={990} spacing={1}>
                <CLDocLabelAny title="룰명">
                  <CLStyledSelect
                    MenuProps={{ sx: { maxHeight: 400 } }}
                    onChange={(e) => {
                      setSelectedRuleid(String(e.target.value));
                      // onClickSearchBtn()
                    }}
                    value={selectedRuleid}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value={'선택'} color="inherit">
                      선택
                    </MenuItem>
                    {ruleNames.map((el) => (
                      <MenuItem value={el.ruleid} color="inherit" key={el.ruleid}>
                        {el.ruleNm}
                      </MenuItem>
                    ))}
                  </CLStyledSelect>
                </CLDocLabelAny>
                <CLDocLabelAny title="룰 별칭">
                  <Stack direction="row">
                    <CLStyledTextField
                      value={inputAlias}
                      onChange={(e) => setInputAlias(e.target.value)}
                      fullWidth
                      sx={{ width: 300 }}
                    />
                  </Stack>
                </CLDocLabelAny>
                <Button
                  onClick={() => setRefreshToken(Date.now)}
                  size="small"
                  variant="contained"
                  startIcon={<SearchIcon />}
                >
                  조회
                </Button>
                <Button
                  onClick={onClickReload}
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                >
                  새로고침
                </Button>
              </Stack>
              <Divider sx={{ my: 1, position: 'relative' }}></Divider>
            </>
          )}

          <Box pl={1}>
            <SubTitleAndIcon labelTitle="룰 조회 결과" />
          </Box>
          <Stack px={2} py={1} spacing={1}>
            <Stack direction="row" spacing={1}>
              <CLDocLabelInput value={ruleInfo?.ruleid} readOnly title="룰ID" />
              <Box flex={1}></Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <CLDocLabelInput value={ruleInfo?.ruleNm} readOnly title="룰명" />
              <CLDocLabelInput value={ruleInfo?.rulealiasNm} readOnly title="룰별칭" />
            </Stack>
            <Stack direction="row" spacing={1}>
              <CLDocLabelInput value={ruleReturnItemNames} readOnly title="반환항목" />
              <Box flex={1}></Box>
            </Stack>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Box pl={1}>
            <SubTitleAndIcon labelTitle="입력 항목" />
          </Box>
          <Stack direction="row" alignItems={'flex-end'} py={1} px={2}>
            <Stack>
              {inputItem.map((el, index) => (
                <Stack key={index}>
                  <CLDocLabelAny title={`항목 ${index + 1}`}>
                    <Stack direction="row" spacing={1}>
                      <CLStyledTextField value={el.label} fullWidth sx={{ width: 400 }} />
                      <CLStyledTextField
                        // readOnly={trimAndStringLenght(el.label) === 0 ? true : false}
                        value={el.value}
                        onChange={(e) => {
                          const tmpArr = [...inputItem];
                          tmpArr.splice(index, 1, { ...el, value: e.target.value });
                          setInputItem(tmpArr);
                        }}
                        fullWidth
                        sx={{ width: 400 }}
                      />
                    </Stack>
                  </CLDocLabelAny>
                </Stack>
              ))}
            </Stack>
            <Button
              sx={{ ml: 3 }}
              size="small"
              variant="contained"
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={onClickRuleTestReq}
            >
              룰 호출
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Box pl={1}>
            <SubTitleAndIcon labelTitle="결과" />
          </Box>
          <Stack py={1} px={2}>
            {ruleTestResult.map((el, idx) => (
              <CLDocLabelAny required title="반환값" key={idx}>
                <Stack direction="row" spacing={1}>
                  <CLStyledTextField
                    readOnly
                    value={el.returnItemNm}
                    fullWidth
                    sx={{ width: 500 }}
                  />
                  <CLStyledTextField
                    readOnly
                    value={el.returnItemValue}
                    fullWidth
                    sx={{ width: 500 }}
                  />
                </Stack>
              </CLDocLabelAny>
            ))}
          </Stack>
        </PortletContent>
      </Portlet>
      {popupMode && ruleTestResult.length > 0 && (
        <Stack direction="row" justifyContent="center" pt={1}>
          <Button
            sx={{ whiteSpace: 'nowrap' }}
            onClick={onClickTestSubmit}
            size="small"
            variant="contained"
          >
            테스트 완료하기
          </Button>
        </Stack>
      )}
    </Box>
  );
}
