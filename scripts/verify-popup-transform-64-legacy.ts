// POL-07-02 : 변환 책임 분리
// ■ 변환 분리 전(497c4c8) PopupEditorDialog의 데이터 구성 코드를 그대로 옮긴 비교 기준. 수정하지 않는다.
/* eslint-disable */
import type { AdminPopupDetail, PopupDateValue, PopupQuestion, PopupType } from '@local/domain';
import normalizePopupLink from '../zero-rule-web/main/src/features/PopupcommonComponent/normalizePopupLink';
import { popupDateMillis } from '../zero-rule-web/main/src/features/PopupcommonComponent/popupCommon';
function withDefaultAnswerMatchMode(questions: PopupQuestion[]): PopupQuestion[] {
  if (!questions.some((q) => q.questionType === 'TEXT' && !q.answerMatchMode)) return questions;
  return questions.map((q) => q.questionType === 'TEXT' && !q.answerMatchMode ? { ...q, answerMatchMode: 'EXACT' } : q);
}
function createDefaultPopup(): AdminPopupDetail {
  const startAt = new Date();
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
      // POL-01-02 : 기본값의 적용 — Header/본문/Footer 폰트 크기. 신규 등록 기본값은 "미설정(null)" — WPF가 기존 XAML 기본 크기를 쓴다(§5.8).
      // 값을 넣으면 Overlay 옵션처럼 content_options_json으로 저장되어 서버 → WPF PopupOptions까지 전달된다.
      headerFontSize: null,
      bodyFontSize: null,
      footerFontSize: null,
    },
  };
}

function toDateTimeLocal(value: PopupDateValue): string {
  const date = new Date(popupDateMillis(value));
  if (Number.isNaN(date.getTime())) return '';
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}
function toApiDate(value: string): string { return new Date(value).toISOString(); }
function contentValue(popup: AdminPopupDetail, key: string): string {
  const value = popup.content[key];
  return value == null ? '' : String(value);
}

const IMAGE_SIZE_MODES = ['ADAPTIVE', 'FIT_TO_IMAGE', 'ORIGINAL'];
function normalizeImageSizeMode(value: unknown): string {
  const mode = value == null ? '' : String(value).trim().toUpperCase();
  return IMAGE_SIZE_MODES.includes(mode) ? mode : 'ADAPTIVE';
}
/* POL-07-03 : 저장 경계 — 저장 시 팝업 유형에서 쓰는 content 키만 보낸다(WPF content DTO·관리자 미리보기 기준).
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
  // POL-06-01 : 문항·서식 — 콘텐츠 제목·설명 서식(surveyTitleBlocks·descriptionBlocks). 서버가 surveyTitle·description을 서식에서 파생한다.
  SURVEY: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks'],
  QUIZ: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks', 'videoEnabled', 'videoUrl', 'showDescription', 'showControls', 'allowFullScreen', 'allowPlaybackRateChange', 'allowSeek', 'autoPlay', 'isLoop', 'defaultVolume'],
};
function contentForType(popupType: string, content: AdminPopupDetail['content']): AdminPopupDetail['content'] {
  const keys = [...COMMON_CONTENT_KEYS, ...(CONTENT_KEYS_BY_TYPE[popupType] ?? [])];
  return Object.fromEntries(keys.filter((key) => key in content).map((key) => [key, content[key]]));
}
/* POL-02-03 : 푸터 역할 — Footer 동작 저장 정규형(서버 PopupFooterAction과 같음). 설문·퀴즈는 제출(SUBMIT) 고정이라 저장하지 않고,
 * 그 밖의 유형은 바로가기(LINK_AND_CLOSE)일 때만 동작·URL을 저장한다. 닫기(CLOSE)는 기본값이라 저장하지 않는다. */
