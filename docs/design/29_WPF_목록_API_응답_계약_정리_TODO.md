# 29. WPF 목록 API 응답 계약 정리 TODO

## 1. 목적

WPF 목록 API는 서버가 활성 여부, 노출 기간, 대상자, 숨김, 완료 여부 등 **노출 판정을 모두 끝낸 최종 팝업 목록만 반환**하는 구조다.

따라서 WPF가 화면 표시·사용자 동작·채점에 직접 사용하지 않는 서버 내부 판정용 필드는 목록 API 응답에서 제거하고,
클라이언트 계약을 실제 사용 필드 중심으로 단순화한다.

기본 원칙:

```text
서버 내부 판정에만 필요한 값
→ WPF 목록 API에서 제거

WPF가 화면 표시·사용자 동작·채점에 직접 사용하는 값
→ 유지
```

---

## 2. 제거 확정 후보

### 29-01. WPF PopupResponseDto에서 displayStartAt 제거

현재:
- `PopupResponseDto.DisplayStartAt`은 nullable로 수신한다.
- WPF는 PC 현재 시각과 비교하지 않는다.
- 서버가 노출 시작 시각을 포함한 노출 대상 판정을 완료한 뒤 목록을 반환한다.

변경:
- C# `PopupResponseDto.DisplayStartAt` 제거.
- WPF에서 팝업별 예약 타이머 또는 로컬 시각 판정을 추가하지 않는다.

### 29-02. WPF PopupResponseDto에서 displayEndAt 제거

현재:
- `PopupResponseDto.DisplayEndAt`은 nullable로 수신한다.
- WPF에서 실제 노출 종료 판정에 사용하지 않는다.

변경:
- C# `PopupResponseDto.DisplayEndAt` 제거.
- 종료 시각 판정은 서버 책임으로 고정한다.

### 29-03. 서버 WpfPopupItem에서 displayStartAt 제거

현재 Java `WpfPopupItem`이 `displayStartAt`을 응답에 포함한다.

변경:
- WPF가 사용하지 않으므로 WPF 전용 목록 응답에서는 제거한다.
- 관리자/도메인 내부 데이터에서는 필요 시 유지한다.

### 29-04. 서버 WpfPopupItem에서 displayEndAt 제거

`displayStartAt`과 동일한 이유로 WPF 전용 응답에서는 제거한다.

### 29-05. 서버 WpfPopupItem에서 periodMode 제거

현재:
- 기간/반복 노출 판정은 서버에서 수행한다.
- C# `PopupResponseDto`에는 이미 해당 필드가 없다.

변경:
- WPF 전용 목록 응답에서 제거한다.

### 29-06. 서버 WpfPopupItem에서 repeatInterval 제거

서버 내부 반복 판정용 값이므로 WPF 응답에서 제거한다.

### 29-07. 서버 WpfPopupItem에서 repeatDayOfWeek 제거

서버 내부 반복 판정용 값이므로 WPF 응답에서 제거한다.

### 29-08. 서버 WpfPopupItem에서 repeatDayOfMonth 제거

서버 내부 반복 판정용 값이므로 WPF 응답에서 제거한다.

---

## 3. 삭제 여부 결정 필요 (2026-10-12 결정: 둘 다 유지)

### 29-09. serverTime 제거 여부 확정

현재:
- `WpfPopupListResponseDto.ServerTime`으로 수신한다.
- `MainWindow`의 표시 대상 판단에는 사용하지 않는다.
- 계약 문서에서도 참고용 값으로만 정의되어 있다.

권장:
- 운영 로그/진단 용도가 없다면 ROOT 응답에서 제거한다.
- 유지할 경우 용도를 문서에 명확히 적는다.

### 29-10. userId 제거 여부 확정

현재:
- 사용자는 Authorization/SSO 정보로 서버가 식별한다.
- WPF가 응답의 `userId`를 표시·판정·결과 생성에 사용하지 않는다.

권장:
- 화면/진단 요구가 없다면 ROOT 응답에서 제거한다.
- 사용자 식별의 단일 책임은 인증 계층에 둔다.

---

## 4. 유지 필드

다음 값은 WPF가 실제 동작에 사용하므로 유지한다.

### ROOT

- `pollingIntervalSeconds`
  - 다음 목록 조회 주기 계산에 사용.
- `popups[]`
  - 실제 표시 대상 목록.

