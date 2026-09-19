import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import { pstring } from '@cp949/pjs';
import type { CLCodeType } from '@local/domain';
import { requestFocusSelector } from '@local/ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import type { CodeInput } from '../types';
import CommonCodeEditRow from './CommonCodeEditRow';
import errorCustomHandle from '@/lib/error-custom-handle';

type CodeInputRow = {
  rowKey: number;
} & Partial<CodeInput>;

type Props = {
  codeTypeEntity: CLCodeType;
  onClose: () => void;
  onSaved: () => void;
};

const MAX_LENS = {
  code: 20,
  codeNm: 60,
  dtlExpl: 200,
};

export default function CommonCodeEditForm(props: Props) {
  const { codeType, codeTypeNm } = props.codeTypeEntity;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const orgCodeCountRef = useRef(0);

  const onSavedFnRef = useRef<Props['onSaved']>();
  onSavedFnRef.current = props.onSaved;

  const onCloseFnRef = useRef<Props['onClose']>();
  onCloseFnRef.current = props.onClose;

  // 입력 데이터
  const [codeInputList, setCodeInputList] = useState<CodeInputRow[]>([]);

  // 행추가
  const handleClickAddRows = () => {
    const newValues = [createEmptyRow(), createEmptyRow(), createEmptyRow()];
    setCodeInputList((p) => [...p, ...newValues]);
  };

  // 포커스
  const focus = (selector: string) => {
    requestFocusSelector(rootRef.current, selector);
  };

  // 포커스 by 행번호 and 필드
  const focusRowAt = (rowIndex: number, field: string) => {
    focus(`[data-row-index='${rowIndex}'][data-row-field='${field}'] input`);
  };

  // 저장하기
  const doSave = useCallback(
    async (codeType: string, codes: CodeInput[]): Promise<boolean> => {
      try {
        setSaving(true);
        await api.clCode.saveAll({ codeType, codes });
        toast.success('저장되었습니다');
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setSaving(false);
      }
      return false;
    },
    [api],
  );

  // 코드 목록 조회
  const doLoadCodeList = useCallback(
    async (ctx: ApiRequestContext, codeType: string) => {
      setLoading(true);
      try {
        const { body } = await api.clCode.search({
          ctx,
          codeType,
          rowsPerPage: 9999,
          pageNumber: 0,
        });
        const { pagerData } = body;
        if (ctx.canceled) return;
        const codeList: CodeInputRow[] = pagerData.elements.map((el) => ({
          rowKey: nextId(),
          code: el.code,
          codeNm: el.codeNm,
          dtlExpl: el.dtlExpl,
        }));
        orgCodeCountRef.current = codeList.length;

        if (codeList.length < 3) {
          // 신규 등록이거나 3줄이 안되면 빈줄을 3개 추가한다
          setCodeInputList([
            ...codeList, //
            createEmptyRow(),
            createEmptyRow(),
            createEmptyRow(),
          ]);
        } else {
          setCodeInputList(codeList);
        }
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // 코드 목록 조회
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doLoadCodeList(ctx, codeType);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doLoadCodeList, codeType]);

  // 입력값 유효성 검사, null을 리턴하면 에러, 빈 배열도 정상입니다.
  const validateInput = (codeInputList: Partial<CodeInput>[]): CodeInput[] | null => {
    if (codeInputList.length === 0) return [];

    // 값의 일부만 입력한 행을 찾기
    const invalidIndex = findInvalidInputRowIndex(codeInputList);

    // 값의 일부만 입력한 행을 찾았다면 에러 메시지 표시
    if (invalidIndex >= 0) {
      toast.warn(`${invalidIndex + 1}번 행의 입력을 확인해주세요`, {
        autoClose: 3500,
      });
      focusRowAt(invalidIndex, 'code');
      return null;
    }

    // 빈줄은 버리기
    const values: CodeInput[] = codeInputList
      .filter((it) => pstring.isNotBlank(it.code) && pstring.isNotBlank(it.codeNm))
      .map((it) => ({ code: it.code!, codeNm: it.codeNm!, dtlExpl: it.dtlExpl }));

    // code는 숫자와 알파벳만 허용한다
    const invalidCodes = [] as string[];

    // 중복체크를 위한 set
    const allCodeSet = new Set<string>();
    const dupCodes = new Set<string>();
    for (const value of values) {
      if (allCodeSet.has(value.code)) {
        // 중복된 코드는 dupCodes에 저장
        dupCodes.add(value.code);
      } else {
        allCodeSet.add(value.code);
      }

      // 코드는 숫자와 알파벳만 가능
      if (!/^[0-9A-Za-z]+$/.test(value.code)) {
        invalidCodes.push(value.code);
      }

      if (value.code.length > MAX_LENS.code) {
        alert(`코드는 최대 ${MAX_LENS.code}글자로 입력해주세요: ${value.code}`);
        return null;
      }

      if (value.codeNm.length > MAX_LENS.codeNm) {
        alert(`코드이름은 최대 ${MAX_LENS.codeNm}글자로 입력해주세요: ${value.codeNm}`);
        return null;
      }

      if (value.dtlExpl && value.dtlExpl.length > MAX_LENS.dtlExpl) {
        alert(`비고는 최대 ${MAX_LENS.dtlExpl}글자로 입력해주세요: ${value.dtlExpl}`);
        return null;
      }
    }

    // 코드가 알파벳과 숫자인지 체크
    if (invalidCodes.length > 0) {
      const invalidCodesStr = invalidCodes.join(', ');
      toast.warn(
        <Box>
          <Typography>
            코드는 알파벳과 숫자만 허용합니다. 아래의 코드는 유효하지 않습니다.
          </Typography>
          <Typography mt={2} color="error">
            {invalidCodesStr}
          </Typography>
        </Box>,
        {
          autoClose: 3500,
        },
      );
      return null;
    }

    // 중복된 코드가 있는지 체크
    if (dupCodes.size > 0) {
      const invalidCodesStr = Array.from(dupCodes).join(', ');
      toast.warn(
        <Box>
          <Typography>중복된 코드를 입력했습니다. 아래의 코드들이 중복됩니다.</Typography>
          <Typography mt={2} color="error">
            {invalidCodesStr}
          </Typography>
        </Box>,
        {
          autoClose: 3500,
        },
      );
      return null;
    }

    return values;
  };

  // 입력한 데이터를 수집, CoeInput 배열로 리턴
  const populateInputList = (): null | Partial<CodeInput>[] => {
    const root = rootRef.current;
    if (!root) return null;
    const codeList = root.querySelectorAll(`[data-row-field='code'] input`);
    const codeNmList = root.querySelectorAll(`[data-row-field='codeNm'] input`);
    const dtlExplList = root.querySelectorAll(`[data-row-field='dtlExpl'] input`);
    const results: Partial<CodeInput>[] = [];
    for (let i = 0; i < codeList.length; i++) {
      results.push({
        code: pstring.trimToUndefined((codeList[i] as HTMLInputElement).value),
        codeNm: pstring.trimToUndefined((codeNmList[i] as HTMLInputElement).value),
        dtlExpl: pstring.trimToUndefined((dtlExplList[i] as HTMLInputElement).value),
      });
    }
    return results;
  };

  // 저장 버튼 클릭
  const handleClickSaveBtn = () => {
    const codeInputList = populateInputList();
    if (codeInputList == null) return;
    const codes = validateInput(codeInputList);
    if (!codes) return;

    if (orgCodeCountRef.current > 0) {
      if (codes.length === 0) {
        if (!confirm('입력한 코드들이 삭제됩니다. 정말로 삭제하시겠습니까?')) {
          return;
        }
      }
    }

    doSave(codeType, codes).then((success) => {
      if (success) {
        onSavedFnRef.current?.();
      }
    });
  };

  // 닫기 버튼 클릭
  const handleClickCloseBtn = () => {
    onCloseFnRef.current?.();
  };

  // 행 삭제 버튼 클릭
  const handleClickRowDeleteBtn = (event: React.MouseEvent) => {
    const elem = event.currentTarget as HTMLElement;
    const rowIndex = getRowIndexFromDataset(elem);
    if (typeof rowIndex !== 'number') {
      // 무시, 이런 경우 없음
      console.warn('unexcepted state: data-row-index invalid');
      return;
    }

    const newValues = [...codeInputList];
    newValues.splice(rowIndex, 1);
    setCodeInputList(newValues);
  };

  // 행이동 - Shift+화살표 위/아래
  const handleMoveRow = (rowIndex: number, addition: 1 | -1) => {
    const totalCnt = codeInputList.length;
    const nextRowIndex = rowIndex + addition;
    if (nextRowIndex < 0 || nextRowIndex > totalCnt - 1) return;
    const a = codeInputList[rowIndex];
    const b = codeInputList[nextRowIndex];
    const newValues = [...codeInputList];
    newValues[rowIndex] = b;
    newValues[nextRowIndex] = a;
    setCodeInputList(newValues);
  };

  return (
    <>
      <DialogContent
        ref={rootRef}
        sx={{
          position: 'relative',
          py: 1.5,
          pl: 2,
        }}
        dividers
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">코드 그룹 : </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              px: 2,
              py: '2px',
              borderRadius: 1,
              border: '1px solid #ddd',
              color: '#fff',
              bgcolor: 'secondary.main',
            }}
          >
            {codeType}
          </Typography>
          <Typography variant="subtitle2" color="secondary">
            {codeTypeNm}
          </Typography>
        </Stack>
        <Stack direction="column" alignItems="stretch" spacing={1.5} sx={{ mt: 4 }}>
          {codeInputList.map((codeInput, idx) => (
            <CommonCodeEditRow
              key={codeInput.rowKey}
              rowIndex={idx}
              onClickDelete={handleClickRowDeleteBtn}
              initialData={codeInput}
              onMoveRow={handleMoveRow}
            />
          ))}
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            onClick={handleClickAddRows}
            variant="outlined"
            disabled={loading}
            endIcon={<AddCircleOutlineIcon />}
          >
            행추가
          </Button>
        </Box>
        <Box
          component="ul"
          sx={{
            mt: 5,
            em: {
              color: 'secondary.main',
              fontStyle: 'normal',
            },
          }}
        >
          <li>
            코드는 <em>알파벳과 숫자</em>만 입력할 수 있습니다.
          </li>
          <li>
            저장할 때 빈줄은 자동으로 <em>제거</em>됩니다.
          </li>
          <li>
            저장할 때 코드값을 기준으로 <em>자동 정렬</em>됩니다.
          </li>
          <li>
            <em>Shift</em>를 누른 채로 <em>화살표 위/아래 키</em>를 누르면 줄을 이동합니다.
          </li>
        </Box>
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClickSaveBtn}>저장</Button>
        <Button onClick={handleClickCloseBtn}>닫기</Button>
      </DialogActions>
    </>
  );
}

