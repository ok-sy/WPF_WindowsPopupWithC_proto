import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import PeopleSharpIcon from '@mui/icons-material/PeopleSharp';
import ListSharpIcon from '@mui/icons-material/ListSharp';
/**
 * 오늘자 건수 데이터 타입
 */
export type ItemType = {
  title: string;
  count: number;
  delta: number;
  icon: React.ReactNode;
  color: string;
  dataType?: 'money' | 'K' | 'percent';
};
/**
 * 오늘자 건수 샘플 데이터
 */
export const SAMPLE_TODAY: ItemType[] = [
  {
    title: 'BUDGET',
    count: 35668,
    delta: 375,
    icon: <PaidRoundedIcon />,
    color: '#f04438',
  },
  {
    title: 'TOTAL CUSTOMERS',
    count: 25668,
    delta: -95,
    icon: <PeopleSharpIcon />,
    color: '#10b981',
    dataType: 'money',
  },
  {
    title: 'TESL PROGRESS',
    count: 32018,
    delta: 442,
    icon: <ListSharpIcon />,
    color: '#f79009',
    dataType: 'percent',
  },
  {
    title: 'TOTAL PROFIT',
    count: 98754,
    delta: -200,
    icon: <PaidRoundedIcon />,
    color: '#6366f1',

    dataType: 'K',
  },
];
/**
 * 전체 건수 데이터 타입
 */
export interface SampleTotDataType {
  ymd: string;
  /**
   * 심사 건수
   */
  judgeCount: number;
  /**
   * 통화 건수
   */
  callCount: number;
  /**
   * SNS발송 건수
   */
  snsCount: number;
  /**
   * 추가 FDS1 건수
   */
  addFdsCount: number;
}

let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

const year = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export function nextNum() {
  let requestId = Math.round(Math.random() * 10000);
  return ++requestId;
}
export const SAMPLE_TOTAL: SampleTotDataType[] = new Array(12).fill(0).map((it) => ({
  ymd: year[nextdata()],
  judgeCount: 354 + nextNum(),
  callCount: 457 + nextNum(),
  snsCount: 658 + nextNum(),
  addFdsCount: 458 + nextNum(),
}));
