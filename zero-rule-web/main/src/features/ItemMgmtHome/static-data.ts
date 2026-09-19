import type { CustomGridColumn } from '@/components/CustomGrid/grid-type';

export const ITEM_GRID_COLUMN: CustomGridColumn[] = [
  {
    columeId: 'itemid',
    columeName: '항목ID',
    columeType: 'string',
    textAlign: 'center',
    maxWidth: 120,
  },
  {
    columeId: 'itemNm',
    columeName: '항목이름',
    columeType: 'string',
  },
  {
    columeId: 'dataTypeCd',
    columeName: '데이터타입',
    columeType: 'string',
    textAlign: 'center',
    maxWidth: 100,
  },
  {
    columeId: 'itemAliasNm',
    columeName: '항목별칭',
    columeType: 'string',
    maxWidth: 250,
  },
  {
    columeId: 'itemExplanDesc',
    columeName: '항목설명',
    columeType: 'string',
    maxWidth: 250,
  },
  {
    columeId: 'ifid',
    columeName: '인터페이스ID',
    columeType: 'string',
    textAlign: 'center',
    maxWidth: 120,
  },
  {
    columeId: 'usedCnt',
    columeName: '이용중인룰갯수',
    columeType: 'number',
  },
  {
    columeId: 'firstRegUserId',
    columeName: '등록자ID',
    columeType: 'string',
  },
  {
    columeId: 'firstRegDateTime',
    columeName: '등록일시',
    columeType: 'string',
    textAlign: 'center',
  },
  {
    columeId: 'updateUserID',
    columeName: '수정자ID',
    columeType: 'string',
  },
  {
    columeId: 'firstRegDateTime',
    columeName: '수정일시',
    columeType: 'string',
    textAlign: 'center',
  },
  {
    columeId: 'itemUseYn',
    columeName: '사용여부',
    columeType: 'string',
    maxWidth: 100,
  },
];

export const dataTypeToKorNm = (type: string) =>
  type === '0' ? '숫자형' : type === '1' ? '문자형' : '논리형';

export const dataTypeToCode = (type: string) =>
  type === '숫자형' ? '0' : type === '문자형' ? '1' : '2';
