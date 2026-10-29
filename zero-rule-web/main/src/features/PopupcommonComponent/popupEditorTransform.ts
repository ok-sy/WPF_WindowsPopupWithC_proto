/*
 * 팝업 등록 화면의 데이터 구성·변환 함수. 화면을 그리지 않으므로 React 컴포넌트가 아니라 일반 함수다.
 *
 * 객체 구분(모두 JavaScript 객체이며 JSON 문자열 parse/stringify는 API 클라이언트 경계에서만 한다):
 *  - 조회 응답 래퍼  AdminPopupInfo { popup, targetGroups }  ← api.popupAdmin.info / 템플릿 조회
 *  - 편집값          AdminPopupDetail                         ← toEditorPopup·toEditorPopupFromTemplate·createDefaultPopup
 *  - 미리보기 popup  편집값 그대로(AdminPopupDetail)           → InlinePopupPreview·PopupPreviewDialog. 별도 변환 없음
 *  - 저장 요청 body  { popup, active, targetGroups }          ← toSaveRequest → api.popupAdmin.save
 *
 * 규칙: 입력 객체를 바꾸지 않고 새 객체를 돌려준다. React state·API 호출·toast·라우팅·입력 검증 메시지는 넣지 않는다.
 * 이 모듈은 UI 모듈(PopupEditorDialog·MUI·React)을 참조하지 않는다. 글자 서식(HTML↔Blocks) 변환은 popupRichText.ts가 맡는다.
 */
import type { AdminPopupDetail, PopupDateValue, PopupDisplayTime, PopupQuestion, PopupTargetGroup, PopupType } from '@local/domain';
import normalizePopupLink from './normalizePopupLink';
import { POPUP_MIN_WINDOW_SIZE, popupDateMillis } from './popupCommon';

/**
 * POL-07-02 : 변환 책임 분리
 * ■ 팝업 유형 선택값
 * - in : 없음(타입)
 * - out: PopupType 값 또는 'VIDEO_QUIZ'
 * - 유형 선택 목록의 값을 나타낸다. 동영상+퀴즈는 popupType QUIZ + content.videoEnabled=true로 저장한다.
 */
export type PopupTypeSelection = PopupType | 'VIDEO_QUIZ';

/**
 * POL-07-02 : 변환 책임 분리
 * POL-07-03 : 저장 경계
 * ■ 저장 요청 본문
 * - in : 없음(타입)
 * - out: popup(AdminPopupDetail) 저장할 팝업 · active(boolean) 활성 여부 · targetGroups(PopupTargetGroup[]) 대상 그룹
 * - 저장 API(api.popupAdmin.save) 인자에서 BaseRequest를 뺀 부분을 나타낸다.
 */
export interface PopupSaveRequest {
  popup: AdminPopupDetail;
  active: boolean;
  targetGroups: PopupTargetGroup[];
}

/**
 * POL-07-02 : 변환 책임 분리
 * POL-01-02 : 기본값의 적용
 * ■ 신규 등록 기본 편집값 생성
 * - in : now?(Date) 기준 시각(기본 현재)
 * - out: AdminPopupDetail 신규 편집값(TEXT 유형, 창 560×420, 최소 300×300 등)
 * - 기준 시각을 받아 노출 기간이 그때부터 한 달인 기본 편집값을 만든다.
 */
