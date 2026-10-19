# 55. SURVEY·QUIZ FONT EDIT 확장 TODO

기준일: 2026-10-18 (KST).
상태: **개발 완료 · 55-1~55-9 반영(WPF 2026-10-18, 서버·관리자 웹 2026-10-19) · 55-10 일부(실화면·인터페이스 산출물·원격 개발 DB 미실행)**.
기준: main `dfcf148`, TODO28 §10의 후속 확장. TEXT 1차 제외 기록은 당시 범위이며 이번 TODO로 설문·퀴즈 서식 확장을 진행한다.

## 목적과 적용 범위
TEXT에서 제공하는 문단·Run 기반 FONT EDIT를 SURVEY·QUIZ의 콘텐츠 제목·설명, 문항 제목·설명, 선택지 표시 문구로 확장한다. VIDEO+QUIZ의 설문 영역에도 같은 구조를 적용한다.
공통 창 헤더, 버튼 라벨, 사용자 답변 입력 및 정답 데이터 자체의 서식 편집은 이번 범위에 포함하지 않는다. 채점·응답·통계는 기존 ID와 값에 기반하며 표시 서식과 분리한다.
기존 글꼴·크기·색·굵게·기울임·밑줄·문단 정렬·들여쓰기 및 펼침 우클릭 팔레트를 재사용한다.

## 책임과 데이터 원칙
- WPF는 서버가 제공하는 서식 JSON을 표시하고 기존 응답을 전송한다. 서버의 업무 허용 목록을 WPF에 중복 구현하지 않고 TODO48의 표시 변환·최소 방어를 유지한다.
- Front/Server 담당자는 등록 편집·HTML 변환·저장·검증·API 공급 및 통합 검증을 담당한다. WPF 담당 범위는 표시 구현·샘플 전달·WPF 검증이다.
- 문단+Run 공통 구조를 재사용하고 각 표시 필드에 대응하는 JSON 위치·필드명·선택 여부·일반 문자열 대체 규칙을 계약으로 정의한다. TEXT용 textBlocks 하나에 모든 문항을 합치지 않는다.
- 일반 문자열과 서식 본문을 독립 편집하여 불일치시키지 않는다. 서식이 있으면 문자열을 파생하고 서식이 없는 기존 데이터는 기존 문자열로 표시한다.
- 서버의 콘텐츠 JSON(CLOB) 저장 방향에 맞춰 실제 저장 경로를 담당자와 연결한다. 과거 TODO28의 문항 테이블 컬럼 신설 가정을 그대로 적용하지 않고 최신 DB/API에 맞춘다. 이번 TODO로 DDL 변경을 확정하지 않는다.

