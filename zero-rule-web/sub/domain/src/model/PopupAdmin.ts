/** 서버가 반환할 수 있는 ISO 문자열 또는 epoch 초 형식의 팝업 일시다. */
export type PopupDateValue = string | number;

export type PopupType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'SURVEY' | 'QUIZ';
export type PopupDisplayMode = 'SEQUENTIAL' | 'SIMULTANEOUS';
export type PopupSizeMode = 'FIXED' | 'RATIO' | 'FULLSCREEN';

export interface PopupOption {
  optionId: number;
  value: string;
  text: string;
  sortOrder: number;
  isCorrect?: boolean | null;
}

export interface PopupQuestion {
  questionId: number;
  title: string;
  description?: string | null;
  questionType: string;
  isRequired: boolean;
  isScored: boolean;
  questionScore?: number | null;
  sortOrder: number;
  options: PopupOption[];
  correctAnswer?: string | null;
  answerMatchMode?: 'EXACT' | 'CONTAINS' | null;
}

/** 관리자 목록 그리드 한 행에서 사용하는 요약 정보다. */
export interface AdminPopupListItem {
  popupId: string;
  popupType: PopupType;
  title: string;
  displayStartAt: PopupDateValue;
  displayEndAt: PopupDateValue;
  displayMode: PopupDisplayMode;
  displayOrder: number;
  sizeMode: PopupSizeMode;
  activeYn: 'Y' | 'N';
  periodMode: string;
  questionTemplateId?: number | null;
  createdBy: string;
  createdAt: PopupDateValue;
  updatedBy: string;
  updatedAt: PopupDateValue;
}

/** WPF 출력과 관리자 편집·CSS 미리보기가 함께 사용하는 전체 팝업 정보다. */
export interface AdminPopupDetail {
  popupId: string;
  popupType: PopupType;
  title: string;
  displayStartAt: PopupDateValue;
  displayEndAt: PopupDateValue;
  displayMode: PopupDisplayMode;
  displayOrder: number;
  sizeMode: PopupSizeMode;
  width: number;
  height: number;
  widthRatio: number;
  heightRatio: number;
  minimumWidth: number;
  minimumHeight: number;
  maximumWidth: number;
  maximumHeight: number;
  showHeader: boolean;
  showCloseButton: boolean;
  showFooter: boolean;
  showDoNotShowAgain: boolean;
  questionTemplateId?: number | null;
  periodMode: string;
  repeatInterval?: number | null;
  repeatDayOfWeek?: string | null;
  repeatDayOfMonth?: number | null;
  hideDays?: number | null;
  completionRatio?: number | null;
  passingScore?: number | null;
  allowCloseBeforeComplete: boolean;
  questions: PopupQuestion[];
  content: Record<string, unknown>;
}

export type PopupTargetConditionType = 'DEPARTMENT' | 'POSITION' | 'EMPLOYEE' | 'HIRE_DATE';

export interface PopupTargetCondition {
  conditionType: PopupTargetConditionType;
  conditionOperator: '=' | '!=' | '<' | '<=' | '>' | '>=';
  value: string;
  includeChild: boolean;
}

export interface PopupTargetGroup {
  targetName: string;
  targetDescription: string;
  conditions: PopupTargetCondition[];
}

export interface AdminPopupQuestion {
  question: PopupQuestion;
  correctValues: string[];
}
export interface AdminQuestionTemplate {
  templateId: number;
  templateName: string;
  templateType: string;
}

export interface AdminPopupInfo {
  adminQuestions: AdminPopupQuestion[];
  popup: AdminPopupDetail;
  targetGroups: PopupTargetGroup[];
}
