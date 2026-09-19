import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  COLM_MPPN_DEFN_API_URL,
  splitParams,
} from '..';
import { ColmMppnDefn, ColmMppnDefnTblNmAll } from '../model';

/**
 * 컬럼 정의서 API
 */
export class ColmMppnDefnApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * 컬럼매퍼 테이블 검색
   */
  colmMppnDefnSearch = (
    params: {
      tobeTblPhyNm?: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ colmMppnDefnList: ColmMppnDefn[] }>> => {
    const url = COLM_MPPN_DEFN_API_URL.colmMppnDefnSearch;
    return this.withData.postJson(url, ...splitParams(params));
  };
  /**
   * 컬럼매퍼 테이블 리스트(중복제거됨)
   */
  colmMppnDefnTableList = (
    params: BaseRequest,
  ): Promise<ApiResponseWithData<{ colmMppnDefnTblNmAll: ColmMppnDefnTblNmAll[] }>> => {
    const url = COLM_MPPN_DEFN_API_URL.colmMppnDefnTableList;
    return this.withData.postJson(url, ...splitParams(params));
  };
}