## 구현 TODO
- [x] **55-1 필드별 계약**: 콘텐츠 제목·설명, questions의 문항 제목·설명, options의 표시 문구 각각의 일반 문자열/서식 JSON 매핑을 작성한다. 필드명·누락/null/빈 문단·우선순위·길이 제한을 명세화하고 기존 응답과 신규 샘플을 제공한다.
- [x] **55-2 공통 변환 재사용**: 문단·Run·정렬·indent·폰트 ID 모델과 HTML↔blocks 변환을 재사용한다. 제목·문항·선택지의 다중 문단·줄바꿈 표현을 정의하고 첫 문단만 취해 내용을 버리지 않는다. 제한이 필요한 필드는 편집 시 명시적으로 제한한다.
- [x] **55-3 관리자 편집 인계**: 기존 CKEditor와 펼침 팔레트를 해당 입력 영역에 연결한다. 여러 문항/선택지 편집기 간 선택 범위·커서·상태가 섞이지 않게 하고 문항 추가·삭제·정렬·템플릿 불러오기·재편집에서 내용과 서식을 보존한다. 기존 기능을 줄이지 않는다.
- [x] **55-4 서버·API 인계**: 각 필드의 서식 JSON 검증·일반 문자열 파생·길이 검증 및 반환 위치를 담당자에게 전달한다. API에는 JSON 객체/배열로 제공하며 CLOB 문자열 이중 인코딩을 피한다. 대상/결과 관리와 콘텐츠 저장을 분리한다.
- [x] **55-5 WPF 표시 연결**: DTO·모델·Factory에서 각 필드의 서식 데이터를 전달하고 PopupRichText 공통 표시 경로를 재사용한다. 서식 부재 시 기존 문자열을 표시하며 기본 글자 크기와 Run 지정값 우선순위를 유지한다.
- [x] **55-6 선택지 레이아웃·조작**: 혼합 크기·여러 문단·들여쓰기·기울임·긴 문구에서 체크/라디오 위치, 행 높이, 클릭 영역, 줄바꿈, 스크롤 및 잘림을 점검한다. 키보드 선택·포커스·접근 가능한 이름과 선택 상태를 보존한다.
- [x] **55-7 답변·채점 분리**: questionId/optionId 및 응답 값·정답·배점·필수/복수선택 검증을 서식 데이터와 분리한다. 표시 스타일 변경만으로 답변 키나 결과가 달라지지 않도록 한다. 동일 텍스트 선택지도 ID로 구분한다. 주관식 사용자 답변을 서식 HTML로 변환하지 않는다.
- [x] **55-8 VIDEO+QUIZ·완료 UX 회귀**: 시청 잠금·해제·passingScore·제출·나중에 보기 등 당시 확정된 정책을 유지한다. TODO53의 머리말 중복 제거와 서식 필드의 표시 관계를 정리하고 서식이 다른 콘텐츠를 문자열이 같다는 이유만으로 누락시키지 않는다.
- [x] **55-9 Demo·미리보기·샘플**: SURVEY/QUIZ 및 VIDEO+QUIZ의 부분 서식·빈 문단·긴 선택지·서식 없는 기존 데이터 샘플을 제공한다. TODO54 상세옵션 구성에 연결하고 TODO51 API Demo로 수신·표시·결과를 확인한다. 관리자 미리보기와 실제 WPF 차이를 담당자에게 전달한다.
- [ ] **55-10 검증·문서**: WPF에서 유형별 서식 표시·일반 문자열 대체·선택 조작·답변/채점 불변·DPI/창 폭/폰트 누락·기울임 잘림을 검증한다. Front/Server 왕복 검증은 담당자 인계 항목으로 분리한다. ALL/MINIMAL·인터페이스·Excel/Word·JSON 예제를 갱신하되 최소 외부 제공 범위를 자동 확대하지 않는다.

## 55-1 필드별 계약 초안 (2026-10-18, 확정 전)

조사 기준: main `c454480`. TEXT 서식은 `textBlocks`(문단 `{alignment, indent, runs}`, 구간 `{text, bold, italic, underline, color, size, font}`, 인터페이스 명세 §8.1). WPF는 `PopupRichText.CreateParagraphs`로 그리고, 구조가 깨지면 `LenientTextBlocksConverter`가 null로 바꿔 일반 문자열을 표시한다. 서버는 `PopupRichText.validateAndDerivePlainText`로 검증·일반 문자열 파생(TEXT 외 유형은 현재 저장 거부).

### 필드 매핑(제안)
| 표시 위치 | 일반 문자열(기존) | 서식(신규, 같은 문단·구간 스키마) | 일반 문자열 상한(현행 저장소) |
|---|---|---|---|
| 콘텐츠 제목 | `content.surveyTitle` | `content.surveyTitleBlocks` | 200(`POPUP_CONTENT.CONTENT_TITLE`) |
| 콘텐츠 설명 | `content.description` | `content.descriptionBlocks` | 2000(`DESCRIPTION`) |
| 문항 제목 | `questions[].title` | `questions[].titleBlocks` | 1000(`POPUP_QUESTION.QUESTION_TITLE`) |
| 문항 설명 | `questions[].description` | `questions[].descriptionBlocks` | 2000(`QUESTION_DESCRIPTION`) |
| 선택지 표시 문구 | `questions[].options[].text` | `questions[].options[].textBlocks` | 1000(`POPUP_OPTION.OPTION_TEXT`) |

