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

/**
 * POL-07-03 : 저장 경계
 * ■ 팝업 관리자 API 클라이언트
 * - in : helper(ApiHelper) 생성자 인자
 * - out: list·info·save·questionTemplates·questionTemplate·updateActive 메서드(POST /apis/popup/...)
 * - zero-rule-web의 팝업 관리자 화면이 사용하는 인증 API다. 객체를 그대로 보내고 매핑·검증은 서버가 한다.
 */
export class PopupAdminApi {
  private readonly withData: ApiHelperWithData;

  constructor(helper: ApiHelper) {
    this.withData = new ApiHelperWithData(helper);
  }

  /**
   * ■ 팝업 목록 조회(POST /apis/popup/list)
   * - in : params(BaseRequest) 공통 요청 값
   * - out: Promise<ApiResponseWithData<{ popups: AdminPopupListItem[] }>>
   * - 비활성·기간 만료 항목을 포함한 전체 팝업 목록을 조회한다.
   */
  list = (
    params: BaseRequest = {},
  ): Promise<ApiResponseWithData<{ popups: AdminPopupListItem[] }>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.list, ...splitParams(params));
  };

  /**
   * POL-07-01 : 부모의 데이터 소유
   * ■ 팝업 상세 조회(POST /apis/popup/info)
   * - in : params({ popupId } & BaseRequest) 조회할 팝업 ID
   * - out: Promise<ApiResponseWithData<AdminPopupInfo>>
   * - 편집과 CSS 미리보기에 사용할 팝업 상세정보를 조회한다.
   */
  info = (
    params: { popupId: string } & BaseRequest,
  ): Promise<ApiResponseWithData<AdminPopupInfo>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.info, ...splitParams(params));
  };

  /**
   * POL-07-03 : 저장 경계
   * ■ 팝업 저장(POST /apis/popup/save)
   * - in : params({ popup, active, targetGroups } & BaseRequest) 저장 요청
   * - out: Promise<ApiResponseWithData<{ popup: AdminPopupDetail }>> 저장된 팝업
   * - 신규 팝업을 등록하거나 동일한 popupId의 팝업을 수정한다.
   */
  save = (
    params: {
      popup: AdminPopupDetail;
      active: boolean;
      targetGroups: PopupTargetGroup[];
    } & BaseRequest,
  ): Promise<ApiResponseWithData<{ popup: AdminPopupDetail }>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.save, ...splitParams(params));
  };

  /**
   * POL-06-01 : 문항·서식
   * ■ 문항 템플릿 목록 조회(POST /apis/popup/question-templates)
   * - in : params(BaseRequest) 공통 요청 값
   * - out: Promise<ApiResponseWithData<{ templates: AdminQuestionTemplate[] }>>
   */
  questionTemplates = (
    params: BaseRequest = {},
  ): Promise<ApiResponseWithData<{ templates: AdminQuestionTemplate[] }>> =>
    this.withData.postJson(POPUP_ADMIN_API_URL.questionTemplates, ...splitParams(params));

  /**
   * POL-06-01 : 문항·서식
   * ■ 문항 템플릿 상세 조회(POST /apis/popup/question-template)
   * - in : params({ templateId } & BaseRequest) 템플릿 ID
   * - out: Promise<ApiResponseWithData<{ adminQuestions: AdminPopupQuestion[] }>> 템플릿 문항
   */
  questionTemplate = (
    params: { templateId: number } & BaseRequest,
  ): Promise<ApiResponseWithData<{ adminQuestions: AdminPopupQuestion[] }>> =>
    this.withData.postJson(POPUP_ADMIN_API_URL.questionTemplate, ...splitParams(params));

  /**
   * ■ 팝업 활성 변경(POST /apis/popup/active)
   * - in : params({ popupId, active } & BaseRequest) 대상 팝업과 활성 여부
   * - out: Promise<ApiResponseWithData<{ popup: AdminPopupDetail }>> 변경된 팝업
   * - 팝업의 다른 내용은 유지하고 활성 여부만 변경한다.
   */
  updateActive = (
    params: { popupId: string; active: boolean } & BaseRequest,
  ): Promise<ApiResponseWithData<{ popup: AdminPopupDetail }>> => {
    return this.withData.postJson(POPUP_ADMIN_API_URL.updateActive, ...splitParams(params));
  };
}
