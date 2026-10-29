import type { AdminPopupDetail } from '@local/domain';
import popupDemoQuestions from '../popupDemoQuestions';
import { pickPopupFields, type PopupTypeSelection } from '../popupEditorTransform';
import { plainTextToBlocks } from '../popupRichText';

/*
 * 서버 없이 샘플 페이지를 확인하기 위한 편집값 목록.
 * 관리자 API 조회 응답이 아니라 공통 컴포넌트에 바로 넣는 편집값이다. [실연동] api.popupAdmin.info({ popupId }) → toEditorPopup(body.popup)으로 교체한다.
 * [옵션] 샘플을 늘리려면 createSamplePopups() 배열에 sample(...)을 추가한다(가이드 §4.5).
 * 정책: docs/design/20261030_PopupcommonComponent_WEB표시기본값_SERVER정책_책임분리_TODO.md F-1(미설정 표현 규칙)
 *  - 샘플 state는 화면이 입력했거나 샘플이 일부러 지정한 값만 갖는다(미설정 = 키 생략). createDefaultPopup()의 업무 기본값
 *    (게시 기간·표시 순서·창 크기·content 옵션 등)을 채우지 않는다. 미리보기에 넘길 때만 withPreviewFallback으로 표시용 값을 채운다.
 *  - 저장 값에 키가 없으면 서버 기본값이 적용된다(최종 기본값·검증은 서버 책임).
 */
const IMAGE_DATA = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#2563EB"/>'
  + '<text x="320" y="190" font-size="36" text-anchor="middle" fill="#fff">SAMPLE IMAGE</text></svg>');

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 샘플 화면 state
 * - 식별·유형·제목·content·문항만 항상 있고 나머지 최상위 값은 입력했을 때만 있다(미설정 = 키 생략).
 * - 미리보기 컴포넌트에는 withPreviewFallback(state)로 넘긴다. state 자체를 AdminPopupDetail로 단언하지 않는다.
 */
export type SamplePopupState = Pick<AdminPopupDetail, 'popupId' | 'popupType' | 'title' | 'content' | 'questions'>
  & Partial<Omit<AdminPopupDetail, 'popupId' | 'popupType' | 'title' | 'content' | 'questions'>>;