- TEXT의 `textBlocks` 하나에 모든 문항을 합치지 않고, 필드마다 같은 이름 규칙(`<필드>Blocks`)의 배열을 둔다. 선택지는 TEXT와 키 이름이 같지만 위치(`options[]`)가 달라 충돌하지 않는다.
- 서식이 있으면 서버가 일반 문자열을 서식에서 파생해 함께 보낸다(독립 편집 금지). 일반 문자열은 접근성 이름·로그·VIDEO+QUIZ 머리말 비교·서식 실패 시 대체에 쓴다.
- 우선순위: 서식 배열이 유효하고 비어 있지 않으면 서식으로 표시. `null`·누락·빈 배열 `[]`이면 일반 문자열로 표시(기존 데이터 그대로 동작). 구조가 깨진 서식도 일반 문자열로 표시.
- 빈 문단(구간 0개)은 줄을 차지하는 빈 줄로 표시한다(TEXT와 같음). 모든 문단이 비면 서식 없음으로 본다.
- 여러 문단·줄바꿈 허용. 첫 문단만 쓰고 나머지를 버리지 않는다. 필수 표시 `*`는 문항 제목 마지막 문단 끝에 붙인다.
- 허용 값(크기·글꼴·색·들여쓰기)과 문단·구간 수 상한은 TEXT와 같은 서버 규칙을 쓰되, 파생 일반 문자열 길이는 위 표의 필드별 상한을 따른다. 필드별 문단 수 상한이 필요하면 서버가 정하고 WPF는 받은 만큼 표시한다(표시 방어만).
- 답변·채점 불변: `questionId`·`optionId`·`value`·정답·배점·필수/복수 선택은 서식과 무관. 주관식 답변·정답(`correctAnswer`)은 서식 대상 아님.

### 저장 경로(Front/Server 인계, 이번에 확정하지 않음)
- 콘텐츠 제목·설명 서식은 기존 `CONTENT_OPTIONS`(CLOB JSON)에 둘 수 있어 DDL이 필요 없다.
- 문항·선택지 서식은 현재 `POPUP_QUESTION`·`POPUP_OPTION` 정규 컬럼(VARCHAR)뿐이라 저장 위치가 없다. 후보: 문항·선택지 테이블에 서식 CLOB 추가 / 문항 템플릿 단위 JSON 컬럼. 문항 템플릿은 변경 시 새 버전으로 저장되므로(`saveAdminQuestions`) 템플릿과 함께 버전 관리되는 위치여야 한다. 결정은 서버 담당.
- API에는 JSON 배열로 내려준다(CLOB 문자열 이중 인코딩 금지).

### WPF 영향(55-5~55-8 구현 범위)
- DTO 5곳에 서식 필드 추가(관대한 변환기 재사용) → 모델 → `SurveyPopupView`에서 `PopupRichText`로 표시.
- 선택지: 라디오·체크박스 `Content`가 일반 `TextBlock`이고 세로형 `StableChoiceText`가 일반 문자열 폭을 전제로 측정하므로, 서식 문단 패널로 바꿔도 클릭 영역·줄바꿈·잘림·접근 가능한 이름(일반 문자열 유지)을 점검해야 한다.
- VIDEO+QUIZ 머리말 중복 숨김(`CollapseHeaderShownAbove`)은 일반 문자열만 비교한다. 서식이 다르면 숨기지 않도록 서식까지 비교한다.

## WPF 반영 (2026-10-18)

결정: 필드 이름은 `<필드>Blocks` 규칙(55-1 표). 서버 저장 경로 결정 전이라 WPF 표시까지 구현하고 명세에는 초안으로 표시.

