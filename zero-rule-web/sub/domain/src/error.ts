import axios, { AxiosError } from 'axios';

export const createAppError = (error: any) => {
  console.log('error=', error);
  if (error.isAxiosError && error.message === 'Network Error') {
    console.log('axiosError', error.toJSON());
    return new AppError('NE00000000', 'Network Error', 'ER', '2', 'Network Error');
  }

  // 타임아웃 에러 처리
  if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
    console.log('Request timeout', error.message);
    throw new AppError(
      'TE00000000',
      'Timeout Error',
      'ER',
      '2',
      undefined,
      undefined,
      error.config?.url,
    );
  }

  if (error instanceof AppError || error instanceof ApiCanceledError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiCanceledError();
  }

  if (error?.response?.status > 0) {
    return new AppError(
      `SY${error.response.status}00000`,
      error.message,
      'ER',
      '2',
      undefined,
      undefined,
      error.config.url,
    );
  }

  return new AppError('ER00000000', error.msgCn || 'unknwon error', 'ER', '2', 'unknwon error');
};

export class AppError extends Error {
  name: string;
  msgId: string;
  msgClsf: string;
  msgPrntCd: string;
  occrPrgNm: string;
  occrMethodNm: string;
  url: string;
  constructor(
    msgId: string,
    msgCn?: string,
    msgClsf?: string,
    msgPrntCd?: string,
    occrPrgNm?: string,
    occrMethodNm?: string,
    url?: string,
  ) {
    super(msgCn);
    this.message = msgCn ?? '';
    this.msgId = msgId;
    this.msgClsf = msgClsf ?? '';
    this.occrPrgNm = occrPrgNm ?? '';
    this.occrMethodNm = occrMethodNm ?? '';
    this.msgPrntCd = msgPrntCd ?? '';
    this.name = 'AppError';
    this.url = url ?? '';
  }

  toString = (): string => {
    if (this.message) {
      return `${this.msgId}: ${this.message}`;
    } else {
      return this.msgId;
    }
  };
}

export class ApiCanceledError extends AppError {
  constructor(msgCn?: string) {
    super('E1_CANCELED', msgCn);
  }
}
