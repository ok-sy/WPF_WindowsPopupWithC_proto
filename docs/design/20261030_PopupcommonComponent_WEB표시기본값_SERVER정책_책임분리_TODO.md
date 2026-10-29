# PopupcommonComponent WEB 표시 기본값 / SERVER 업무 정책 책임 분리 TODO

작성: 2026-10-30 (KST)
상태: **정책 확정(2026-10-30: 미설정 표현 규칙·F-3 분류) · WEB 이행 1단계 완료(withPreviewFallback·신규 독립 샘플·문구) · 기존 샘플 state 전환 완료** · RgstPop(proto) 전환과 서버 항목은 미실행. 신규 숫자 TODO 번호는 임의 부여하지 않음.
관련: [독립 재사용·선택 필드 추출 TODO](20261030_PopupcommonComponent_독립재사용_필드추출_TODO.md)(공통 컴포넌트 계약 A~E) · [등록·수정 공통 JSON 검증 TODO](20261029_등록수정_공통JSON검증_기본값생성_3111직조회_TODO.md)(서버 검증·기본값 구현) · [팝업 JSON 가공·요청 body 정책](20261029_팝업JSON_가공_요청body_정책정리.md)

## 원칙

WEB 공통 컴포넌트는 사용자 입력·표시·미리보기를 담당하고, 업무 정책·최종 기본값·검증·저장 정합성의 권위는 SERVER에 둔다. 특정 서버 규칙을 공통 UI에 하드코딩하지 않는다.

## 범위

- 이 문서: 책임 정의, 현행 WEB 코드의 분류(F-3), **WEB 쪽 이행**.
- 범위 밖: 서버·DB 구현. 서버 검증·기본값·결과 계약 구현은 [등록·수정 공통 JSON 검증 TODO](20261029_등록수정_공통JSON검증_기본값생성_3111직조회_TODO.md)에서 진행한다(F-2·F-4의 서버 항목은 그쪽 완료 조건과 연결).
- 서버 경로가 둘이므로 항목마다 대상을 적는다: **proto 관리자 저장 API**(`PopupService`·`PopupQuestionRules`, RgstPop이 사용) / **3117 등록 경로**(`PopupJsonValidator`, 폐쇄망 인계 샘플).

## F-1. WEB 책임

- [x] 렌더·입력 편의상 필요한 UI 초기값과 **미리보기 전용 fallback**만 정의한다. 원본 편집값(state)을 미리보기 때문에 덮어쓰지 않는다 → 구조: state는 입력한 값만 갖고, 미리보기에 넘길 때만 fallback을 합친다(`withPreviewFallback(state)`).
- [x] `withPreviewFallback()`은 `createDefaultPopup()` 전체를 합치지 않고 **미리보기 렌더에 실제 필요한 필드만** 합성한다(창 크기·비율·Header/Footer 표시, 유형 렌더에 필요한 표시 옵션 등). 표시용 기본값이 미리보기 안에서 업무 정책처럼 동작하지 않게 하기 위함이며, 합성 대상 필드 목록을 함수 주석·가이드에 명시한다. 기간·반복·대상·완료 기준 같은 업무 값은 합성하지 않는다. → 2026-10-30 `popupPreviewFallback.ts`(`PREVIEW_FALLBACK`: popupId·popupType·title·sizeMode·width·height·비율·최소/최대·showHeader·showCloseButton·showFooter·showDoNotShowAgain·showLater·hideDays·completionRatio·passingScore·questions, content는 state 값만 — 미리보기가 PopupPreview에서 실제로 읽는 필드 기준).
- [ ] 입력 단계의 형식·유형·범위 오류는 즉시 안내할 수 있으나 서버 최종 판정으로 간주하지 않는다(문구에 "저장 시 서버가 최종 확인" 취지 유지).
- [x] 미리보기 시뮬레이션(설문·퀴즈 채점, 노출 일정 요약, 동영상 시청 비율)은 표시 목적임을 구분하고, 서버 결과와 다를 수 있는 규칙을 확정 정책처럼 안내하지 않는다. → 노출 일정 요약 문구를 "안내용 요약이며 최종 노출은 서버가 한국 시간으로 판단"으로, 주석의 "확정 정책"을 "서버 정책, 화면 문구는 안내용"으로 정리.
- [x] `pickPopupFields()`는 선택한 값을 그대로 반환한다(서버 정책 적용·날짜 ISO 변환·대상 판정·완료 판정 없음) — A~E TODO에서 구현.
- [x] 업무 기본값 미설정과 사용자의 명시값(false·0·빈 문자열)을 구별한다 — 신규 독립 샘플(`PopupIndependentSamples`)·가이드 실행기 state를 미설정(키 생략) 기준으로 전환. 기존 샘플(`IS063M02Sample`·`PopupListSample`·`PopupSampleEditor`)도 state를 미설정 기준(`SamplePopupState`·`newSamplePopup`·`changeSampleType`, 미리보기 `withPreviewFallback`)으로 전환(2026-10-30), RgstPop은 proto 유지.

