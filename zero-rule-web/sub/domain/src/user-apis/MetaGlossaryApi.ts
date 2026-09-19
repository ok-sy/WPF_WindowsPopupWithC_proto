import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  META_GLOSSARY_API_URL,
  splitParams,
} from '..';
import { MetaGlossary } from '../model/MetaGlossary';

/**
 * 메타 관련 API
 */
export class MetaGlossaryApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 메타 용어 정보 조회
   */
  glossaryInfo = (
    params: {
      glsySqno: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaGlossary: MetaGlossary }>> => {
    const url = META_GLOSSARY_API_URL.glossaryInfo;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 메타 용어 리스트 검색
   */
  glossarySearch = (
    params: {
      glsyKorNm?: string;
      glsyPhyNm?: string;
      engFullNm?: string;
      dataType?: string;
      glsyExpl?: string;
      maxCount: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaGlossaryList: MetaGlossary[] }>> => {
    const url = META_GLOSSARY_API_URL.glossarySearch;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 신규 메타 단어 등록
   */
  createGlossary = (
    params: {
      glsyKorNm: string;
      glsyPhyNm: string;
      engFullNm?: string;
      dataType: string;
      glsyExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaGlossary: MetaGlossary }>> => {
    const url = META_GLOSSARY_API_URL.createGlossary;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 메타 단어 업데이트
   */
  updateGlossary = (
    params: {
      glsySqno: number;
      glsyKorNm: string;
      glsyPhyNm: string;
      engFullNm?: string;
      dataType: string;
      glsyExpl?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ metaGlossary: MetaGlossary }>> => {
    const url = META_GLOSSARY_API_URL.updateGlossary;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * 메타 단어 존재 여부 체크
   * 존재하면 true를 리턴
   */
  GlossaryExistsByGlsySqno = (
    params: {
      glsyKorNm: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<boolean>> => {
    const url = META_GLOSSARY_API_URL.GlossaryExistsByGlsySqno;
    return this.withData.post(url, ...splitParams(params));
  };

  /**
   * 메타 단어 삭제
   */
  GlossaryDelete = async (
    params: {
      glsySqno: number;
    } & BaseRequest,
  ): Promise<void> => {
    const [data, extra] = splitParams(params);
    const url = META_GLOSSARY_API_URL.GlossaryDelete + `${data.glsySqno}`;
    await this.helper.post(url, undefined, extra);
  };
}
