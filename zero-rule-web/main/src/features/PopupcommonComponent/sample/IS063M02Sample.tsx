import { NavigateNext } from '@mui/icons-material';
import {
  Box, Breadcrumbs, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Link, Menu, MenuItem, Select, Stack, Switch,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  InlinePopupPreview, PopupPreviewDialog, PopupQuestionEditor, PopupQuizRuleFields, usePopupQuizRule,
  richBlocksOrNull, PopupRichTextEditor, adaptiveWindowForImage, imageSizeMode,
  useNaturalImageSize, applyVideoFixedDescription, stripVideoFixedDescription,
  popupMaximumSize, PopupNumberField, loadPopupDefaultCodes, popupSizeInputMin,
  isSubmitPopupType, pickPopupFields, withPreviewFallback, plainTextToBlocks, readTextBlocks,
  type Size, type PopupCodeSearch, type PopupTypeSelection,
} from '@/features/PopupcommonComponent';
import {
  changeSampleType, createSamplePopups, newSamplePopup, toSampleScreenValues, type SamplePopupState,
} from './popupSampleData';

/*
 * 복원 퍼블리싱 IS063M02(컨텐츠 등록)에 공통 팝업 기능을 연결한 샘플. 원본은 같은 폴더 IS063M02.tsx(대조용, 변경 없음).
 *
 * 원본 구조(n* 클래스·좌/중/우 3단·버튼 위치)는 유지하고 다음을 바꿨다.
 *  - BbsCKEditor 자리에 공통 PopupRichTextEditor, 우측 '미리보기'에 InlinePopupPreview, 미리보기 버튼에 PopupPreviewDialog 연결.
 *  - 모든 편집기가 하나의 inputData를 쓰던 구조 → 필드별(본문·설명) 편집값. 문항은 PopupQuestionEditor가 문항·선택지별로 관리하고,
 *    원본의 공유 라디오 state(selectedValue)와 미연결 추가/삭제 버튼은 공통 문항 편집기의 문항별 정답 선택·추가/삭제로 대체.
 *  - 숫자 Select 값(1~7)과 문자열 비교('2') 불일치 → 유형·푸터 Select 모두 계약 문자열 값 사용.
 *  - FormControlLabel 단독 label(boolean) 타입 오류는 문항 편집기 대체로 제거.
 *  - 크기 placeholder '최소 200' → 공통 최소 300.
 * 사진에 없던 업무 정책은 정하지 않는다: '컨텐츠 명'은 현재 저장 계약에 대응 필드가 없어 화면 값으로만 둔다(서버 확정 필요).
 * [실연동] 퀴즈 유형·답안 유형 목록은 샘플용 값이다. loadPopupQuestionCodes(api.clCode.search) 결과를 PopupQuizRuleFields options·PopupQuestionEditor answerTypeOptions로 넘긴다.
 * [확정] 퀴즈 점수: 채점 문항당 1점(총점 = 채점 문항 수). 만점형의 통과 점수 = 채점 문항 수,
 * 커트라인 통과 = N개 이상 통과(7개 → 통과 점수 7점). [확정] 만점형·컷트라인형은 미달(실패)이면 제출하지 못한다
 * (WPF: 점수 안내 후 창 유지·답 수정 후 다시 채점, 통과 시에만 SUBMITTED 결과). 참여형도 기준 N개(통계용 합격 기준)를 입력하며
 * 미달이어도 제출하면 완료된다(passed만 false). 저장 값은 기준 점수 passingScore와 퀴즈 유형 코드 quizTypeCode(0090: 00·01·02)다.
 * IMAGE·VIDEO 파일 첨부는 브라우저 미리보기용 object URL만 만들며 서버 업로드·서버 경로 URL 생성은 담당 서버 구현이다.
 * 화면 state는 입력한 값만 갖는다(미설정 = 키 생략, newSamplePopup·changeSampleType). 미리보기에는 withPreviewFallback으로 표시용 값만 채워 넘긴다.
 * 저장은 화면이 입력하는 필드만 담은 값(toSampleScreenValues)을 보여 주기만 한다(서버 미전송). n* 클래스 스타일은 폐쇄망 전역 CSS가 담당하고, 여기서는 sx로 3단 배치만 보장한다.
 * 인수인계 가이드: docs/interfaces/Web/POPUP_FRONT_SAMPLE_HANDOVER.md (선언 이유·로직·옵션·옵션 추가/삭제 예시·실연동 교체 지점).
 * 주석 표식: [옵션] = 바꿔도 되는 값, [실연동] = 실제 서버에 붙일 때 바꾸는 곳.
 */
