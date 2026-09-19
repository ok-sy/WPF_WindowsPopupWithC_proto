import { makeAutoObservable } from 'mobx';

export type ErrorType = {
  msgId: string;
  msgCn: string;
  msgClsf?: string;
  msgPrntCd: string;
  occrPrgNm?: string;
  occrMethodNm?: string;
  url?: string;
};
/**
 * 에러메세지를 보관하는 mobx 스토어
 */
class ErrorHandleStore {
  error: ErrorType | null = null;
  constructor() {
    // 자동 메서드 생성
    makeAutoObservable(this, {
      error: true, // error를 observable로 설정
      setError: true,
      clearError: true,
    });
  }
  // 에러 등록
  setError(
    msgId: string,
    msgCn: string,
    msgClsf: string,
    msgPrntCd: string,
    occrPrgNm?: string,
    occrMethodNm?: string,
    url?: string,
  ) {
    this.error = { msgId, msgCn, msgClsf, msgPrntCd, occrPrgNm, occrMethodNm, url };
  }
  // 에러 클리어링
  clearError = () => {
    this.error = null;
  };
}

const errorHandleStore = new ErrorHandleStore();
export default errorHandleStore;
