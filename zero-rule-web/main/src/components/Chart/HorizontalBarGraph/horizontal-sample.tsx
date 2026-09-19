/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  labels: string;
  beforeData: number;
  afterData: number;
};

let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

/**
 * Vertical Bar 차트에 맞게 가공
 */
export function createHorizontalBarData(dailyList: SampleData[]) {
  const labels: string[] = [];
  const beforeData: number[] = [];
  const afterData: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    afterData.push(dailyList[i].afterData);
    beforeData.push(dailyList[i].beforeData);
    labels.push(dailyList[i].labels);
  }

  return {
    labels,
    datasets: [
      {
        label: '데이터1',
        data: afterData,
        fill: false,
        backgroundColor: '#10b981',
      },
      {
        label: '데이터2',
        data: beforeData,
        fill: false,
        backgroundColor: '#d8d9fb',
      },
    ],
  };
}
