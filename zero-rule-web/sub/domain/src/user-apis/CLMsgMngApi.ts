import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  MSG_MNG_API_URL,
  splitParams,
} from '..';
import { CLMsgMng, CLMsgMngCreateParams, MsgEnumList, PagerData } from '../model';

/**
 *  메시지 관리 API
 */
export class CLMsgMngApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 메시지 목록 조회
   */
  list = (
    params: {
      rowsPerPage: number;
      pageNumber: number;
      msgClsf?: string;
      tskClsfCd?: string;
      occrClsfCd?: string;
      teamId?: number | null;
      msgId?: string;
      msgCn?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<CLMsgMng> }>> => {
    const url = MSG_MNG_API_URL.list;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 등록
   */
  create = (
    params: {
      insertArrs: CLMsgMngCreateParams[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ insertCnt: number | null }>> => {
    const url = MSG_MNG_API_URL.create;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 수정
   */
  update = (
    params: {
      msgClsf: string;
      teamId: number; //팀 아이디
      occrClsfCd: string; //발생구분코드
      msgPrntCd: string; //메시지출력코드
      msgCn: string; //메시지내용
      msgId: string; //메시지 아이디
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ uptCnt: number | null }>> => {
    const url = MSG_MNG_API_URL.update;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 사용여부 수정
   */
  updateUseYn = (
    params: {
      msgClsf: string;
      useYn: string;
      msgId: string;
      msgCn: string;
      msgPrntCd: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ uptCnt: number | null }>> => {
    const url = MSG_MNG_API_URL.updateUseYn;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * enum클래스 메시지 목록 조회
   */
  msgEnumList = (
    params: BaseRequest,
  ): Promise<ApiResponseWithData<{ enumList: MsgEnumList[] }>> => {
    const url = MSG_MNG_API_URL.enumList;
    return this.withData.post(url, ...splitParams(params));
  };
}
