import { ApiHelper, ApiHelperWithData, ApiResponseWithData, BaseRequest, splitParams } from '..';
import {
  GetDateServiceAvgResponeTimeVo,
  GetDateServiceLateTimeVo,
  GetUrlRequestCntVo,
  LayoutApiDataFrequentlyCalledUrl,
  LayoutApiDataProcessingSpeedByUrl,
  UsedTaskVo,
} from '../model';

/**
 * clover framework 코드 API
 */
export class LayoutApi {
  private withData: ApiHelperWithData;

  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 분당 URL 호출 갯수
   */
  getMinuteUrlRequestCntList = (
    params: { hour?: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetUrlRequestCntVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-minute-url-request-cnt';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 시간별 URL 호출 갯수
   */
  getHourUrlRequestCntList = (
    params: { day?: string } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetUrlRequestCntVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-hour-url-request-cnt';
    return this.withData.post(url, ...splitParams(params));
  };
  /**
   * 일별 URL 호출 갯수
   */
  getDayUrlRequestCntList = (
    params: {
      month?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetUrlRequestCntVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-day-url-request-cnt';
    return this.withData.post(url, ...splitParams(params));
  };
  /**
   * 월별 URL 호출 갯수
   */
  getMonthlyUrlRequestCntList = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetUrlRequestCntVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-month-url-request-cnt';
    return this.withData.postJson(url, ...splitParams(params));
  };
  /**
   *  자주쓰는 서비스 TOP10
   */
  getProcessingSpeedByUrlRequestCntList = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: LayoutApiDataProcessingSpeedByUrl[];
    }>
  > => {
    const url = '/apis/main-layout/get-processing-speed-url-request-cnt';
    return this.withData.postJson(url, ...splitParams(params));
  };
  /**
   * 지연 서비스 TOP10
   */
  getFrequentlyCalledUrlRequestCntList = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: LayoutApiDataFrequentlyCalledUrl[];
    }>
  > => {
    const url = '/apis/main-layout/get-frequently-called-url-request-cnt';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 월별 서비스 평균 응답시간 조회
   */
  getMonthServiceAvgResponseTime = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceAvgResponeTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-month-service-avg-response-time';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 일별 서비스 평균 응답시간 조회
   */
  getDayServiceAvgResponseTime = (
    params: {
      month?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceAvgResponeTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-day-service-avg-response-time';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 시간별 서비스 평균 응답시간 조회
   */
  getHourServiceAvgResponseTime = (
    params: {
      day?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceAvgResponeTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-hour-service-avg-response-time';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 분당 서비스 평균 응답시간 조회
   */
  getMinServiceAvgResponseTime = (
    params: {
      hour?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceAvgResponeTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-min-service-avg-response-time';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 월별 서비스 지연시간 조회
   */
  getMonthServiceLateTime = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceLateTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-month-service-late-time';
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 일별 서비스 지연시간 조회
   */
  getDayServiceLateTime = (
    params: {
      month?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceLateTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-day-service-late-time';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 시간별 서비스 지연시간 조회
   */
  getHourServiceLateTime = (
    params: {
      day?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceLateTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-hour-service-late-time';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 분당 서비스 지연시간 조회
   */
  getMinServiceLateTime = (
    params: {
      hour?: string;
    } & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: GetDateServiceLateTimeVo[];
    }>
  > => {
    const url = '/apis/main-layout/get-min-service-late-time';
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 업무별 사용량 조회
   */
  usedTask = (
    params: {} & BaseRequest,
  ): Promise<
    ApiResponseWithData<{
      list: UsedTaskVo[];
    }>
  > => {
    const url = '/apis/main-layout/used-task';
    return this.withData.postJson(url, ...splitParams(params));
  };
}
