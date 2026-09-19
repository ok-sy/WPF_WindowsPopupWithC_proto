/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  labels: string;
  afterData: number;
};

/**
 * Pie Bar 차트에 맞게 가공
 */
export function createRadarData(dailyList: SampleData[]) {
  const labels: string[] = [];
  const afterData: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    afterData.push(dailyList[i].afterData);
    labels.push(dailyList[i].labels);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Month ',
        data: afterData,
        backgroundColor: ['#ffd9e1'],
        borderColor: ['rgba(255, 99, 132, 1)'],
        borderWidth: 1,
        fill: false,
      },
    ],
  };
}