export function createDefaultPopup(now: Date = new Date()): AdminPopupDetail {
  const startAt = new Date(now);
  const endAt = new Date(startAt);
  endAt.setMonth(endAt.getMonth() + 1);
  return {
    popupId: '', popupType: 'TEXT', title: '',
    displayStartAt: startAt.toISOString(), displayEndAt: endAt.toISOString(),
    displayMode: 'SEQUENTIAL', displayOrder: 100, sizeMode: 'FIXED',
    width: 560, height: 420, widthRatio: 0.7, heightRatio: 0.75,
    minimumWidth: POPUP_MIN_WINDOW_SIZE, minimumHeight: POPUP_MIN_WINDOW_SIZE, maximumWidth: 1200, maximumHeight: 900,
    showHeader: true, showCloseButton: true, showFooter: true, showDoNotShowAgain: false, showLater: false,
    questionTemplateId: null, periodMode: 'FIXED', repeatInterval: null,
    repeatDayOfWeek: null, repeatDayOfMonth: null, displayTimes: [], hideDays: null,
    completionRatio: null, passingScore: null,
    questions: [],
    content: {
      description: '', plainText: '',
      showPlainText: true,
      bottomDescription: '', bottomDescriptionUrl: '',
      showBottomDescription: false,
      showDescription: true, imageSizeMode: 'ADAPTIVE',
      showControls: true, allowFullScreen: true,
      allowPlaybackRateChange: true, allowSeek: true, autoPlay: false, isLoop: false, defaultVolume: 0.7,
      // 공통 배경 Overlay 옵션. content_options_json에 함께 저장되어 WPF까지 전달된다.
      useBackgroundOverlay: true,
      backgroundOverlayOpacity: 0.45,
      // Header/본문/Footer 폰트 크기. 신규 등록 기본값은 "미설정(null)" — WPF가 기존 XAML 기본 크기를 쓴다.
      // 값을 넣으면 Overlay 옵션처럼 content_options_json으로 저장되어 서버 → WPF PopupOptions까지 전달된다.
      headerFontSize: null,
      bodyFontSize: null,
      footerFontSize: null,
    },
  };
}

/**
 * POL-07-02 : 변환 책임 분리
 * ■ 날짜 입력 문자열 변환
 * - in : value(PopupDateValue) 서버 일시(ISO 문자열 또는 epoch 초·밀리초)
 * - out: string datetime-local 입력 문자열(로컬 시각, 분 단위). 읽을 수 없으면 빈 문자열
 * - 서버 일시를 받아 날짜 입력란에 넣을 로컬 시각 문자열로 바꾼다.
 */
export function toDateTimeLocal(value: PopupDateValue): string {
  const date = new Date(popupDateMillis(value));
  if (Number.isNaN(date.getTime())) return '';
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}
function toApiDate(value: string): string { return new Date(value).toISOString(); }

/**
 * POL-07-02 : 변환 책임 분리
 * ■ content 값 읽기
 * - in : popup(AdminPopupDetail) 편집값 · key(string) content 키
 * - out: string 입력란 문자열. 값이 없으면 빈 문자열
 * - 편집값과 키를 받아 content 값을 입력란에 넣을 문자열로 읽는다.
 */
export function contentValue(popup: AdminPopupDetail, key: string): string {
  const value = popup.content[key];
  return value == null ? '' : String(value);
}

/**
 * POL-02-03 : 푸터 역할
 * ■ 제출형 유형 판별
 * - in : popupType(string) 팝업 유형
 * - out: boolean 설문·퀴즈면 true
 * - 팝업 유형을 받아 Footer가 제출(SUBMIT) 고정인 유형인지 판별한다.
 */
export function isSubmitPopupType(popupType: string): boolean {
  return popupType === 'SURVEY' || popupType === 'QUIZ';
}

/**
 * POL-06-01 : 문항·서식
 * ■ 주관식 정답 비교 방식 기본값 채우기
 * - in : questions(PopupQuestion[]) 문항 목록
 * - out: PopupQuestion[] 비교 방식이 채워진 문항 목록(바꿀 문항이 없으면 입력 배열 그대로)
 * - 문항 목록을 받아 주관식 문항의 비어 있는 정답 비교 방식을 실제 값 'EXACT'로 채운다.
 * 서버(PopupQuestionRules)는 QUIZ 주관식에 answerMatchMode를 요구하므로 화면 표시(?? 'EXACT')만으로는 저장이 거절된다.
 * 서버 응답·문항 템플릿·SURVEY→QUIZ 전환처럼 값이 null로 들어오는 경로에서 사용한다.
 */
export function withDefaultAnswerMatchMode(questions: PopupQuestion[]): PopupQuestion[] {
  if (!questions.some((q) => q.questionType === 'TEXT' && !q.answerMatchMode)) return questions;
  return questions.map((q) => q.questionType === 'TEXT' && !q.answerMatchMode ? { ...q, answerMatchMode: 'EXACT' } : q);
}

/* IMAGE 크기 모드는 ADAPTIVE / FIT_TO_IMAGE / ORIGINAL 세 값만 쓴다.
 * 과거 값 FIXED와 빈 값은 불러오기·저장 시 ADAPTIVE로 바꿔 다시 저장되지 않게 한다. */
