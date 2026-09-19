/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  xData: number;
  yData: number;
};

/**
 * Pie Bar 차트에 맞게 가공
 */
export function createScatterData(dailyList: SampleData[], data?: {}[]) {
  const xData: number[] = [];
  const yData: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    xData.push(dailyList[i].xData);
    yData.push(dailyList[i].yData);
  }

  return {
    datasets: [
      {
        label: 'data ',
        data: data,
        backgroundColor: ['rgba(255, 99, 132, 1)'],
        fill: false,
      },
    ],
  };
}
