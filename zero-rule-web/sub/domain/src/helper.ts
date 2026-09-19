import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import qs from 'querystring';
import errorHandleStore from './ErrorHandleStore';
import type {
  ApiRequestContext,
  ApiResponse,
  ApiResponseWithData,
  ErrorResponseInterceptor,
  ResponseInterceptor,
} from './base';
import { AppError, createAppError } from './error';
import log from './log';

type ParsedUrlQueryInput = Record<string, any>;
type AxiosResponsToApiResponseFn = (response: AxiosResponse) => ApiResponse;
type ErrorToMessageFn = (errorCode: string, message?: string) => string;

const createApiServer = (
  apiBaseURL: string,
  responseInterceptor: ResponseInterceptor,
  errorResponseInterceptor: ErrorResponseInterceptor,
  debug = true,
): AxiosInstance => {
  const server = axios.create({
    baseURL: apiBaseURL,
    //withCredentials: false,
  });

  server.defaults.timeout = 30000; // 15sec
  server.interceptors.request.use(
    (config) => {
      if (debug) {
        log.debug(`axios interceptors ${config.method}url=`, config.url, {
          headers: config.headers,
        });
      }
      return config;
    },
    function (error) {
      return Promise.reject(error);
    },
  );
  server.interceptors.response.use(responseInterceptor, function (error: Error) {
    if (axios.isCancel(error)) {
      log.debug('axios canceled');
    }

    log.debug('axios.interceptors.response error', error);
    const appError = createAppError(error);

    if (errorResponseInterceptor) {
      errorResponseInterceptor(appError);
    }
    return Promise.reject(appError);
  });
  return server;
};

const serialize = (params?: ParsedUrlQueryInput, clean = true): string | undefined => {
  if (!params || Object.keys(params).length === 0) return undefined;
  if (clean) {
    const newParams: ParsedUrlQueryInput = {};
    for (const key of Object.keys(params)) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        newParams[key] = params[key];
      }
    }
    if (Object.keys(newParams).length === 0) {
      return undefined;
    }
    return qs.stringify(newParams);
  } else {
    return qs.stringify(params);
  }
};

// makeGetUrl('/', {foo: 123, bar: null},      false)= /?foo=123&bar=
// makeGetUrl('/', {foo: 123, bar: null},      true) = /?foo=123
// makeGetUrl('/', {foo: 123, bar: undefined}, true) = /?foo=123
// makeGetUrl('/', {foo: 123, bar: ''},        true) = /?foo=123
// makeGetUrl('/', {foo: 123, bar: 0},         true) = /?foo=123&bar=0
const makeGetUrl = (url: string, params?: ParsedUrlQueryInput, clean = true): string => {
  if (!params || Object.keys(params).length === 0) return url;
  const queryStr: string = serialize(params, clean) ?? '';

  const prefix = url.endsWith('?') || url.endsWith('&') ? '' : url.indexOf('?') < 0 ? '?' : '&';
  return `${url}${prefix}${queryStr}`;
};

const createCancelToken = () => {
  const source = axios.CancelToken.source();
  const { token, cancel } = source;
  return { token, cancel };
};

async function wrapAxiosResponse(
  ctx: ApiRequestContext | undefined,
  extraHeaders: Record<string, string> | undefined,
  createApiHeader: () => Record<string, string>,
  handle: (config?: AxiosRequestConfig) => Promise<AxiosResponse>,
): Promise<AxiosResponse> {
  const headers = { ...extraHeaders, ...createApiHeader() };
  const config = { ...ctx?.config } as AxiosRequestConfig;
  config.headers = headers;
  if (ctx) {
    const { token, cancel } = createCancelToken();
    ctx.cancel = (message?: string) => {
      ctx.canceled = true;
      cancel(message);
    };
    config.cancelToken = token;
  }

  return await handle(config);
}

const convertApiResponse = (errorToMessage: ErrorToMessageFn): AxiosResponsToApiResponseFn => {
  return (axiosResponse: AxiosResponse): ApiResponse => {
    const apiResponse = axiosResponse.data as ApiResponse;
    const apiResonseUrl = axiosResponse.config.url;
    const {
      msgId = 'ER00000000',
      msgCn = '',
      msgClsf = '',
      msgPrntCd = '',
      occrPrgNm = '',
      occrMethodNm = '',
    } = apiResponse ?? {};

    const apiResult = { ...apiResponse, url: apiResonseUrl };
    if (apiResponse) {
      errorHandleStore.setError(
        msgId,
        msgCn,
        msgClsf,
        msgPrntCd,
        occrPrgNm,
        occrMethodNm,
        apiResonseUrl,
      );
      if (apiResult.msgClsf === 'ER') {
        throw new AppError(
          msgId,
          msgCn,
          msgClsf,
          msgPrntCd,
          occrPrgNm,
          occrMethodNm,
          apiResonseUrl,
        );
      }
      return apiResult;
    }

    if (msgId === 'ER00000000' && msgCn.length > 0) {
      throw new AppError(msgId, msgCn, msgClsf, msgPrntCd, occrPrgNm, occrMethodNm, apiResonseUrl);
    }

    throw new AppError(msgId, msgCn, msgClsf, msgPrntCd, occrPrgNm, occrMethodNm, apiResonseUrl);
  };
};

// const toApiResponseData = <T>(axiosResponse: AxiosResponse): T => {
//   const response = toApiResponse(axiosResponse) as ApiResponseWithData<T>
//   return response.data
// }

