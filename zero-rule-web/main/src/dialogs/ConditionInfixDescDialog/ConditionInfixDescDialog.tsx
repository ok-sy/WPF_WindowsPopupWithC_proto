import AddIcon from '@mui/icons-material/Add';
import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  MenuItem,
  MenuList,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { rootSx } from './style';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import CLDocLabelAny from '@/components/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import errorCustomHandle from '@/lib/error-custom-handle';
import { toast } from 'react-toastify';
import { operationSelBiz, returnValBiz, submitDataBiz, variableSelBiz } from './biz-data';

export type ConditionInfixDescDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: string) => void;
  val: string;
  ifid: string;
};
type InfixDescType = 'item' | 'rule';

export type Variable = {
  itemNm: string;
  dataTypeCd: string;
};
export default function ConditionInfixDescDialog(props: ConditionInfixDescDialogProps) {
  const { open, onClose, onSubmit, val, ifid } = props;
  const api = useApi();
  // 변수 라디오 데이터
  const [infixDescType, setInfixDescType] = useState<InfixDescType>('item');
  // 변수 select 데이터
  const [variableList, setVariableList] = useState<Variable[]>([]);
  // 중위식조건 출력 데이터
  const [submitData, setSubmitData] = useState<string>(val);
  // 변수 select
  const [variableSel, setVariableSel] = useState<string>('A');
  // 연산기호
  const [operationSel, setOperationSel] = useState<string>('A');
  // 데이터
  const [returnVal, setReturnVal] = useState<string>();
  // 데이터 텍스트 커서 타겟
  const [cursorPosition, setCursorPosition] = useState(0);
  // 드래그 text 데이터 상태값
  const [selectedText, setSelectedText] = useState<string>('');
  // 출력데이터 ref
  const textFieldRef = useRef<HTMLInputElement>(null);
  // 우클릭시 popover open 및 open위치 상태값
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

  const itemList = useCallback(
    async (
      params: {
        itemNm?: string;
        itemAliasNm?: string;
        itemUseYn?: string;
        ifid?: string;
      },
      ctx: ApiRequestContext,
      infixDescType: InfixDescType,
    ) => {
      try {
        if (infixDescType === 'item') {
          const { body } = await api.itemMgmt.itemMgmtSelect({ ctx, ...params });
          const { itemMgmt } = body;
          const selectDataSet = itemMgmt
            .filter((item) => item.itemUseYn === 'Y')
            .map((el) => {
              if (!el.itemNm || !el.dataTypeCd) return null;
              return {
                itemNm: el.itemNm,
                dataTypeCd: el.dataTypeCd,
              };
            })
            .filter((el): el is { itemNm: string; dataTypeCd: string } => el !== null); // null 값을 제거하여 타입 안전성을 보장합니다.
          if (ctx.canceled) return;
          return setVariableList(selectDataSet);
        } else if (infixDescType === 'rule') {
          const { body } = await api.rule.conditionRuleSelect({ ifid: params.ifid });
          const selectDataSet = body.ruleConditionInfixDescVo
            .filter((el) => el.ruleid && el.ruleid.startsWith('#S'))
            .map((el) => {
              return {
                itemNm: el.ruleNm,
                dataTypeCd: el.datatypeCd,
              };
            });
          return setVariableList(selectDataSet);
        }
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  useEffect(() => {
    setVariableSel('A');
    setOperationSel('A');
    setReturnVal('');
    const ctx = { canceled: false } as ApiRequestContext;
    const dataSet = {
      itemNm: '',
      itemAliasNm: '',
      itemUseYn: '',
      ifid: ifid,
    };

    itemList(dataSet, ctx, infixDescType);
  }, [infixDescType, itemList, ifid]);

  // 데이터 추가 버튼
  const handleClickAddOutDataBtn = () => {
    // 변수 선택 안했을때
    variableSelBiz(variableSel);
    // 연산자 선택 안했을때
    operationSelBiz(operationSel);
    // 데이터를 입력 안했을때
    returnValBiz(returnVal);
    // 변수가 항목일때
    if (!returnVal) return;
    // 데이터 추가 로직
    submitDataBiz(
      infixDescType,
      variableSel,
      operationSel,
      returnVal,
      variableList,
      cursorPosition,
      submitData,
      setSubmitData,
      setCursorPosition,
    );
  };

  // 드래그 데이터 가져와 저장하기
  useEffect(() => {
    const handleMouseUp = () => {
      const input = textFieldRef.current;
      if (input) {
        const selectionStart = input.selectionStart || 0; // 드래그 시작값
        const selectionEnd = input.selectionEnd || 0; // 드래그 종료값
        const selectedValue = input.value.substring(selectionStart, selectionEnd); // 드래그 데이터 짜르기
        setSelectedText(selectedValue);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  // 우클릭 버튼 클릭
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAnchorPosition({ top: e.clientY + 10, left: e.clientX + 60 });
  };
  // 드래그 영역 괄호 삽입 버튼
  const handleWrapWithParentheses = () => {
    if (selectedText) {
      setSubmitData((prevData) => {
        const start = textFieldRef.current?.selectionStart || 0; // 드래그의 시작값
        const end = textFieldRef.current?.selectionEnd || 0; // 드래그의 끝값
        const newData = prevData.slice(0, start) + '(' + selectedText + ')' + prevData.slice(end);
        return newData;
      });
    }
    setAnchorPosition(null);
  };
  const tmpArr = variableList.find((item) => item.itemNm === variableSel);
  useEffect(() => {
    setOperationSel('A');
  }, [tmpArr]);
  return (
    <CustomDragableDialog
      maxWidth="sm"
      fullWidth
      backLightOn
      className="ConditionInfixDescDialog-root"
      sx={rootSx}
      open={open}
      onClose={onClose}
    >
      <CustomDialogTitle title="조건식 등록/수정" onClose={onClose}></CustomDialogTitle>

      <DialogContent dividers className="ConditionInfixDescDialog-content">
        <Stack spacing={1}>
          <Stack>
            <CLDocLabelAny title="변수">
              <Stack direction="row" alignItems="center">
                <RadioGroup
                  sx={{ ml: 1 }}
                  value={infixDescType}
                  onChange={(e) => setInfixDescType(e.target.value as InfixDescType)}
                >
                  <Stack
                    alignItems="center"
                    direction="row"
                    sx={{
                      pl: 1,
                      whiteSpace: 'nowrap',
                      minHeight: 28,
                      '& .MuiButtonBase-root': { width: 8, height: 8, mr: 1 },
                    }}
                  >
                    <FormControlLabel value="item" control={<Radio size="small" />} label="항목" />
                    <FormControlLabel value="rule" control={<Radio size="small" />} label="룰" />
                  </Stack>
                </RadioGroup>
                <Select
                  value={variableSel}
                  onChange={(e) => setVariableSel(e.target.value as string)}
                  fullWidth
                  size="small"
                  sx={{
                    borderRadius: 0,
                    '& .MuiInputBase-root': {
                      fontSize: '0.7rem',
                      borderRadius: 0,
                      minWidth: '100%',
                      '& .MuiInputBase-input': {
                        p: 0.8,
                        width: '100%',
                        minWidth: 50,
                      },
                    },
                  }}
                >
                  <MenuItem value="A">선택</MenuItem>
                  {infixDescType === 'item'
                    ? variableList.map((el, idx) => {
                        const typeStr =
                          el.dataTypeCd === '0'
                            ? '숫자형'
                            : el.dataTypeCd === '1'
                              ? '문자형'
                              : '논리형';
                        return (
                          <MenuItem key={idx} value={el.itemNm}>
                            {'(' + typeStr + ')' + el.itemNm}
                          </MenuItem>
                        );
                      })
                    : variableList.map((el, idx) => {
                        const typeStr =
                          el.dataTypeCd === '0'
                            ? '숫자형'
                            : el.dataTypeCd === '1'
                              ? '문자형'
                              : '논리형';
                        return (
                          <MenuItem key={idx} value={el.itemNm}>
                            {'(' + typeStr + ')' + el.itemNm}
                          </MenuItem>
                        );
                      })}
                </Select>
              </Stack>
            </CLDocLabelAny>
            {tmpArr?.dataTypeCd === undefined ? (
              <CLDocLabelSelect
                title="연산자"
                sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
                value={operationSel}
                onChange={(e) => setOperationSel(e.target.value as string)}
                displayEmpty
              >
                <MenuItem value="A">선택</MenuItem>
              </CLDocLabelSelect>
            ) : tmpArr.dataTypeCd === '0' ? (
              <CLDocLabelSelect
                title="연산자"
                sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
                value={operationSel}
                onChange={(e) => setOperationSel(e.target.value as string)}
                displayEmpty
              >
                <MenuItem value="A">선택</MenuItem>
                <MenuItem value="==">==</MenuItem>
                <MenuItem value="!=">!=</MenuItem>
                <MenuItem value="<=">&lt;=</MenuItem>
                <MenuItem value=">=">&gt;=</MenuItem>
                <MenuItem value="+">+</MenuItem>
                <MenuItem value="-">-</MenuItem>
                <MenuItem value="*">*</MenuItem>
                <MenuItem value="/">/</MenuItem>
                <MenuItem value="^">^</MenuItem>
                <MenuItem value="%">%</MenuItem>
                <MenuItem value="like">like</MenuItem>
                <MenuItem value="not like">not like</MenuItem>
                <MenuItem value="in">in</MenuItem>
              </CLDocLabelSelect>
            ) : tmpArr.dataTypeCd === '1' ? (
              <CLDocLabelSelect
                title="연산자"
                sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
                value={operationSel}
                onChange={(e) => setOperationSel(e.target.value as string)}
                displayEmpty
              >
                <MenuItem value="A">선택</MenuItem>
                <MenuItem value="==">==</MenuItem>
                <MenuItem value="!=">!=</MenuItem>
                <MenuItem value="like">like</MenuItem>
                <MenuItem value="not like">not like</MenuItem>
                <MenuItem value="in">in</MenuItem>
              </CLDocLabelSelect>
            ) : (
              tmpArr.dataTypeCd === '2' && (
                <CLDocLabelSelect
                  title="연산자"
                  sx={{ '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
                  value={operationSel}
                  onChange={(e) => setOperationSel(e.target.value as string)}
                  displayEmpty
                >
                  <MenuItem value="A">선택</MenuItem>
                  <MenuItem value="==">==</MenuItem>
                </CLDocLabelSelect>
              )
            )}
            <CLDocLabelInput
              title={'데이터'}
              value={returnVal}
              onChange={(e) => {
                const tmpArr = variableList.find((item) => item.itemNm === variableSel);
                let value = e.target.value;

                if (tmpArr?.dataTypeCd === '0') {
                  if (
                    operationSel !== 'in' &&
                    operationSel !== 'like' &&
                    operationSel !== 'not like'
                  )
                    value = e.target.value.replace(/\D/g, '');
                } else {
                  value;
                }
                setReturnVal(value);
              }}
            />
            <Stack direction="row" justifyContent="flex-end" mt={1}>
              <Button variant="outlined" size="small" onClick={handleClickAddOutDataBtn}>
                데이터 추가
              </Button>
            </Stack>
          </Stack>
          <Divider />
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSubmitData(val);
                    setCursorPosition(0);
                  }}
                >
                  데이터 리셋
                </Button>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (
                      textFieldRef.current?.selectionStart === undefined ||
                      textFieldRef.current?.selectionStart === 0
                    ) {
                      return setSubmitData(submitData + ' and');
                    }
                    const start = textFieldRef.current?.selectionStart || 0;
                    const end = textFieldRef.current?.selectionEnd || 0;
                    const beforeCursor = submitData.slice(0, start);
                    const afterCursor = submitData.slice(end);
                    setSubmitData(beforeCursor + ' and' + afterCursor);
                  }}
                >
                  and
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (
                      textFieldRef.current?.selectionStart === undefined ||
                      textFieldRef.current?.selectionStart === 0
                    ) {
                      return setSubmitData(submitData + ' or');
                    }
                    const start = textFieldRef.current?.selectionStart || 0;
                    const end = textFieldRef.current?.selectionEnd || 0;
                    const beforeCursor = submitData.slice(0, start);
                    const afterCursor = submitData.slice(end);
                    setSubmitData(beforeCursor + ' or' + afterCursor);
                  }}
                >
                  or
                </Button>
              </Stack>
            </Stack>
            <TextField
              inputRef={textFieldRef}
              onContextMenu={handleContextMenu}
              multiline
              minRows={2}
              fullWidth
              size="small"
              value={submitData}
              onChange={(e) => setSubmitData(e.target.value as string)}
              onClick={(e) => {
                const target = e.target as HTMLInputElement;
                setCursorPosition(target.selectionStart || 0);
              }}
              onKeyUp={(e) => {
                const target = e.target as HTMLInputElement;
                setCursorPosition(target.selectionStart || 0);
              }}
            />
            <Popover
              id={anchorPosition ? 'simple-popover' : undefined}
              open={Boolean(anchorPosition)}
              anchorReference="anchorPosition"
              anchorPosition={
                anchorPosition ? { top: anchorPosition.top, left: anchorPosition.left } : undefined
              }
              onClose={() => setAnchorPosition(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <MenuList>
                <MenuItem onClick={handleWrapWithParentheses}>{'(' + ')'}괄호 감싸기</MenuItem>
              </MenuList>
            </Popover>
            <Stack
              spacing={0.5}
              component="ul"
              sx={{
                pl: 3,
                em: {
                  color: 'secondary.main',
                  fontStyle: 'normal',
                },
                fontSize: '0.8rem',
              }}
              className="HelpPaper-root"
            >
              <li>
                직접 <em>출력데이터</em>에서 작성도 가능합니다.
              </li>
              <li>
                <em>데이터 추가</em>시 <em>출력데이터</em>에 추가할 부분을 <em>클릭</em>하면 중간에
                데이터 추가가 가능합니다.
              </li>
              <li>
                <em>and</em>, <em>or</em> 선택 전 삽입해야할 위치를 찍어주세요.
              </li>
              <li>
                <em>드래그</em>하고 <em>우클릭</em> 시 괄호로 감쌀 수 있습니다.
              </li>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onSubmit(submitData)}>
          저장
        </Button>
        <Button variant="contained" onClick={onClose}>
          취소
        </Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
