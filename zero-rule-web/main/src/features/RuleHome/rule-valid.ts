import type { ItemMgmt, RuleInfoCondition, UpdateInsertAllData } from '@local/domain';
import { toast } from 'react-toastify';

// 저장시 유효성
export const checkValid = (data: UpdateInsertAllData) => {
  // 룰명 공백 유효성
  if (!data.ruleNm || data.ruleNm.includes(' ')) {
    toast.warn('RULE명에 공백이나 빈값이 있습니다');
    return false;
  }
  if (!data.rulealiasNm) {
    toast.warn('RULE별칭명 데이터가 비어있습니다');
    return false;
  } else if (/^\s|\s$/.test(data.rulealiasNm)) {
    toast.warn('RULE별칭명 시작이나 끝에 공백이 존재합니다');
    return false;
  }
  if (!data.ruleDesc) {
    toast.warn('RULE설명 데이터가 비어있습니다');
    return false;
  }

  if (!data.returnItem) return;
  if (data.returnItem.filter((el) => el.uptGubun !== 'D').length === 0) {
    toast.warn('RULE반환리스트 데이터는 최소 1개 이상 입니다');
    return false;
  }

  if (!data.conditionList) return;
  if (data.conditionList.filter((el) => el.uptGubun !== 'D').length === 0) {
    toast.warn('조건식리스트 데이터는 최소 1개 이상 입니다');
    return false;
  }

  // 반환리스트 count / 조건식 반환값count 일치 유효성
  const returnitemExprDescNull = data.conditionList
    ?.filter((el) => el.uptGubun !== 'D')
    .some((el) => {
      if (el.returnitemExprDesc === '') {
        return true;
      }
      return false;
    });

  if (returnitemExprDescNull) {
    toast.warn('조건식 반환값에 빈 데이터가 있습니다');
    return false; // 조건식 반환값에 빈 데이터가 있으면 함수 종료
  }

  const conditionListValid = data.conditionList
    .filter((el) => el.uptGubun !== 'D')
    .some((el) => el.conditionInfixDesc === '');

  if (conditionListValid) {
    toast.warn(`조건식 중위식조건에 빈 데이터가 있습니다`);
    return false;
  }

  return true;
};

// 룰 조건식리스트 반환값 팝업 영역 유효성
export const conditionPopupValid = (
  data: {
    itemNm: string;
    returnItemid: string;
    returnitemExprDesc?: string;
    datatypeCd: string;
    ruleconditionno?: number;
  }[],
) => {
  const isValid = data.every((el) => {
    const exprDesc = el.returnitemExprDesc || '';
    const pattern1 = /^\[.*\]$/; // [로 시작하고 ]로 끝나는 형식
    const pattern2 = /^\{@.*\}$/; // {@로 시작하고 }로 끝나는 형식

    if (el.datatypeCd === '1') {
      // 유효성 체크 패턴
      const pattern3 = /^SUBSTR\(.+\)$/; // SUBSTR(로 시작해서 )로 끝나는 형식
      const pattern4 = /^".*"$/; // "로 시작해서 "로 끝나는 형식

      if (
        !(
          pattern1.test(exprDesc) ||
          pattern2.test(exprDesc) ||
          pattern3.test(exprDesc) ||
          pattern4.test(exprDesc)
        )
      ) {
        toast.warn(`${el.itemNm}의 반환값의 데이터타입이 일치하지 않습니다`);
        return false; // 패턴이 일치하지 않으면 유효성 검사 실패
      }

      if (pattern3.test(exprDesc)) {
        // SUBSTR() 함수의 경우
        const substrParams = exprDesc
          .substring('SUBSTR('.length, exprDesc.length - 1) // SUBSTR( 부분을 제외한 문자열
          .split(',')
          .map((param) => param.trim());

        if (substrParams.length !== 3) {
          toast.warn(`${el.itemNm}의 SUBSTR() 함수에는 3개의 인자가 필요합니다`);
          return false; // SUBSTR() 함수의 인자가 3개가 아닌 경우
        }

        const firstParam = substrParams[0];
        const secondParam = substrParams[1];
        const thirdParam = substrParams[2];

        const paramPattern = /^\[.*\]$|^\{@.*\}$|^".*"$/; // 첫 번째 인자의 패턴

        if (!paramPattern.test(firstParam)) {
          toast.warn(`${el.itemNm}의 SUBSTR() 함수의 첫 번째 인자가 올바르지 않습니다`);
          return false; // 첫 번째 인자의 패턴이 맞지 않는 경우
        }

        if (
          isNaN(Number(secondParam)) ||
          isNaN(Number(thirdParam)) ||
          secondParam.trim() === '' ||
          thirdParam.trim() === ''
        ) {
          toast.warn(`${el.itemNm}의 SUBSTR() 함수의 두 번째와 세 번째 인자는 숫자여야 합니다`);
          return false; // 두 번째와 세 번째 인자가 숫자가 아닌 경우 또는 빈 문자열인 경우
        }
      }
    } else if (el.datatypeCd === '0') {
      // 숫자만 존재하는 형식
      const pattern3 = /^\d+$/;

      if (!(pattern1.test(exprDesc) || pattern2.test(exprDesc) || pattern3.test(exprDesc))) {
        toast.warn(`${el.itemNm}의 반환값의 데이터타입이 일치하지 않습니다`);
        return false; // 패턴이 일치하지 않으면 유효성 검사 실패
      }
    } else if (el.datatypeCd === '2') {
      // "Y" 또는 "N"이외의 값이 존재하는 경우
      const pattern3 = /^"Y"$|^"N"$/;

      if (!(pattern1.test(exprDesc) || pattern2.test(exprDesc) || pattern3.test(exprDesc))) {
        toast.warn(`${el.itemNm}의 반환값의 데이터타입이 일치하지 않습니다`);
        return false; // 패턴이 일치하지 않으면 유효성 검사 실패
      }
    }

    return true; // 데이터타입이 '1', '0', '2'가 아닌 경우에는 항상 유효성 검사 통과
  });

  if (!isValid) {
    return false;
  }

  return true;
};

export type RuleSavedValidSameValid = {
  ruleNm?: string; // 룰명
  rulealiasNm?: string; // 룰별칭명
  ruleDesc?: string; // 룰설명
  rulereturnType?: string; // 리턴타입
  allreturnYn?: string; // 계속점검여부
  returnItem?: ItemMgmt[];
  conditionList?: RuleInfoCondition[];
};

export const sameValidForSaveJsonComparison = (
  asis?: RuleSavedValidSameValid,
  tobe?: RuleSavedValidSameValid,
) => {
  const str1 = JSON.stringify(asis);
  const str2 = JSON.stringify(tobe);

  return str1 === str2;
};
