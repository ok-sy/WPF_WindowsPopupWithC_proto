/*
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 공지
 * - 가이드 화면 '공지' 탭에 표시한다. 추가 예정 기능·변경·삭제·완료를 개발자가 이 파일에 적어 배포한다(DB·서버 없음).
 * - 추가 방법: GUIDE_NOTICES 배열에 항목 하나를 넣는다. 정렬은 화면이 date 내림차순으로 하므로 순서는 상관없다.
 *   date는 'YYYY-MM-DD'(KST). id는 겹치지 않는 문자열. 화면은 최근 14일 안의 공지에 NEW를 붙인다.
 * - 예정(PLANNED)이 반영되면 항목을 지우지 말고 status를 DONE으로 바꾸고 doneDate를 적는다(이력 유지).
 * - props 변경·삭제 공지는 action에 영향 화면과 바꾸는 방법을 적는다. 상세 정책은 docs/design TODO 링크로 두고 여기엔 요약만 쓴다.
 * - 이 파일이 공지의 단일 출처다(게시판 DB·API를 만들지 않는다).
 */
import type { GuideTabId } from './GuideUi';

/** 공지 구분 */
export type NoticeCategory = 'ADDED' | 'CHANGED' | 'REMOVED' | 'PLANNED' | 'NOTICE';
/** 진행 상태 */
export type NoticeStatus = 'DONE' | 'IN_PROGRESS' | 'PLANNED';

export interface GuideNotice {
  id: string;
  /** 공지일(YYYY-MM-DD, KST) */
  date: string;
  category: NoticeCategory;
  status: NoticeStatus;
  title: string;
  /** 본문(문단마다 한 원소) */
  body: string[];
  /** 영향받는 컴포넌트·함수 이름(가이드 컴포넌트 탭 이름과 같게) */
  components?: string[];
  /** 사용하는 쪽(부모 화면·이식 프로젝트)이 해야 할 일. 없으면 생략 */
  action?: string;
  /** 반영일(status DONE일 때) */
  doneDate?: string;
  /** 자세한 내용이 있는 가이드 탭(공지 카드에 이동 링크 표시) */
  tab?: GuideTabId;
}

/** 최근 게시로 표시(NEW·배지)하는 기간(일). 게시일 기준이며 완료·실행 여부를 추측하지 않는다. */
export const RECENT_NOTICE_DAYS = 14;

/** 게시일(YYYY-MM-DD, KST)이 now 기준 최근 RECENT_NOTICE_DAYS일 안인지 */
export function isRecentNotice(date: string, now: Date): boolean {
  const time = new Date(`${date}T00:00:00+09:00`).getTime();
  return Number.isFinite(time) && now.getTime() - time < RECENT_NOTICE_DAYS * 24 * 60 * 60 * 1000;
}

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  ADDED: '추가', CHANGED: '변경', REMOVED: '삭제', PLANNED: '추가 예정', NOTICE: '안내',
};
export const NOTICE_STATUS_LABELS: Record<NoticeStatus, string> = {
  DONE: '반영 완료', IN_PROGRESS: '진행 중', PLANNED: '예정',
};

