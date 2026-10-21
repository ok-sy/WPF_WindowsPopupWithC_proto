/*
 * [TODO64] 팝업 등록 화면의 데이터 구성·변환 함수. 화면을 그리지 않으므로 React 컴포넌트가 아니라 일반 함수다.
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
import type { AdminPopupDetail, PopupDateValue, PopupQuestion, PopupTargetGroup, PopupType } from '@local/domain';
import normalizePopupLink from './normalizePopupLink';
import { popupDateMillis } from './popupCommon';

/** 팝업 유형 선택값. 동영상+퀴즈는 popupType QUIZ + content.videoEnabled=true로 저장한다. */
export type PopupTypeSelection = PopupType | 'VIDEO_QUIZ';

/** 저장 API 요청 body(api.popupAdmin.save의 인자에서 BaseRequest를 뺀 부분). */
export interface PopupSaveRequest {
  popup: AdminPopupDetail;
  active: boolean;
  targetGroups: PopupTargetGroup[];
}

/** 신규 등록 기본 편집값. 노출 기간은 지금부터 한 달이다. */
export function createDefaultPopup(now: Date = new Date()): AdminPopupDetail {
  const startAt = new Date(now);
  const endAt = new Date(startAt);
  endAt.setMonth(endAt.getMonth() + 1);
  return {
    popupId: '', popupType: 'TEXT', title: '',
    displayStartAt: startAt.toISOString(), displayEndAt: endAt.toISOString(),
    displayMode: 'SEQUENTIAL', displayOrder: 100, sizeMode: 'FIXED',
    width: 560, height: 420, widthRatio: 0.7, heightRatio: 0.75,
    minimumWidth: 480, minimumHeight: 320, maximumWidth: 1200, maximumHeight: 900,
    showHeader: true, showCloseButton: true, showFooter: true, showDoNotShowAgain: false, showLater: false,
    questionTemplateId: null, periodMode: 'FIXED', repeatInterval: null,
    repeatDayOfWeek: null, repeatDayOfMonth: null, hideDays: null,
    completionRatio: null, passingScore: null,
    questions: [],
    content: {
      description: '', plainText: '',
      showPlainText: true,
      highlightText: '', showHighlight: false,
      bottomDescription: '', bottomDescriptionUrl: '',
      showBottomDescription: false,
      showDescription: true, imageSizeMode: 'ADAPTIVE',
      showControls: true, allowFullScreen: true,
      allowPlaybackRateChange: true, allowSeek: true, autoPlay: false, isLoop: false, defaultVolume: 0.7,
      // 공통 배경 Overlay 옵션. content_options_json에 함께 저장되어 WPF까지 전달된다.
      useBackgroundOverlay: true,
      backgroundOverlayOpacity: 0.45,
      // [설계 14 §5] Header/본문/Footer 폰트 크기. 신규 등록 기본값은 "미설정(null)" — WPF가 기존 XAML 기본 크기를 쓴다(§5.8).
      // 값을 넣으면 Overlay 옵션처럼 content_options_json으로 저장되어 서버 → WPF PopupOptions까지 전달된다.
      headerFontSize: null,
      bodyFontSize: null,
      footerFontSize: null,
    },
  };
}

/** 날짜 값을 datetime-local 입력 문자열(로컬 시각, 분 단위)로 바꾼다. 읽을 수 없으면 빈 문자열. */
export function toDateTimeLocal(value: PopupDateValue): string {
  const date = new Date(popupDateMillis(value));
  if (Number.isNaN(date.getTime())) return '';
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}
function toApiDate(value: string): string { return new Date(value).toISOString(); }

/** content 값을 입력란 문자열로 읽는다. 없으면 빈 문자열. */
export function contentValue(popup: AdminPopupDetail, key: string): string {
  const value = popup.content[key];
  return value == null ? '' : String(value);
}

/** [설계 30] 설문·퀴즈는 Footer가 제출(SUBMIT) 고정이다. */
export function isSubmitPopupType(popupType: string): boolean {
  return popupType === 'SURVEY' || popupType === 'QUIZ';
}

/**
 * 주관식 문항의 비어 있는 정답 비교 방식을 실제 값 'EXACT'로 채운다.
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
export function normalizeImageSizeMode(value: unknown): string {
  const mode = value == null ? '' : String(value).trim().toUpperCase();
  return IMAGE_SIZE_MODES.includes(mode) ? mode : 'ADAPTIVE';
}
function withNormalizedImageSizeMode(popup: AdminPopupDetail): AdminPopupDetail {
  if (popup.popupType !== 'IMAGE') return popup;
  // [TODO58] 크기는 popup.width/height 한 쌍이다. 구 서버 응답의 content.width/height는 최상위 값이 없을 때만 옮기고 content에서는 뺀다.
  const { width: legacyWidth, height: legacyHeight, ...content } = popup.content;
  const legacy = (value: unknown) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : undefined);
  return { ...popup, width: popup.width ?? legacy(legacyWidth), height: popup.height ?? legacy(legacyHeight),
    sizeMode: popup.content.imageSizeMode !== 'ORIGINAL' && popup.sizeMode !== 'FULLSCREEN' ? 'FIXED' : popup.sizeMode,
    content: { ...content, imageSizeMode: normalizeImageSizeMode(popup.content.imageSizeMode) } };
}

/* [설계 18 L-3] 저장 시 팝업 유형에서 쓰는 content 키만 보낸다(WPF content DTO·관리자 미리보기 기준).
 * 편집 중에는 유형을 바꿔도 입력값이 남도록 모든 키를 유지하고, 저장 요청에서만 걸러 다른 유형의 키가
 * CONTENT_OPTIONS에 쌓이지 않게 한다. 새 content 옵션을 추가하면 이 목록에도 넣어야 저장된다. */