const IMAGE_SIZE_MODES = ['ADAPTIVE', 'FIT_TO_IMAGE', 'ORIGINAL'];
/**
 * POL-04-01 : 공통 크기 입력
 * ■ 이미지 크기 모드 정규화
 * - in : value(unknown) 저장·입력된 크기 모드
 * - out: string 'ADAPTIVE' | 'FIT_TO_IMAGE' | 'ORIGINAL'
 * - 크기 모드 값을 받아 대문자로 맞추고, 허용 값이 아니면 ADAPTIVE로 바꾼다.
 */
export function normalizeImageSizeMode(value: unknown): string {
  const mode = value == null ? '' : String(value).trim().toUpperCase();
  return IMAGE_SIZE_MODES.includes(mode) ? mode : 'ADAPTIVE';
}
function withNormalizedImageSizeMode(popup: AdminPopupDetail): AdminPopupDetail {
  if (popup.popupType !== 'IMAGE') return popup;
  // IMAGE 크기는 popup.width/height 한 쌍이다. 구 서버 응답의 content.width/height는 최상위 값이 없을 때만 옮기고 content에서는 뺀다.
  const { width: legacyWidth, height: legacyHeight, ...content } = popup.content;
  const legacy = (value: unknown) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : undefined);
  return { ...popup, width: popup.width ?? legacy(legacyWidth), height: popup.height ?? legacy(legacyHeight),
    sizeMode: popup.content.imageSizeMode !== 'ORIGINAL' && popup.sizeMode !== 'FULLSCREEN' ? 'FIXED' : popup.sizeMode,
    content: { ...content, imageSizeMode: normalizeImageSizeMode(popup.content.imageSizeMode) } };
}

/* 저장 시 팝업 유형에서 쓰는 content 키만 보낸다(WPF content DTO·관리자 미리보기 기준).
 * 편집 중에는 유형을 바꿔도 입력값이 남도록 모든 키를 유지하고, 저장 요청에서만 걸러 다른 유형의 키가
 * CONTENT_OPTIONS에 쌓이지 않게 한다. 새 content 옵션을 추가하면 이 목록에도 넣어야 저장된다. */
const COMMON_CONTENT_KEYS = ['useBackgroundOverlay', 'backgroundOverlayOpacity', 'popupPosition',
  'headerFontSize', 'bodyFontSize', 'footerFontSize', 'footerAction', 'footerLinkUrl'];
const CONTENT_KEYS_BY_TYPE: Record<string, string[]> = {
  TEXT: ['plainText', 'textBlocks', 'showPlainText', 'bottomDescription', 'bottomDescriptionUrl', 'showBottomDescription'],
  IMAGE: ['imageTitle', 'imageUrl', 'description', 'showDescription', 'imageSizeMode', 'keepAspectRatio'],
  VIDEO: ['videoTitle', 'videoUrl', 'description', 'showDescription', 'showControls', 'allowFullScreen',
    'allowPlaybackRateChange', 'allowSeek', 'autoPlay', 'isLoop', 'defaultVolume'],
  // 콘텐츠 제목·설명 서식(surveyTitleBlocks·descriptionBlocks). 서버가 surveyTitle·description을 서식에서 파생한다.
  SURVEY: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks'],
  QUIZ: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks', 'videoEnabled', 'videoUrl', 'showDescription', 'showControls', 'allowFullScreen', 'allowPlaybackRateChange', 'allowSeek', 'autoPlay', 'isLoop', 'defaultVolume'],
};
function contentForType(popupType: string, content: AdminPopupDetail['content']): AdminPopupDetail['content'] {
  const keys = [...COMMON_CONTENT_KEYS, ...(CONTENT_KEYS_BY_TYPE[popupType] ?? [])];
  return Object.fromEntries(keys.filter((key) => key in content).map((key) => [key, content[key]]));
}
/* Footer 동작 저장 정규형(서버 PopupFooterAction과 같음). 설문·퀴즈는 제출(SUBMIT) 고정이라 저장하지 않고,
 * 그 밖의 유형은 바로가기(LINK_AND_CLOSE)일 때만 동작·URL을 저장한다. 닫기(CLOSE)는 기본값이라 저장하지 않는다. */
