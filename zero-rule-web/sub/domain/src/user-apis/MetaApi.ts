import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  META_API_URL,
  splitParams,
} from '..';
import { MetaWord } from '../model';

/**
 * 메타 관련 API
 */
export class MetaApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 메타 단어 정보 조회
   */
  wordInfo = (
    params: {
      wordId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaWord: MetaWord }>> => {
    const url = META_API_URL.wordInfo;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 메타 단어 검색
   */
  wordSearch = (
    params: {
      name?: string;
      fullName?: string;
      korName?: string;
      entityYn?: string;
      attrYn?: string;
      synm?: string;
      expl?: string;
      sortKey?: string;
      maxCount: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaWordList: MetaWord[] }>> => {
    const url = META_API_URL.wordSearch;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 신규 메타 단어 등록
   */
  createWord = (
    params: {
      name: string;
      fullName?: string;
      korName: string;
      synm?: string;
      entityYn: 'Y' | 'N';
      attrYn: 'Y' | 'N';
      expl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaWord: MetaWord }>> => {
    const url = META_API_URL.createWord;
    console.log(params);
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 메타 단어 업데이트
   */
  updateWord = (
    params: {
      id: number;
      name: string;
      fullName?: string;
      korName: string;
      synm?: string;
      entityYn: 'Y' | 'N';
      attrYn: 'Y' | 'N';
      expl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaWord: MetaWord }>> => {
    const url = META_API_URL.updateWord;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 메타 단어 존재 여부 체크
   * 존재하면 true를 리턴
   */
  wordExistsByName = (
    params: {
      name: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<boolean>> => {
    const url = META_API_URL.wordExistsByName;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 메타 단어 삭제
   */
  wordDelete = async (
    params: {
      wordId: number;
    } & BaseRequest,
  ): Promise<void> => {
    const [data, extra] = splitParams(params);
    const url = META_API_URL.wordDelete + `${data.wordId}`;
    await this.helper.post(url, undefined, extra);
  };
}
