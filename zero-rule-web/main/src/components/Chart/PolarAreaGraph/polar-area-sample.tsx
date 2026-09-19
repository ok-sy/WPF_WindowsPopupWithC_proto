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
export function createPolarAreaData(dailyList: SampleData[]) {
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
        label: 'Data ',
        data: afterData,
        backgroundColor: ['#ffd9e1', '#cdebff', '#fff3d6', '#d3f5f5', '#e6d9ff', '#ffe9d2'],
        fill: false,
        borderWidth: 1,
      },
    ],
  };
}