const COMMON_CONTENT_KEYS = ['useBackgroundOverlay', 'backgroundOverlayOpacity', 'popupPosition',
  'headerFontSize', 'bodyFontSize', 'footerFontSize', 'footerAction', 'footerLinkUrl'];
const CONTENT_KEYS_BY_TYPE: Record<string, string[]> = {
  TEXT: ['plainText', 'textBlocks', 'showPlainText', 'highlightText',
    'showHighlight', 'bottomDescription', 'bottomDescriptionUrl', 'showBottomDescription'],
  IMAGE: ['imageTitle', 'imageUrl', 'description', 'showDescription', 'imageSizeMode', 'keepAspectRatio'],
  VIDEO: ['videoTitle', 'videoUrl', 'description', 'showDescription', 'showControls', 'allowFullScreen',
    'allowPlaybackRateChange', 'allowSeek', 'autoPlay', 'isLoop', 'defaultVolume'],
  // [TODO55] 콘텐츠 제목·설명 서식(surveyTitleBlocks·descriptionBlocks). 서버가 surveyTitle·description을 서식에서 파생한다.
  SURVEY: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks'],
  QUIZ: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks', 'videoEnabled', 'videoUrl', 'showDescription', 'showControls', 'allowFullScreen', 'allowPlaybackRateChange', 'allowSeek', 'autoPlay', 'isLoop', 'defaultVolume'],
};
function contentForType(popupType: string, content: AdminPopupDetail['content']): AdminPopupDetail['content'] {
  const keys = [...COMMON_CONTENT_KEYS, ...(CONTENT_KEYS_BY_TYPE[popupType] ?? [])];
  return Object.fromEntries(keys.filter((key) => key in content).map((key) => [key, content[key]]));
}
/* [설계 30] Footer 동작 저장 정규형(서버 PopupFooterAction과 같음). 설문·퀴즈는 제출(SUBMIT) 고정이라 저장하지 않고,
 * 그 밖의 유형은 바로가기(LINK_AND_CLOSE)일 때만 동작·URL을 저장한다. 닫기(CLOSE)는 기본값이라 저장하지 않는다. */
function withNormalizedFooter(popupType: string, content: AdminPopupDetail['content']): AdminPopupDetail['content'] {
  const { footerAction, footerLinkUrl, ...rest } = content;
  if (isSubmitPopupType(popupType) || footerAction !== 'LINK_AND_CLOSE') return rest;
  return { ...rest, footerAction, footerLinkUrl };
}

/** 조회 응답의 popup → 편집값. 표시 순서 기본값, 주관식 정답 비교 방식, IMAGE 크기 모드·구 크기 필드를 정리한다. */
export function toEditorPopup(loaded: AdminPopupDetail): AdminPopupDetail {
  return withNormalizedImageSizeMode({ ...loaded, displayOrder: loaded.displayOrder ?? 100,
    questions: withDefaultAnswerMatchMode(loaded.questions ?? []) });
}

/** 템플릿 popup → 편집값. 현재 입력한 팝업 ID를 유지하고 문항 템플릿 연결은 끊는다(저장 시 새로 판단). */
export function toEditorPopupFromTemplate(template: AdminPopupDetail, currentPopupId: string): AdminPopupDetail {
  return withNormalizedImageSizeMode({ ...template, popupId: currentPopupId, questionTemplateId: null,
    questions: withDefaultAnswerMatchMode(template.questions ?? []) });
}

/** 팝업 유형 변경. 입력값은 유지하고 유형별 필수 값(창 크기·완료 비율·정답 비교 방식)만 맞춘다. */
export function changePopupType(previous: AdminPopupDetail, selection: PopupTypeSelection): AdminPopupDetail {
  const combined = selection === 'VIDEO_QUIZ';
  const nextType: PopupType = combined ? 'QUIZ' : selection;
  return { ...previous, popupType: nextType,
    content: { ...previous.content, videoEnabled: combined },
    // 일반 IMAGE는 width/height를 생략할 수 있다(TODO58). 다른 유형으로 바꿔 저장할 때 "팝업 너비와 높이는 필수" 거절을 막는다.
    width: previous.width ?? 560,
    height: previous.height ?? 420,
    // 동영상+퀴즈 기본 0.8, 일반 VIDEO는 입력값 유지(비우면 1.0), 동영상이 없는 유형은 저장 요청에 남지 않게 비운다.
    completionRatio: combined ? previous.completionRatio ?? 0.8 : nextType === 'VIDEO' ? previous.completionRatio : null,
    questions: nextType === 'QUIZ' ? withDefaultAnswerMatchMode(previous.questions) : previous.questions };
}

/**
 * 편집값 → 저장 요청 popup. ID·제목 공백 제거, 유형별 content 키만 남김, URL 정규화, Footer 정규형, 날짜 ISO 변환,
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
  // [TODO58] 모든 모드에서 popup.width/height만 보낸다(content 크기는 서버가 거절). 비율 고정은 FIT_TO_IMAGE에서만 보낸다.
  const { keepAspectRatio, width: _width, height: _height, ...content } = requestPopup.content;
  return { ...requestPopup,
    content: requestPopup.content.imageSizeMode === 'FIT_TO_IMAGE' && 'keepAspectRatio' in requestPopup.content
      ? { ...content, keepAspectRatio } : content };
}

/** 편집값·활성 여부·대상 그룹 → 저장 API 요청 body. */
export function toSaveRequest(popup: AdminPopupDetail, active: boolean, targetGroups: PopupTargetGroup[]): PopupSaveRequest {
  return { popup: toSaveRequestPopup(popup), active, targetGroups };
}