function withNormalizedFooter(popupType: string, content: AdminPopupDetail['content']): AdminPopupDetail['content'] {
  const { footerAction, footerLinkUrl, ...rest } = content;
  if (isSubmitPopupType(popupType) || footerAction !== 'LINK_AND_CLOSE') return rest;
  return { ...rest, footerAction, footerLinkUrl };
}

/**
 * POL-07-01 : 부모의 데이터 소유
 * ■ 조회 응답 → 편집값 변환
 * - in : loaded(AdminPopupDetail) 조회 응답의 popup
 * - out: AdminPopupDetail 편집값(새 객체)
 * - 조회 응답의 popup을 받아 표시 순서 기본값, 주관식 정답 비교 방식, IMAGE 크기 모드·구 크기 필드를 정리한 편집값을 만든다.
 */
export function toEditorPopup(loaded: AdminPopupDetail): AdminPopupDetail {
  return withNormalizedImageSizeMode({ ...loaded, displayOrder: loaded.displayOrder ?? 100,
    questions: withDefaultAnswerMatchMode(loaded.questions ?? []) });
}

/**
 * POL-07-01 : 부모의 데이터 소유
 * ■ 템플릿 → 편집값 변환
 * - in : template(AdminPopupDetail) 템플릿 popup · currentPopupId(string) 현재 입력한 팝업 ID
 * - out: AdminPopupDetail 편집값(새 객체)
 * - 템플릿 popup을 받아 현재 팝업 ID를 유지하고 문항 템플릿 연결을 끊은 편집값을 만든다(문항 템플릿 연결은 저장 시 새로 판단).
 */
export function toEditorPopupFromTemplate(template: AdminPopupDetail, currentPopupId: string): AdminPopupDetail {
  return withNormalizedImageSizeMode({ ...template, popupId: currentPopupId, questionTemplateId: null,
    questions: withDefaultAnswerMatchMode(template.questions ?? []) });
}

/**
 * POL-07-02 : 변환 책임 분리
 * ■ 팝업 유형 변경
 * - in : previous(AdminPopupDetail) 현재 편집값 · selection(PopupTypeSelection) 새 유형 선택값
 * - out: AdminPopupDetail 유형이 바뀐 편집값(새 객체)
 * - 현재 편집값과 새 유형을 받아 입력값은 유지하고 유형별 필수 값(창 크기·완료 비율·정답 비교 방식)만 맞춘다.
 */
export function changePopupType(previous: AdminPopupDetail, selection: PopupTypeSelection): AdminPopupDetail {
  const combined = selection === 'VIDEO_QUIZ';
  const nextType: PopupType = combined ? 'QUIZ' : selection;
  return { ...previous, popupType: nextType,
    content: { ...previous.content, videoEnabled: combined },
    // 일반 IMAGE는 width/height를 생략할 수 있다. 다른 유형으로 바꿔 저장할 때 "팝업 너비와 높이는 필수" 거절을 막는다.
    width: previous.width ?? 560,
    height: previous.height ?? 420,
    // 동영상+퀴즈 기본 0.8, 일반 VIDEO는 입력값 유지(비우면 1.0), 동영상이 없는 유형은 저장 요청에 남지 않게 비운다.
    completionRatio: combined ? previous.completionRatio ?? 0.8 : nextType === 'VIDEO' ? previous.completionRatio : null,
    questions: nextType === 'QUIZ' ? withDefaultAnswerMatchMode(previous.questions) : previous.questions };
}

/**
 * POL-07-02 : 변환 책임 분리
 * POL-07-03 : 저장 경계
 * ■ 편집값 → 저장 요청 popup 변환
 * - in : popup(AdminPopupDetail) 편집값
 * - out: AdminPopupDetail 저장 요청에 넣을 popup(새 객체)
 * - 편집값을 받아 ID·제목 공백 제거, 유형별 content 키만 남김, URL 정규화, Footer 정규형, 날짜 ISO 변환,
 * IMAGE 크기 정리를 한다. 입력 검증(필수값·범위)은 하지 않으므로 호출 전에 부모가 검사한다.
 */
