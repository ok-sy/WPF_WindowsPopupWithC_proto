/*
 * POL-08-01 : 공통 렌더러
 * ■ 미리보기 전용 fallback 합성
 * 정책: docs/design/20261030_PopupcommonComponent_WEB표시기본값_SERVER정책_책임분리_TODO.md F-1
 *  - 화면 state는 사용자가 입력한 값만 갖는다(미설정 = 키 생략). 미리보기에 넘길 때만 이 함수로 표시용 값을 채운다.
 *  - 미리보기 렌더에 실제로 필요한 최상위 표시 필드만 채운다. 게시 기간·반복·표시 순서·문항 템플릿·대상 같은 업무 값은 채우지 않는다
 *    (미리보기는 그 값을 읽지 않는다). content 표시 옵션은 값이 없으면 미리보기 컴포넌트가 WPF 기본 동작으로 그리므로 채우지 않는다.
 *  - 여기 값은 표시용이며 서버 저장 기본값과 다를 수 있다. 저장 값·pickPopupFields 결과에는 섞지 않는다(원본 state를 바꾸지 않음).
 */
import type { AdminPopupDetail } from '@local/domain';
import { POPUP_DEFAULTS } from './popupDefaults';

/* 창 크기·최소·최대·비율과 헤더·푸터 표시는 화면 기본값(popupDefaults.ts)을 읽는 시점의 값으로 채운다.
   공통코드 0101을 앱 시작 뒤에 적용해도 반영되도록 getter로 둔다(펼치기 ...PREVIEW_FALLBACK 할 때 현재 값이 들어간다). */
const liveDefaults = (group: 'window' | 'chrome') => Object.fromEntries(Object.keys(POPUP_DEFAULTS[group]).map((key) =>
  [key, { enumerable: true, get: () => (POPUP_DEFAULTS[group] as Record<string, unknown>)[key] }])) as PropertyDescriptorMap;

/** 미리보기 표시용 fallback(최상위 표시 필드만). 키를 추가할 때는 PopupPreview가 실제로 읽는 필드인지 먼저 확인한다. */
export const PREVIEW_FALLBACK: Readonly<Partial<AdminPopupDetail>> = Object.defineProperties({
  popupId: '',
  popupType: 'TEXT',
  title: '',
  hideDays: null,
  completionRatio: null,
  passingScore: null,
  questions: [],
}, { ...liveDefaults('window'), ...liveDefaults('chrome') }) as Partial<AdminPopupDetail>;

/**
 * 동영상+퀴즈 미리보기 완료 비율(파일 기본값 0.8). 미설정(키 없음·null)이면 등록 화면(changePopupType) 기본값과 같은 값으로 표시한다. 일반 VIDEO는 1.0 그대로.
 * WPF·서버의 미설정 기본값도 같다(PU001 B-7, 2026-11-03). 공통코드 0101(VQRATIO) 반영 값은 POPUP_DEFAULTS.video.videoQuizCompletionRatio를 쓴다.
 */
export const PREVIEW_VIDEO_QUIZ_COMPLETION_RATIO = POPUP_DEFAULTS.video.videoQuizCompletionRatio;

/**
 * POL-08-01 : 공통 렌더러
 * ■ 미리보기용 팝업 만들기
 * - in : state(Partial<AdminPopupDetail>) 화면이 입력한 값만 가진 state
 * - out: AdminPopupDetail 미리보기 컴포넌트(InlinePopupPreview·PopupPreviewDialog·PopupPreview)에 넘길 새 객체
 * - 표시용 fallback(PREVIEW_FALLBACK) 위에 state를 얹는다. state에 있는 값(null·false·0·빈 문자열 포함)이 항상 우선이고,
 *   content는 state 값만 쓴다. 업무 값(기간·반복 등)은 채우지 않으므로 반환값을 저장·추출에 쓰지 않는다(미리보기 전용).
 *   동영상+퀴즈(QUIZ + content.videoEnabled)는 완료 비율이 미설정(키 없음·null)이면 PREVIEW_VIDEO_QUIZ_COMPLETION_RATIO로 표시한다.
 */
export function withPreviewFallback(state: Partial<AdminPopupDetail>): AdminPopupDetail {
  // 미리보기는 업무 값(displayStartAt·periodMode 등)을 읽지 않아 채우지 않는다. 타입은 미리보기 props(AdminPopupDetail)에 맞춘다.
  const videoQuiz = state.popupType === 'QUIZ' && state.content?.videoEnabled === true;
  return {
    ...PREVIEW_FALLBACK, ...state, content: { ...(state.content ?? {}) },
    ...(videoQuiz && state.completionRatio == null ? { completionRatio: POPUP_DEFAULTS.video.videoQuizCompletionRatio } : {}),
  } as AdminPopupDetail;
}
