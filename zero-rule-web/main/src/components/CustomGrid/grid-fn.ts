import type { CustomGridColumnFilter, CustomGridSortingType } from './grid-type';
import { CustomGridSubtotal } from './grid-type';

// 정렬 연산 함수, 가져온 값을 오름차순, 내림차순으로 정렬 autor:simjinwoo
export const sortingArr = (sorting: CustomGridSortingType, rowData: any[]) => {
  const { columeType, order, columeId } = sorting;
  rowData.sort((a, b) => {
    //@ts-ignore
    const aValue = a[columeId];
    //@ts-ignore
    const bValue = b[columeId];
    if (!aValue || !bValue) return 0;
    if (columeType === 'string') {
      return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (columeType === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (columeType === 'boolean') {
      return order === 'asc'
        ? aValue === bValue
          ? 0
          : aValue
            ? 1
            : -1
        : aValue === bValue
          ? 0
          : bValue
            ? 1
            : -1;
    }
    return 0;
  });

  return [...rowData];
};

// table head에 있는 버튼에 대한 핸들러 현재 값을 확인해서 오름,내림차순 정렬
export const sortBtnHandle = (
  columeId: string | number,
  columeType: string,
  sorting?: CustomGridSortingType,
) => {
  if (sorting === undefined) {
    return { columeId, columeType, order: 'asc' };
  } else {
    if (sorting.columeId === columeId) {
      let order: string | undefined = undefined;
      if (sorting.order === 'asc') {
        order = 'desc';
      }
      if (sorting.order === 'desc') {
        order = 'basic';
      }
      return { columeId, columeType, order };
    } else {
      return { columeId, columeType, order: 'asc' };
    }
  }
};

// 멀티로우 count view 용
export const createMultiRowCountView = (
  multiRowCount?: number,
  columeFilter?: CustomGridColumnFilter[],
) => {
  if (!columeFilter) return 1;
  if (!multiRowCount) return 1;
  if (columeFilter.length < multiRowCount) return 1;
  return multiRowCount === undefined ? 1 : multiRowCount === 0 ? 1 : multiRowCount;
};

// 멀티로우 용 배열 생성
export const createDividedArrays = (
  multiRowCountView: number,
  columeFilter: CustomGridColumnFilter[],
) => {
  return Array.from({ length: multiRowCountView }, (_, index) => {
    const dividedArray = [] as any[];
    if (!columeFilter) return;
    for (let i = index; i < columeFilter.length; i += multiRowCountView) {
      dividedArray.push(columeFilter[i]);
    }

    return dividedArray;
  }) as CustomGridColumnFilter[][];
};

// 소계 합계 생성용 함수
// export const subTotalGroupingDataSets = (data: any[], columns: (string | number)[]) => {
//   const copyData = [...data]

//   const groupedData: { [key: string]: { [key: string]: any[] } } = {}

//   copyData.forEach((row) => {
//     let key1 = columns[0]
//     let key2 = columns[1]

//     if (Array.isArray(key1)) {
//       key1 = key1.map((column) => row[column]).join(',')
//     } else {
//       key1 = row[key1]
//     }

//     if (Array.isArray(key2)) {
//       key2 = key2.map((column) => row[column]).join(',')
//     } else {
//       key2 = row[key2]
//     }

//     if (!groupedData[key1]) {
//       groupedData[key1] = {}
//     }

//     if (!groupedData[key1][key2]) {
//       groupedData[key1][key2] = []
//     }

//     groupedData[key1][key2].push(row)
//   })

//   console.log('Object.values(groupedData)', Object.values(groupedData))

//   return Object.values(groupedData)
// }

/**
 * oper 코드로 변환하기
 * @autor sim jinwoo
 */
export const strOperCodeChange = (val: string) => {
  switch (val) {
    case 'sum':
      return 'sum';
    case 'average':
      return 'avg';
    case 'max':
      return 'max';
    case 'min':
      return 'min';
    case 'count':
      return 'cnt';
  }
};

/**
 * oper 코드로 변환하기
 * @autor sim jinwoo
 */
export const numOperCodeChange = (val: string) => {
  switch (val) {
    case '=':
      return 'eq';
    case '!=':
      return 'ne';
    case '<':
      return 'lt';
    case '>':
      return 'gt';
    case '<=':
      return 'le';
    case '>=':
      return 'ge';
    case 'between':
      return 'bt';
  }
};

/**
 * z
 * @autor sim jinwoo
 */
export const colTypeCodeChange = (val: string) => {
  switch (val) {
    case 'string':
      return 'str';
    case 'number':
      return 'num';
    case 'boolean':
      return 'bol';
    case 'component':
      return 'com';
  }
};

export const strOperCodeReverseChange = (val: string) => {
  switch (val) {
    case 'sum':
      return 'sum';
    case 'avg':
      return 'average';
    case 'max':
      return 'max';
    case 'min':
      return 'min';
    case 'cnt':
      return 'count';
  }
};

/**
 * oper 코드로 변환하기
 * @autor sim jinwoo
 */
export const numOperCodeReverseChange = (val: string) => {
  switch (val) {
    case 'eq':
      return '=';
    case 'ne':
      return '!=';
    case 'lt':
      return '<';
    case 'gt':
      return '>';
    case 'le':
      return '<=';
    case 'ge':
      return '>=';
    case 'bt':
      return 'between';
  }
};

export const colTypeCodeReverseChange = (val: string) => {
  switch (val) {
    case 'str':
      return 'string';
    case 'num':
      return 'number';
    case 'bol':
      return 'boolean';
    case 'com':
      return 'component';
  }
};