let seq = 0;
const nextId = () => ++seq;

function createEmptyRow(): CodeInputRow {
  return {
    rowKey: nextId(),
  };
}

function datasetValue(elem: HTMLElement, key: string): string | null {
  const value = elem.dataset[key];
  if (typeof value === 'undefined' || value == null) return null;
  return value;
}

function getValueFromDataset(elem: HTMLElement, key: string): string | null {
  const value = datasetValue(elem, key);
  if (typeof value === 'undefined' || value == null) {
    // data-row-index가 있는 element를 찾는다
    const parent = elem.closest('[data-row-index]');
    if (parent) {
      return datasetValue(parent as HTMLElement, key);
    }
    return null;
  }
  return value;
}

function getRowIndexFromDataset(elem: HTMLElement): number | null {
  const rowIndexStr = getValueFromDataset(elem, 'rowIndex');
  if (!rowIndexStr) return null;
  const rowIndexNum = +rowIndexStr;
  if (isNaN(rowIndexNum)) return null;
  return rowIndexNum;
}

/**
 * 비정상 입력 행을 찾기
 * @param codeInputList 검사할 데이터
 * @returns 비정상 행의 index 리턴
 */
const findInvalidInputRowIndex = (codeInputList: Partial<CodeInput>[]): number => {
  return codeInputList.findIndex((input, i) => {
    if (
      pstring.isBlank(input.code) &&
      pstring.isBlank(input.codeNm) &&
      pstring.isBlank(input.dtlExpl)
    ) {
      // 빈줄은 무시할 거니까, 비정상 아니다
      return false;
    }

    // 정상적인 입력은 무시
    if (pstring.isNotBlank(input.code) && pstring.isNotBlank(input.codeNm)) return false;

    // 비정상 입력행을 찾았음
    return true;
  });
};
