export type SamplePadRule = {
  cardNum: string;
  koreanType: string;
  money: string;
  endDate: string;
  commitType: string;
  modifyType: string;
  modifyDate: string;
};

let requestId = 10;
export function nextId() {
  if (requestId > 99) requestId = 10;
  return ++requestId;
}
let requestId2 = 0;
export function nextId2() {
  return ++requestId2;
}
let requestId3 = 0;
export function nextId3() {
  return ++requestId3;
}
let requestId4 = 0;
export function nextId4() {
  return ++requestId4;
}

type ModifyType = '반영' | '미반영';

function ModifyTypeRandom(): ModifyType {
  const modifyTypeRandom: ModifyType[] = ['반영', '미반영'];
  const randomIndex = Math.floor(Math.random() * modifyTypeRandom.length);
  return modifyTypeRandom[randomIndex];
}

export const SAMPLE_PAD_RULE: SamplePadRule[] = Array(10)
  .fill(0)
  .map((it) => ({
    cardNum: '135-7894-' + nextId(),
    koreanType: nextId4() % 2 === 0 ? '국내' : '해외',
    money: nextId() + '1,548',
    endDate: '2022-04-' + nextId2(),
    commitType: '적용됨',
    modifyType: ModifyTypeRandom(),
    modifyDate: '2023-07-' + nextId3(),
  }));
