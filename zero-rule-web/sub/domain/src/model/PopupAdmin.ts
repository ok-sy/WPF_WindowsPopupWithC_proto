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
  /** [TODO55] 선택지 표시 문구 서식(TEXT textBlocks와 같은 문단·구간 배열). 있으면 서버가 text를 여기서 파생한다. */
  textBlocks?: unknown[] | null;
}

export interface PopupQuestion {
  questionId: number;
  title: string;
  description?: string | null;
  questionType: string;
  optionLayout?: 'VERTICAL' | 'HORIZONTAL';
  isRequired: boolean;
  isScored: boolean;
  questionScore?: number | null;
  sortOrder: number;
  options: PopupOption[];
  correctAnswer?: string | null;
  answerMatchMode?: 'EXACT' | 'CONTAINS' | null;
  /** [TODO55] 문항 제목·설명 서식. 있으면 서버가 title·description을 여기서 파생한다. */
  titleBlocks?: unknown[] | null;
  descriptionBlocks?: unknown[] | null;
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
  /** [TODO52-1] SCHEDULE 요일(ISO 번호 '1,3,5', 1=월). null = 매일. */
  repeatDayOfWeek?: string | null;
  /** [TODO52-1] SCHEDULE 시간대 요약('09:00~12:00, 22:00~02:00'). null = 하루 종일. */
  displayTimesText?: string | null;
}

/** [TODO52-1] 게시 기간 안 노출 시간대(KST, HH:mm). 시작 포함·종료 미포함, 종료 < 시작이면 자정 초과(요일은 시작 기준). */
export interface PopupDisplayTime {
  startTime: string;
  endTime: string;
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
  /**
   * [TODO58] IMAGE도 이 한 쌍을 쓴다(content.width/height 없음). ADAPTIVE·ORIGINAL은 팝업 창 전체 크기,
   * FIT_TO_IMAGE는 이미지 콘텐츠 영역 크기(헤더·푸터·제목·설명은 더해서 창 계산). 일반 IMAGE는 축별로 생략할 수 있다.
   */
  width?: number;
  height?: number;
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
  /** [TODO52-2] Footer "나중에 보기" 버튼 표시. 이전 저장 데이터·응답에 없으면 false로 본다. */
  showLater?: boolean;
  questionTemplateId?: number | null;
  /** [TODO52-1] FIXED = 게시 기간 내 상시, SCHEDULE = 게시 기간 안 요일·시간대 지정. */
  periodMode: string;
  repeatInterval?: number | null;
  /** [TODO52-1] SCHEDULE 노출 요일(ISO 번호 '1,3,5', 1=월). 비우면 매일. */
  repeatDayOfWeek?: string | null;
  repeatDayOfMonth?: number | null;
  /** [TODO52-1] SCHEDULE 노출 시간대(개수 제한 없음). 비우면 하루 종일. */
  displayTimes?: PopupDisplayTime[];
  hideDays?: number | null;
  completionRatio?: number | null;
  passingScore?: number | null;
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

/** 정답은 question.options[].isCorrect / correctAnswer로 전달된다. */
export interface AdminPopupQuestion {
  question: PopupQuestion;
}
export interface AdminQuestionTemplate {
  templateId: number;
  templateName: string;
  templateType: string;
}

export interface AdminPopupInfo {
  popup: AdminPopupDetail;
  targetGroups: PopupTargetGroup[];
}
