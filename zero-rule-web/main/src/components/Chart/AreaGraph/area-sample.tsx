/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  labels: string;
  data: number;
};

let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

/**
 * Vertical Bar 차트에 맞게 가공
 */
export function createAreaData(dailyList: SampleData[]) {
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    data.push(dailyList[i].data);
    labels.push(dailyList[i].labels);
  }

  return {
    labels,
    datasets: [
      {
        label: '데이터',
        data: data,
        fill: true,
        backgroundColor: '#d8d9fb',
      },
    ],
  };
}
