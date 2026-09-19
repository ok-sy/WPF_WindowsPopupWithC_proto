import { isNumberLengthOverFive } from '@/lib/common-validation';
import type { RuleInterfaceMapVo } from '@local/domain';

export const EXCEL_DATA_SET = Array(300)
  .fill(0)
  .map(() => ({
    필드영문명: '',
    필드한글명: '',
    순번: '',
    길이: '',
    시작위치번호: '',
    코드ID: '',
    데이타타입: '',
    소수점자리수: '',
    TRIM여부: '',
    캐릭터셋: '',
  }));

export const excelFromData = (data: RuleInterfaceMapVo[]) => {
  const changeArr = data.map((el) => {
    return {
      필드영문명: el.fieldEngNm,
      필드한글명: el.fieldKorNm,
      순번: el.fieldOrder,
      길이: el.fieldLength,
      시작위치번호: el.fieldStartNo,
      코드ID: el.fieldCodeType,
      데이타타입: el.datatypeCd,
      소수점자리수: el.fieldScale,
      TRIM여부: el.trimYn,
      캐릭터셋: el.characterset,
    };
  });
  return changeArr;
};

export const interfaceValiDali = (interfaceMapListData: RuleInterfaceMapVo[]) => {
  let result = 0;
  interfaceMapListData.forEach((el) => {
    if (isNumberLengthOverFive(el.fieldOrder, 5)) {
      result = 1;
    } else if (isNumberLengthOverFive(el.fieldLength, 5)) {
      result = 2;
    } else if (isNumberLengthOverFive(el.fieldStartNo, 5)) {
      result = 3;
    } else if (el.fieldCodeType?.length > 1) {
      result = 4;
    } else if (isNumberLengthOverFive(el.fieldScale, 2)) {
      result = 5;
    }
  });
  return result;
};