- 55-2: TEXT의 `PopupRichText.CreateParagraphs`·`LenientTextBlocksConverter`를 그대로 쓴다. 문단마다 일반 문자열 자리의 기본 글꼴·크기·굵기·색·줄 높이를 이어받고 구간 서식이 우선한다. 모든 문단에 글자가 없으면 서식 없음으로 본다.
- 55-5: DTO 3종·모델 2종·Factory에 서식 필드 연결. `SurveyPopupView`가 콘텐츠 제목·설명(서식 패널, 일반 문자열 TextBlock은 숨긴 채 유지), 문항 제목(필수 `*`는 마지막 문단 끝)·설명, 선택지를 서식으로 표시. 본문 글자 크기 적용(설계 14)도 서식 문단에 적용.
- 55-6: 라디오·체크박스 `Content`를 문단 패널로 바꾸고 폭 제한(줄바꿈)을 패널에도 적용. 접근 가능한 이름은 일반 문구(`text`) 유지. 세로형의 선택 시 굵기 대비 높이 예약(`StableChoiceText`)은 일반 문구에만 적용되어, 서식 선택지는 선택할 때 줄 수가 바뀌면 높이가 조금 달라질 수 있다(실화면 확인 필요).
- 55-7: 응답 수집은 `Tag`의 `OptionId`를 그대로 쓰므로 서식과 무관. 주관식 답변·정답은 서식 대상 아님.
- 55-8: VIDEO+QUIZ 머리말 숨김은 일반 문자열 TextBlock만 접으므로 서식 머리말은 문자열이 같아도 남는다. 잠금·제출·나중에 보기 회귀는 PopupWindowTests 197건 통과로 확인.
- 55-9: Demo 설문 샘플에 제목(부분 굵게·색), 설명(2문단·들여쓰기·기울임), 문항 제목(밑줄), 긴 선택지(2문단·들여쓰기·기울임·크기 12), 가로형 선택지(색·크기 16) 서식 추가. 옵션 창은 `*Blocks`를 JSON으로 편집하고 적용 시 서버처럼 일반 문자열을 파생·필드별 상한 검사(빈 서식은 제거). 관리자 웹 미리보기(SurveyPreview)는 서버·웹 인계 범위라 변경하지 않음 — 미리보기와 WPF 차이로 전달.
- 55-10(일부): RichTextTests 97건(신규 12 — 머리말·설명 문단·문항 제목 필수 표시·세로/가로 선택지 서식과 접근성 이름·응답 ID 불변·빈/깨진/공백 서식 대체 3종·VIDEO+QUIZ 머리말·Demo 파생과 상한). 변이 확인: 선택지 서식 표시를 일반 문구로 되돌리면 실패. Demo 앱에서 설문 샘플을 열어 서식·줄바꿈·체크 위치를 캡처로 확인. DPI·창 폭 변화·글꼴 누락·키보드 선택 점검과 인터페이스 Excel/Word 반영은 확정 후.

### Front/Server 인계(55-3·55-4)
- 관리자 편집: 콘텐츠 제목·설명(PopupEditorDialog), 문항 제목·설명·선택지 문구(PopupQuestionEditor)에 TEXT의 `PopupRichTextEditor`·`popupRichText.ts`(htmlToBlocks·blocksToPlainText) 재사용. 여러 편집기 간 선택 범위·팔레트 상태 분리, 문항 추가·삭제·정렬·템플릿 불러오기에서 서식 보존.
- 서버: `PopupRichText.validateAndDerivePlainText`를 필드별로 적용하고(현재 TEXT 외 유형 저장 거부 해제 필요) 위 상한으로 파생 일반 문자열 검사. 콘텐츠 제목·설명 서식은 `CONTENT_OPTIONS`에 저장 가능. 문항·선택지 서식은 `POPUP_QUESTION`·`POPUP_OPTION`에 저장 위치가 없으므로 문항 템플릿 버전과 함께 저장할 위치 결정(DDL 포함). API에는 JSON 배열로 반환.
- 미리보기: `SurveyPreview.tsx`·`PopupPreview.tsx`에서 같은 서식 표시.

## 서버·관리자 웹 반영 (2026-10-19)

결정: 55-1 초안의 필드 이름·위치·우선순위를 그대로 확정한다. 문항·선택지 서식은 문항 템플릿 행에 CLOB 컬럼으로 저장한다(템플릿 버전과 함께 보존).