/* [옵션] 컨텐츠 유형 선택지·중간 영역 제목. 줄을 지우면 선택지에서만 빠진다(기존 데이터는 불러오기로 계속 편집 가능, 가이드 §4.3).
 * 새 유형을 추가하려면 서버·WPF 계약 변경이 먼저 필요하다. */
const TYPE_OPTIONS: { value: PopupTypeSelection; label: string; title: string }[] = [
  { value: 'TEXT', label: '텍스트 팝업', title: '텍스트 컨텐츠' },
  { value: 'IMAGE', label: '이미지 팝업', title: '이미지 컨텐츠' },
  { value: 'VIDEO', label: '동영상 팝업', title: '동영상 컨텐츠' },
  { value: 'QUIZ', label: '퀴즈 팝업', title: '퀴즈 컨텐츠' },
  { value: 'SURVEY', label: '설문조사 팝업', title: '설문조사 컨텐츠' },
  { value: 'VIDEO_QUIZ', label: '동영상 + 퀴즈 팝업', title: '동영상 + 퀴즈 컨텐츠' },
];

const selectionOf = (popup: SamplePopupState): PopupTypeSelection =>
  popup.popupType === 'QUIZ' && popup.content.videoEnabled === true ? 'VIDEO_QUIZ' : popup.popupType;

// [실연동] 팝업 ID는 원본 퍼블리싱 표기값(N2609001). 서버 채번 규칙으로 바꾼다. [옵션] 신규 값은 newSamplePopup()(팝업 ID·제목·TEXT만, 미설정 기준).
const newPopup = (selection: PopupTypeSelection): SamplePopupState =>
  changeSampleType(newSamplePopup('N2609001', ''), selection);

/* 미설정 content 값은 빈 문자열로 표시만 한다(state에는 넣지 않음). */
const contentText = (popup: SamplePopupState, key: string) => { const value = popup.content[key]; return value == null ? '' : String(value); };

/* [예시] pickPopupFields 호출 코드. 아래 pickForSave와 같은 내용을 결과 대화상자에도 보여 준다(코드를 바꾸면 이 문자열도 같이 바꾼다). */
const PICK_EXAMPLE_CODE = `const picked = pickPopupFields(popup, {
  topLevelKeys: ['popupType', 'title', 'width', 'height', 'showLater'],
  contentKeys: ['plainText', 'imageUrl', 'videoUrl', 'description', 'footerAction'],
  questionKeys: ['questionId', 'title', 'questionType'],
});`;

function Required({ not = false }: { not?: boolean }) {
  return <Typography component="span" className={not ? 'required not' : 'required'}>*&nbsp;</Typography>;
}

/**
 * POL-14-01 : 공통 프론트 경계
 * POL-06-02 : 선택·제출
 * ■ 컨텐츠 등록 샘플 화면(IS063M02)
 * - in : 데이터 공급 newSamplePopup()(폼 생성 기본값) · createSamplePopups()(불러오기 목록)
 *        searchCodes(선택) 공통코드 조회 함수(api.clCode.search). 있으면 열 때 팝업 기본값·입력 범위 코드 0101을 읽어 적용한다.
 * - out: 저장 값 toSampleScreenValues(퀴즈 점수 규칙 적용값) — 화면이 입력하는 필드만(서버 미전송, 대화상자에 표시) · 화면: 좌(컨텐츠 정보·팝업 설정)/중(유형별 컨텐츠)/우(미리보기) 3단과 실제 크기 미리보기
 * - 컨텐츠 유형과 샘플 편집값을 받아 원본 퍼블리싱 배치 그대로 공통 편집기·문항 편집기·미리보기를 연결하고, 저장 시 입력을 검증해 저장 요청 객체를 만든다.
 */
