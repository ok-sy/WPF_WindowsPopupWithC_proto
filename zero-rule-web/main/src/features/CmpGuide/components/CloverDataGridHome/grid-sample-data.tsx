import type { CustomGridColumn } from '@/components/CustomGrid/grid-type';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

export type Person = {
  checkBox: React.ReactNode;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: React.ReactNode;
  booleantype: boolean;
  element: React.ReactNode;
};

export const DEFAULT_COLUME: CustomGridColumn[] = [
  {
    columeId: 'checkBox',
    columeName: 'checkBox',
    columeType: 'component',
  },
  {
    columeId: 'firstName',
    columeName: 'firstName',
    columeType: 'string',
  },
  {
    columeId: 'lastName',
    columeName: 'lastName',
    columeType: 'string',
  },
  {
    columeId: 'age',
    columeName: 'age',
    columeType: 'number',
  },
  {
    columeId: 'visits',
    columeName: 'visits',
    columeType: 'number',
  },
  {
    columeId: 'status',
    columeName: 'tooltip',
    columeType: 'component',
  },
  {
    columeId: 'booleantype',
    columeName: 'boolean',
    columeType: 'boolean',
  },
  {
    columeId: 'element',
    columeName: 'element',
    columeType: 'component',
  },
];

export const DEFAULT_SAMPLE_DATA: Person[] = [
  {
    checkBox: 'checked',
    firstName: '김',
    lastName: '길동',
    age: 40,
    visits: 489686486,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="다른값이 들어갈수 있다.">
          <Typography>지상에는 아홉 켤레의 신발</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Radio size="small" sx={{ padding: 0 }} />,
  },

  {
    checkBox: 'checked',
    firstName: '황',
    lastName: '길음',
    age: 28,
    visits: 4564567878,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="그대가 남기고 간 시든 꽃 다시 필 때까지">
          <Typography>그대가 남기고 간 시든 꽃 다시 필 때까지</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '정',
    lastName: '길정',
    age: 24,
    visits: 100000000,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="얼굴 하나야 손가락 둘로">
          <Typography>얼굴 하나야 손가락 둘로</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: (
      <FormControl sx={{ pl: 2 }}>
        <RadioGroup defaultValue="female">
          <FormControlLabel value="female" control={<Radio size="small" />} label="Female" />
          <FormControlLabel value="male" control={<Radio size="small" />} label="Male" />
        </RadioGroup>
      </FormControl>
    ),
  },
  {
    checkBox: 'checked',
    firstName: '이',
    lastName: '정민',
    age: 35,
    visits: 144184563,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="다른값이 들어갈수 있다.">
          <Typography>보고싶은 마음 호수만 하니 눈 감을 수 밖에</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '박',
    lastName: '정연',
    age: 45,
    visits: 45645645,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="코드 : E02.545412">
          <Typography>그대가 꺾어준 꽃 시들 때 까지 들여다 보았네</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '화',
    lastName: '찬희',
    age: 32,
    visits: 4563456,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="코드값이 들어갈수 있다 E1.0585741">
          <Typography>자세히 보아야 예쁘다 오래 보아야 사랑스럽다</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '이',
    lastName: '예주',
    age: 28,
    visits: 4563887,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="하늘은 바다 끝없이 넓고 푸른 바다">
          <Typography>하늘은 바다 끝없이 넓고 푸른 바다</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: 'grace',
    lastName: 'turem',
    age: 35,
    visits: 658000000,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="구름은 조각배 바람이 사공 되어">
          <Typography>구름은 조각배 바람이 사공 되어</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: 'michael',
    lastName: 'lee',
    age: 42,
    visits: 785000000,
    status: (
      <Stack direction="row">
        <Tooltip
          sx={{ px: 0.5 }}
          arrow
          title="연탄재 함부로 발로 차지 마라너는 누구에게 한 번이라도"
        >
          <Typography>연탄재 함부로 발로 차지 마라너는 누구에게 한 번이라도 </Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: 'tanner',
    lastName: 'claner',
    age: 31,
    visits: 6000000,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="잃어버렸습니다 무얼 어디다 잃었는지 몰라">
          <Typography>잃어버렸습니다 무얼 어디다 잃었는지 몰라</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: 'tanner',
    lastName: 'sopia',
    age: 37,
    visits: 5000000,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="담은 쇠문을 굳게 닫아 길 위엔 그림자를 드리우고">
          <Typography>담은 쇠문을 굳게 닫아 길 위엔 그림자를 드리우고</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: 'tanner',
    lastName: 'sopia',
    age: 37,
    visits: 4000000,
    status: <Stack direction="row">상태업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '태용',
    lastName: '김',
    age: 27,
    visits: 123456,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '민지',
    lastName: '박',
    age: 32,
    visits: 789012,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '서연',
    lastName: '이',
    age: 41,
    visits: 345678,
    status: <Stack direction="row">완료</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '민수',
    lastName: '정',
    age: 38,
    visits: 873456,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '지영',
    lastName: '김',
    age: 24,
    visits: 234567,
    status: <Stack direction="row">완료</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '현우',
    lastName: '박',
    age: 45,
    visits: 987654,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '태용',
    lastName: '김',
    age: 27,
    visits: 123456,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '민지',
    lastName: '박',
    age: 32,
    visits: 789012,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '서연',
    lastName: '이',
    age: 41,
    visits: 345678,
    status: <Stack direction="row">완료</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '현우',
    lastName: '정',
    age: 20,
    visits: 987654,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '지영',
    lastName: '김',
    age: 47,
    visits: 234567,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '민수',
    lastName: '박',
    age: 38,
    visits: 873456,
    status: <Stack direction="row">완료</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '수민',
    lastName: '이',
    age: 24,
    visits: 456789,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '도윤',
    lastName: '정',
    age: 35,
    visits: 102938,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '예진',
    lastName: '김',
    age: 50,
    visits: 567890,
    status: <Stack direction="row">완료</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '하영',
    lastName: '박',
    age: 29,
    visits: 123456,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '태용',
    lastName: '김',
    age: 27,
    visits: 123456,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '민지',
    lastName: '박',
    age: 32,
    visits: 789012,
    status: <Stack direction="row">완료</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '서연',
    lastName: '이',
    age: 41,
    visits: 345678,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '현우',
    lastName: '정',
    age: 20,
    visits: 987654,
    status: <Stack direction="row">완료</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '지영',
    lastName: '김',
    age: 47,
    visits: 234567,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '민수',
    lastName: '박',
    age: 38,
    visits: 873456,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '지수',
    lastName: '이',
    age: 22,
    visits: 456789,
    status: <Stack direction="row">완료</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '도윤',
    lastName: '정',
    age: 35,
    visits: 102938,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '예진',
    lastName: '김',
    age: 50,
    visits: 567890,
    status: <Stack direction="row">진행 중</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: '',
    firstName: '하영',
    lastName: '박',
    age: 29,
    visits: 123456,
    status: <Stack direction="row">상태 업로드</Stack>,
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '김',
    lastName: '길동',
    age: 40,
    visits: 489686486,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="다른값이 들어갈수 있다.">
          <Typography>지상에는 아홉 켤레의 신발</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Radio size="small" sx={{ padding: 0 }} />,
  },

  {
    checkBox: 'checked',
    firstName: '황',
    lastName: '길음',
    age: 28,
    visits: 4564567878,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="그대가 남기고 간 시든 꽃 다시 필 때까지">
          <Typography>그대가 남기고 간 시든 꽃 다시 필 때까지</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '정',
    lastName: '길정',
    age: 24,
    visits: 100000000,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="얼굴 하나야 손가락 둘로">
          <Typography>얼굴 하나야 손가락 둘로</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: (
      <FormControl sx={{ pl: 2 }}>
        <RadioGroup defaultValue="female">
          <FormControlLabel value="female" control={<Radio size="small" />} label="Female" />
          <FormControlLabel value="male" control={<Radio size="small" />} label="Male" />
        </RadioGroup>
      </FormControl>
    ),
  },
  {
    checkBox: 'checked',
    firstName: '이',
    lastName: '정민',
    age: 35,
    visits: 144184563,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="다른값이 들어갈수 있다.">
          <Typography>보고싶은 마음 호수만 하니 눈 감을 수 밖에</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: false,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '박',
    lastName: '정연',
    age: 45,
    visits: 45645645,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="코드 : E02.545412">
          <Typography>그대가 꺾어준 꽃 시들 때 까지 들여다 보았네</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '화',
    lastName: '찬희',
    age: 32,
    visits: 4563456,
    status: (
      <Stack direction="row">
        <Tooltip sx={{ px: 0.5 }} arrow title="코드값이 들어갈수 있다 E1.0585741">
          <Typography>자세히 보아야 예쁘다 오래 보아야 사랑스럽다</Typography>
        </Tooltip>
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '화',
    lastName: '찬희',
    age: 32,
    visits: 4563456,
    status: (
      <Stack direction="row">
        <Box
          component="img"
          className="lightbox imageScale"
          src="/images/clover-intro/platform.png"
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '25px',
          }}
        />
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '화',
    lastName: '그림',
    age: 32,
    visits: 4563456,
    status: (
      <Stack direction="row">
        <Box
          component="img"
          className="lightbox imageScale"
          src="/images/clover-intro/overview.png"
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '25px',
          }}
        />
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
  {
    checkBox: 'checked',
    firstName: '김',
    lastName: '지원',
    age: 32,
    visits: 4563456,
    status: (
      <Stack direction="row">
        <Box
          component="img"
          className="lightbox imageScale"
          src="/images/clover-intro/user_friendly_tab_2.png"
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '25px',
          }}
        />
      </Stack>
    ),
    booleantype: true,
    element: <Checkbox size="small" sx={{ padding: 0 }} />,
  },
];

