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
    id: '2026-11-24-font-id-removed', date: '2026-11-24', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-24',
    title: '서식 글꼴 저장값 — 기본 4종도 글꼴 이름',
    body: ['기본 4종 글꼴을 MALGUN_GOTHIC 같은 ID 대신 Windows 글꼴 이름(Malgun Gothic·Gulim·Dotum·Batang)으로 저장합니다. 서버·WPF의 ID 목록은 없앴고, 기존 저장값은 DB 스크립트로 이름으로 바꿉니다.',
      '편집기 선택지·표시는 그대로입니다. registerPopupRichFonts에 기본 4종과 같은 family를 넘기면 중복으로 빠집니다.'],
    components: ['PopupRichTextEditor', 'PopupRichTextMenu', 'registerPopupRichFonts', 'richFonts'],
    action: 'runs[].font 값을 직접 비교하는 코드가 있으면 ID 대신 이름으로 바꿉니다. 그 밖에는 바꿀 코드가 없습니다.',
    tab: 'function',
  },
  {
    id: '2026-11-24-preview-reference-screen', date: '2026-11-24', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-24',
    title: '실제 크기 미리보기 — 기준 화면(해상도·배율) 선택',
    body: ['PopupPreviewDialog 상단에서 기준 화면 해상도(13종)와 Windows 배율(100·125·150·175%)을 고릅니다. 팝업 크기·위치는 그 화면의 작업 영역(해상도 ÷ 배율, 작업 표시줄 40 제외)으로 WPF와 같이 계산합니다.',
      '선택한 해상도 크기의 가상 데스크톱을 실제 크기로 그리고, 브라우저보다 크면 줄이지 않고 스크롤합니다. 내 모니터와 같은 해상도·배율에는 * 표시가 붙습니다. 화면 상한은 FIXED·AUTO·IMAGE 모두 작업 영역의 90%(RATIO 100%)입니다.',
      'recommendedSize는 더 이상 쓰지 않지만 넘겨도 오류는 없습니다.'],
    components: ['PopupPreviewDialog', 'PopupPreview'],
    action: '바꿀 코드는 없습니다. recommendedSize는 지워도 됩니다.',
  },
  {
    id: '2026-11-24-video-description-blocks', date: '2026-11-24', category: 'ADDED', status: 'DONE', doneDate: '2026-11-24',
    title: '동영상 설명 서식(descriptionBlocks)·고정 안내 문구',
    body: ['동영상 설명도 설문·퀴즈처럼 서식(content.descriptionBlocks)으로 저장합니다. 서버가 description을 서식에서 만들고 WPF는 문단 정렬·서식으로 표시합니다.',
      '동영상·동영상+퀴즈는 미리보기·저장 값에 고정 안내 문구를 오른쪽 정렬 문단으로 붙입니다(applyVideoFixedDescription). 불러올 때는 떼어(stripVideoFixedDescription) 에디터에 사용자 입력만 보입니다.',
      '미리보기 영상 아래 컨트롤 모형 줄(▶ 00:00 / 00:00 · 1.0× · 전체화면)은 없앴습니다.'],
    components: ['PopupPreview', 'PopupRichTextEditor', 'applyVideoFixedDescription', 'stripVideoFixedDescription', 'VIDEO_FIXED_DESCRIPTION'],
    action: '동영상 설명 입력을 PopupRichTextEditor로 바꾸고(descriptionBlocks·description 함께 갱신), 미리보기·저장 값에 applyVideoFixedDescription, 불러오기에 stripVideoFixedDescription을 씁니다. 서버는 VIDEO descriptionBlocks를 받도록 반영돼 있어야 저장됩니다.',
    tab: 'function',
  },
  {
    id: '2026-11-24-image-adaptive-fit', date: '2026-11-24', category: 'ADDED', status: 'DONE', doneDate: '2026-11-24',
    title: '이미지 창 우선(ADAPTIVE) — 이미지에 맞춘 창 크기',
    body: ['ADAPTIVE는 가로·세로가 창 크기라 이미지 칸 비율이 이미지와 다르면 위아래·좌우 띠가 보입니다. adaptiveWindowForImage가 가로에서 띠가 생기지 않는 세로를 계산합니다.',
      '등록 화면은 "이미지에 맞춰 세로 자동"(세로 잠금)과 "이미지 크기에 맞추기"를 둡니다. 신규는 자동을 켜고, 수정·불러오기는 저장 값을 바꾸지 않도록 끈 채 시작합니다. 가로가 원본보다 크면 여백 없는 최대 가로를 안내합니다.'],
    components: ['adaptiveWindowForImage', 'useNaturalImageSize'],
    action: '이미지 크기 입력 화면에서 쓰려면 useNaturalImageSize로 원본 크기를 읽고 adaptiveWindowForImage 결과의 window.height를 세로에 넣습니다.',
    tab: 'function',
  },
  {
    id: '2026-11-24-schedule-row-align', date: '2026-11-24', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-24',
    title: '노출 시간대 입력 줄 정렬',
    body: ['종료 시각 칸 아래 빈 안내 자리가 있어 시작 칸과 줄이 맞지 않던 문제를 고쳤습니다. "다음 날까지(자정 초과)"는 자정을 넘길 때만 같은 줄에 표시합니다.'],
    components: ['PopupScheduleFields'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-19-rich-custom-font', date: '2026-11-19', category: 'ADDED', status: 'DONE', doneDate: '2026-11-19',
    title: '서식 본문 회사 글꼴 등록(registerPopupRichFonts)',
    body: ['기본 4가지 글꼴(맑은 고딕·굴림·돋움·바탕) 외에 회사 글꼴을 서식 선택지에 추가할 수 있습니다. 저장 값은 Windows 글꼴 패밀리 이름이며 서버를 거쳐 WPF에 그대로 전달됩니다.',
      'family는 WPF가 인식하는 Windows 패밀리 이름(저장값), css는 웹에서 그릴 CSS 글꼴(전역 @font-face 별칭)입니다. 굵게는 기존처럼 bold로 저장하고, 400/700 굵기와 웹 서체 연결은 전역 CSS가 담당합니다.',
      '등록하지 않은 이름이 저장된 본문은 선택지에 "이름 (미등록)"으로 보여 다시 편집해도 지워지지 않습니다. WPF는 PC에 없는 글꼴을 기본 글꼴로 표시합니다.',
      "예: registerPopupRichFonts([{ family: '회사 Text', css: \"'Company Text', sans-serif\", label: '회사 본문' }])"],
    components: ['PopupRichTextEditor', 'PopupRichTextMenu', 'PopupRichBlocks', 'registerPopupRichFonts', 'richFonts', 'isRichFontName'],
    action: '회사 글꼴을 쓰려면 앱 시작 시(라우터·Provider 초기화 등) registerPopupRichFonts를 한 번 호출합니다. 서버가 같은 이름 규칙을 받도록 반영돼 있어야 저장됩니다(구버전 서버는 새 이름을 거부). 쓰지 않으면 바꿀 코드는 없습니다.',
    tab: 'function',
  },
  {
    id: '2026-11-18-video-quiz-scroll-oscillation', date: '2026-11-18', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-18',
    title: '동영상+퀴즈 미리보기 스크롤바 깜빡임 수정',
    body: ['동영상+퀴즈 미리보기의 내용 높이가 미리보기 높이와 거의 같을 때 세로 스크롤바가 계속 생겼다 없어지던 문제를 고쳤습니다.',
      '스크롤바 때문에 영역 너비가 조금 바뀌는 경우에는 영상 높이를 유지합니다(WPF와 같은 규칙). 창 크기를 바꾸는 등 큰 너비 변화는 그대로 다시 계산합니다.'],
    components: ['InlinePopupPreview', 'PopupPreviewDialog', 'PopupPreview'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-18-later-button-size', date: '2026-11-18', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-18',
    title: '미리보기 푸터: "나중에 보기" 보조 버튼 모양, 버튼 높이 34, 푸터 높이 64',
    body: ['미리보기의 "나중에 보기"는 글자만 있던 작은 버튼(약 93 × 32)에서 WPF와 같은 보조 버튼(최소 너비 118, 밝은 회색 면과 테두리)으로 바뀌었습니다. 설문·퀴즈 미달 뒤 보이는 보조 "닫기"도 같습니다.',
      '"나중에 보기"·"확인"·"바로가기"·"제출" 버튼 높이는 모두 34, 푸터 높이는 64(버튼 위아래 15)입니다(WPF 실제 팝업도 같음). 너비와 누르는 동작은 그대로입니다.', '이미지 팝업 권장 창 크기 계산의 푸터 높이도 80에서 64로 바뀌었습니다.'],
    components: ['PopupPreview', 'PopupPreviewDialog', 'InlinePopupPreview'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-18-rich-editor-label-format-toggle', date: '2026-11-18', category: 'ADDED', status: 'DONE', doneDate: '2026-11-18',
    title: 'PopupRichTextEditor 라벨·서식 버튼 켜고 끄기(hideLabel·hideFormatButton)',
    body: ['hideLabel을 넘기면 입력칸 위 라벨 글자를 숨깁니다. 라벨은 화면 낭독기용 이름으로 계속 씁니다.', 'hideFormatButton을 넘기면 "서식" 버튼을 숨깁니다. 둘 다 넘기면 라벨 줄이 없어지고 입력칸만 남습니다.',
      '서식은 우클릭·키보드로 여는 서식 패널과 상단 툴바(켜져 있으면)로 계속 지정합니다. 넘기지 않으면 기존 화면과 같습니다.',
      'PopupQuestionEditor의 문항 제목 편집기와 샘플·등록 화면의 설명 편집기는 둘 다 숨김으로 적용했습니다. 문항 제목의 접근 이름은 "N번 문항 제목(필수)"입니다.'],
    components: ['PopupRichTextEditor', 'PopupQuestionEditor'],
    action: '툴바·라벨·서식 버튼을 모두 끄면 서식 지정 방법이 우클릭뿐이라 눈에 띄지 않으므로 화면에 안내를 둡니다.',
  },
  {
    id: '2026-11-18-preview-placeholder-off', date: '2026-11-18', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-18',
    title: '미리보기 예시 표시 기본 OFF·동영상+퀴즈 설명 한 번 표시·문항 자동 번호 제거',
    body: ['InlinePopupPreview·PopupPreviewDialog·PopupPreview는 값이 없는 팝업 제목·영상 제목·설명·이미지 자리에 예시 문구를 표시하지 않습니다. 인라인과 실제 크기 미리보기가 같은 기준입니다.',
      '영상을 첨부하기 전에도 동영상·동영상+퀴즈의 영상 영역은 첨부 후와 같은 크기의 검정 영역과 재생 아이콘으로 자리를 유지합니다. 첨부해도 배치가 바뀌지 않으며 "영상 재생 영역" 안내 문구만 숨깁니다.',
      '동영상+퀴즈의 설명은 퀴즈 머리말에 한 번만 표시합니다(서식 설명 우선, 빈 설명은 숨김). 설문·퀴즈 문항 제목 앞의 01·02 자동 번호는 표시하지 않습니다.'],
    components: ['InlinePopupPreview', 'PopupPreviewDialog', 'PopupPreview'],
    action: '빈 자리 예시가 필요한 가이드·샘플 화면은 showPlaceholders를 넘깁니다. PopupPreview의 hidePlaceholders는 더 이상 쓰지 않습니다(false를 넘기면 showPlaceholders와 같음).',
  },
  {
    id: '2026-11-17-preview-wpf-window-parity', date: '2026-11-17', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-17',
    title: '미리보기 창 여백·확인 버튼·설문 머리말을 WPF와 같게 정렬',
    body: ['TEXT·SURVEY·QUIZ 미리보기도 IMAGE처럼 창 크기 안에 WPF 그림자 여백 24px를 두고 흰 판(창 - 48)과 WPF 그림자를 그립니다. 영상 창·전체 화면은 여백·그림자가 없습니다. 실제 크기 모달은 창이 화면 가장자리에 바로 붙습니다.',
      '확인 버튼은 WPF와 같은 진한 남색(#111827)·흰 글자입니다. 설문·퀴즈 푸터 위 구분선을 없앴고, 설명이 비어도 한 줄 자리를 두는 등 머리말 간격을 WPF와 맞췄습니다.'],
    components: ['PopupPreview', 'PopupPreviewDialog'],
    action: '바꿀 코드는 없습니다. 미리보기를 감싼 화면에서 그림자 여백을 따로 더하고 있었다면 빼야 합니다.',
  },
  {
    id: '2026-11-17-area-default-font-size', date: '2026-11-17', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-17',
    title: '편집기·미리보기 영역별 기본 글자 크기 명시',
    body: ['크기를 지정하지 않은 글자는 화면 테마·Dialog의 상속 크기가 아니라 실제 팝업(WPF) 기본값으로 표시합니다. 헤더 17, TEXT 본문 15, IMAGE·VIDEO 설명 14, 푸터 14, 설문 문항 제목 16·설명 13·선택지 12입니다.',
      'PopupRichTextEditor 편집 영역도 같은 기본값을 씁니다(TEXT 본문 15, 설명 14, 문항 제목 16, 선택지 12). baseFontSize(선택)로 바꿀 수 있고 데이터에 크기를 저장하지 않습니다.',
      'headerFontSize·bodyFontSize·footerFontSize는 각 영역에만 적용됩니다. bodyFontSize만 주면 헤더 17·푸터 14는 그대로입니다.'],
    components: ['PopupRichTextEditor', 'PopupPreview', 'PopupPreviewDialog'],
    action: '바꿀 코드는 없습니다. 기본값은 popupCommon의 POPUP_DEFAULT_FONT_SIZES에 있습니다.',
  },
  {
    id: '2026-11-17-option-size-32-12', date: '2026-11-17', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-17',
    title: '설문·퀴즈 선택지 기본 크기 32px·12px',
    body: ['편집기의 선택지 입력칸(일반·서식)은 한 줄 높이 32px, 기본 글자 12px입니다. 정답·삭제 칸도 32px에 맞춥니다. 문항 제목·주관식 정답 입력은 그대로입니다.',
      '미리보기 선택지도 한 줄 높이 32px이고 글자는 본문 - 2(bodyFontSize 미지정 시 12px)입니다. OX 문항도 같은 크기입니다. bodyFontSize를 주면 문항 제목은 본문 + 4, 설명은 본문 + 1로 WPF와 같습니다.',
      'PopupRichTextEditor에 optionSize(선택)를 추가했습니다.'],
    components: ['PopupQuestionEditor', 'PopupRichTextEditor', 'PopupPreview'],
    action: '바꿀 코드는 없습니다. 저장 형식은 그대로입니다.',
  },
  {
    id: '2026-11-17-question-title-always-rich', date: '2026-11-17', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-17',
    title: '설문 문항 제목도 서식 편집기로 입력',
    body: ['문항 제목은 설문·퀴즈와 richQuestionText 값에 관계없이 항상 서식 편집기(compact)로 입력합니다. richQuestionText는 선택지 입력 방식(일반 입력 / 서식 편집기)만 정합니다.',
      '서식 없이 title만 저장된 기존 문항은 서식 없는 문단으로 열리고, 열기만 하면 저장값을 바꾸지 않습니다. 편집하면 title과 titleBlocks를 함께 저장합니다.'],
    components: ['PopupQuestionEditor'],
    action: '바꿀 코드는 없습니다. 저장 형식(title·titleBlocks)은 그대로입니다.',
  },
  {
    id: '2026-11-11-survey-option-300-byte', date: '2026-11-11', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-11',
    title: '설문 선택지도 UTF-8 300 Byte 입력 제한·저장 오류 사유 표시',
    body: ['설문 선택지도 퀴즈 선택지와 같은 DB 컬럼(VARCHAR2(300 BYTE))이라 같은 300 Byte 기준으로 입력을 막고 validatePopupQuestions가 저장 전에 확인합니다. 문항 제목(CLOB)은 제한하지 않습니다.',
      '관리자 팝업 API는 입력 검증 오류를 HTTP 400으로 응답하고 msgCn에 사유(예: "현재 301 Byte")를 담습니다. 공통 오류 변환이 이 문구를 오류 메시지로 쓰므로 handleError가 사유를 그대로 표시합니다.'],
    components: ['PopupQuestionEditor', 'PopupRichTextEditor', 'validatePopupQuestions'],
    action: '바꿀 코드는 없습니다. 폐쇄망은 sub/domain/src/error.ts의 HTTP 오류 본문(msgCn) 처리 블록을 함께 반영해야 사유가 표시됩니다.',
  },
  {
    id: '2026-11-10-quiz-option-300-byte', date: '2026-11-10', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-10',
    title: '퀴즈 선택지 UTF-8 300 Byte 입력 제한',
    body: ['퀴즈 선택지는 UTF-8 기준 300 Byte(한글 약 100자, 영문 300자)까지만 입력됩니다. 키보드·한글 조합·붙여넣기 모두 같은 기준이며 넘는 입력은 반영하지 않고 안내 문구를 띄웁니다(잘라 넣지 않음).',
      '이미 300 Byte를 넘은 기존 선택지는 그대로 보여 주고 현재 Byte를 안내합니다. 줄이는 편집만 받으며 validatePopupQuestions가 저장을 막습니다. 퀴즈 문항 제목·설문 선택지는 제한하지 않습니다.',
      'PopupRichTextEditor에 maxPlainBytes(선택)를 추가했습니다. richQuestionText=true인 퀴즈 선택지 서식 편집기도 같은 300 Byte 기준입니다.'],
    components: ['PopupQuestionEditor', 'PopupRichTextEditor', 'validatePopupQuestions'],
    action: '바꿀 코드는 없습니다. 저장 전 validatePopupQuestions 오류 문구를 그대로 안내하면 됩니다.',
  },
  {
    id: '2026-11-10-quiz-title-rich-option-number', date: '2026-11-10', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-10',
    title: '퀴즈 문항 제목 서식 편집기 통일·선택지 자동 번호 제거',
    body: ['퀴즈 문항 제목은 OX형·선다형 모두 서식 편집기(compact)로 입력합니다. 설문 문항 제목은 기존처럼 일반 입력칸이며 richQuestionText=true일 때만 서식 편집기입니다.',
      '선택지 일반 입력칸 앞의 자동 번호(1, 2, …)를 표시하지 않습니다. 문항 카드의 「N번 문항」 표시와 입력칸 접근성 이름(N번 문항 선택지 M)은 그대로입니다.'],
    components: ['PopupQuestionEditor'],
    action: '바꿀 코드는 없습니다. 저장 형식(title·titleBlocks, 선택지 text·optionId)은 그대로입니다.',
  },
  {
    id: '2026-11-09-quiz-participation-threshold', date: '2026-11-09', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-09',
    title: '참여형 퀴즈 기준 개수 입력·퀴즈 유형 코드 저장',
    body: ['참여형 퀴즈도 기준 개수(1~문항 수)를 입력합니다. 참여형은 정답 개수와 관계없이 제출하면 완료되고, 기준 개수는 통계용 합격 여부(passed = 정답 수 ≥ 기준)에만 씁니다. 만점형·컷트라인형은 기존처럼 합격해야 제출됩니다.',
      '퀴즈 유형은 공통코드 0090 값으로 popup.quizTypeCode에 저장합니다(00 참여형·01 만점형·02 컷트라인형, QUIZ가 아니면 저장하지 않음). 다시 열면 코드로 유형을 복원하므로 기준이 문항 수와 같은 컷트라인형도 컷트라인형으로 남습니다. 코드가 없는 기존 데이터는 통과 점수로 추정합니다.',
      '미리보기는 참여형이면 기준 미달이어도 완료 안내(정답 N/M개)를 보여 주고 다시 풀기 상태로 가지 않습니다.'],
    components: ['PopupQuizRuleFields', 'PopupPreview'],
    action: '저장 값에 usePopupQuizRule의 effective.quizTypeCode를 passingScore와 함께 넣습니다(pickPopupFields topLevelKeys에 quizTypeCode 추가).',
  },
  {
    id: '2026-11-09-todo73-question-editor-props', date: '2026-11-09', category: 'ADDED', status: 'DONE', doneDate: '2026-11-09',
    title: '문항 편집기 richQuestionText·maxQuestions 추가',
    body: ['PopupQuestionEditor에 richQuestionText(기본 false)와 maxQuestions(기본 30)를 추가했습니다. richQuestionText를 true로 주면 문항 제목·선택지를 서식 편집기로 입력합니다. maxQuestions로 최대 문항 수를 바꿉니다.',
      'validatePopupQuestions는 네 번째 인자로 같은 최대 문항 수를 받습니다(생략하면 30).'],
    components: ['PopupQuestionEditor', 'validatePopupQuestions'],
    action: '기본값이 기존 동작과 같아 바꿀 코드는 없습니다. maxQuestions를 바꾸면 저장 전 validatePopupQuestions에도 같은 값을 넘기세요.',
  },
  {
    id: '2026-11-09-todo73-plain-question-text', date: '2026-11-09', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-09',
    title: '설문·퀴즈 문항 제목·선택지 일반 텍스트 입력',
    body: ['OX 외 문항의 제목과 선택지 문구는 서식 편집기 대신 일반 입력칸(여러 줄)으로 입력합니다. 퀴즈 OX 문항 제목과 O·X 정답 선택은 그대로입니다.',
      '기존 서식 문항은 일반 문자열을 먼저 보여 주고, 문자열이 없으면 서식의 글자를 보여 줍니다. 입력칸에서 고치면 titleBlocks·textBlocks를 비웁니다(null).'],
    components: ['PopupQuestionEditor'],
    action: '바꿀 코드는 없습니다. 저장 형식(title·text, 서식 블록)은 그대로입니다.',
  },
  {
    id: '2026-11-09-todo73-question-max', date: '2026-11-09', category: 'ADDED', status: 'DONE', doneDate: '2026-11-09',
    title: '설문·퀴즈 최대 30문항',
    body: ['문항 개수를 「문항 N/30」으로 보여 주고 30개가 되면 문항 추가 버튼을 막습니다. 템플릿·기존 자료로 30개를 넘게 들어오면 자르지 않고 사유를 보여 주며, validatePopupQuestions가 저장을 막습니다.'],
    components: ['PopupQuestionEditor', 'validatePopupQuestions'],
    action: '바꿀 코드는 없습니다. 상한 값은 QUESTION_MAX로 가져올 수 있습니다. 서버·WPF 제한은 별도로 정합니다.',
  },
  {
    id: '2026-11-09-todo73-inline-size-notice', date: '2026-11-09', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-09',
    title: '인라인 미리보기 크기 안내 문구',
    body: ['우측 인라인 미리보기 제목과 「실제 크기로 보기」 버튼 사이에 「실제 팝업 크기와 다를 수 있습니다.」를 작게 표시합니다. 폭이 좁으면 줄바꿈됩니다. 실제 크기 모달에는 표시하지 않습니다.'],
    components: ['InlinePopupPreview'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-06-todo69-editor-density', date: '2026-11-06', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-06',
    title: '설문·퀴즈 문항 편집기 입력 밀도 조정',
    body: ['문항 제목·선택지 입력칸과 Select 높이를 줄이고, 짧은 Select는 한 행에 묶어 폭이 부족하면 줄바꿈합니다.',
      '선택지는 번호·입력칸·서식·삭제를 한 줄에 둡니다. 편집기 OX 칸은 높이 44입니다. 미리보기·WPF OX 크기와 저장 형식은 바뀌지 않습니다.'],
    components: ['PopupQuestionEditor', 'PopupRichTextEditor'],
    action: '바꿀 코드는 없습니다. PopupRichTextEditor에 선택 prop inlineLabel이 추가되었습니다.',
  },
  {
    id: '2026-11-05-todo73-editor-fields', date: '2026-11-05', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-05',
    title: '설문·퀴즈 콘텐츠 제목·문항 설명 입력 제거, TEXT 편집기 툴바 숨김',
    body: ['설문·퀴즈 편집기에서 콘텐츠 제목과 문항 설명 입력을 뺐습니다. 이미 저장된 값은 지우지 않고 그대로 표시합니다.',
      'TEXT 본문 편집기는 hideToolbar로 상단 툴바를 숨깁니다. 서식은 우클릭 패널로 지정합니다.'],
    components: ['PopupQuestionEditor', 'PopupRichTextEditor'],
    action: '설문·퀴즈 등록 화면에서는 surveyTitle·surveyTitleBlocks 입력을 만들지 않습니다.',
  },
  {
    id: '2026-11-05-ox-design', date: '2026-11-05', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-05',
    title: 'OX 문항 표시 개선, 미리보기 모서리 정리',
    body: ['OX 문항은 편집기에서 정답 버튼으로 고르고, 미리보기·WPF에서 O·X를 크게 표시합니다. 미리보기 창 모서리는 WPF와 같은 6px이며 흰색이 비치지 않습니다.'],
    components: ['PopupQuestionEditor', 'PopupPreview', 'PopupPreviewDialog'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-05-remove-example-questions', date: '2026-11-05', category: 'REMOVED', status: 'DONE', doneDate: '2026-11-05',
    title: '미리보기 예제 문항 보기 삭제',
    body: ['설문·퀴즈 미리보기의 「예제 문항 보기」 버튼을 삭제했습니다. 미리보기는 입력한 문항만 보여 줍니다.'],
    components: ['PopupPreview', 'InlinePopupPreview'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-05-todo73-common-code', date: '2026-11-05', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-05',
    title: '답안 유형·퀴즈 유형 공통코드 연결',
    body: ['퀴즈 답안 유형은 공통코드 0089(OX형·선다형), 퀴즈 유형은 0090(참여형·만점형·컷트라인형)으로 고릅니다. 퀴즈 문항은 단일 객관식만 만들고, OX형은 O·X를 채우는 프리셋입니다. 참여형은 항상 통과, 컷트라인형은 미달이면 통과하지 못합니다(passed). 코드값은 저장하지 않고 기존 questionType·options·passingScore로 변환합니다.',
      '설문은 응답 유형(객관식·주관식)·레이아웃·응답 수(단일·복수, 개수)로 입력합니다. 통과/실패 제출 유형은 참여형으로 대체했습니다.'],
    components: ['PopupQuestionEditor', 'PopupQuizRuleFields'],
    action: "loadPopupQuestionCodes(api.clCode.search) 결과를 answerTypeOptions·options prop으로 넘깁니다. rule 값 'PASS_FAIL'은 더 쓰지 않습니다.",
  },
  {
    id: '2026-11-05-ox-answer-cells', date: '2026-11-05', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-05',
    title: 'OX 문항을 미리보기·실제 팝업에서 큰 O·X 칸으로 표시',
    body: ['OX 문항의 미리보기와 실제 팝업은 같은 크기의 큰 O·X 칸 2개가 폭을 나눠 표시합니다. 편집기의 정답 칸은 높이를 낮게 두고 가로만 나누며 칸 전체 클릭이나 화살표 키로 바꾸고 정답은 하나입니다.', '저장 값은 기존과 같은 단일 선택 O·X 선택지와 isCorrect입니다. 선다형 입력과 응답 버튼은 바뀌지 않습니다.'],
    components: ['PopupQuestionEditor', 'PopupPreview'],
    action: '바꿀 코드는 없습니다.',
  },
  {
    id: '2026-11-05-dialog-no-placeholder', date: '2026-11-05', category: 'CHANGED', status: 'DONE', doneDate: '2026-11-05',
    title: '실제 크기 미리보기에서 입력 안내 문구 제거',
    body: ['PopupPreviewDialog는 값이 없는 팝업 제목·영상 제목·설명·이미지 자리에 안내 문구를 표시하지 않습니다. 실제 WPF 팝업처럼 비워 둡니다.', 'InlinePopupPreview는 입력 안내를 위해 기존 문구를 유지합니다.'],
    components: ['PopupPreviewDialog', 'PopupPreview'],
    action: 'PopupPreview를 직접 쓰는 화면에서 같은 동작이 필요하면 hidePlaceholders를 넘깁니다.',
  },
  {
    id: '2026-11-04-hide-toolbar', date: '2026-11-04', category: 'ADDED', status: 'DONE', doneDate: '2026-11-04',
    title: 'PopupRichTextEditor 상단 툴바 켜고 끄기(hideToolbar)',
    body: ['hideToolbar를 넘기면 본문 높이는 그대로 두고 상단 툴바만 숨깁니다. 값을 바꿔도 입력 내용과 선택 범위가 유지되고, 서식은 우클릭이나 서식 버튼으로 지정합니다.', '넘기지 않으면 기존 화면과 같습니다.'],
    components: ['PopupRichTextEditor'],
    action: '툴바를 숨길 화면에서만 hideToolbar를 넘깁니다. 켜고 끄는 버튼은 그 화면에서 만듭니다.',
  },
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