export default function IS063M02Sample({ searchCodes }: { searchCodes?: PopupCodeSearch }) {
  const [pendingType, setPendingType] = useState<PopupTypeSelection | ''>('');
  const [popup, setPopup] = useState<SamplePopupState | null>(null);
  // 확인 필요: '컨텐츠 명'은 저장 계약(AdminPopupDetail)에 대응 필드가 없어 화면 state로만 둔다. 필드가 확정되면 popup으로 옮긴다.
  const [contentName, setContentName] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fitWindow, setFitWindow] = useState<Size | null>(null);
  const [loadAnchor, setLoadAnchor] = useState<HTMLElement | null>(null);
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);
  const [picked, setPicked] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  /*
   * POL-01-02 : 기본값의 적용 — 팝업 기본값·입력 범위 공통코드(0101)
   * - [실연동] 라우트(scene-router)가 searchCodes에 api.clCode.search를 넘긴다. 실제 등록 화면도 화면을 열 때 이 한 번만 호출하면 된다.
   * - loadPopupDefaultCodes가 POPUP_DEFAULTS·POPUP_INPUT_RANGES를 코드 값으로 바꾼다(가로·세로 입력 하한은 MINW·MINH). 코드 없음·조회 실패·숫자 아님·계약 범위 밖이면 popupDefaults.ts 값 그대로다.
   * - 이 화면 state는 입력한 값만 가져서(미설정 = 키 생략) 다시 그리기만 하면 된다: 미리보기 기본값(withPreviewFallback)·창 최대·입력칸 범위가 그릴 때 읽는다.
   * - searchCodes가 없으면(가이드 예시 탭·검증 하네스) 조회하지 않고 파일 기본값을 쓴다.
   */
  const [, setDefaultsVersion] = useState(0);
  useEffect(() => {
    if (!searchCodes) return undefined;
    let live = true;
    void loadPopupDefaultCodes(searchCodes).then(() => { if (live) setDefaultsVersion((version) => version + 1); });
    return () => { live = false; };
  }, [searchCodes]);

  /* 신규 폼 생성·불러오기는 편집기를 새 key로 다시 만들어 이전 문서·옵션이 섞이지 않게 한다. 입력 중에는 key를 바꾸지 않는다. */
  const start = (next: SamplePopupState) => {
    // 저장된 고정 안내 문구는 떼어 에디터에는 사용자 설명만 보인다(effective에서 다시 붙는다).
    setPopup(stripVideoFixedDescription(next)); setEditorKey((key) => key + 1); setPreviewOpen(false); setFitWindow(null); setError('');
  };
  const update = <K extends keyof SamplePopupState>(key: K, value: SamplePopupState[K]) =>
    setPopup((previous) => (previous ? { ...previous, [key]: value } : previous));
  const updateContent = (key: string, value: unknown) =>
    setPopup((previous) => (previous ? { ...previous, content: { ...previous.content, [key]: value } } : previous));

  const selection = popup ? selectionOf(popup) : null;
  const typeTitle = TYPE_OPTIONS.find((option) => option.value === selection)?.title ?? '컨텐츠';
  const isQuestion = popup?.popupType === 'SURVEY' || popup?.popupType === 'QUIZ';
  const hasVideo = popup?.popupType === 'VIDEO' || popup?.content.videoEnabled === true;
  const footerAction = popup && isSubmitPopupType(popup.popupType) ? 'SUBMIT' : (popup && contentText(popup, 'footerAction')) || 'CLOSE';
  const isQuiz = popup?.popupType === 'QUIZ';
  /* [확정] 퀴즈 점수 규칙(문항 1점 고정, 만점 = 채점 문항 수, 참여형·커트라인 N개 = N점). 공통 popupQuizRule을 RgstPop 등록 화면과 같이 쓴다.
   * 신규·불러오기(editorKey 변경) 때 저장된 퀴즈 유형 코드(없으면 통과 점수)로 유형을 복원하고, 미리보기·저장에는 규칙을 적용한 effective를 보낸다. */
  const quiz = usePopupQuizRule(popup, editorKey);
  // POL-05-01 : 재생 경로 — 동영상·동영상+퀴즈는 미리보기·저장 값에 고정 안내 문구(오른쪽 정렬 문단)를 붙인다(applyVideoFixedDescription).
  const effective = quiz.effective ? applyVideoFixedDescription(quiz.effective) : null;
  const preview = effective ? withPreviewFallback(effective) : null;

  /*
   * [옵션] IMAGE ADAPTIVE 창 크기를 이미지에 맞추기(2026-11-24)
   * - ADAPTIVE는 가로·세로가 창 크기라 이미지 칸 비율이 이미지와 다르면 칸 바탕이 위아래·좌우 띠로 보인다.
   * - '세로 자동'을 켜면 가로·이미지·제목·설명·헤더/푸터가 바뀔 때마다 띠가 생기지 않는 세로를 채운다(adaptiveWindowForImage).
   *   가로가 비어 있으면 이미지 원본 크기 기준 창 크기를 넣는다. '이미지 크기에 맞추기'는 원본 크기 기준으로 가로·세로를 한 번에 넣는다.
   * - 가로가 원본보다 크면 이미지가 커지지 않아 좌우 띠를 피할 수 없다. 이때는 안내만 하고 가로는 바꾸지 않는다.
   * - 창 최대 크기(maximumWidth/Height, 이 화면은 입력이 없어 미리보기 기본값 1200×900 — 0101 MAXW·MAXH가 있으면 그 값)를 넘으면 띠가 생기지 않게 가로·세로를 함께 줄인다(2026-11-25).
   * - 화면이 작으면 WPF가 작업 영역 90% 상한으로 창을 줄여 띠가 다시 생길 수 있다(저장값은 사용자 화면과 무관하게 계산).
   * - 폼 생성은 '세로 자동'을 켜고, 불러오기는 저장된 크기를 열기만 해서 바꾸지 않도록 끈 채 시작한다.
   */
  const adaptiveImage = popup?.popupType === 'IMAGE' && preview != null && imageSizeMode(preview) === 'ADAPTIVE';
  const naturalImage = useNaturalImageSize(adaptiveImage ? contentText(popup, 'imageUrl') : null);
  const [autoHeight, setAutoHeight] = useState(true);
  const imageFit = adaptiveImage && naturalImage && preview ? adaptiveWindowForImage(preview, naturalImage, popup?.width) : null;
  useEffect(() => {
    if (!autoHeight || !imageFit) return;
    setPopup((previous) => {
      if (!previous) return previous;
      // 설정 최대를 넘어 두 축을 함께 줄였으면(cappedByMaximum) 가로도 계산 결과로 바꾼다('이미지 크기에 맞추기' 버튼과 같은 결과, 2026-11-25).
      const width = imageFit.cappedByMaximum ? imageFit.window.width : previous.width ?? imageFit.window.width;
      return previous.width === width && previous.height === imageFit.window.height ? previous : { ...previous, width, height: imageFit.window.height };
    });
    // 입력 가로도 넣는다: 이미 최대에 걸린 상태에서 가로만 바꾸면 계산 결과가 같아 다시 맞추지 않던 문제(2026-11-25).
  }, [autoHeight, popup?.width, imageFit?.window.width, imageFit?.window.height]); // eslint-disable-line react-hooks/exhaustive-deps
  // 원본 기준 맞춤 결과. 창 최대에 걸리면(cappedByMaximum) 여백 없는 가장 큰 크기이며, 세로 자동·'이미지 크기에 맞추기' 모두 이 값으로 맞춘다.
  const largestFit = adaptiveImage && naturalImage && preview ? adaptiveWindowForImage(preview, naturalImage, null) : null;
  const atMaximum = largestFit?.cappedByMaximum === true && (imageFit?.cappedByMaximum === true || Number(popup?.width ?? 0) >= largestFit.window.width);
  const fitImageSize = () => {
    if (!preview || !naturalImage) return;
    const natural = adaptiveWindowForImage(preview, naturalImage, null);
    if (natural) setPopup((previous) => (previous ? { ...previous, width: natural.window.width, height: natural.window.height } : previous));
  };

  const attach = (file: File | undefined) => {
    if (!file || !popup) return;
    // 브라우저 미리보기용 임시 URL. [실연동] 서버 업로드 API 호출 → 응답의 서버 경로 URL(영상은 popup-video-range 규칙)을 넣는다.
    // attachedFileName은 화면 표시용이라 저장 요청에서 뺀다(save 참고).
    updateContent(popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl', URL.createObjectURL(file));
    updateContent('attachedFileName', file.name);
  };

  // [실연동] 검증 통과 후 이 화면의 저장 API 형식으로 바꿔 호출하고 성공/실패 처리(toast·handleError)를 붙인다.
  //   저장 값은 화면이 입력하는 필드만(toSampleScreenValues). proto 저장 변환(toSaveRequest: 기간·활성·대상 그룹 등)은 이 화면에 없는 값이라 쓰지 않는다.
  // [옵션] 필수 입력 규칙은 이 함수에서 추가·삭제한다(예: 문항 검증 validatePopupQuestions(popup.questions, popup.popupType === 'QUIZ', popup.passingScore)).
  const save = () => {
    if (!popup) { setError('컨텐츠 유형을 선택하고 폼 생성을 눌러 주세요.'); return; }
    if (!contentName.trim() || !popup.title.trim()) { setError('컨텐츠 명과 헤더 제목을 입력해 주세요.'); return; }
    // [실연동] 하한은 기본 창 최소 크기(popupSizeInputMin — 공통코드 0101 MINW·MINH, 계약 300 이상)다. 이 화면은 최소 크기 입력이 없어
    //   모든 팝업이 이 최소 크기로 저장되고, 그보다 작은 가로·세로는 실제 팝업이 최소 크기까지 늘려 띄운다. searchCodes가 없으면(가이드 예시 탭) 300×300이다.
    const sizeMin = popupSizeInputMin();
    // 창 크기는 정수만 받는다(입력칸이 소수점 키를 막지만, 불러온 값·붙여 넣기 대비로 한 번 더 확인).
    if ((popup.width != null && !Number.isInteger(popup.width)) || (popup.height != null && !Number.isInteger(popup.height))) {
      setError('크기는 소수점 없이 정수로 입력해 주세요.'); return;
    }
    // 가로·세로 필수(모든 유형). 빈 값을 기본값으로 채우지 않고 입력을 요청한다. 서버는 IMAGE가 아닌 팝업만 필수로 거절하고 IMAGE는 빈 값을
    //   '이미지 원본 크기 기준'으로 받지만, 이 화면은 IMAGE도 크기를 넣게 한다(세로 자동·'이미지 크기에 맞추기'가 값을 채워 준다, 2026-11-25).
    //   미리보기는 빈 칸을 화면 기본값 560×420으로 보여 주므로, 비운 채 저장하면 미리보기와 실제 크기가 달라진다.
    if (popup.width == null || popup.height == null) {
      setError('가로·세로를 입력해 주세요.'); return;
    }
    if ((popup.width ?? sizeMin.width) < sizeMin.width || (popup.height ?? sizeMin.height) < sizeMin.height) {
      setError(`크기는 가로 ${sizeMin.width}px·세로 ${sizeMin.height}px 이상이어야 합니다.`); return;
    }
    // POL-04-03 : 비율·상한 — 가로·세로가 창 크기인 경우(IMAGE 이미지 우선 제외) 창 최대 크기 이하여야 한다(모든 유형 공통, 2026-11-25).
    // [옵션] 이 화면은 최대 크기 입력이 없어 미리보기 기본값(POPUP_DEFAULTS 1200×900, 0101 MAXW·MAXH가 있으면 그 값)을 쓴다. 화면에 최대 입력을 두면 그 값으로 바뀐다.
    const maximum = preview ? popupMaximumSize(preview) : null;
    const windowSize = !(popup.popupType === 'IMAGE' && preview && imageSizeMode(preview) === 'FIT_TO_IMAGE');
    if (maximum && windowSize && ((popup.width ?? 0) > maximum.width || (popup.height ?? 0) > maximum.height)) {
      setError(`크기는 창 최대 크기(${maximum.width}×${maximum.height}px) 이하여야 합니다.`); return;
    }
    if (quiz.error) { setError(quiz.error); return; }
    const target = effective ?? popup;
    const { attachedFileName: _file, ...content } = target.content;
    setError('');
    setSaved(toSampleScreenValues({ ...target, content }));
  };

  /*
   * [예시] 저장할 때 필요한 항목만 가져오기 — pickPopupFields
   * - 가져올 항목 이름을 영역별로 넘기면 그 값만 담긴 새 객체가 나온다(입력한 값은 바뀌지 않는다).
   * - 입력하지 않은 항목은 결과에도 없다. 이 결과를 저장 API 형식에 맞게 바꿔 보내면 된다.
   * - 위 저장 버튼(save)은 같은 일을 toSampleScreenValues(유형별 항목 목록)로 한다. 이 버튼은 호출 방법을 그대로 보여 주는 용도다.
   */
  const pickForSave = () => {
    if (!popup) { setError('컨텐츠 유형을 선택하고 폼 생성을 눌러 주세요.'); return; }
    setError('');
    setPicked(pickPopupFields(effective ?? popup, {
      topLevelKeys: ['popupType', 'title', 'width', 'height', 'showLater'],
      contentKeys: ['plainText', 'imageUrl', 'videoUrl', 'description', 'footerAction'],
      questionKeys: ['questionId', 'title', 'questionType'],
    }));
  };

  const sizeField = (label: string, key: 'width' | 'height') => (
    <Box className="nConWid">
      <Typography component="span">{label}</Typography>
      {/* [옵션] 빈 칸은 입력을 마칠 때 반영한다(PopupNumberField empty="onBlur"). 바로 반영하면 세로 자동이 가로를 다시 채워 마지막 자리가 지워지지 않는다. */}
      <PopupNumberField integer placeholder={`최소 ${popupSizeInputMin()[key]}`} sx={{ width: 80, marginX: 1 }} value={popup?.[key]} empty="onBlur"
        disabled={!popup || (key === 'height' && adaptiveImage && autoHeight && imageFit != null)}
        slotProps={{ htmlInput: { 'aria-label': label, min: popupSizeInputMin()[key] } }}
        onChange={(value) => update(key, value ?? undefined)} />
      <Typography component="span">px</Typography>
    </Box>
  );

  return (
    <Box className="nContainer" sx={{ p: 2 }}>
      <Box className="nContent">
        <Box className="nBreadArea">
          <Breadcrumbs className="nBreadNav" separator={<NavigateNext fontSize="small" />}>
            <Link underline="hover">HOME</Link>
            <Link underline="hover">관리/교육</Link>
            <Link underline="hover">팝업관리</Link>
            <Link underline="hover">컨텐츠 관리</Link>
            <Typography>컨텐츠 등록</Typography>
          </Breadcrumbs>
        </Box>
        <Box className="nResultArea" sx={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(320px, 1fr) minmax(360px, 1fr)', gap: 2, mt: 1 }}>
          {/* nResultBox left : 컨텐츠 정보·팝업 설정 */}
          <Box className="nDevider" data-testid="is063-left">
            <Box className="nConSection">
              <Box component="h4" className="nConTitle">컨텐츠 정보</Box>
              <Box className="nConID">
                <Typography className="nConSectionTitle">팝업ID</Typography>
                <Typography className="nConSectionTitle">{popup?.popupId ?? 'N2609001'}</Typography>
              </Box>
              <Stack className="nConSectionDiv" spacing={1}>
                <Typography className="nConSectionTitle"><Required />컨텐츠 유형</Typography>
                <Select value={pendingType} displayEmpty inputProps={{ 'aria-label': '컨텐츠 유형' }}
                  onChange={(event) => setPendingType(event.target.value as PopupTypeSelection | '')}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {TYPE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </Select>
                <Box className="nConBtnBox" sx={{ display: 'flex', gap: 1 }}>
                  {/* 이미 편집 중이면 유형만 바꾸고 공통 입력값은 유지한다(changeSampleType — 업무 기본값은 채우지 않음). */}
                  <Button variant="contained" disabled={!pendingType}
                    onClick={() => { if (!pendingType) return; start(popup ? changeSampleType(popup, pendingType) : newPopup(pendingType)); setAutoHeight(true); }}>폼 생성</Button>
                  <Button variant="contained" className="nWhiteBtn" onClick={(event) => setLoadAnchor(event.currentTarget)}>불러오기</Button>
                  <Menu anchorEl={loadAnchor} open={Boolean(loadAnchor)} onClose={() => setLoadAnchor(null)}>
                    {createSamplePopups().map((item) => (
                      <MenuItem key={item.popupId} onClick={() => { setLoadAnchor(null); setPendingType(selectionOf(item)); setContentName(item.title); start(item); setAutoHeight(false); }}>
                        {item.popupId} · {item.title}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              </Stack>
            </Box>
            <Box className="nConSection">
              <Box component="h4" className="nConTitle">팝업 설정</Box>
              <Stack className="nConSectionDiv">
                <Typography className="nConSectionTitle"><Required />컨텐츠 명</Typography>
                <TextField placeholder="컨텐츠명을 입력하세요" sx={{ width: '100%' }} value={contentName} disabled={!popup}
                  slotProps={{ htmlInput: { 'aria-label': '컨텐츠 명' } }} onChange={(event) => setContentName(event.target.value)} />
              </Stack>
              <Stack className="nConSectionDiv">
                <Typography className="nConSectionTitle"><Required />헤더 제목</Typography>
                <TextField placeholder="제목을 입력하세요" sx={{ width: '100%' }} value={popup?.title ?? ''} disabled={!popup}
                  slotProps={{ htmlInput: { 'aria-label': '헤더 제목' } }} onChange={(event) => update('title', event.target.value)} />
              </Stack>
              <Stack className="nConSectionDiv">
                <Typography className="nConSectionTitle"><Required />크기 설정</Typography>
                <Stack direction="row" alignItems="center">
                  {sizeField('가로', 'width')}
                  <Typography component="span" sx={{ marginX: 1 }}>/</Typography>
                  {sizeField('세로', 'height')}
                </Stack>
                {adaptiveImage && (
                  <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ mt: 0.5, columnGap: 1 }}>
                    <FormControlLabel label="이미지에 맞춰 세로 자동" disabled={!naturalImage}
                      control={<Checkbox size="small" checked={autoHeight} onChange={(event) => setAutoHeight(event.target.checked)} />} />
                    <Button size="small" variant="outlined" disabled={!naturalImage} onClick={fitImageSize}>이미지 크기에 맞추기</Button>
                    <Typography variant="caption" color={imageFit?.limited || atMaximum ? 'warning.main' : 'text.secondary'} sx={{ flexBasis: '100%' }}>
                      {!naturalImage ? '이미지를 첨부하면 창 크기를 이미지에 맞출 수 있습니다.'
                        : atMaximum && largestFit ? `창 최대 크기 안에서 여백 없는 가장 큰 크기는 ${largestFit.window.width}×${largestFit.window.height}px입니다. 세로 자동·맞추기는 이 크기로 넣습니다.`
                        : imageFit?.limited ? `가로가 이미지 원본보다 커서 좌우 여백이 생깁니다. 여백 없는 최대 가로는 ${imageFit.window.width}px입니다.`
                          : `이미지 원본 ${naturalImage.width}×${naturalImage.height}px · 이미지 바깥 여백이 생기지 않는 크기로 맞춥니다.`}
                    </Typography>
                  </Stack>
                )}
              </Stack>
              <Stack className="nConSectionDiv" direction="row" alignItems="center">
                <Typography className="nConSectionTitle"><Required not />나중에 보기</Typography>
                <Switch className="ios-switch" disableRipple checked={popup?.showLater ?? false} disabled={!popup}
                  slotProps={{ input: { 'aria-label': '나중에 보기' } }} onChange={(event) => update('showLater', event.target.checked)} />
              </Stack>
              <Stack className="nConSectionDiv">
                <Typography className="nConSectionTitle"><Required not />푸터버튼명</Typography>
                {popup && isSubmitPopupType(popup.popupType)
                  /* 퀴즈·설문·동영상+퀴즈는 제출 고정(원본 주석의 비활성 Select) */
                  ? <Select value="SUBMIT" disabled><MenuItem value="SUBMIT">제출</MenuItem></Select>
                  : <Select value={footerAction} disabled={!popup} inputProps={{ 'aria-label': '푸터버튼명' }}
                    onChange={(event) => updateContent('footerAction', event.target.value)}>
                    <MenuItem value="CLOSE">확인</MenuItem>
                    <MenuItem value="LINK_AND_CLOSE">바로가기</MenuItem>
                  </Select>}
              </Stack>
              {footerAction === 'LINK_AND_CLOSE' && popup && (
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Required not />URL 링크</Typography>
                  <TextField sx={{ width: '100%' }} value={contentText(popup, 'footerLinkUrl')}
                    slotProps={{ htmlInput: { 'aria-label': 'URL 링크' } }} onChange={(event) => updateContent('footerLinkUrl', event.target.value)} />
                </Stack>
              )}
            </Box>
          </Box>

          {/* nResultBox mid : 유형별 컨텐츠 */}
          <Box className="nDevider" data-testid="is063-mid" sx={{ minWidth: 0 }}>
            <Box component="h4" className="nConTitle">{typeTitle}</Box>
            {!popup && <Typography color="text.secondary">컨텐츠 유형을 선택하고 폼 생성을 누르세요.</Typography>}
            {popup?.popupType === 'TEXT' && (
              <PopupRichTextEditor key={`body-${editorKey}`} hideToolbar label="본문"
                initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentText(popup, 'plainText'))}
                onChange={(blocks, plainText) => setPopup((previous) => previous && ({ ...previous, content: { ...previous.content, textBlocks: blocks, plainText } }))} />
            )}
            {popup && (popup.popupType === 'IMAGE' || hasVideo) && (
              <Box className="nFormBox">
                <Box className="nFormLine" sx={{ gap: '5px', display: 'flex', alignItems: 'center' }}>
                  <Box className="nFileWrap" sx={{ flex: 1 }}>
                    <Typography className="nFileList">{contentText(popup, 'attachedFileName') || '첨부 파일 없음'}</Typography>
                  </Box>
                  <span className="nAddFile02">
                    <label>
                      파일첨부
                      <input type="file" aria-label="파일첨부" accept={popup.popupType === 'IMAGE' ? '.bmp,.gif,.jpg,.jpeg,.png' : '.mp4'}
                        onChange={(event) => attach(event.target.files?.[0])} />
                    </label>
                  </span>
                </Box>
                <TextField size="small" fullWidth sx={{ mt: 1 }} label={popup.popupType === 'IMAGE' ? '이미지 URL' : '동영상 URL'}
                  value={contentText(popup, popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl')}
                  onChange={(event) => updateContent(popup.popupType === 'IMAGE' ? 'imageUrl' : 'videoUrl', event.target.value)} />
                <Typography component="span" sx={{ color: '#333' }}>
                  {popup.popupType === 'IMAGE' ? '※ BMP, GIF, JPG, PNG 파일만 등록 가능합니다.' : '※ MP4 파일만 등록 가능합니다.'}
                </Typography>
              </Box>
            )}
            {/* POL-03-01 : 저장·표시 경계 — VIDEO 설명 서식 편집기(descriptionBlocks, 2026-11-24). 동영상+퀴즈는 아래 문항 영역의 설명을 쓴다. */}
            {popup && popup.popupType === 'VIDEO' && (
              <Stack className="nConSectionDiv" spacing={1} sx={{ mt: 1 }}>
                <Typography className="nConSectionTitle"><Required not />설명</Typography>
                <PopupRichTextEditor key={`video-description-${editorKey}`} compact hideLabel hideFormatButton label="설명" placeholder="설명(선택)"
                  initialBlocks={richBlocksOrNull(popup.content.descriptionBlocks) ?? plainTextToBlocks(contentText(popup, 'description'))}
                  onChange={(blocks, plainText) => setPopup((previous) => previous && ({ ...previous, content: { ...previous.content, descriptionBlocks: blocks, description: plainText } }))} />
              </Stack>
            )}
            {popup && isQuestion && (
              <>
                <Stack className="nConSectionDiv" spacing={1} sx={{ mt: 1 }}>
                  <Typography className="nConSectionTitle"><Required not />설명</Typography>
                  <PopupRichTextEditor key={`description-${editorKey}`} compact hideLabel hideFormatButton label="설명" placeholder="설명(선택)"
                    initialBlocks={richBlocksOrNull(popup.content.descriptionBlocks) ?? plainTextToBlocks(contentText(popup, 'description'))}
                    onChange={(blocks, plainText) => setPopup((previous) => previous && ({ ...previous, content: { ...previous.content, descriptionBlocks: blocks, description: plainText } }))} />
                </Stack>
                {isQuiz && <Box sx={{ mt: 1 }}>
                  <PopupQuizRuleFields className="nConSectionDiv" titlePrefix={<Required />} questionCount={quiz.scoredCount}
                    rule={quiz.rule} count={quiz.count} passingScore={effective?.passingScore} onRuleChange={quiz.setRule} onCountChange={quiz.setCount} />
                </Box>}
                {/* 원본의 문항별 하드코딩 블록·공유 라디오 state 대신 공통 문항 편집기가 문항·선택지·정답을 각각 관리한다.
                    [확정] 채점 문항은 1점이며, 통과 점수는 퀴즈유형에서 계산한다(hidePassingScore). */}
                <Box className="nQuizBox" sx={{ mt: 1, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <PopupQuestionEditor key={`questions-${editorKey}`} questions={popup.questions} quiz={popup.popupType === 'QUIZ'} passingScore={effective?.passingScore}
                    hidePassingScore
                    onPassingScoreChange={(score) => update('passingScore', score)} onChange={(questions) => update('questions', questions)} />
                </Box>
              </>
            )}
          </Box>

          {/* nResultBox right : 미리보기 */}
          <Box className="nDevider" data-testid="is063-right" sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
            <Box component="h4" className="nConTitle">미리보기</Box>
            {popup
              ? <InlinePopupPreview popup={preview ?? withPreviewFallback(popup)} title="" onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setFitWindow} />
              : <Typography color="text.secondary">폼을 만들면 미리보기가 표시됩니다.</Typography>}
          </Box>
        </Box>
        {error && <Typography color="error" role="alert" sx={{ mt: 1 }}>{error}</Typography>}
        <Box className="nBtnWrap" sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
          <Button variant="contained" onClick={save}>저장</Button>
          <Button variant="outlined" onClick={pickForSave} sx={{ textTransform: 'none' }}>pickPopupFields로 가져오기</Button>
          <Button variant="contained" className="nWhiteBtn" onClick={() => { setPopup(null); setPendingType(''); setContentName(''); setSaved(null); setPicked(null); setError(''); }}>취소</Button>
        </Box>
      </Box>
      {preview && <PopupPreviewDialog popup={preview} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={fitWindow} />}
      <Dialog open={Boolean(saved)} onClose={() => setSaved(null)} maxWidth="md" fullWidth>
        <DialogTitle>저장 값 (화면 입력 필드만, 서버 미전송)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary">
            컨텐츠 명 &quot;{contentName}&quot;은 현재 저장 계약에 대응 필드가 없어 요청에 넣지 않았습니다(서버 확정 필요).
          </Typography>
          <Box component="pre" data-testid="is063-save-request" sx={{ m: 0, mt: 1, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(saved, null, 2)}</Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setSaved(null)}>닫기</Button></DialogActions>
      </Dialog>
      <Dialog open={Boolean(picked)} onClose={() => setPicked(null)} maxWidth="md" fullWidth>
        <DialogTitle>pickPopupFields 결과 (서버에 보내지 않음)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>필요한 항목 이름을 넘기면 그 값만 가져옵니다. 입력하지 않은 항목은 결과에 없습니다.</Typography>
          <Box component="pre" data-testid="is063-pick-code" sx={{ m: 0, p: 1.5, fontSize: 12, overflow: 'auto', bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1 }}>{PICK_EXAMPLE_CODE}</Box>
          <Box component="pre" data-testid="is063-pick-result" sx={{ m: 0, mt: 1.5, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(picked, null, 2)}</Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setPicked(null)}>닫기</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