export type EXCEL_GRID = {
  isFirstRow?: boolean;
  expl?: string;
  costomer?: string;
  date?: string;
  status?: string;
};

let noticeId = 0;
const nextNoticeId = () => {
  noticeId++;
  return noticeId;
};
function generateRandomString(length: number) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }

  return result;
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

function getRandomStatus() {
  const statuses = ['USED', 'UNUSED', 'ERROR', 'SUCCESS'];
  const randomIndex = Math.floor(Math.random() * statuses.length);
  return statuses[randomIndex];
}

export function getRandomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

function formatDateToYYYYMMDD(date: Date) {}

export const EXCEL_GRID_DATA: EXCEL_GRID[] = Array(300)
  .fill(0)
  .map((it) => ({
    expl: 'ID' + nextNoticeId(),
    costomer: generateRandomString(5),
    date: generateRandomDate(),
    status: getRandomStatus(),
  }));

export const EXCEL_GRID_SAMPLE_DATA: EXCEL_GRID[] = [
  {
    expl: '',
    costomer: '',
    date: '',
    status: '',
  },
];

export type Animal = {
  animalName: string;
  bodySize: string;
  bodyKillo: number;
  leave: string;
  kind: string;
  age: number;
  date: string;
};

export const DEFAULT_ANIMAL_COLUME: CustomGridColumn[] = [
  {
    columeId: 'animalName',
    columeName: '종',
    columeType: 'string',
  },
  {
    columeId: 'leave',
    columeName: '서식지',
    columeType: 'string',
  },
  {
    columeId: 'kind',
    columeName: '먹이',
    columeType: 'string',
  },

  {
    columeId: 'date',
    columeName: '생일',
    columeType: 'string',
  },
  {
    columeId: 'bodySize',
    columeName: '몸길이',
    columeType: 'string',
  },
  {
    columeId: 'age',
    columeName: '수명',
    columeType: 'number',
  },
  {
    columeId: 'bodyKillo',
    columeName: '몸무게',
    columeType: 'number',
  },
];
function getRandomAnimal() {
  const animals = ['사자', '호랑이', '코끼리', '고래', '나비'];
  return animals[Math.floor(Math.random() * animals.length)];
}

function getRandomHabitat() {
  const habitats = ['초원', '밀림', '사바나', '바다', '전 세계'];
  return habitats[Math.floor(Math.random() * habitats.length)];
}
function getRandomDiet() {
  const diets = ['육식', '초식', '잡식'];
  return diets[Math.floor(Math.random() * diets.length)];
}
export const ANIMAL_SAMPLE_DATA: Animal[] = Array(200)
  .fill(0)
  .map((it) => ({
    animalName: getRandomAnimal(),
    bodySize: getRandomNumber() + ' 미터',
    leave: getRandomHabitat(),
    kind: getRandomDiet(),
    date: generateRandomDate(),
    bodyKillo: getRandomNumber() * 100,
    age: getRandomNumber(),
  }));
