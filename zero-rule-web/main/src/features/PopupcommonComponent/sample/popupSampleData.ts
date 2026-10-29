import type { AdminPopupDetail } from '@local/domain';
import popupDemoQuestions from '../popupDemoQuestions';
import { createDefaultPopup, pickPopupFields } from '../popupEditorTransform';
import { plainTextToBlocks } from '../popupRichText';

/*
 * 서버 없이 샘플 페이지를 확인하기 위한 편집값(AdminPopupDetail) 목록.
 * 관리자 API 조회 응답이 아니라 공통 컴포넌트에 바로 넣는 편집값이다. [실연동] api.popupAdmin.info({ popupId }) → toEditorPopup(body.popup)으로 교체한다.
 * [옵션] 샘플을 늘리려면 createSamplePopups() 배열에 sample(...)을 추가한다(가이드 §4.5). 날짜는 결과가 일정하도록 고정했다.
 */
const IMAGE_DATA = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#2563EB"/>'
  + '<text x="320" y="190" font-size="36" text-anchor="middle" fill="#fff">SAMPLE IMAGE</text></svg>');

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 샘플 전체 content 옵션
 * - in : 없음
 * - out: Record<string, unknown> 계약상 가능한 content 옵션 키 전체와 기본값
 * - [옵션] 샘플은 계약상 가능한 content 옵션 키를 모두 싣는다(인터페이스 명세 §6.3·§8 기본값). 저장 요청(toSaveRequest)에서는 유형별 키만 남는다.
 * createDefaultPopup()에 없는 키(위치·푸터·이미지/영상/설문 제목·URL·비율 고정·영상 사용)를 샘플에서만 보충한다(실제 등록 화면 기본값은 변경 없음).
 */
export const SAMPLE_FULL_CONTENT_OPTIONS: Record<string, unknown> = {
  popupPosition: 'CENTER', footerAction: 'CLOSE', footerLinkUrl: '',
  headerFontSize: null, bodyFontSize: null, footerFontSize: null,
  useBackgroundOverlay: true, backgroundOverlayOpacity: 0.45,
  // TEXT
  plainText: '', textBlocks: null, showPlainText: true,
  bottomDescription: '', bottomDescriptionUrl: '', showBottomDescription: false,
  // IMAGE
  imageTitle: '', imageUrl: '', description: '', showDescription: true, imageSizeMode: 'ADAPTIVE', keepAspectRatio: true,
  // VIDEO · 영상+퀴즈
  videoTitle: '', videoUrl: '', showControls: true, allowFullScreen: true, allowPlaybackRateChange: true, allowSeek: true,
  autoPlay: false, isLoop: false, defaultVolume: 0.7,
  // SURVEY · QUIZ
  surveyTitle: '', surveyTitleBlocks: null, descriptionBlocks: null, videoEnabled: false,
};

