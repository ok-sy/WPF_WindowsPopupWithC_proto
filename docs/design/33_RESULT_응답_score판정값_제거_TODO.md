# 33. RESULT 응답 totalScore / passed 제거 TODO

## 1. 목적

QUIZ 채점과 사용자 판정의 책임을 WPF에 둔다.

현재 흐름:

```text
WPF
→ 답안 수집
→ 로컬 채점
→ score 계산
→ passingScore 비교
→ passed 결정
→ 사용자에게 합격/불합격 표시
→ score / passed를 결과 요청으로 전송
```

이 구조에서는 서버가 결과 응답에서 다시 `totalScore`와 `passed`를 내려줄 필요가 없다.

---

## 2. 요청 값은 유지

결과 요청의 다음 값은 유지한다.

- `score`
- `passed`

이유:
- WPF가 최종 판정 주체
- 서버는 WPF가 결정한 결과를 저장
- 서버가 다시 passingScore 규칙을 재구현하지 않아도 됨
- 향후 통과 규칙이 단순 점수 비교 외 정책으로 확장돼도 최종 판정 결과를 그대로 저장 가능

예:

```json
{
  "score": 80,
  "passed": true
}
```

---

## 3. 응답 값은 제거

현재 서버 결과 응답 DTO의 다음 필드는 제거 대상으로 한다.

- `totalScore`
- `passed`

현재 응답 예:

```json
{
  "resultId": "RESULT-001",
  "status": "ACCEPTED",
  "totalScore": 80,
  "passed": true
}
```

목표 응답:

```json
{
  "resultId": "RESULT-001",
  "status": "ACCEPTED"
}
```

서버 응답은 "결과가 정상적으로 처리/저장되었는지"에 집중한다.

---

## 4. 책임 분리

### WPF 책임

- QUIZ 채점
- score 계산
- passed 계산
- 사용자 화면 판정
- 결과 요청에 score/passed 포함

### 서버 책임

- 결과 수신
- 멱등 처리
- 결과 저장
- ACCEPTED / DUPLICATE / REJECTED 응답
- 필요 시 완료 상태 및 저장 식별자 반환

서버가 요청의 score/passed를 검증 로그 용도로 비교하는 것은 가능하지만,
응답 계약으로 동일 값을 다시 내려줄 필요는 없다.

> 2026-10-12 정합성 확인·반영: 기존 서버는 `submitResponse`에서 자체 채점한 점수·통과 여부를 저장하고 WPF 값과 다르면 경고 로그만 남겼다(§2의 "서버는 WPF가 결정한 결과를 저장"과 불일치).
> 이를 WPF 값 저장으로 변경했다. QUIZ SUBMITTED는 `score`·`passed`가 필수(없거나 음수·비정상 수면 REJECTED `WPF_INVALID_RESULT`)이며 POPUP_RESPONSE.TOTAL_SCORE·PASSED_YN과 완료 판정에 그대로 쓴다.
> 서버 계산값은 문항별 상세(POPUP_RESPONSE_ANSWER의 점수·정오답) 저장과 불일치 경고 로그에만 사용한다. SURVEY는 기존처럼 0점·통과로 저장해 제출 즉시 완료한다.

---

## 5. 응답에 유지할 값

> 2026-10-12: 이 목록은 [설계 34](34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md) §3으로 대체되었다. `hiddenUntil`·`watchedRatio`·`requiredRatio`도 응답에서 제거했고, 나머지 항목의 유지·삭제는 설계 34 §3.4 대조표에서 관리한다.

결과 응답은 다음 값 중심으로 유지한다.

- `receivedAt`
- `results[]`
- `resultId`
- `popupId`
- `resultType`
- `status`
- `code`
- `message`
- `popupStatus`
- `completed`
- `completedAt`
- `hiddenUntil`
- `responseId`

영상 관련 `watchedRatio / requiredRatio`는 별도 사용 여부를 추가 검토한다.

---

## 6. 구현 TODO

- [x] 33-01 C# `WpfResultItemResponseDto.TotalScore` 제거
- [x] 33-02 C# `WpfResultItemResponseDto.Passed` 제거
- [x] 33-03 서버 결과 응답 DTO의 totalScore 제거
- [x] 33-04 서버 결과 응답 DTO의 passed 제거
- [x] 33-05 서버 응답 조립 로직에서 두 필드 제거
- [x] 33-06 WPF 응답 처리 코드에서 두 필드 참조 여부 확인 — WPF 응답 처리 코드에서 참조 없음 확인(PopupManager는 로컬 판정만 사용). Demo 게이트웨이 응답 설정 제거
- [ ] 33-07 RESULT_RESPONSE 문서/Excel에서 두 필드 제거 — 계약서 반영. 저장소에 Excel 정의서 없음(미반영)
- [x] 33-08 Sample JSON에서 두 필드 제거 (`api/examples/wpf-results-response.json`, 계약서 11장)
- [x] 33-09 요청의 score/passed는 유지되는지 회귀 검증 — 서버 단위·HTTP 테스트, WPF 행동 검증 통과
- [x] 33-10 QUIZ 로컬 판정 후 서버 응답을 기다리지 않고 기존 UX가 유지되는지 검증 — 로컬 행동 검증(Demo 결과 큐) 통과. 실제 Windows 화면 미확인
- [x] 33-11 (2026-10-12 추가) 서버가 QUIZ의 WPF score/passed를 저장·완료 판정에 사용(QUIZ 필수, 누락 시 REJECTED). Demo 게이트웨이도 같은 규칙

---

## 7. 완료 기준

- QUIZ 최종 판정 책임이 WPF에 명확히 위치한다.
- 결과 요청에는 `score/passed`가 유지된다.
- 결과 응답에는 동일 의미의 `totalScore/passed`가 존재하지 않는다.
- 서버는 결과 처리 상태를 중심으로 응답한다.
