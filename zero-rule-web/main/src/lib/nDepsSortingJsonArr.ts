import sorter from 'sort-nested-json';
type SortingKey = string;
/**
 * N뎁스 정렬 오름이와 내림이
 * @author simjinwoo
 */
export const sortingOnAsc = (jsonArr: any[], sortingKeyArr: SortingKey[]): any[] => {
  const sortingKeyArrCopy = [...sortingKeyArr];
  const _sorting = (arr: any[], key: SortingKey): any[] => {
    // 1. 키가 없는 경우 원본 배열 반환
    if (!key) return arr;

    // 2. 키 기준으로 오름차순 정렬
    const sortedArr = sorter.sort(arr).asc(key);

    // 3. 동일한 값을 가진 그룹으로 분류
    const groupedArr = sortedArr.reduce((acc, item) => {
      const keyValue = item[key];
      const group = acc.get(keyValue) ?? [];
      group.push(item);
      acc.set(keyValue, group);
      return acc;
    }, new Map());

    // 4. 각 그룹을 다음 키 기준으로 재귀적으로 정렬
    const nextKey = sortingKeyArrCopy.shift();
    return [...groupedArr.values()].map((group) => _sorting(group, nextKey ?? '')).flat();
  };
  // 5. `sortingKeyArr`의 모든 키를 순서대로 적용하여 정렬
  return _sorting(jsonArr, sortingKeyArrCopy.shift() ?? '');
};

export const sortingOnDesc = (jsonArr: any[], sortingKeyArr: SortingKey[]): any[] => {
  const sortingKeyArrCopy = [...sortingKeyArr];
  const _sorting = (arr: any[], key: SortingKey): any[] => {
    // 1. 키가 없는 경우 원본 배열 반환
    if (!key) return arr;

    // 2. 키 기준으로 내림차순 정렬
    const sortedArr = sorter.sort(arr).desc(key);

    // 3. 동일한 값을 가진 그룹으로 분류
    const groupedArr = sortedArr.reduce((acc, item) => {
      const keyValue = item[key];
      const group = acc.get(keyValue) ?? [];
      group.push(item);
      acc.set(keyValue, group);
      return acc;
    }, new Map());

    // 4. 각 그룹을 다음 키 기준으로 재귀적으로 정렬
    const nextKey = sortingKeyArrCopy.shift();
    return [...groupedArr.values()].map((group) => _sorting(group, nextKey ?? '')).flat();
  };
  // 5. `sortingKeyArr`의 모든 키를 순서대로 적용하여 정렬
  return _sorting(jsonArr, sortingKeyArrCopy.shift() ?? '');
};
