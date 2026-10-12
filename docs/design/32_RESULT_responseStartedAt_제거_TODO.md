# 32. RESULT responseStartedAt 제거 TODO

## 1. 목적

현재 결과 요청 DTO에는 SUBMITTED 결과에서 다음 두 시각을 함께 보낸다.

- displayedAt
- responseStartedAt

그러나 현재 WPF 구현에서는 둘 다 동일한 `_displayedAt` 값을 사용한다.

현재 코드:

```csharp
DisplayedAt = _displayedAt,
ResponseStartedAt = _displayedAt,
```

즉 현재 계약에서는 두 필드가 의미적으로 중복이다.

---

## 2. 현재 역할

### displayedAt

팝업이 사용자 화면에 처음 표시된 시각.

용도:
- 실제 노출 시각 기록
- 표시 이력/횟수 집계
- 필요 시 체류시간 계산 기준

### responseStartedAt

SUBMITTED 결과에서 응답 시작 시각을 표현하기 위한 필드.

하지만 현재 구현은 별도의 "응답 시작 이벤트"를 수집하지 않고
`displayedAt`을 그대로 복사한다.

---

## 3. 제거 판단

현재 요구사항에서는 다음 계산이 가능하다.

```text
응답/처리 소요시간
= closedAt - displayedAt
```

따라서 별도 응답 시작 시각을 실제로 수집하지 않는 한
`responseStartedAt`은 추가 정보를 제공하지 않는다.

제거 방향:

- WPF 결과 요청 DTO에서 `ResponseStartedAt` 제거
- `PopupResultBuilder.BuildSubmitted`의 할당 제거
- 서버 결과 요청 DTO/저장 로직에서 해당 필드 제거
- 인터페이스 문서/샘플/Excel에서 제거

---

## 4. 다시 필요해지는 조건

향후 아래처럼 실제 첫 응답 시점을 별도로 수집하는 요구가 생기면
다시 도입할 수 있다.

```text
16:00 팝업 표시
→ displayedAt

16:03 첫 문항 선택/입력
→ responseStartedAt

16:07 제출
→ closedAt
```

이 경우에만 responseStartedAt은 displayedAt과 다른 의미를 가진다.

현재는 이 이벤트를 수집하지 않으므로 제거한다.

---

## 5. 구현 TODO

- [x] 32-01 C# `WpfResultItemDto.ResponseStartedAt` 제거
- [x] 32-02 `PopupResultBuilder.BuildSubmitted`의 `ResponseStartedAt = _displayedAt` 제거
- [x] 32-03 서버 결과 요청 DTO의 responseStartedAt 제거
- [x] 32-04 서버 저장/매핑 로직에서 responseStartedAt 의존 여부 확인 후 제거 — PopupService.submitResponse·PopupMapper.upsertPopupResponse(MERGE)에서 제거. 읽는 곳 없음 확인
- [x] 32-05 결과 API 문서에서 responseStartedAt 제거
- [ ] 32-06 RESULT_REQUEST Excel 시트에서 responseStartedAt 제거 — 저장소에 Excel 정의서 없음. 미반영
- [x] 32-07 Sample JSON에서 responseStartedAt 제거 (`api/examples/wpf-results-request.json`, 계약서 10.5)
- [x] 32-08 기존 DB 컬럼이 있으면 유지/삭제 여부 별도 결정 — 삭제로 결정. `db/oracle/12_drop_response_started_at_oracle.sql` 추가, `01` 스키마에서 제거. 로컬·원격 개발 DB 미실행
- [x] 32-09 결과 전송/재전송 회귀 검증 — 서버 단위·HTTP 테스트, WPF 행동·재전송 큐 검증 통과. 실제 서버 HTTP 미실행

---

## 6. 완료 기준

- 결과 요청에는 의미가 중복되는 시각 필드가 없다.
- 표시 시작 시각은 `displayedAt`, 종료/제출 시각은 `closedAt`으로 단순화된다.
- 기존 SUBMITTED 결과 저장 및 통계에 회귀가 없다.
