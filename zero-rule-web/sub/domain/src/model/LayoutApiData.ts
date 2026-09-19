/**
 * @interface LayoutApiData 전체목록
 */
export interface GetUrlRequestCntVo {
  regDttm: string;

  cnt: number;
}

export interface GetDateServiceAvgResponeTimeVo {
  regDttm: string;

  avgTime: number;
}

export interface GetDateServiceLateTimeVo {
  regDttm: string;

  lateTime: number;
}

export interface UsedTaskVo {
  task: string;

  cnt: number;
}
/**
 * @interface LayoutApiDataProcessingSpeedByUrl 전체목록
 */
export interface LayoutApiDataProcessingSpeedByUrl {
  apiUrl: string;
  apiUrlNm: string;
  procTmMax: number;
}

/**
 * @interface LayoutApiDataFrequentlyCalledUrl 전체목록
 */
export interface LayoutApiDataFrequentlyCalledUrl {
  apiUrl: string;
  apiUrlNm: string;
  cnt: number;
}