- 55-4 DB: `db/oracle/17_question_rich_text_oracle.sql` — `POPUP_QUESTION.TITLE_BLOCKS`·`DESCRIPTION_BLOCKS`, `POPUP_OPTION.TEXT_BLOCKS`(CLOB JSON 배열, NULL = 서식 없음). `01` 신규 스키마에도 반영. 콘텐츠 제목·설명 서식은 기존 `CONTENT_OPTIONS`(DDL 없음).
- 55-4 서버: `PopupSurveyRichText`가 저장 전 정규화 — 각 필드를 `PopupRichText.validateAndDerivePlainText`(TEXT와 같은 허용 값)로 검증하고 일반 문자열을 서식에서 파생(독립 편집 금지), 필드별 상한(제목 200·설명 2000·문항 제목 1000·문항 설명 2000·선택지 1000) 검사. `null`·`[]`·글자 없는 문단만이면 서식을 지우고 요청 일반 문자열 사용. SURVEY·QUIZ 외 유형의 콘텐츠 서식 키는 거부. 정규화 결과로 문항 템플릿 재사용을 비교하므로 서식만 바뀌어도 새 템플릿을 만든다. DTO(`PopupQuestionDto.titleBlocks`·`descriptionBlocks`, `PopupOptionDto.textBlocks`)는 NON_NULL로 서식 없을 때 키 생략, 기존 생성자 유지. 저장 JSON이 손상되면 문항·선택지 ID와 함께 실패(CONTENT_OPTIONS 정책과 같음). WPF 응답(`withoutAnswerKey`)에도 서식 유지.
- 55-3 관리자 웹: `PopupRichTextEditor`에 `compact`(툴바 숨김·낮은 높이, 서식은 우클릭·'서식' 버튼 펼침 패널) 추가. `PopupQuestionEditor`의 문항 제목·설명·선택지, `PopupEditorDialog`의 설문·퀴즈 콘텐츠 제목·설명을 서식 편집기로 교체. 편집기마다 선택 범위·패널 상태가 따로이며, 선택지는 `optionId`로 key를 잡아 삭제 후에도 내용·커서가 섞이지 않는다. 새 문항·선택지 임시 ID는 순번을 더해 겹치지 않게 했다. 문항 템플릿·팝업 템플릿·불러오기에서는 편집기를 다시 연다. 글자가 없으면 서식을 보내지 않는다. 서식 편집기는 글자 수 제한 입력이 없어 저장 전 검증에 서버와 같은 상한을 추가했다.
- 미리보기: 공용 `PopupRichBlocks`로 콘텐츠 제목·설명, 문항 제목(필수 `*`·선택 안내는 마지막 문단 끝)·설명, 선택지(접근 가능한 이름은 일반 문구)를 서식으로 표시. VIDEO+QUIZ는 WPF와 같이 서식 설명을 퀴즈 머리말에서 숨기지 않는다.
- 검증: 서버 `PopupSurveyRichTextTest` 8건(파생·빈 서식·오류·콘텐츠·저장 JSON·재조회와 템플릿 재사용·손상 JSON·요청 역직렬화), 로컬 XE 실DB `PopupQuestionDatabaseTest` 2건(서식 저장·재조회·재사용, 롤백 전용). 웹 `scripts/verify-survey-rich-text-55.cjs` 23건(실제 CKEditor 여러 개 분리·패널 적용 범위·삭제 후 ID 유지·빈 서식·상한·다중 문단·임시 ID·미리보기 서식과 접근성 이름·VIDEO+QUIZ 머리말).
- 남은 55-10: 관리자 웹 실제 로그인 화면에서 저장→재조회→WPF 표시 왕복, 원격 개발 DB 17 스크립트 실행, 인터페이스 Excel·Word·PDF 반영, WPF DPI·창 폭·키보드 실화면.

## 관련 과제
TODO28(TEXT 서식, §10 확장), TODO48(서버 검증/WPF 표시 방어 분리), TODO49(들여쓰기·팔레트), TODO51(API Demo), TODO52(선택지 제어·공통 동작), TODO53(정합성·VIDEO+QUIZ 머리말), TODO54(Demo 상세옵션 UX).

## 완료 기준
설문·퀴즈의 대상 표시 필드에서 TEXT와 같은 구간 서식이 보존되며 기존 일반 문자열 데이터도 정상 표시된다. 문항/선택지 ID와 답변·채점 결과는 서식 때문에 바뀌지 않는다. 긴 문구·혼합 크기·들여쓰기에서도 선택 및 제출이 가능하다. WPF 검증 결과와 Front/Server 인계·미실행 항목을 구분해 기록한다.

Trello: https://trello.com/c/kn6flUiH
