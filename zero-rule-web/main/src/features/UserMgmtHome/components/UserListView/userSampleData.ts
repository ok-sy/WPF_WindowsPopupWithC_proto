import type { UserDataType } from './user-schema';

let seq = 0;
const nextId = () => ++seq;

export const USER_SAMPLE_DATA: UserDataType[] = new Array(20).fill(0).map((it) => ({
  id: `${nextId()}`,
  password: '1234',
  name: `홍길동`,
  team: '영업부',
  tell: '010-7777-7777',
  memo: '샘플 데이터 입니다.',
  security: '최고 관리자',
  downloadAccess: true,
}));