function sample(popupId: string, title: string, patch: Partial<SamplePopupState>, content: Record<string, unknown> = {}): SamplePopupState {
  return { popupId, popupType: 'TEXT', title, questions: [], ...patch, content };
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 신규 샘플 편집값 생성
 * - in : popupId(string) 팝업 ID · title(string) 팝업 제목
 * - out: SamplePopupState 신규 편집값(미설정 기준)
 * - 팝업 ID·제목만 담은 TEXT 편집값을 만든다. 창 크기·버튼·content 옵션은 비워 두고(키 생략) 미리보기는 표시용 fallback으로 그린다.
 */
export function newSamplePopup(popupId: string, title: string): SamplePopupState {
  return { popupId, popupType: 'TEXT', title, content: {}, questions: [] };
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 샘플 유형 전환
 * - in : previous(SamplePopupState) 현재 편집값 · selection(PopupTypeSelection) 바꿀 유형(VIDEO_QUIZ = QUIZ + videoEnabled)
 * - out: SamplePopupState 유형을 바꾼 새 편집값
 * - 공통 입력값(제목·크기·본문 등)은 유지하고 유형 표시값만 바꾼다. proto changePopupType과 달리 창 크기(560×420)·
 *   완료 비율(0.8)·주관식 비교 방식(EXACT) 같은 업무 기본값을 채우지 않는다(미설정이면 서버 기본값·검증).
 *   새 유형에서 쓰지 않는 값(영상 없는 유형의 completionRatio, 퀴즈가 아닌 유형의 passingScore, videoEnabled)은 지운다.
 */
export function changeSampleType(previous: SamplePopupState, selection: PopupTypeSelection): SamplePopupState {
  const combined = selection === 'VIDEO_QUIZ';
  const popupType = combined ? 'QUIZ' : selection;
  const { videoEnabled: _videoEnabled, ...content } = previous.content;
  const { completionRatio, passingScore, ...rest } = previous;
  return {
    ...rest, popupType,
    content: combined ? { ...content, videoEnabled: true } : content,
    ...((popupType === 'VIDEO' || combined) && completionRatio !== undefined ? { completionRatio } : {}),
    ...(popupType === 'QUIZ' && passingScore !== undefined ? { passingScore } : {}),
  };
}

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 샘플 팝업 목록 생성
 * - in : 없음
 * - out: SamplePopupState[] TEXT·IMAGE·VIDEO·SURVEY·QUIZ·영상+퀴즈 샘플 편집값 6건
 * - 서버 없이 샘플 화면에 공급할 유형별 편집값 목록을 만든다. 샘플마다 보여 주려는 값만 지정한다(나머지는 미설정).
 */
export function createSamplePopups(): SamplePopupState[] {
  const text = '서비스 점검 안내\n10월 25일(토) 02:00~06:00 점검 예정입니다.';
  return [
    sample('SAMPLE-TEXT', '시스템 점검 안내', { popupType: 'TEXT', showLater: true },
      { plainText: text, textBlocks: plainTextToBlocks(text) }),
    sample('SAMPLE-IMAGE', '이미지 공지', { popupType: 'IMAGE', width: 640, height: 480 },
      { imageUrl: IMAGE_DATA, imageTitle: '이미지 공지' }),
    sample('SAMPLE-VIDEO', '교육 영상', { popupType: 'VIDEO', width: 760, height: 560, completionRatio: 0.9 },
      { videoTitle: '교육 영상' }),
    sample('SAMPLE-SURVEY', '만족도 조사', { popupType: 'SURVEY', width: 640, height: 640, questions: popupDemoQuestions(false) },
      { surveyTitle: '만족도 조사' }),
    sample('SAMPLE-QUIZ', '보안 퀴즈', { popupType: 'QUIZ', width: 640, height: 640, passingScore: 2, questions: popupDemoQuestions(true) },
      { surveyTitle: '보안 퀴즈' }),
    sample('SAMPLE-VIDEO-QUIZ', '영상 + 퀴즈', { popupType: 'QUIZ', width: 760, height: 860, completionRatio: 0.8,
      passingScore: 1, questions: popupDemoQuestions(true).slice(0, 1) },
    { videoEnabled: true, videoTitle: '영상 + 퀴즈', surveyTitle: '영상 확인 퀴즈' }),
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
 * - in : popup(SamplePopupState) 샘플 화면 편집값(미설정 기준)
 * - out: Record<string, unknown> 화면이 입력하는 필드 중 값이 있는 것만 담은 값(pickPopupFields 결과)
 * - state에 없는 키(미설정)는 결과에도 없다. 저장 값에는 화면이 다루는 필드만 담는다.
 *   proto 저장 변환(toSaveRequest: 기간 ISO·활성·대상 그룹·유형별 content 정리)은 호출하지 않는다.
 *   [실연동] 실제 저장 API에 붙일 때 이 값을 그 API의 형식(날짜·키 이름 등)으로 바꾸는 것은 각 화면의 저장 경계에서 한다.
 */
export function toSampleScreenValues(popup: SamplePopupState): Record<string, unknown> {
  const question = popup.popupType === 'SURVEY' || popup.popupType === 'QUIZ';
  return question
    ? pickPopupFields(popup, { topLevelKeys: [...SAMPLE_TOP_LEVEL_KEYS, 'passingScore'], contentKeys: SAMPLE_CONTENT_KEYS[popup.popupType], questionKeys: SAMPLE_QUESTION_KEYS })
    : pickPopupFields(popup, { topLevelKeys: SAMPLE_TOP_LEVEL_KEYS, contentKeys: SAMPLE_CONTENT_KEYS[popup.popupType] ?? [] });
}
