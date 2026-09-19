import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { AppError } from './error';

export interface RequestCancel {
  cancel?: (message?: string) => void;
}

export interface ApiRequestContext {
  canceled: boolean;
  config?: AxiosRequestConfig;
  cancel?: (message?: string) => void;
}

export interface ApiResponse {
  msgId?: string;
  msgCn?: string;
  msgClsf?: string;
  msgPrntCd?: string;
  msgKn?: string;
  occrPrgNm?: string;
  occrMethodNm?: string;
  url?: string;
  // errorCode?: string
  // message?: string
}

export interface ApiResponseWithData<T> extends ApiResponse {
  body: T;
}

export interface BaseRequest {
  ctx?: ApiRequestContext;
  header?: Record<string, string>;
}

export interface PagingRequest extends BaseRequest {
  rowsPerPage: number;
  pageNumber: number;
}

export type ResponseInterceptor = (
  response: AxiosResponse,
) => AxiosResponse | Promise<AxiosResponse>;

export type ErrorResponseInterceptor = (error: AppError) => void;

export function splitParams<T extends BaseRequest>(
  params: T,
): [Omit<T, 'ctx' | 'header'>, BaseRequest] {
  const { ctx, header, ...rest } = params;
  return [rest, { ctx, header }];
}