export function toSaveRequestPopup(popup: AdminPopupDetail): AdminPopupDetail {
  const bottomUrl = contentValue(popup, 'bottomDescriptionUrl').trim();
  const requestPopup = withNormalizedImageSizeMode({
    ...popup, popupId: popup.popupId.trim(), title: popup.title.trim(),
    content: withNormalizedFooter(popup.popupType, contentForType(popup.popupType, { ...popup.content,
      ...(popup.popupType === 'TEXT' ? { bottomDescriptionUrl: normalizePopupLink(bottomUrl) ?? '' } : {}),
      footerLinkUrl: normalizePopupLink(contentValue(popup, 'footerLinkUrl')) ?? '',
    })),
    displayStartAt: toApiDate(toDateTimeLocal(popup.displayStartAt)),
    displayEndAt: toApiDate(toDateTimeLocal(popup.displayEndAt)),
  });
  if (requestPopup.popupType !== 'IMAGE') return requestPopup;
  // IMAGE는 모든 모드에서 popup.width/height만 보낸다(content 크기는 서버가 거절). 비율 고정은 FIT_TO_IMAGE에서만 보낸다.
  const { keepAspectRatio, width: _width, height: _height, ...content } = requestPopup.content;
  return { ...requestPopup,
    content: requestPopup.content.imageSizeMode === 'FIT_TO_IMAGE' && 'keepAspectRatio' in requestPopup.content
      ? { ...content, keepAspectRatio } : content };
}

/**
 * POL-07-02 : 변환 책임 분리
 * POL-07-03 : 저장 경계
 * ■ 저장 요청 본문 생성
 * - in : popup(AdminPopupDetail) 편집값 · active(boolean) 활성 여부 · targetGroups(PopupTargetGroup[]) 대상 그룹
 * - out: PopupSaveRequest 저장 API 요청 body
 * - 편집값·활성 여부·대상 그룹을 받아 저장 API(api.popupAdmin.save)에 보낼 요청 본문을 만든다.
 */
export function toSaveRequest(popup: AdminPopupDetail, active: boolean, targetGroups: PopupTargetGroup[]): PopupSaveRequest {
  return { popup: toSaveRequestPopup(popup), active, targetGroups };
}

/**
 * POL-11-03 : 시간 경계
 * ■ 요일 선택지
 * - in : 없음
 * - out: { value, label }[] 월(1)~일(7) 요일 목록
 * - 노출 일정 입력·요약에 쓰는 요일 목록이다. 요일은 ISO 번호(1=월). 노출 판단은 서버(KST)가 하며 여기서는 요약 문구만 만든다.
 */
export const WEEKDAYS: { value: number; label: string }[] = ['월', '화', '수', '목', '금', '토', '일'].map((label, index) => ({ value: index + 1, label }));

/**
 * POL-11-03 : 시간 경계
 * ■ 요일 문자열 해석
 * - in : value(string | null | undefined) 쉼표로 구분한 요일 번호(예: '1,3,5')
 * - out: number[] 중복 없이 정렬한 요일 번호(예: [1, 3, 5])
 * - 요일 문자열을 받아 요일 번호 배열로 바꾼다. 비었거나 형식 밖 값은 무시한다(서버가 저장 시 검증).
 */
export function parseWeekdays(value: string | null | undefined): number[] {
  return [...new Set(String(value ?? '').split(',').map((part) => Number(part.trim())).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))].sort();
}

/**
 * POL-11-02 : 반복의 의미
 * ■ 노출 일정 요약 문구
 * - in : periodMode(string) 'FIXED' | 'SCHEDULE' · repeatDayOfWeek(string) 요일 번호 문자열 · times(PopupDisplayTime[] | string) 노출 시간대
 * - out: string 요약 문구. FIXED = '상시', SCHEDULE = '월·수·금 · 09:00~12:00, 22:00~02:00'(요일 없음 = 매일, 시간대 없음 = 종일)
 * - 노출 일정 값을 받아 목록·미리보기에 보일 요약 문구를 만든다.
 */
export function describeSchedule(periodMode: string | null | undefined, repeatDayOfWeek: string | null | undefined,
  times: PopupDisplayTime[] | string | null | undefined): string {
  if (periodMode !== 'SCHEDULE') return '상시';
  const days = parseWeekdays(repeatDayOfWeek);
  const dayText = days.length === 0 || days.length === 7 ? '매일' : days.map((day) => WEEKDAYS[day - 1].label).join('·');
  const timeText = typeof times === 'string' ? times : (times ?? []).map((time) => `${time.startTime}~${time.endTime}`).join(', ');
  return `${dayText} · ${timeText || '종일'}`;
}
