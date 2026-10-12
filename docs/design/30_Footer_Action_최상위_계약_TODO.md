# 30. Footer Action 최상위 계약 및 3모드 정리 TODO

## 1. 목적

현재 `footerAction`과 `footerLinkUrl`은 `content` 내부에서 읽는다.

```json
{
  "content": {
    "footerAction": "LINK_AND_CLOSE",
    "footerLinkUrl": "https://example.com"
  }
}
```

하지만 Footer는 특정 TEXT/IMAGE/VIDEO 콘텐츠의 속성이 아니라 **PopupWindow 공통 영역의 동작**이다.

현재 최상위에도 이미 다음 공통 Footer 필드가 존재한다.

- `showFooter`
- `showFooterButton`

따라서 Footer 관련 계약을 같은 레벨로 정리한다.

---

## 2. 목표 구조

변경 후:

```json
{
  "popupId": "POPUP-001",
  "popupType": "IMAGE",
  "showFooter": true,
  "showFooterButton": true,
  "footerAction": "LINK_AND_CLOSE",
  "footerLinkUrl": "https://example.com",
  "content": {
    "imageUrl": "https://example.com/image.png"
  }
}
```

역할:

```text
popups[] 최상위
→ 팝업 전체 공통 정책/동작

content
→ 타입별 화면 콘텐츠/표현
```

---

## 3. footerAction 모드

신규 계약은 다음 3개 값으로 명시한다.

### 30-01. CLOSE

적용:
- 일반 TEXT / IMAGE / VIDEO

동작:

```text
Footer 버튼 클릭
→ 팝업 종료 처리
→ 필요한 결과 생성
→ 창 닫기
```

`footerLinkUrl`은 사용하지 않는다.

### 30-02. LINK_AND_CLOSE

적용:
- 링크 이동이 필요한 일반 팝업

동작:

```text
Footer 버튼 클릭
→ footerLinkUrl을 기본 브라우저로 열기
→ 링크 실행 성공
→ 팝업 종료 처리
```

조건:
- `footerLinkUrl` 필수.
- 절대 HTTP/HTTPS URL만 허용.
- URL이 잘못되었거나 브라우저 실행이 실패하면 창을 유지하고 오류를 안내한다.

### 30-03. SUBMIT

적용:
- SURVEY
- QUIZ
- VIDEO+QUIZ

동작:

```text
Footer 버튼 클릭
→ 응답 수집
→ 필수 응답 검증
→ QUIZ면 로컬 채점
→ 성공 결과 생성
→ 결과 큐 저장/전송
→ 창 닫기
```

QUIZ 미통과:

```text
SUBMIT
→ 채점
→ passingScore 미달
→ 안내
→ 창 유지
→ 답안 수정 후 재제출
```

별도 `CloseOnFail` 필드는 사용하지 않는다.

---

## 4. 팝업 타입별 정책

| popupType | footerAction 기본/허용 정책 |
|---|---|
| TEXT | CLOSE / LINK_AND_CLOSE |
| IMAGE | CLOSE / LINK_AND_CLOSE |
| VIDEO | CLOSE / LINK_AND_CLOSE |
| SURVEY | SUBMIT 고정 |
| QUIZ | SUBMIT 고정 |
| VIDEO+QUIZ | popupType=QUIZ이며 SUBMIT 고정 |

### 정책 원칙

SURVEY/QUIZ에서 관리자가 `footerAction=CLOSE` 또는 `LINK_AND_CLOSE`를 보내더라도
제출 의미가 사라지면 안 된다.

권장 구현은 서버가 저장/응답 단계에서:

```text
SURVEY / QUIZ
→ footerAction = SUBMIT
```

으로 정규화하거나 잘못된 값은 등록 오류로 처리하는 것이다.

WPF도 방어적으로 popupType이 SURVEY/QUIZ이면 SUBMIT을 우선한다.

---

## 5. showFooter / showFooterButton 관계

`footerAction`은 Footer 버튼의 **동작**을 정의한다.

각 필드 책임:

- `showFooter`
  - Footer 영역 자체의 표시 여부.
- `showFooterButton`
  - 일반 팝업에서 Footer Action 버튼 표시 여부.
- `footerAction`
  - 버튼 클릭 시 동작.
- `footerLinkUrl`
  - LINK_AND_CLOSE 전용 URL.

SURVEY/QUIZ는 응답 제출 경로가 사라지면 안 되므로 기존 정책처럼 제출 버튼을 보장한다.

```text
SURVEY / QUIZ
showFooter=true
→ 공통 Footer의 SUBMIT 버튼 사용

showFooter=false
→ View 내부 Submit 경로 유지

showFooterButton=false
→ 제출 버튼 자체를 제거하는 의미로 사용하지 않음
```

---

## 6. DTO 목표

C# `PopupResponseDto`에 최상위 필드 추가:

```csharp
public string FooterAction { get; set; } = "CLOSE";
public string FooterLinkUrl { get; set; } = string.Empty;
```

`PopupFactory`는 기존:

