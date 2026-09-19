/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  labels: string;
  firstData: number;
  secondData: number;
  // thirthData: number
};

/**
 * Vertical Bar 차트에 맞게 가공
 */
export function createStackedBarData(dailyList: SampleData[]) {
  const labels: string[] = [];
  const secondData: number[] = [];
  const firstData: number[] = [];
  const thirthData: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    firstData.push(dailyList[i].firstData);
    secondData.push(dailyList[i].secondData);
    // thirthData.push(dailyList[i].thirthData)
    labels.push(dailyList[i].labels);
  }

  return {
    labels,
    datasets: [
      {
        label: '데이터1',
        data: firstData,
        fill: false,
        backgroundColor: '#10b981',
      },
      {
        label: '데이터2',
        data: secondData,
        fill: false,
        backgroundColor: '#d8d9fb',
      },
      // {
      //   label: '데이터3',
      //   data: thirthData,
      //   fill: false,
      //   backgroundColor: '#049bff',
      // },
    ],
  };
}
