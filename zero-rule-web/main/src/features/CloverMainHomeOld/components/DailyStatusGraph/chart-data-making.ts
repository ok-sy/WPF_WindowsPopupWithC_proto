import { Accordion } from '@mui/material';
import type { ItemType, SampleTotDataType } from '../../todays-sample';

/**
 * 데이터 꺾은선 차트에 맞게 가공
 */
export function createTotalChartData(dailyList: SampleTotDataType[]) {
  const labels: string[] = [];
  const judgeCount: number[] = [];
  const callCount: number[] = [];
  const snsCount: number[] = [];
  const addFdsCount: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    judgeCount.push(dailyList[i].judgeCount);
    callCount.push(dailyList[i].callCount);
    snsCount.push(dailyList[i].snsCount);
    addFdsCount.push(dailyList[i].addFdsCount);
    labels.push(dailyList[i].ymd);
  }

  return {
    labels,
    datasets: [
      {
        label: 'TOTAL PROFIT',
        data: judgeCount,
        fill: false,
        tension: 0.3,
        backgroundColor: '#6366f1',
        barThickness: 10,
        maxBarThickness: 10,
      },
      {
        label: 'TOTAL CUSTOMERS',
        data: callCount,
        fill: false,
        tension: 0.3,
        backgroundColor: '#d8d9fb',
        barThickness: 10,
        maxBarThickness: 10,
      },
    ],
  };
}

/**
 * 당일 도넛 차트 데이터 하나 가공
 */
export function createTodayChartData(todaysList: ItemType[]) {
  const labels: string[] = [];
  const count: number[] = [];

  for (let i = 0; i < 3; i++) {
    labels.push(todaysList[i].title);
    count.push(todaysList[i].count);
  }
  return {
    labels,
    datasets: [
      {
        label: '건수',
        data: count,
        backgroundColor: ['#6366f1', '#10b981', '#f79009'],
      },
    ],
  };
}

/**
 * 데이터 영역 차트에 맞게 가공
 */
export function createAreaChartData(dailyList: SampleTotDataType[]) {
  const labels: string[] = [];
  const judgeCount: number[] = [];
  const callCount: number[] = [];
  const snsCount: number[] = [];
  const addFdsCount: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    judgeCount.push(dailyList[i].judgeCount);
    callCount.push(dailyList[i].callCount);
    snsCount.push(dailyList[i].snsCount);
    addFdsCount.push(dailyList[i].addFdsCount);
    labels.push(dailyList[i].ymd);
  }

  return {
    labels,
    datasets: [
      {
        label: 'TOTAL',
        data: [1000, 1200, 1500, 2000, 1800, 2300, 2500, 2800, 3000, 3200, 2000, 1500],
        fill: false,
        backgroundColor: '#f0443850',
        borderColor: '#f04438',
        barThickness: 10,
        maxBarThickness: 10,
      },
    ],
  };
}

/**
 * 데이터 영역 차트에 맞게 가공
 */
export function createPolarChartData(dailyList: SampleTotDataType[]) {
  const labels: string[] = [];
  const judgeCount: number[] = [];
  const callCount: number[] = [];
  const snsCount: number[] = [];
  const addFdsCount: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    judgeCount.push(dailyList[i].judgeCount);
    callCount.push(dailyList[i].callCount);
    snsCount.push(dailyList[i].snsCount);
    addFdsCount.push(dailyList[i].addFdsCount);
    labels.push(dailyList[i].ymd);
  }

  return {
    labels,
    datasets: [
      {
        label: 'TOTAL',
        data: judgeCount,
        fill: false,
        backgroundColor: ['#10b981', '#0065e8', '#191919', '#3e4b5e', '#db0050'],
        borderWidth: 1,
      },
    ],
  };
}
/**
 * 데이터 영역 차트에 맞게 가공
 */
export function createScatterChartData(dailyList: SampleTotDataType[]) {
  const labels: string[] = [];
  const judgeCount: number[] = [];
  const callCount: number[] = [];
  const snsCount: number[] = [];
  const addFdsCount: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    judgeCount.push(dailyList[i].judgeCount);
    callCount.push(dailyList[i].callCount);
    snsCount.push(dailyList[i].snsCount);
    addFdsCount.push(dailyList[i].addFdsCount);
    labels.push(dailyList[i].ymd);
  }

  return {
    labels,
    datasets: [
      {
        data: [
          { x: 12, y: 5 },
          { x: 7, y: 8 },
          { x: 6, y: 9 },
          { x: 12, y: 8 },
          { x: 6, y: 10 },
          { x: 9, y: 3 },
          { x: 4, y: 12 },
          { x: 7, y: 5 },
          { x: 8, y: 4 },
          { x: 11, y: 4 },
          { x: 3, y: 9 },
          { x: 4, y: 11 },
          { x: 11, y: 7 },
          { x: 10, y: 5 },
          { x: 8, y: 3 },
          { x: 11, y: 5 },
          { x: 6, y: 7 },
          { x: 7, y: 4 },
          { x: 9, y: 8 },
          { x: 5, y: 8 },
        ],
        backgroundColor: '#f79009',
        pointRadius: 3,
        pointHoverRadius: 4,
        showLine: false,
      },
    ],
  };
}
/**
 * 데이터 영역 차트에 맞게 가공
 */
export function createBubbleChartData(dailyList: SampleTotDataType[]) {
  const labels: string[] = [];
  const judgeCount: number[] = [];
  const callCount: number[] = [];
  const snsCount: number[] = [];
  const addFdsCount: number[] = [];

  for (let i = 0; i < dailyList.length; i++) {
    judgeCount.push(dailyList[i].judgeCount);
    callCount.push(dailyList[i].callCount);
    snsCount.push(dailyList[i].snsCount);
    addFdsCount.push(dailyList[i].addFdsCount);
    labels.push(dailyList[i].ymd);
  }

  return {
    labels,
    datasets: [
      {
        data: [
          {
            x: 20,
            y: 30,
            r: 5,
          },
          {
            x: 60,
            y: 40,
            r: 15,
          },
          {
            x: 30,
            y: 70,
            r: 10,
          },
          {
            x: 80,
            y: 60,
            r: 20,
          },
          {
            x: 45,
            y: 35,
            r: 8,
          },
          {
            x: 10,
            y: 50,
            r: 10,
          },
          {
            x: 50,
            y: 50,
            r: 12,
          },
          {
            x: 30,
            y: 20,
            r: 15,
          },
          {
            x: 70,
            y: 50,
            r: 18,
          },
          {
            x: 40,
            y: 30,
            r: 10,
          },
        ],
        backgroundColor: '#6366f195',
      },
    ],
  };
}