### 미설정 표현 규칙 (확정 2026-10-30)

기본은 **키 생략**이다. 명시적인 값 제거가 필요한 경우에만 `null`을 쓰되, 현재 구현에서는 `null`도 서버 기본값 적용 대상으로 둔다.

| 값 | 의미 | 처리 |
|---|---|---|
| 키 생략 | 사용자가 설정하지 않음 | 서버 기본값 적용 가능 |
| `null` | 값 없음 또는 명시적 초기화 | 필드 계약에 따라 처리. **현재는 생략과 같이 기본값 적용 대상**(3117 `PopupJsonValidator`의 누락·null 기본값 처리와 충돌 방지). 명시적 초기화가 필요한 필드는 별도 계약을 만든다 |
| `false` | 명시적으로 비활성화 | 그대로 전달 |
| `0` | 명시적으로 0 설정 | 그대로 전달 |
| `''` | 명시적 빈 문자열 | 필드별 허용 여부 결정 |

필드별 `''`:

| 필드 | `''`의 의미 | 처리 |
|---|---|---|
| `title` | 필수 제목 누락 | 서버 오류(저장 거절) |
| `description` | 명시적으로 설명 없음 | 그대로 저장 |
| `plainText` | 명시적으로 본문 없음 | 그대로 전달, 본문 필수 여부는 유형별 서버 검증 |

- `undefined` 키는 `JSON.stringify`에서 지워지므로 전송 단계에서는 "생략"과 같다. `pickPopupFields`는 키가 있으면 undefined도 보존하지만 직렬화 후에는 생략된다.
- 현행 문제(이행 대상): `createDefaultPopup()`이 `title`·`description`·`plainText`를 `''`로, 업무 기본값(`defaultVolume 0.7` 등)을 state에 직접 채운다. 그래서 `pickPopupFields`로 뽑으면 기본값이 사용자 설정처럼 전송된다(샘플은 2026-10-30 최상위 기간 필드만 제외, content 기본값은 아직 포함). 신규 독립 화면부터 state를 미설정(키 생략)으로 시작하고 미리보기는 `withPreviewFallback`으로 그린다.

## F-2. SERVER 책임 (구현은 등록·수정 공통 JSON 검증 TODO)

- 저장·수정 단계에서 필수값·자료형·ENUM·범위·교차 필드 조건을 최종 검증한다.
- 허용된 누락값에만 업무 기본값을 적용하고, 잘못된 명시값은 기본값으로 덮지 않고 오류 처리한다.
- 날짜·시간대·기간 정책, 게시·반복·대상 조건, 유형별 완료 기준, 저장 정규화, 실제 노출·응답 판단을 서버가 결정한다.
- 검증 실패 시 저장을 중단하고 WEB이 필드별 오류를 표시할 수 있는 결과 계약을 제공한다.
- 저장 후 정규화된 값과 정책 버전·적용된 기본값을 필요에 따라 반환해 표시·미리보기와 연결한다.

| 항목 | 3117 등록 경로 | proto 관리자 저장 API |
|---|---|---|
| 오류를 모아 반환 | 있음 — `PopupJsonValidationResult`·`PopupJsonIssue {path, code, expected, actual, message}` | 문항 규칙 등 개별 검증, 필드별 오류 계약은 없음(메시지 단위) |
| 누락에만 기본값·명시 오류 거절 | 있음(YAML 기본값, 변경 이력 `PopupJsonChange`) | 확인 필요(저장 시 일부 필드 검증, 기본값 적용 위치 조사 대상) |
| 정규화 결과·정책 버전 반환 | 결과 객체에 정책 버전·정규화 popup | 없음 |
| 실제 등록 API 연결 | 인계 샘플(`PopupFullJsonRegisterSampleService`)까지, 운영 연결 미정 | RgstPop이 사용 중 |

## F-3. 기존 구현 분류와 이행 (확정 2026-10-30)

