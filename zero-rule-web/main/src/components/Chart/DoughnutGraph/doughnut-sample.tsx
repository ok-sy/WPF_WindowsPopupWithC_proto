/**
 * 전체 건수 데이터 타입
 */
export type SampleData = {
  labels: string;
  afterData: number;
};

let seq = 0;
const nextdata = () => {
  ++seq;
  return seq;
};

/**
 * Pie Bar 차트에 맞게 가공
 */
export function createDoughnutData(dailyList: SampleData[]) {
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
        backgroundColor: ['#ffd9e1', '#cdebff', '#fff3d6', '#d3f5f5', '#e6d9ff', '#ffe9d2'],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        fill: false,
      },
    ],
  };
}