export const GUIDE_NOTICES: GuideNotice[] = [
  {
    id: '2026-10-30-recommended-size-loop', date: '2026-10-30', category: 'CHANGED', status: 'DONE', doneDate: '2026-10-30',
    title: 'onRecommendedSize — 권장 크기 값이 바뀔 때만 호출(무한 반복 수정)',
    body: ['`PopupPreview`(InlinePopupPreview 포함)가 인라인 콜백(`onRecommendedSize={(s) => ...}`)을 받고 그 안에서 부모 state를 바꾸면 렌더마다 다시 호출되어 무한 반복되던 문제를 고쳤습니다.',
      '이제 권장 너비·높이 값이 바뀔 때만 호출하고, 콜백은 항상 최신 함수를 씁니다. 값이 같으면 콜백만 바꿔도 다시 호출하지 않습니다.'],
    components: ['PopupPreview', 'InlinePopupPreview'],
    action: '변경할 코드는 없습니다. 콜백 교체만으로 재호출을 기대하던 코드가 있다면 권장 크기를 부모 state에 보관해 쓰세요.',
    tab: 'component',
  },
  {
    id: '2026-10-30-guide-restructure', date: '2026-10-30', category: 'CHANGED', status: 'DONE', doneDate: '2026-10-30',
    title: '가이드 화면 정리 — 시작하기 탭, 범용/proto 전용 구분',
    body: ['첫 탭으로 시작하기를 추가했습니다(가져오기·최소 사용 코드·공통/부모/서버 경계). 공지는 맨 뒤로 옮기고 최근 게시 수를 배지로 표시합니다.',
      '프로세스·변환·유틸에 범용 / proto 전용 표시를 붙였습니다. `createDefaultPopup`·`changePopupType`·`toSaveRequest`는 proto(RgstPop) 전용이며 독립 화면의 필수 처리가 아닙니다.',
      '실습 탭은 독립 필드 추출 실습을 먼저 보여 주고(추출할 키를 칩으로 고르면 실제 `pickPopupFields` 호출 코드와 결과가 바로 바뀜), proto 저장 변환 실습은 선택해서 봅니다.'],
    components: ['createDefaultPopup', 'changePopupType', 'toSaveRequest', 'withPreviewFallback', 'pickPopupFields'],
    action: '새 화면은 시작하기 탭의 최소 코드(입력한 값만 state, 미리보기는 withPreviewFallback, 저장은 pickPopupFields + 화면별 저장 경계)를 따르세요.',
    tab: 'start',
  },
  {
    id: '2026-10-30-sample-unset', date: '2026-10-30', category: 'CHANGED', status: 'DONE', doneDate: '2026-10-30',
    title: '공통 샘플 state 미설정 기준 전환 · 동영상+퀴즈 미리보기 완료 비율 0.8',
    body: ['목록 샘플·편집 샘플·IS063M02 샘플의 state가 입력한 값만 갖습니다(`newSamplePopup`은 ID·제목·TEXT만, 유형 전환 `changeSampleType`은 업무 기본값을 채우지 않음). 저장 값에는 입력하지 않은 창 크기·나중에 보기·푸터 동작 키가 없습니다.',
      '`withPreviewFallback`은 동영상+퀴즈의 완료 비율이 미설정이면 미리보기에서 0.8(80%)로 표시합니다(state·저장 값에는 넣지 않음). 일반 VIDEO는 1.0 그대로입니다.'],
    components: ['withPreviewFallback', 'usePopupQuizRule'],
    action: '샘플을 복사해 쓰던 화면은 state에 createDefaultPopup 값을 넣지 말고 미리보기에만 withPreviewFallback을 쓰세요.',
    tab: 'example',
  },
  {
    id: '2026-10-30-preview-fallback', date: '2026-10-30', category: 'ADDED', status: 'DONE', doneDate: '2026-10-30',
    title: 'WEB/SERVER 책임 분리 — 미설정은 키 생략, 미리보기 fallback은 withPreviewFallback',
    body: ['WEB은 입력·표시·미리보기, SERVER는 업무 기본값·최종 검증·정규화를 맡습니다. 미설정 값은 키를 생략하고(null은 현재 서버 기본값 적용 대상), false·0·빈 문자열은 명시값으로 그대로 보냅니다.',
      '화면 state에는 사용자가 입력한 값만 두고, 미리보기에 넘길 때만 `withPreviewFallback(state)`로 표시용 값(창 크기·Header/Footer 표시 등)을 채웁니다. 업무 기본값(createDefaultPopup)은 신규 독립 화면 state에 넣지 않습니다.',
      '가이드의 개요 탭을 없애고 예시 탭(IS063M02Sample)을 추가했습니다.'],
    components: ['withPreviewFallback', 'pickPopupFields'],
    action: '신규 독립 화면은 state를 미설정으로 시작하고 미리보기에 withPreviewFallback을 쓰세요. 기존 RgstPop(proto)은 서버 대응 후 점진 전환합니다.',
    tab: 'process',
  },
  {
    id: '2026-10-30-pick-fields', date: '2026-10-30', category: 'ADDED', status: 'DONE', doneDate: '2026-10-30',
    title: '선택 필드 추출 pickPopupFields · PopupScheduleFields 일정 전용 value',
    body: ['`pickPopupFields(source, { topLevelKeys, contentKeys, questionKeys })`로 최상위·content·각 문항에서 필요한 키만 값 그대로 뽑습니다. 준 영역만 결과에 들어가고, 키가 있으면 null·false·0·빈 문자열도 보존합니다(얕은 복사).',
      '날짜 ISO 변환·키 이름 변경·검증·저장 요청 생성은 하지 않습니다. 저장 형식은 각 업무 화면이 정하며, proto 저장 기준이 필요할 때만 `toSaveRequestPopup(popup)` 결과를 넘깁니다.',
      '`PopupScheduleFields`가 일정 전용 `value: PopupScheduleValue`를 받습니다(AdminPopupDetail 불필요, `showPeriod`로 게시 기간 입력 포함). 기존 `popup` prop도 계속 받습니다.'],
    components: ['pickPopupFields', 'PopupScheduleFields'],
    action: '필드를 손으로 골라 담던 화면은 pickPopupFields로, 일정 입력은 value prop으로 바꾸세요. 기존 popup prop 호출은 그대로 동작합니다.',
    tab: 'saveParts',
  },
  {
    id: '2026-10-29-runner', date: '2026-10-29', category: 'ADDED', status: 'DONE', doneDate: '2026-10-29',
    title: '가이드 컴포넌트 코드 실행기',
    body: ['가이드 컴포넌트 탭 오른쪽에서 입력(props JSON)을 고쳐 실행하고 출력(콜백 값)을 바로 볼 수 있습니다.'],
  },
  {
    id: '2026-10-29-guide', date: '2026-10-29', category: 'ADDED', status: 'DONE', doneDate: '2026-10-29',
    title: 'PopupcommonComponent 가이드 화면 추가',
    body: ['컴포넌트별 값·props·재사용 방법, 프로세스별 변환 흐름, 실제 변환 함수를 직접 호출하는 실습, 변경 공지를 한 화면에서 제공합니다.'],
  },
  {
    id: '2026-10-29-footer-close-label', date: '2026-10-29', category: 'CHANGED', status: 'DONE', doneDate: '2026-10-29',
    title: "Footer 동작 CLOSE 표시 이름 '닫기' → '확인'",
    body: ["footerAction=CLOSE 하단 버튼과 편집 화면 선택지의 표시 이름을 '확인'으로 바꿨습니다. 값(CLOSE)과 동작(누르면 닫힘)은 그대로입니다.",
      "보조 닫기 버튼(퀴즈 미달·영상 재생 실패 시)은 '닫기'를 유지합니다."],
    components: ['PopupPreview'],
    action: "푸터 동작 선택지를 직접 만든 화면은 CLOSE 표시를 '확인'으로 맞추세요.",
  },
  {
    id: '2026-10-29-highlight-removed', date: '2026-10-29', category: 'REMOVED', status: 'DONE', doneDate: '2026-10-29',
    title: 'TEXT 강조 문구(highlightText·showHighlight) 삭제',
    body: ['TEXT 팝업의 강조 문구 입력·스위치와 미리보기 강조 영역을 삭제했습니다. 저장 요청(toSaveRequest)에서도 두 키를 보내지 않습니다.',
      '기존 데이터에 키가 남아 있어도 WPF·미리보기는 무시합니다.'],
    components: ['PopupPreview', 'toSaveRequest', 'createDefaultPopup'],
    action: '강조 문구 입력란을 따로 둔 화면은 제거하세요.',
  },
  {
    id: '2026-10-29-header-black', date: '2026-10-29', category: 'CHANGED', status: 'DONE', doneDate: '2026-10-29',
    title: '미리보기 Header 검은 배경·흰 글자 로고',
    body: ['미리보기 Header를 WPF와 같은 검은 배경·흰 제목으로 바꾸고, 고정 로고(public/images/popup-header-logo.png)를 흰 글자 CLOVER로 교체했습니다.'],
    components: ['PopupPreview'],
    action: '이식한 프로젝트는 로고 파일도 함께 교체하세요(다른 로고를 쓰려면 같은 이름으로 교체).',
  },
  {
    id: '2026-10-29-ckeditor49', date: '2026-10-29', category: 'CHANGED', status: 'DONE', doneDate: '2026-10-29',
    title: '서식 편집기 CKEditor 5 공통 엔진 전환(ckeditor5 49.0.1)',
    body: ['PopupRichTextEditor가 커스텀 빌드(34.1.0) 대신 공통 엔진 @/components/ckeditor(ckeditor5 49.0.1 + @ckeditor/ckeditor5-react 12.0.0, licenseKey GPL)를 씁니다.',
      '서식 패널을 Esc로 닫아도 선택 범위가 유지되도록 보완했습니다. 편집기 테두리는 바깥 테두리 하나로 맞췄습니다.'],
    components: ['PopupRichTextEditor'],
    action: '이식 시 ckeditor5·@ckeditor/ckeditor5-react 12와 src/components/ckeditor/를 함께 가져가고, 다른 경로로 ckeditor5를 import하지 마세요.',
  },
  {
    id: '2026-10-29-selection-limit', date: '2026-10-29', category: 'ADDED', status: 'DONE', doneDate: '2026-10-29',
    title: 'SURVEY 복수 선택 최소·최대 선택 수',
    body: ['SURVEY의 MULTIPLE_CHOICE 문항에 minSelections·maxSelections(비우면 제한 없음)를 입력할 수 있습니다. 미리보기는 한도·최소 판정과 안내 문구를 WPF와 같이 보여 줍니다.'],
    components: ['PopupQuestionEditor', 'PopupPreview'],
  },
  {
    id: '2026-10-29-planned-ckeditor-verify', date: '2026-10-29', category: 'PLANNED', status: 'IN_PROGRESS',
    title: 'CKEditor 49 남은 검증',
    body: ['한글 IME 조합 입력, 붙여넣기 실조작, 폐쇄망 반입본 설치 확인이 남아 있습니다. 결과는 이 공지에 이어서 적습니다.'],
    components: ['PopupRichTextEditor'],
  },
];
