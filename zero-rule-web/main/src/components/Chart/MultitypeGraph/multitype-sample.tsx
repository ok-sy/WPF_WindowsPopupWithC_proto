/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  labels: string;
  firstData: number;
  secondData: number;
  thirthData: number;
};

let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

/**
 * Pie Bar 차트에 맞게 가공
 */
export function createMultitypeData(dailyList: SampleData[]) {
  const labels: string[] = [];
  const firstData: number[] = [];
  const secondData: number[] = [];
  const thirthData: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    firstData.push(dailyList[i].firstData);
    secondData.push(dailyList[i].secondData);
    thirthData.push(dailyList[i].thirthData);
    labels.push(dailyList[i].labels);
  }

  return {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Data1 ',
        data: firstData,
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        fill: false,
      },
      {
        type: 'bar' as const,
        label: 'Data2 ',
        data: secondData,
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        fill: false,
      },
      {
        type: 'bar' as const,
        label: 'Data3 ',
        data: thirthData,
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };
}