function isSubmitPopupType(popupType: string): boolean {
  return popupType === 'SURVEY' || popupType === 'QUIZ';
}
function withNormalizedFooter(popupType: string, content: AdminPopupDetail['content']): AdminPopupDetail['content'] {
  const { footerAction, footerLinkUrl, ...rest } = content;
  if (isSubmitPopupType(popupType) || footerAction !== 'LINK_AND_CLOSE') return rest;
  return { ...rest, footerAction, footerLinkUrl };
}
function withNormalizedImageSizeMode(popup: AdminPopupDetail): AdminPopupDetail {
  if (popup.popupType !== 'IMAGE') return popup;
  // POL-04-01 : 공통 크기 입력 — 크기는 popup.width/height 한 쌍이다. 구 서버 응답의 content.width/height는 최상위 값이 없을 때만 옮기고 content에서는 뺀다.
  const { width: legacyWidth, height: legacyHeight, ...content } = popup.content;
  const legacy = (value: unknown) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : undefined);
  return { ...popup, width: popup.width ?? legacy(legacyWidth), height: popup.height ?? legacy(legacyHeight),
    sizeMode: popup.content.imageSizeMode !== 'ORIGINAL' && popup.sizeMode !== 'FULLSCREEN' ? 'FIXED' : popup.sizeMode, content: {
    ...content,
    imageSizeMode: normalizeImageSizeMode(popup.content.imageSizeMode),

  } };
}


export const legacyDefault = createDefaultPopup;
export function legacyLoad(body: { popup: AdminPopupDetail }): AdminPopupDetail {
  let result: any; const setPopup = (value: any) => { result = value; };
        setPopup(withNormalizedImageSizeMode({ ...body.popup, displayOrder: body.popup.displayOrder ?? 100,
          questions: withDefaultAnswerMatchMode(body.popup.questions ?? []) }));
  return result;
}
export function legacyTemplate(template: AdminPopupDetail, currentPopupId: string): AdminPopupDetail {
  let result: any; const setPopup = (update: any) => { result = update({ popupId: currentPopupId }); };
          setPopup((current) => withNormalizedImageSizeMode({ ...template, popupId: current.popupId, questionTemplateId: null,
            questions: withDefaultAnswerMatchMode(template.questions ?? []) }));
  return result;
}
export function legacyChangeType(previous: AdminPopupDetail, value: string): AdminPopupDetail {
  let result: any; const setPopup = (update: any) => { result = update(previous); }; const e = { target: { value } };
                const combined = e.target.value === 'VIDEO_QUIZ';
                const nextType = combined ? 'QUIZ' : e.target.value as PopupType;
                setPopup((previous) => ({ ...previous, popupType: nextType,
                  content: { ...previous.content, videoEnabled: combined },
                  // 일반 IMAGE는 width/height를 생략할 수 있다(POL-04-01 : 공통 크기 입력). 다른 유형으로 바꿔 저장할 때 "팝업 너비와 높이는 필수" 거절을 막는다.
                  width: previous.width ?? 560,
                  height: previous.height ?? 420,
                  // 동영상+퀴즈 기본 0.8, 일반 VIDEO는 입력값 유지(비우면 1.0), 동영상이 없는 유형은 저장 요청에 남지 않게 비운다.
                  completionRatio: combined ? previous.completionRatio ?? 0.8 : nextType === 'VIDEO' ? previous.completionRatio : null,
                  questions: nextType === 'QUIZ' ? withDefaultAnswerMatchMode(previous.questions) : previous.questions }));
  return result;
}
export function legacySave(popup: AdminPopupDetail): AdminPopupDetail {
  const bottomUrl = contentValue(popup, 'bottomDescriptionUrl').trim();
      const requestPopup: AdminPopupDetail = withNormalizedImageSizeMode({
        ...popup, popupId: popup.popupId.trim(), title: popup.title.trim(),
        content: withNormalizedFooter(popup.popupType, contentForType(popup.popupType, { ...popup.content,
          ...(popup.popupType === 'TEXT' ? { bottomDescriptionUrl: normalizePopupLink(bottomUrl) ?? '' } : {}),
          footerLinkUrl: normalizePopupLink(contentValue(popup, 'footerLinkUrl')) ?? '',
        })),
        displayStartAt: toApiDate(toDateTimeLocal(popup.displayStartAt)),
        displayEndAt: toApiDate(toDateTimeLocal(popup.displayEndAt)),
      });
      if (requestPopup.popupType === 'IMAGE') {
        const mode = requestPopup.content.imageSizeMode;
        if (mode !== 'FIT_TO_IMAGE') delete requestPopup.content.keepAspectRatio;
        // POL-04-01 : 공통 크기 입력 — 모든 모드에서 popup.width/height만 보낸다(content 크기는 서버가 거절).
        delete requestPopup.content.width; delete requestPopup.content.height;
      }
  return requestPopup;
}
