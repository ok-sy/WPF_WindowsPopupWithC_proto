type NoticeType = {
  expl: string;
  costomer: string;
  date: string;
  status: string;
};

let noticeId = 0;
const nextNoticeId = () => {
  noticeId++;
  return noticeId;
};

const initialDate = new Date();

export const NOTICE_DATAS: NoticeType[] = [
  {
    expl: 'DEV104' + nextNoticeId(),
    costomer: 'Ekaterina Tankova',
    date: '12/04/2019',
    status: 'PENDING',
  },
  {
    expl: 'DEV104' + nextNoticeId(),
    costomer: 'Cao Yu',
    date: '12/04/2019',
    status: 'DELIVERED',
  },
  {
    expl: 'DEV104' + nextNoticeId(),
    costomer: 'Alexa Richardson',
    date: '11/04/2019',
    status: 'REFUNDED',
  },
  {
    expl: 'DEV104' + nextNoticeId(),
    costomer: 'Anje Keizer',
    date: '09/04/2019',
    status: 'PENDING',
  },
  {
    expl: 'DEV104' + nextNoticeId(),
    costomer: 'Clarke Gillebert',
    date: '08/04/2019',
    status: 'DELIVERED',
  },
];

type ListType = {
  img: string;
  name: string;
  updateAt: Date;
};

export const LIST_DATAS: ListType[] = [
  {
    img: '/images/main-home/product-1.png',
    name: 'Healthcare Erbology',
    updateAt: initialDate,
  },
  {
    img: '/images/main-home/product-2.png',
    name: 'Makeup Lancome Rouge',
    updateAt: initialDate,
  },
  {
    img: '/images/main-home/product-4.png',
    name: 'Skincare Soja CO',
    updateAt: initialDate,
  },
  {
    img: '/images/main-home/product-5.png',
    name: 'Makeup Lipstick',
    updateAt: initialDate,
  },
  {
    img: '/images/main-home/product-6.png',
    name: 'Makeup Lipstick',
    updateAt: initialDate,
  },
];
