import {
  ApiHelper,
  ApiHelperWithData,
  ApiResponseWithData,
  BaseRequest,
  POPUP_ADMIN_API_URL,
  splitParams,
} from '..';
import type {
  AdminPopupQuestion,
  AdminQuestionTemplate,
  AdminPopupDetail,
  AdminPopupInfo,
  AdminPopupListItem,
  PopupTargetGroup,
} from '../model';

/** zero-rule-web의 팝업 관리자 화면이 사용하는 인증 API다. */
export class PopupAdminApi {
  private readonly withData: ApiHelperWithData;

  constructor(helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /** 비활성·기간 만료 항목을 포함한 전체 팝업 목록을 조회한다. */
  list = (
    params: BaseRequest = {},
  ): Promise<ApiResponseWithData<{ popups: AdminPopupListItem[] }>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.list, ...splitParams(params));
  };

  /** 편집과 CSS 미리보기에 사용할 팝업 상세정보를 조회한다. */
  info = (
    params: { popupId: string } & BaseRequest,
  ): Promise<ApiResponseWithData<AdminPopupInfo>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.info, ...splitParams(params));
  };

  /** 신규 팝업을 등록하거나 동일한 popupId의 팝업을 수정한다. */
  save = (
    params: {
      popup: AdminPopupDetail;
      active: boolean;
      targetGroups: PopupTargetGroup[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ popup: AdminPopupDetail }>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.save, ...splitParams(params));
  };

  /** 팝업의 다른 내용은 유지하고 활성 여부만 변경한다. */
  questionTemplates = (
    params: BaseRequest = {},
  ): Promise<ApiResponseWithData<{ templates: AdminQuestionTemplate[] }>> =>
    this.withData.postJson(POPUP_ADMIN_API_URL.questionTemplates, ...splitParams(params));

  questionTemplate = (
    params: { templateId: number } & BaseRequest,
  ): Promise<ApiResponseWithData<{ adminQuestions: AdminPopupQuestion[] }>> =>
    this.withData.postJson(POPUP_ADMIN_API_URL.questionTemplate, ...splitParams(params));

  updateActive = (
    params: { popupId: string; active: boolean } & BaseRequest,
  ): Promise<ApiResponseWithData<{ popup: AdminPopupDetail }>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.updateActive, ...splitParams(params));
  };
}
