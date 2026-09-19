import type { CustomGridColumn } from '@/components/CustomGrid/grid-type';

export const ITEM_GRID_REF_COLUMN: CustomGridColumn[] = [
  {
    columeId: 'itemrefCd',
    columeName: '참조코드',
    columeType: 'string',
    textAlign: 'center',
    maxWidth: 120,
  },
  {
    columeId: 'itemrefNm',
    columeName: '참조코드명',
    columeType: 'string',
  },
  {
    columeId: 'itemrefaliasNm',
    columeName: '참조코드 별칭',
    columeType: 'string',
    textAlign: 'center',
    maxWidth: 100,
  },
  {
    columeId: 'itemrefexprDesc',
    columeName: '설명',
    columeType: 'string',
    maxWidth: 250,
  },
];
