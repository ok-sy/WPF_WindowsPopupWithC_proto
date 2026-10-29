/*
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 공지
 * - 가이드 화면 '공지' 탭에 표시한다. 추가 예정 기능·변경·삭제·완료를 개발자가 이 파일에 적어 배포한다(DB·서버 없음).
 * - 추가 방법: GUIDE_NOTICES 배열에 항목 하나를 넣는다. 정렬은 화면이 date 내림차순으로 하므로 순서는 상관없다.
 *   date는 'YYYY-MM-DD'(KST). id는 겹치지 않는 문자열. 화면은 최근 14일 안의 공지에 NEW를 붙인다.
 * - 예정(PLANNED)이 반영되면 항목을 지우지 말고 status를 DONE으로 바꾸고 doneDate를 적는다(이력 유지).
 */

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
}

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  ADDED: '추가', CHANGED: '변경', REMOVED: '삭제', PLANNED: '추가 예정', NOTICE: '안내',
};
export const NOTICE_STATUS_LABELS: Record<NoticeStatus, string> = {
  DONE: '반영 완료', IN_PROGRESS: '진행 중', PLANNED: '예정',
};

export const GUIDE_NOTICES: GuideNotice[] = [
  {
    id: '2026-10-30-preview-fallback', date: '2026-10-30', category: 'ADDED', status: 'DONE', doneDate: '2026-10-30',
    title: 'WEB/SERVER 책임 분리 — 미설정은 키 생략, 미리보기 fallback은 withPreviewFallback',
    body: ['WEB은 입력·표시·미리보기, SERVER는 업무 기본값·최종 검증·정규화를 맡습니다. 미설정 값은 키를 생략하고(null은 현재 서버 기본값 적용 대상), false·0·빈 문자열은 명시값으로 그대로 보냅니다.',
      '화면 state에는 사용자가 입력한 값만 두고, 미리보기에 넘길 때만 `withPreviewFallback(state)`로 표시용 값(창 크기·Header/Footer 표시 등)을 채웁니다. 업무 기본값(createDefaultPopup)은 신규 독립 화면 state에 넣지 않습니다.',
      '가이드의 개요 탭을 없애고 예시 탭(IS063M02Sample)을 추가했습니다.'],
    components: ['withPreviewFallback', 'pickPopupFields'],
    action: '신규 독립 화면은 state를 미설정으로 시작하고 미리보기에 withPreviewFallback을 쓰세요. 기존 RgstPop(proto)은 서버 대응 후 점진 전환합니다.',
  },
  {
    id: '2026-10-30-pick-fields', date: '2026-10-30', category: 'ADDED', status: 'DONE', doneDate: '2026-10-30',
    title: '선택 필드 추출 pickPopupFields · PopupScheduleFields 일정 전용 value',
    body: ['`pickPopupFields(source, { topLevelKeys, contentKeys, questionKeys })`로 최상위·content·각 문항에서 필요한 키만 값 그대로 뽑습니다. 준 영역만 결과에 들어가고, 키가 있으면 null·false·0·빈 문자열도 보존합니다(얕은 복사).',
      '날짜 ISO 변환·키 이름 변경·검증·저장 요청 생성은 하지 않습니다. 저장 형식은 각 업무 화면이 정하며, proto 저장 기준이 필요할 때만 `toSaveRequestPopup(popup)` 결과를 넘깁니다.',
      '`PopupScheduleFields`가 일정 전용 `value: PopupScheduleValue`를 받습니다(AdminPopupDetail 불필요, `showPeriod`로 게시 기간 입력 포함). 기존 `popup` prop도 계속 받습니다.'],
    components: ['pickPopupFields', 'PopupScheduleFields'],
    action: '필드를 손으로 골라 담던 화면은 pickPopupFields로, 일정 입력은 value prop으로 바꾸세요. 기존 popup prop 호출은 그대로 동작합니다.',
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
