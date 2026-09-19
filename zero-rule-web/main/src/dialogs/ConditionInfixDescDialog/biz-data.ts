import { toast } from 'react-toastify';
import type { Variable } from './ConditionInfixDescDialog';

// 변수 선택 안했을때
export const variableSelBiz = (data: string) => {
  if (data === 'A') {
    return toast.warn('변수를 선택해주세요');
  }
};
// 연산자 선택 안했을때
export const operationSelBiz = (data: string) => {
  if (data === 'A') {
    return toast.warn('연산기호를 선택해주세요');
  }
};
// 데이터를 입력 안했을때
export const returnValBiz = (data?: string) => {
  if (data === '' || data === undefined) {
    return toast.warn('데이터를 입력해주세요');
  }
};

// 데이터 타입에 따라 값을 포맷하는 함수
export const formatReturnVal = (dataTypeCd: string, returnVal: string, operationSel: string) => {
  if (dataTypeCd === '0') {
    if (operationSel === 'in') {
      const pattern = /^\((\d+,\s*)*\d+\)$/; // 숫자형에서 쌍따옴표 없이 체크
      if (!pattern.test(returnVal)) {
        toast.warn('올바른 형식이 아닙니다. 예: (1, 2, 3)');
        return '';
      }
    } else if (operationSel === '^') {
      const pattern = /^\d+(\^\d+)*$/;
      if (!pattern.test(returnVal)) {
        toast.warn('올바른 형식이 아닙니다. 예: 2^3');
        return '';
      }
    } else if (operationSel === 'like' || operationSel === 'not like') {
      const pattern = /^(%.*%|".*%.*")$/;
      if (!pattern.test(returnVal)) {
        toast.warn('올바른 형식이 아닙니다. 예: "%value%" 또는 "value%"');
        return '';
      }
    }
    return returnVal; // 숫자형
  } else if (dataTypeCd === '1') {
    if (operationSel === '==') {
      const pattern = /^".*"$/;
      if (!pattern.test(returnVal)) {
        toast.warn('쌍따옴표가 존재하지 않습니다.');
        return '';
      }
    } else if (operationSel === 'in') {
      const pattern = /^\((?:"[^"]*",\s*)*"?[^"]*"\)$/;
      if (!pattern.test(returnVal)) {
        toast.warn('올바른 형식이 아닙니다. 예: ("데이터",데이터")');
        return '';
      }
    } else if (operationSel === 'like' || operationSel === 'not like') {
      const pattern = /^(%.*%|".*%.*")$/;
      if (!pattern.test(returnVal)) {
        toast.warn('올바른 형식이 아닙니다. 예: "%value%" 또는 "value%"');
        return '';
      }
    }
    return returnVal; // 문자형
  } else {
    const pattern3 = /^"Y"$|^"N"$/;
    if (!pattern3.test(returnVal)) {
      toast.warn('"Y" 또는 "N" 만 입력해주세요');
      return '';
    }
    return `"${returnVal}"`; // 논리형
  }
};
export const submitDataBiz = (
  infixDescType: string,
  variableSel: string,
  operationSel: string,
  returnVal: string,
  variableList: Variable[],
  cursorPosition: number,
  submitData: string,
  setSubmitData: (data: string) => void,
  setCursorPosition: (pos: number) => void,
) => {
  const tmpArr = variableList.find((item) => item.itemNm === variableSel);
  if (!tmpArr) return;

  const returnValData = formatReturnVal(tmpArr.dataTypeCd, returnVal, operationSel);
  if (returnValData === '') return;

  let newSubmitData = submitData;

  if (cursorPosition !== 0) {
    newSubmitData =
      submitData.slice(0, cursorPosition) +
      (infixDescType === 'item' ? ` [${variableSel}] ` : ` {@${variableSel}} `) +
      operationSel +
      ' ' +
      returnValData +
      submitData.slice(cursorPosition);
  } else {
    newSubmitData +=
      (infixDescType === 'item' ? ` [${variableSel}] ` : ` {@${variableSel}} `) +
      operationSel +
      ' ' +
      returnValData;
  }

  setSubmitData(newSubmitData);
  setCursorPosition(0);
};