| 항목 | 확정 책임 | 현행 위치 | 비고 |
|---|---|---|---|
| 창 크기·비율(560×420·0.7/0.75·최대 1200×900) | WEB 미리보기 fallback / SERVER 저장 기본값 | `createDefaultPopup()` | 서버 기본값과 미리보기 fallback이 다를 수 있음을 가이드에 명시 |
| 최소 창 크기(300×300) | WEB 입력 안내 / SERVER 최종 검증 | `POPUP_MIN_WINDOW_SIZE`·저장 전 검사 | 서버·WPF와 같은 값(TODO68) |
| 게시 기간·반복(노출 기간·`periodMode`·요일·시간대) | WEB 입력 / SERVER 정책·검증 | `createDefaultPopup()`(신규 초기값)·`PopupScheduleFields`·`validatePopupSchedule` | 독립 화면은 일정 입력이 없으면 보내지 않음(샘플 적용) |
| 영상·오버레이 옵션(`defaultVolume`·`backgroundOverlayOpacity`·`useBackgroundOverlay`·`imageSizeMode`·`showDescription`·영상 재생 옵션) | WEB 미리보기 fallback / SERVER 기본값 | `createDefaultPopup()` content | state에 넣지 않고 미리보기 합성으로 |
| URL 보정(`https://`) | WEB 미리보기 편의 / SERVER 저장 정규화 | `normalizePopupLink`(미리보기)·`toSaveRequestPopup()` | |
| 유형별 content 필터링(·Footer 정규형·IMAGE 크기 정리) | SERVER 최종 정합성 | `toSaveRequestPopup()` | 3117 샘플 서버는 계약 외 키 제거·공통 옵션 이동을 이미 함 |
| 문항·퀴즈 검증(`validatePopupQuestions`·`selectionLimitError`·`withQuizRule`·`validateQuizRule`) | WEB 즉시 안내 / SERVER 최종 검증 | `PopupQuestionEditor`·`popupQuizRule.ts` | 서버 `PopupQuestionRules`와 같은 규칙(중복 허용) |
| 노출·완료 판정(노출 일정 요약·조회 주기 안내·퀴즈 채점·시청 비율) | SERVER 정책 / WEB 시뮬레이션 | `PopupScheduleFields`·`PopupPreview` | "확정 정책" 표기를 표시용 안내로 정리 |
| 날짜 ISO 변환 | proto 호환(RgstPop) / 다른 화면은 각자 저장 경계 | `toSaveRequestPopup()` | |

적용 범위: **신규 독립 화면부터** 위 책임을 적용한다. 기존 proto `toSaveRequest()`·`toSaveRequestPopup()`·`createDefaultPopup()`·RgstPop은 당장 유지하고, 서버의 대응 구현(누락 기본값·최종 검증·정규화)이 준비된 뒤 점진적으로 전환한다.

이행 원칙:
- [ ] proto 저장 경로(`toSaveRequest`·`toSaveRequestPopup`·`createDefaultPopup`·RgstPop)는 즉시 제거하거나 계약을 바꾸지 않는다. 서버 정책 수용이 확인된 기능만 단계적으로 이관한다.
- [ ] 서버 기본값과 UI 미리보기 fallback이 다를 수 있음을 가이드에 명시한다. 정확한 재현이 필요한 미리보기는 서버 검증·정규화 결과를 쓰도록 후속 연동 범위로 분리한다.
- [ ] 공통 컴포넌트는 백엔드의 특정 스키마·테이블을 알지 않는다. 서버 연동 방식은 호출하는 업무 화면이 정한다.
- [x] 미리보기 fallback 합성 함수 `withPreviewFallback`을 공통 모듈(`popupPreviewFallback.ts`, index export)에 두고 신규 독립 샘플·가이드 실행기 state에서 업무 기본값을 뺐다(proto RgstPop은 호환 유지, proto 비교용 실행기 줄만 createDefaultPopup 사용).

## F-4. 검증

WEB(이 문서):
- [x] 미리보기 fallback을 적용해도 입력 원본과 `pickPopupFields()` 결과가 바뀌지 않는다(독립 샘플 ④ — 추출 결과에 fallback 필드 없음, 실화면 확인).
- [ ] 미설정(생략·null)과 명시 false·0·빈 문자열이 입력·추출·전송(JSON 직렬화)까지 의도대로 구별된다.
- [x] 현재 proto 등록·미리보기·저장 회귀 없음 — 하네스 transform-64 77·common-sample-69 34·rgstpop-quiz-rule 11·preview-61 52·completion-ux-43 71·rich-text-49 60·image-preview 34·survey-rich-text-55 23건, 운영 빌드 성공.

SERVER(등록·수정 공통 JSON 검증 TODO와 연결):
- [ ] 유효하지 않은 명시값이 서버에서 거절되고, 허용된 누락값에만 서버 기본값이 적용된다.
- [ ] 서버 정규화 결과로 다시 조회했을 때 WEB 표시가 모순되지 않는다.

## 제외 범위
- 3111/3117 등 개별 테이블 전용 Adapter 구현, 서버·DB 구현(연결 TODO에서 진행), 원본 저장 API 리팩터링.
- 공통 컴포넌트가 외부 저장 형식을 추측하거나 강제하는 기능.
