import type { CustomGridColumn } from '@/components/CustomGrid/grid-type';

export type Office = {
  _1deps: string;
  _2deps: string;
  _3deps: string;
  name: string;
  age: number;
  date: string;
  dollar: number;
};

export const SUBTOTAL_COLUME: CustomGridColumn[] = [
  {
    columeId: '_1deps',
    columeName: '본부',
    columeType: 'string',
  },
  {
    columeId: '_2deps',
    columeName: '팀',
    columeType: 'string',
  },
  {
    columeId: '_3deps',
    columeName: '직급',
    columeType: 'string',
  },
  {
    columeId: 'name',
    columeName: '이름',
    columeType: 'string',
  },
  {
    columeId: 'age',
    columeName: '나이',
    columeType: 'number',
  },
  {
    columeId: 'date',
    columeName: '입사일',
    columeType: 'string',
  },
  {
    columeId: 'dollar',
    columeName: '연봉',
    columeType: 'number',
  },
];

export const SUBTOTAL_SAMPLE_DATA: Office[] = [
  {
    _1deps: 'Sales',
    _2deps: 'section manager',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'section manager',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'section manager',
    _3deps: '사원',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'section manager',
    _3deps: '사원',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'section manager',
    _3deps: '사원',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'section manager',
    _3deps: '부장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'deputy manager',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'deputy manager',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'deputy manager',
    _3deps: '차장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'deputy manager',
    _3deps: '차장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Sales',
    _2deps: 'deputy manager',
    _3deps: '사원',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  //-----------------------------------------------------
  {
    _1deps: 'Planning',
    _2deps: 'clerk',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'clerk',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'clerk',
    _3deps: '과장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'clerk',
    _3deps: '과장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'manager',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'manager',
    _3deps: '대리',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'manager',
    _3deps: '차장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  {
    _1deps: 'Planning',
    _2deps: 'manager',
    _3deps: '차장',
    name: generateRandomName(),
    age: getRandomNumber(),
    date: generateRandomDate(),
    dollar: getRandomNumber() * 1000000000,
  },
  // {
  //   _1deps: 'fracchi',
  //   _2deps: 'manager',
  //   _3deps: '차장',
  //   name: generateRandomName(),
  //   age: getRandomNumber(),
  //   date: generateRandomDate(),
  //   dollar: getRandomNumber() * 1000000000,
  // },
];

export function getRandomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}
function generateRandomDate() {
  // 현재 날짜를 가져옵니다.
  const currentDate = new Date();

  // 현재 날짜에서 0부터 365일 중 랜덤한 날짜를 선택합니다.
  const randomDays = Math.floor(Math.random() * 365);

  // 날짜를 랜덤으로 설정합니다.
  currentDate.setDate(currentDate.getDate() - randomDays);

  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // 월은 0부터 시작하므로 1을 더하고 두 자리로 만듭니다.
  const day = currentDate.getDate().toString().padStart(2, '0'); // 일을 두 자리로 만듭니다.

  return `${year}-${month}-${day}`;
}

function generateRandomName() {
  // 성씨 목록
  const lastNames = [
    '김',
    '이',
    '박',
    '최',
    '정',
    '강',
    '조',
    '윤',
    '장',
    '임',
    '황',
    '오',
    '서',
    '안',
    '한',
    '유',
    '권',
    '송',
    '홍',
  ];
  // 이름 목록
  const firstNames = [
    '철수',
    '영희',
    '민수',
    '지수',
    '준수',
    '수빈',
    '민준',
    '서연',
    '지우',
    '민재',
    '준영',
    '예은',
    '수진',
    '지민',
    '서윤',
    '지우',
    '민영',
    '준호',
  ];

  // 성씨를 선택합니다.
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  // 이름을 선택합니다.
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

  // 랜덤 이름을 반환합니다.
  return `${lastName} ${firstName}`;
}
