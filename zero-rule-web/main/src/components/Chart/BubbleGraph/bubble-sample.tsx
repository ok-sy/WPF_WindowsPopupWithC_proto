/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  xData: number;
  yData: number;
};

let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

export function nextNum() {
  let requestId = Math.round(Math.random() * 500);
  return ++requestId;
}

export const SAMPLE_TOTAL: SampleData[] = new Array(5).fill(0).map((it) => ({
  xData: 127 + nextNum(),
  yData: nextNum() - 574,
}));

/**
 * Pie Bar 차트에 맞게 가공
 */
export function createBubbleData(dailyList: {}[]) {
  const xData: number[] = [];
  const yData: number[] = [];

  return {
    datasets: [
      {
        label: 'data ',
        data: dailyList,
        backgroundColor: ['rgba(255, 99, 132, 1)'],
        fill: false,
      },
    ],
  };
}
