import { Context } from 'chartjs-plugin-datalabels';

declare module 'chartjs-plugin-datalabels' {
  interface Context {
    foo?: number;
    _labels?: any;
  }
}