function sample(popupId: string, title: string, patch: Partial<AdminPopupDetail>, content: Record<string, unknown> = {}): AdminPopupDetail {
  const base = createDefaultPopup(new Date('2026-10-22T00:00:00+09:00'));
  return { ...base, popupId, title, ...patch, content: { ...base.content, ...SAMPLE_FULL_CONTENT_OPTIONS, ...content } };
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 신규 샘플 편집값 생성
 * - in : popupId(string) 팝업 ID · title(string) 팝업 제목
 * - out: AdminPopupDetail 신규 편집값
 * - 팝업 ID·제목을 받아 실제 등록 화면의 createDefaultPopup()에 샘플 전체 content 옵션을 더한 편집값을 만든다.
 */
export function newSamplePopup(popupId: string, title: string): AdminPopupDetail {
  const base = createDefaultPopup();
  return { ...base, popupId, title, content: { ...base.content, ...SAMPLE_FULL_CONTENT_OPTIONS } };
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 샘플 팝업 목록 생성
 * - in : 없음
 * - out: AdminPopupDetail[] TEXT·IMAGE·VIDEO·SURVEY·QUIZ·영상+퀴즈 샘플 편집값 6건
 * - 서버 없이 샘플 화면에 공급할 유형별 편집값 목록을 만든다(날짜 고정이라 결과가 매번 같다).
 */
export function createSamplePopups(): AdminPopupDetail[] {
  const text = '서비스 점검 안내\n10월 25일(토) 02:00~06:00 점검 예정입니다.';
  return [
    sample('SAMPLE-TEXT', '시스템 점검 안내', { popupType: 'TEXT', showLater: true },
      { plainText: text, textBlocks: plainTextToBlocks(text) }),
    sample('SAMPLE-IMAGE', '이미지 공지', { popupType: 'IMAGE', width: 640, height: 480 },
      { imageUrl: IMAGE_DATA, imageSizeMode: 'ADAPTIVE', imageTitle: '이미지 공지', description: '' }),
    sample('SAMPLE-VIDEO', '교육 영상', { popupType: 'VIDEO', width: 760, height: 560, completionRatio: 0.9 },
      { videoUrl: '', videoTitle: '교육 영상' }),
    sample('SAMPLE-SURVEY', '만족도 조사', { popupType: 'SURVEY', width: 640, height: 640, questions: popupDemoQuestions(false) },
      { surveyTitle: '만족도 조사', description: '' }),
    sample('SAMPLE-QUIZ', '보안 퀴즈', { popupType: 'QUIZ', width: 640, height: 640, passingScore: 2, questions: popupDemoQuestions(true) },
      { surveyTitle: '보안 퀴즈', description: '' }),
    sample('SAMPLE-VIDEO-QUIZ', '영상 + 퀴즈', { popupType: 'QUIZ', width: 760, height: 860, completionRatio: 0.8,
      passingScore: 1, questions: popupDemoQuestions(true).slice(0, 1) },
    { videoEnabled: true, videoUrl: '', videoTitle: '영상 + 퀴즈', surveyTitle: '영상 확인 퀴즈' }),
  ];
}

/* 샘플 화면(PopupSampleEditor·IS063M02Sample)이 입력하는 값만. 게시 기간·노출 일정·표시 순서·활성·대상 그룹 같은 proto 저장 값은
 * 화면에 입력이 없으므로 결과에 넣지 않는다(미리보기에 필요 없는 정책을 화면이 떠안지 않음). 입력을 추가하면 여기에도 키를 더한다. */
const SAMPLE_TOP_LEVEL_KEYS = ['popupId', 'popupType', 'title', 'width', 'height', 'showLater'] as const;
const SAMPLE_FOOTER_KEYS = ['footerAction', 'footerLinkUrl'];
const SAMPLE_CONTENT_KEYS: Record<string, string[]> = {
  TEXT: ['textBlocks', 'plainText', ...SAMPLE_FOOTER_KEYS],
  IMAGE: ['imageUrl', 'description', 'descriptionBlocks', ...SAMPLE_FOOTER_KEYS],
  VIDEO: ['videoUrl', 'description', 'descriptionBlocks', ...SAMPLE_FOOTER_KEYS],
  SURVEY: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks'],
  QUIZ: ['surveyTitle', 'surveyTitleBlocks', 'description', 'descriptionBlocks', 'videoEnabled', 'videoUrl'],
};
const SAMPLE_QUESTION_KEYS = ['questionId', 'title', 'titleBlocks', 'description', 'descriptionBlocks', 'questionType', 'optionLayout', 'isRequired',
  'isScored', 'questionScore', 'sortOrder', 'options', 'correctAnswer', 'answerMatchMode', 'minSelections', 'maxSelections'] as const;

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 샘플 화면 저장 값
 * - in : popup(AdminPopupDetail) 샘플 화면 편집값(미리보기용 전체 모양)
 * - out: Record<string, unknown> 화면이 입력하는 필드만 담은 값(pickPopupFields 결과)
 * - 미리보기용 state에는 createDefaultPopup 기본값이 함께 있지만, 저장 값에는 화면이 다루는 필드만 담는다.
 *   proto 저장 변환(toSaveRequest: 기간 ISO·활성·대상 그룹·유형별 content 정리)은 호출하지 않는다.
 *   [실연동] 실제 저장 API에 붙일 때 이 값을 그 API의 형식(날짜·키 이름 등)으로 바꾸는 것은 각 화면의 저장 경계에서 한다.
 */
export function toSampleScreenValues(popup: AdminPopupDetail): Record<string, unknown> {
  const question = popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ';
  return question
    ? pickPopupFields(popup, { topLevelKeys: [...SAMPLE_TOP_LEVEL_KEYS, 'passingScore'], contentKeys: SAMPLE_CONTENT_KEYS[popup.popupType], questionKeys: SAMPLE_QUESTION_KEYS })
    : pickPopupFields(popup, { topLevelKeys: SAMPLE_TOP_LEVEL_KEYS, contentKeys: SAMPLE_CONTENT_KEYS[popup.popupType] ?? [] });
}
