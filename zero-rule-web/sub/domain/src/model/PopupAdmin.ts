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
  /** POL-06-01 : 문항·서식 — 선택지 표시 문구 서식(TEXT textBlocks와 같은 문단·구간 배열). 있으면 서버가 text를 여기서 파생한다. */
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
  /** POL-06-01 : 문항·서식 — 문항 제목·설명 서식. 있으면 서버가 title·description을 여기서 파생한다. */
  titleBlocks?: unknown[] | null;
  descriptionBlocks?: unknown[] | null;
  /** POL-06-02 : 선택·제출 — SURVEY 복수 선택 최소·최대 선택 수. null·생략 = 제한 없음. QUIZ는 정답 수가 한도라 쓰지 않는다. */
  minSelections?: number | null;
  maxSelections?: number | null;
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
  /** POL-11-03 : 시간 경계 — SCHEDULE 요일(ISO 번호 '1,3,5', 1=월). null = 매일. */
  repeatDayOfWeek?: string | null;
  /** POL-11-03 : 시간 경계 — SCHEDULE 시간대 요약('09:00~12:00, 22:00~02:00'). null = 하루 종일. */
  displayTimesText?: string | null;
}

/**
 * POL-11-03 : 시간 경계
 * ■ 게시 기간 안 노출 시간대
 * - in : 없음(타입)
 * - out: startTime(string) 시작 HH:mm · endTime(string) 종료 HH:mm
 * - KST 기준. 시작 포함·종료 미포함, 종료 < 시작이면 자정 초과(요일은 시작 기준).
 */
export interface PopupDisplayTime {
  startTime: string;
  endTime: string;
}

/**
 * POL-07-01 : 부모의 데이터 소유
 * POL-01-01 : 공통 옵션의 위치
 * ■ 관리자 팝업 상세(편집값)
 * - in : 없음(타입)
 * - out: 공통 창·노출 설정, questions(PopupQuestion[]) 문항, content(Record) 유형별 콘텐츠
 * - WPF 출력과 관리자 편집·CSS 미리보기가 함께 사용하는 전체 팝업 정보다.
 */
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
   * POL-04-01 : 공통 크기 입력
   * IMAGE도 이 한 쌍을 쓴다(content.width/height 없음). ADAPTIVE·ORIGINAL은 팝업 창 전체 크기,
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
  /** POL-02-03 : 푸터 역할 — Footer "나중에 보기" 버튼 표시. 이전 저장 데이터·응답에 없으면 false로 본다. */
  showLater?: boolean;
  questionTemplateId?: number | null;
  /** POL-11-03 : 시간 경계 — FIXED = 게시 기간 내 상시, SCHEDULE = 게시 기간 안 요일·시간대 지정. */
  periodMode: string;
  repeatInterval?: number | null;
  /** POL-11-03 : 시간 경계 — SCHEDULE 노출 요일(ISO 번호 '1,3,5', 1=월). 비우면 매일. */
  repeatDayOfWeek?: string | null;
  repeatDayOfMonth?: number | null;
  /** POL-11-03 : 시간 경계 — SCHEDULE 노출 시간대(개수 제한 없음). 비우면 하루 종일. */
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

/**
 * POL-07-01 : 부모의 데이터 소유
 * ■ 관리자 팝업 조회 응답 래퍼
 * - in : 없음(타입)
 * - out: popup(AdminPopupDetail) 팝업 상세 · targetGroups(PopupTargetGroup[]) 대상 그룹
 * - api.popupAdmin.info 응답이며 편집 화면에서 toEditorPopup 등으로 편집값을 만든다.
 */
export interface AdminPopupInfo {
  popup: AdminPopupDetail;
  targetGroups: PopupTargetGroup[];
}