### popups[]

- `popupId`
  - 표시 중복 방지, 결과 식별 등에 사용.
- `popupType`
  - 타입별 View 생성.
- `title`
  - 공통 Header 표시.
- `displayMode`
  - SEQUENTIAL / SIMULTANEOUS 표시 제어.
- `displayOrder`
  - 표시 우선순위.
- 크기 관련 값
  - 실제 WPF Window 계산에 사용.
- `showHeader`, `showFooter`, `showFooterButton`
  - 공통 UI 구성.
- `showDoNotShowAgain`, `hideDays`
  - 사용자 숨김 결과 처리.
- `completionRatio`, `allowCloseBeforeComplete`
  - VIDEO / VIDEO+QUIZ 완료·종료 정책.
- `passingScore`
  - QUIZ 로컬 채점.
- `questions[]`
  - SURVEY/QUIZ 입력 및 채점.
- `content`
  - 타입별 화면 콘텐츠 및 표시 옵션.

---

## 5. 명칭 정합성 정리

### 29-11. showCloseButton → showFooterButton 계약 통일

현재:
- Java `WpfPopupItem`: `showCloseButton`
- C#: `showFooterButton`
- C#은 `showCloseButton`을 legacy alias로 수신한다.

변경 방향:
1. 신규 서버 계약명을 `showFooterButton`으로 통일.
2. 서버 응답도 `showFooterButton` 사용.
3. C# legacy `showCloseButton` alias는 이행 기간 후 제거 검토.
4. 두 필드를 동시에 응답하지 않는다.

---

## 6. 목표 ROOT 구조

`serverTime`, `userId` 제거까지 확정하는 경우:

```json
{
  "pollingIntervalSeconds": 3600,
  "popups": []
}
```

즉 WPF 목록 API의 ROOT는 **조회 주기 + 최종 표시 목록**만 전달하는 형태로 단순화한다.

---

## 7. 구현 TODO

- [x] 29-01 C# `PopupResponseDto.DisplayStartAt` 제거
- [x] 29-02 C# `PopupResponseDto.DisplayEndAt` 제거
- [x] 29-03 Java `WpfPopupItem.displayStartAt` 제거
- [x] 29-04 Java `WpfPopupItem.displayEndAt` 제거
- [x] 29-05 Java `WpfPopupItem.periodMode` 제거
- [x] 29-06 Java `WpfPopupItem.repeatInterval` 제거
- [x] 29-07 Java `WpfPopupItem.repeatDayOfWeek` 제거
- [x] 29-08 Java `WpfPopupItem.repeatDayOfMonth` 제거
- [x] 29-09 `serverTime` 최종 삭제 여부 결정 및 반영 — 유지(진단용) 확정, 서버·C# 주석과 계약서에 용도 명시
- [x] 29-10 `userId` 최종 삭제 여부 결정 및 반영 — 유지(진단용) 확정, 용도 명시
- [x] 29-11 `showCloseButton` → `showFooterButton` 계약 통일 — WPF 응답만 전환, 관리자 API·DB 이름 유지, C# legacy 별칭 즉시 삭제(운영 버전 없음)
- [x] `WpfPopupListResponse` 생성부/테스트 수정
- [x] WPF 목록 API JSON 샘플 갱신 (`api/examples/wpf-popups-response.json`)
- [x] `POPUP_INTERFACE_SPEC.md` 필드표 갱신
- [x] 최소/전체 기능 정의서 갱신
- [ ] Excel 인터페이스 정의서 반영 — 저장소에 Excel 정의서 없음(docx·pdf v3.6만 존재). 미반영
- [x] 서버가 제거 전 필드를 보내도 C# 역직렬화가 정상인지 회귀 검증 (로컬 행동 검증)
- [ ] 제거 후 목록 조회·표시·결과 전송 회귀 검증 — 단위·행동 검증 통과, 실제 서버 HTTP·Windows 화면 확인 미실행

---

## 8. 완료 기준

- WPF 목록 API에는 클라이언트가 실제 사용하는 값만 존재한다.
- 노출 기간/반복 판정 책임이 서버와 WPF에 중복되지 않는다.
- WPF는 서버가 반환한 최종 `popups[]`를 별도 시간 판정 없이 표시한다.
- 제거 필드 때문에 기존 표시/채점/결과 전송 동작에 회귀가 없다.
