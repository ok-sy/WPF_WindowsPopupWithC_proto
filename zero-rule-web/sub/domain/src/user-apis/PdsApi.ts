import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  PDS_API_URL,
  splitParams,
} from '..';
import { PagerData, Pds, PdsSimple, UploadedFile } from '../model';

/**
 * 자료실(PDS) API
 */
export class PdsApi {
  private withData: ApiHelperWithData;
  constructor(private helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * Pds 게시물 등록
   */
  create = (
    params: {
      title: string;
      substance: string;
      fileIds: string[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pds: PdsSimple }>> => {
    const url = PDS_API_URL.create;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * Pds 게시물 수정
   */
  update = async (
    params: {
      pdsId: number;
      title: string;
      substance?: string;
      fileIds: string[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pds: Pds }>> => {
    const url = PDS_API_URL.update;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * Pds 게시물 목록 조회 - 페이징
   */
  list = (
    params: {
      title?: string;
      rowsPerPage: number;
      pageNumber: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pagerData: PagerData<PdsSimple> }>> => {
    const url = PDS_API_URL.list;
    return this.withData.postJson(url, ...splitParams(params));
  };

  /**
   * Pds 게시물 정보 조회
   */
  info = (
    params: {
      pdsId: number;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ pds: Pds }>> => {
    const [data, extra] = splitParams(params);
    const url = PDS_API_URL.info + `${data.pdsId}`;
    return this.withData.post(url, undefined, extra);
  };

  /**
   * Pds 삭제
   */
  delete = async (
    params: {
      pdsId: number;
    } & BaseRequest,
  ): Promise<void> => {
    const [data, extra] = splitParams(params);
    const url = PDS_API_URL.delete + `${data.pdsId}`;
    await this.helper.post(url, undefined, extra);
  };

  /**
   * 파일명 변경
   */
  renameFile = (
    params: {
      fileId: string;
      fileName: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ file: UploadedFile }>> => {
    const [data, extra] = splitParams(params);
    const url = PDS_API_URL.renameFile + `${data.fileId}`;

    return this.withData.post(url, { fileName: data.fileName }, extra);
  };

  /**
   * 파일 업로드
   */
  uploadTempFile = (
    params: {
      file: Blob;
      fileName: string;
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ file: UploadedFile }>> => {
    const url = PDS_API_URL.uploadTempFile;
    const [data, extra] = splitParams(params);
    const formData = new FormData();
    formData.append('file', data.file, data.fileName);
    return this.withData.postMultipart(url, formData, extra);
  };
}