```csharp
GetContentString(popupDto.Content, "footerAction")
GetContentString(popupDto.Content, "footerLinkUrl")
```

경로를 제거하고 최상위 DTO 값을 사용한다.

장기 목표:

```csharp
FooterAction
→ enum 변환
→ CLOSE / LINK_AND_CLOSE / SUBMIT 외 값은 명확히 처리
```

---

## 7. 서버 목표

Java `WpfPopupItem`에 다음 최상위 필드를 추가한다.

- `footerAction`
- `footerLinkUrl`

현재 `popup_content.content_options_json` 등에 저장되어 있더라도
**저장 위치와 API 응답 위치는 반드시 같을 필요는 없다.**

권장 흐름:

```text
DB/content_options_json
    ↓
서버 응답 조립
    ↓
footerAction/footerLinkUrl 추출
    ↓
WpfPopupItem 최상위 필드로 응답
    ↓
content 응답에서는 두 key 제거
```

따라서 DB 컬럼을 즉시 추가하지 않고도 API 계약을 먼저 정리할 수 있는지 확인한다.

---

## 8. 하위 호환 정책

구버전 WPF는 기존처럼:

```text
content.footerAction
content.footerLinkUrl
```

을 읽는다.

신규 서버가 즉시 content에서 제거하면 구버전은 링크 동작을 잃을 수 있으므로 전환 순서를 정한다.

권장:

### 단계 1

서버:
- 최상위 `footerAction/footerLinkUrl` 추가.
- 기존 content 값도 일시 유지.

신규 WPF:
- 최상위 값을 우선 사용.
- 필요 시 이행 기간 동안 content fallback 검토.

### 단계 2

지원 최소 WPF 버전 상향.

### 단계 3

서버:
- content 내부 `footerAction/footerLinkUrl` 제거.

WPF:
- content fallback 제거.

구버전 호환이 필요하지 않은 배포 환경이면 최소 지원 버전을 즉시 상향하고 단계 1의 중복 전송 기간을 생략할 수 있다.

---

## 9. 구현 TODO

- [ ] 30-01 `footerAction` 계약을 CLOSE / LINK_AND_CLOSE / SUBMIT 3값으로 정의
- [ ] 30-02 `footerAction`을 `content`에서 `popups[]` 최상위로 이동
- [ ] 30-03 `footerLinkUrl`을 `content`에서 `popups[]` 최상위로 이동
- [ ] 30-04 C# `PopupResponseDto.FooterAction` 추가
- [ ] 30-05 C# `PopupResponseDto.FooterLinkUrl` 추가
- [ ] 30-06 `PopupFactory`가 최상위 Footer 값을 사용하도록 변경
- [ ] 30-07 CLOSE 동작 회귀 검증
- [ ] 30-08 LINK_AND_CLOSE URL 열기/실패 동작 검증
- [ ] 30-09 SURVEY Footer Action을 SUBMIT으로 고정
- [ ] 30-10 QUIZ Footer Action을 SUBMIT으로 고정
- [ ] 30-11 VIDEO+QUIZ Footer Action을 SUBMIT으로 고정
- [ ] 30-12 QUIZ 불합격 시 창 유지 및 재제출 회귀 검증
- [ ] 30-13 Java `WpfPopupItem` 최상위 Footer 필드 추가
- [ ] 30-14 서버 응답 조립 시 content의 Footer 값을 최상위로 승격
- [ ] 30-15 관리자 API에서 popupType별 허용 Action 검증 추가
- [ ] 30-16 LINK_AND_CLOSE일 때 footerLinkUrl 필수/URL 형식 검증
- [ ] 30-17 SURVEY/QUIZ에 CLOSE/LINK_AND_CLOSE가 들어오는 경우의 저장 정책 결정
- [ ] 30-18 구버전 WPF와의 전환 순서 결정
- [ ] 30-19 필요 시 `minimumSupportedVersion` 상향
- [ ] 30-20 content 내부 legacy Footer key 제거
- [ ] `POPUP_INTERFACE_SPEC.md` 공통 필드표 수정
- [ ] 최소/전체 기능 정의서 수정
- [ ] 유형별 Sample JSON 수정
- [ ] Excel 인터페이스 정의서 반영
- [ ] 서버/WPF 계약 테스트 추가
- [ ] TEXT / IMAGE / VIDEO / SURVEY / QUIZ / VIDEO+QUIZ 전체 회귀 검증

---

## 10. 완료 기준

- Footer 관련 공통 필드가 `popups[]` 최상위에 모여 있다.
- `content`에는 타입별 콘텐츠/표현 데이터만 남는다.
- 일반 팝업은 CLOSE / LINK_AND_CLOSE를 명확히 지원한다.
- SURVEY / QUIZ / VIDEO+QUIZ는 SUBMIT 동작이 보장된다.
- 잘못된 Action/URL 조합을 서버에서 차단할 수 있다.
- 구버전/신규 WPF 전환 과정에서 Footer 동작이 조용히 사라지는 문제가 없다.