const withResponseBody = <T>(response: ApiResponse): ApiResponseWithData<T> => {
  log.debug('withResponseBody', response);
  const returnObk = {
    body: (response as ApiResponseWithData<T>).body,
    msgId: (response as ApiResponseWithData<T>).msgId,
    msgCn: (response as ApiResponseWithData<T>).msgCn,
    msgClsf: (response as ApiResponseWithData<T>).msgClsf,
    msgPrntCd: (response as ApiResponseWithData<T>).msgPrntCd,
    occrPrgNm: (response as ApiResponseWithData<T>).occrPrgNm,
    occrMethodNm: (response as ApiResponseWithData<T>).occrMethodNm,
    url: (response as ApiResponseWithData<T>).url,

    // errorCode: (response as ApiResponseWithData<T>).errorCode,
    // message: (response as ApiResponseWithData<T>).message,
  };
  return returnObk;
};

export type RequestExtra = {
  header?: Record<string, string>;
  ctx?: ApiRequestContext;
};

export class ApiHelper {
  server: AxiosInstance;

  private toApiResponse_: AxiosResponsToApiResponseFn;

  constructor(
    public apiBaseURL: string,

    private createApiHeader: () => Record<string, string>,

    // 인증 헤더를 처리할 Reponse interceptor
    responseInterceptor: ResponseInterceptor,

    errorResponseInterceptor: ErrorResponseInterceptor,

    errorToMessage: ErrorToMessageFn,

    debug = true,
  ) {
    this.server = createApiServer(apiBaseURL, responseInterceptor, errorResponseInterceptor, debug);
    this.toApiResponse_ = convertApiResponse(errorToMessage).bind(this);
  }

  _get = (
    url: string,
    params: ParsedUrlQueryInput | undefined,
    extraHeaders: Record<string, string> | undefined,
    ctx: ApiRequestContext | undefined,
  ): Promise<AxiosResponse> => {
    // if (DEBUG_API) console.log('ApiHelper _get request=', url, params ?? '')
    const urlWithQuery = makeGetUrl(url, params);
    return wrapAxiosResponse(ctx, extraHeaders, this.createApiHeader, (config) =>
      this.server.get(urlWithQuery, config),
    );
  };

  _post = (
    url: string,
    params: ParsedUrlQueryInput | FormData | string | undefined,
    extraHeaders: Record<string, string> | undefined,
    ctx: ApiRequestContext | undefined,
  ): Promise<AxiosResponse> => {
    // if (DEBUG_API) console.log('ApiHelper _post request=', url, params ?? '', extraHeaders)
    return wrapAxiosResponse(ctx, extraHeaders, this.createApiHeader, (config) =>
      this.server.post(url, params, config),
    );
  };

  get = (url: string, params?: ParsedUrlQueryInput, extra?: RequestExtra): Promise<ApiResponse> => {
    const extraHeaders = extra?.header;
    return this._get(url, params, extraHeaders, extra?.ctx).then(this.toApiResponse_);
  };

  post = (
    url: string,
    params?: ParsedUrlQueryInput,
    extra?: RequestExtra,
  ): Promise<ApiResponse> => {
    const defaultHeader = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const extraHeaders = extra?.header ? { ...defaultHeader, ...extra?.header } : defaultHeader;
    return this._post(url, serialize(params), extraHeaders, extra?.ctx).then(this.toApiResponse_);
  };

  postJson = (
    url: string,
    params?: ParsedUrlQueryInput,
    extra?: RequestExtra,
  ): Promise<ApiResponse> => {
    const defaultHeader = { 'Content-Type': 'application/json' };
    const extraHeaders = extra?.header
      ? Object.assign({}, defaultHeader, extra?.header)
      : defaultHeader;
    return this._post(url, params, extraHeaders, extra?.ctx).then(this.toApiResponse_);
  };

  postMultipart = (url: string, formData: FormData, extra?: RequestExtra): Promise<ApiResponse> => {
    const defaultHeader = { 'Content-Type': 'multipart/form-data' };
    const extraHeaders = extra?.header
      ? Object.assign({}, defaultHeader, extra?.header)
      : defaultHeader;
    return this._post(url, formData, extraHeaders, extra?.ctx).then(this.toApiResponse_);
  };
}

export class ApiHelperWithData {
  helper: ApiHelper;

  constructor(helper: ApiHelper) {
    this.helper = helper;
  }

  get = <T>(
    url: string,
    params?: ParsedUrlQueryInput,
    extra?: RequestExtra,
  ): Promise<ApiResponseWithData<T>> => {
    return this.helper.get(url, params, extra).then((it) => withResponseBody(it));
  };

  post = <T>(
    url: string,
    params?: ParsedUrlQueryInput,
    extra?: RequestExtra,
  ): Promise<ApiResponseWithData<T>> => {
    return this.helper.post(url, params, extra).then((it) => withResponseBody(it));
  };

  postJson = <T>(
    url: string,
    params?: ParsedUrlQueryInput,
    extra?: RequestExtra,
  ): Promise<ApiResponseWithData<T>> => {
    return this.helper.postJson(url, params, extra).then((it) => withResponseBody(it));
  };

  postMultipart = <T>(
    url: string,
    formData: FormData,
    extra?: RequestExtra,
  ): Promise<ApiResponseWithData<T>> => {
    return this.helper.postMultipart(url, formData, extra).then((it) => withResponseBody(it));
  };
}
