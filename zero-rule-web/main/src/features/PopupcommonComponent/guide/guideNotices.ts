/*
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 공지
 * - 가이드 화면 '공지' 탭에 표시한다. 추가 예정 기능·변경·삭제·완료를 개발자가 이 파일에 적어 배포한다(DB·서버 없음).
 * - 추가 방법: GUIDE_NOTICES 배열에 항목 하나를 넣는다. 정렬은 화면이 date 내림차순으로 하므로 순서는 상관없다.
 *   date는 'YYYY-MM-DD'(KST). id는 겹치지 않는 문자열. 화면은 최근 14일 안의 공지에 NEW를 붙인다.
 * - 예정(PLANNED)이 반영되면 항목을 지우지 말고 status를 DONE으로 바꾸고 doneDate를 적는다(이력 유지).
 * - props 변경·삭제 공지는 action에 영향 화면과 바꾸는 방법을 적는다. 상세 정책은 docs/design TODO 링크로 두고 여기엔 요약만 쓴다.
 * - 이 파일이 공지의 단일 출처다(게시판 DB·API를 만들지 않는다).
 * - 공지 대상: 컴포넌트·함수의 동작이나 사용 흐름(프로세스)이 바뀐 것만 적는다(예: 편집기 엔진 전환, 버튼 표시 이름 변경, 미리보기 Header 변경, 기능 추가·삭제).
 *   가이드 화면 자체의 변경, 정책·설계 문서 정리, 샘플 내부 변경, 검증 예정 같은 작업 상태는 적지 않는다(변경 이력·TODO 문서에 둔다).
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
    title: 'onRecommendedSize — 크기가 바뀔 때만 호출',
    body: ['`PopupPreview`·`InlinePopupPreview`의 `onRecommendedSize`가 계속 반복 호출되던 문제를 고쳤습니다.',
      '이제 권장 창 크기가 바뀔 때만 호출합니다.'],
    components: ['PopupPreview', 'InlinePopupPreview'],
    action: '바꿀 코드는 없습니다.',
    tab: 'component',
  },
  {
    id: '2026-10-30-preview-fallback', date: '2026-10-30', category: 'ADDED', status: 'DONE', doneDate: '2026-10-30',
    title: '미리보기용 기본값 채우기 withPreviewFallback 추가',
    body: ['`withPreviewFallback(state)`는 미리보기에 필요한 기본값만 채워서 돌려줍니다.',
      '입력한 값(state)은 변경하지 않습니다.',
      '동영상+퀴즈의 완료 비율을 비워 두면 미리보기에서 80%로 보여 줍니다.'],
    components: ['withPreviewFallback', 'InlinePopupPreview', 'PopupPreviewDialog', 'PopupPreview'],
    action: '미리보기에 넘길 때 createDefaultPopup()과 합치던 화면은 withPreviewFallback(state)로 바꾸세요. 기존 팝업 등록 화면은 바꿀 것이 없습니다.',
    tab: 'process',
  },
  {
    id: '2026-10-30-pick-fields', date: '2026-10-30', category: 'ADDED', status: 'DONE', doneDate: '2026-10-30',
    title: '필요한 항목만 가져오기 pickPopupFields · PopupScheduleFields value 추가',
    body: ['`pickPopupFields(source, { topLevelKeys, contentKeys, questionKeys })`로 필요한 항목만 가져올 수 있습니다.',
      '입력하지 않은 항목은 결과에 없고, 입력한 값은 그대로 가져옵니다.',
      '`PopupScheduleFields`는 일정 값만 담은 `value`를 받습니다. 예전 이름 `popup`도 그대로 동작합니다.'],
    components: ['pickPopupFields', 'PopupScheduleFields'],
    action: '저장할 항목을 직접 골라 담던 코드는 pickPopupFields로 바꿀 수 있습니다.',
    tab: 'saveParts',
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
];
