# 12. WPF 결과 제출 UX 및 로컬 판정 구조 변경 계획

## 0. 목적

사용자가 팝업을 닫거나 설문/퀴즈를 제출할 때 서버 API 응답을 기다리느라 화면이 멈춰 보이는 UX를 없앤다.

현재 사용 범위는 다음 정도로 본다.

- 신규 입사자 안내 영상 시청 여부 확인
- 간단한 설문
- 간단한 퀴즈
- 필수 응답 여부 확인
- 교육/안내성 점수 또는 통과 여부 표시

따라서 사용자 화면에서 필요한 검증과 판정은 WPF에서 즉시 처리하고,
서버 결과 전송은 로컬 큐에 안전하게 저장한 뒤 팝업이 닫힌 후 백그라운드에서 수행한다.

핵심 목표:

```text
사용자 화면 처리
→ 즉시 완료

서버 결과 저장
→ 사용자 화면과 분리
→ 백그라운드 처리
```

---

## 1. 최종 동작 원칙

다음 결과는 모두 서버 응답을 기다리지 않는다.

```text
TEXT CLOSED
IMAGE CLOSED
HIDDEN
VIDEO_WATCHED
SURVEY SUBMITTED
QUIZ SUBMITTED
```

사용자 화면 흐름:

```text
사용자 입력/닫기
↓
WPF 로컬 검증
↓
필요 시 점수 계산 및 통과 여부 표시
↓
결과 객체 생성
↓
pending-results.json에 먼저 저장
↓
팝업 닫기
↓
백그라운드 결과 API 전송
↓
성공 시 pending 제거
실패 시 pending 유지
↓
다음 Flush 또는 다음 프로그램 실행 시 재전송
```

---

## 2. 기존 구조와 변경 방향

현재 신규 결과 구조에는 이미 다음 기반이 있다.

```text
PopupResultBuilder
PopupResultQueue
pending-results.json
resultId 기반 멱등성
시작 시 Flush
```

따라서 결과 API를 사용자 UI와 분리하기 위한 기반은 이미 존재한다.

### 기존

```text
설문/퀴즈 제출
↓
서버 결과 API 호출
↓
서버 응답 대기
↓
점수/통과 여부 확인
↓
사용자 화면 처리
```

### 변경 후

```text
설문/퀴즈 제출
↓
WPF 필수응답 검사
↓
WPF 점수 계산
↓
WPF 통과 여부 판단
↓
사용자에게 즉시 결과 표시
↓
결과 로컬 큐 저장
↓
팝업 닫기
↓
서버 결과 API 백그라운드 전송
```

---

## 3. 필수 응답 검증 위치

필수응답 검증은 WPF의 Survey/Quiz 화면에서 수행한다.

예:

```csharp
if (question.IsRequired && !HasAnswer(question))
{
    MessageBox.Show(
        "필수 문항에 응답해주세요.");

    return;
}
```

서버 응답을 기다릴 필요 없이
사용자가 제출 버튼을 누른 즉시 누락 문항을 안내한다.

검증 대상 예:

```text
SINGLE_CHOICE
MULTIPLE_CHOICE
TEXT
RATING5
```

---

## 4. 퀴즈 점수 계산 위치

QUIZ의 점수 계산도 WPF에서 수행한다.

WPF가 이미 가지고 있는 다음 정보를 사용한다.

```text
question.IsScored
question.CorrectAnswers
사용자 선택값
passingScore
```

예:

```csharp
int score =
    CalculateScore();

bool passed =
    score >= passingScore;
```

사용자 화면에서는 서버 응답과 관계없이 즉시:

```text
80점 / 통과
```

또는:

```text
60점 / 미통과
```

형태로 결과를 표시할 수 있다.

---

## 5. 동영상 시청 확인

현재 실제 사용 목적은 신규 입사자 안내 영상 등에서
사용자가 영상을 충분히 시청했는지 확인하는 수준이다.

따라서 WPF가 기존처럼 로컬에서 다음 값을 계산한다.

```text
재생 위치
전체 길이
누적 시청 비율
completionRatio
allowCloseBeforeCompletion
```

예:

```text
completionRatio = 0.9

→ 영상의 90% 이상 시청하면 완료 처리
```

사용자가 창을 닫는 시점에 WPF가 최종 시청 결과를 만든다.

```text
VIDEO_WATCHED
positionSeconds
durationSeconds
completionRatio 또는 완료 여부
```

이 결과 역시 서버 응답을 기다리지 않고 로컬 큐에 저장한 뒤 창을 닫는다.

서버는 최종 시청 결과를 저장하는 역할에 집중한다.

---

## 6. 서버 역할

변경 후 서버는 사용자 화면 판정의 주체가 아니라
결과를 안전하게 저장하는 역할에 집중한다.

서버 역할:

```text
결과 수신
↓
resultId 중복 확인
↓
필요한 DB 상태 반영
↓
결과 저장
```

예시 요청 데이터:

```json
{
  "resultId": "GUID",
  "popupId": "P001",
  "resultType": "SUBMITTED",
  "score": 80,
  "passed": true,
  "answers": [
    {
      "questionId": "Q1",
      "values": ["A"]
    }
  ]
}
```

---

## 7. 사용자 화면과 서버 전송 분리

중요한 원칙:

팝업을 먼저 닫고 메모리에서만 결과를 전송하면 안 된다.

잘못된 예:

```csharp
Close();

_ = api.SendResultAsync(result);
```

이 경우 WPF 프로세스가 종료되거나 네트워크 오류가 발생하면
결과가 유실될 수 있다.

반드시 다음 순서를 보장한다.

```text
1. 결과를 pending-results.json에 저장
2. 사용자 UI 종료
3. 서버 전송 시도
```

즉 사용자 입장에서는 즉시 닫히지만,
내부적으로는 결과를 먼저 로컬에 안전하게 보관한다.

---

## 8. PopupResultQueue 권장 역할

현재 `PopupResultQueue`를 다음처럼 역할 분리하는 방향을 검토한다.

### 8.1 Enqueue

```text
result
↓
pending-results.json 저장
↓
즉시 반환
```

### 8.2 Flush

```text
pending-results.json 읽기
↓
결과 API 전송
↓
성공 항목 제거
↓
실패 항목 유지
```

개념 예:

```csharp
await _resultQueue.EnqueueAsync(result);

// 이 시점이면 결과는 로컬에 안전하게 보존됨.
// Window는 이미 닫혀 있거나 바로 닫아도 됨.

_ = SendPendingResultsSafelyAsync();
```

백그라운드 전송은 반드시 내부 예외를 처리해야 한다.

```csharp
private async Task SendPendingResultsSafelyAsync()
{
    try
    {
        await _resultQueue.FlushAsync();
    }
    catch (Exception exception)
    {
        Debug.WriteLine(exception);
        // 실패 결과는 pending 파일에 유지한다.
    }
}
```

---

## 9. 결과 종류별 최종 정책

| 결과 종류 | WPF 즉시 처리 | 서버 응답 대기 |
|---|---|---|
| CLOSED | 닫기 | 없음 |
| HIDDEN | 닫기 | 없음 |
| VIDEO_WATCHED | 시청 완료 여부 판단 후 닫기 | 없음 |
| SURVEY SUBMITTED | 필수응답 검사 후 닫기 | 없음 |
| QUIZ SUBMITTED | 필수응답 검사 + 점수/통과 표시 후 닫기 | 없음 |

즉 사용자 화면 기준으로 모든 결과 전송을 비동기화한다.

---

## 10. 신뢰성 범위

현재 용도는 다음과 같은 사내 안내/교육성 기능이다.

```text
신규 입사자 안내 영상
간단한 퀴즈
간단한 설문
시청 여부 확인
```

따라서 현재 범위에서는:

```text
WPF에서 필수응답 검증
WPF에서 점수 계산
WPF에서 통과 여부 판단
WPF에서 영상 시청 완료 여부 판단
서버는 결과 저장
```

구조로 단순화한다.

법적 필수교육 인증, 보안 권한 부여, 인사평가처럼
결과 위변조 방지가 중요한 시스템으로 사용 범위가 확대될 경우에만
서버 재채점/재검증을 별도 검토한다.

현재 범위에서는 서버 재채점은 구현하지 않는다.

---

## 11. 수정 예상 파일

주요 후보:

```text
popup-frameWork/Popup/Views/Contents/SurveyPopupView.xaml.cs
popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs
popup-frameWork/Popup/Managers/PopupManager.cs
popup-frameWork/Popup/Service/PopupResultBuilder.cs
popup-frameWork/Popup/Service/PopupResultQueue.cs
popup-frameWork/Popup/Dtos/*
```

서버는 실제 구현 시 현재 결과 DTO와 저장 로직을 확인하고
WPF가 보낸 score/passed/video 결과를 저장하는 방향으로 최소 변경한다.

---

## 12. 테스트 항목

### T1. 일반 닫기

```text
TEXT 팝업 닫기
```

기대:

```text
창 즉시 닫힘
pending 저장
서버 전송 지연이 UI에 영향 없음
```

### T2. 네트워크 단절 상태 닫기

기대:

```text
창 즉시 닫힘
pending 유지
다음 Flush에서 재전송
```

### T3. SURVEY 필수응답 누락

기대:

```text
서버 호출 없이 WPF에서 즉시 제출 차단
누락 안내 표시
```

### T4. SURVEY 정상 제출

기대:

```text
필수값 통과
결과 로컬 저장
창 닫힘
서버 전송은 백그라운드
```

### T5. QUIZ 통과/미통과

기대:

```text
WPF에서 점수 계산
WPF에서 통과 여부 표시
결과 로컬 저장
창 닫힘
서버 응답 대기 없음
```

### T6. VIDEO 시청 완료

기대:

```text
WPF에서 시청 비율 판단
완료 기준 충족 시 닫기 허용
VIDEO_WATCHED 결과 로컬 저장
창 닫힌 뒤 백그라운드 전송
```

### T7. VIDEO 완료 전 닫기 금지

```text
allowCloseBeforeCompletion = false
completionRatio 미달
```

기대:

```text
WPF가 즉시 닫기 차단
서버 호출 없음
완료 기준 안내
```

### T8. 결과 API 실패 후 재전송

기대:

```text
pending 결과 유지
다음 Flush 또는 프로그램 재실행 시 동일 resultId로 재전송
서버는 중복 처리하지 않음
```

---

## 13. 완료 기준

- 일반 닫기/숨김/영상 결과에서 서버 응답 때문에 팝업 종료가 지연되지 않는다.
- 설문 필수응답 검증은 WPF에서 즉시 수행된다.
- 퀴즈 점수와 통과 여부는 WPF에서 즉시 계산된다.
- 신규 입사자 영상 시청 완료 여부는 WPF에서 즉시 판단된다.
- 결과는 창이 닫히기 전에 반드시 로컬 pending 파일에 저장된다.
- 서버 전송 실패 시 결과가 유실되지 않는다.
- 동일 resultId 재전송 시 서버에서 중복 저장되지 않는다.

---

## 14. 현재 상태

```text
문서화: 완료
코드 수정: 미수행
빌드/실행 테스트: 미수행
```

후속 구현 핵심:

```text
PopupResultQueue
→ 로컬 Enqueue와 서버 Flush 역할 분리

SurveyPopupView
→ 필수응답/점수/통과 판정 로컬 처리

VideoPopupView
→ 시청 완료 판정 로컬 유지

PopupManager
→ 결과 로컬 저장 후 UI 종료
→ 서버 전송은 백그라운드 처리
```
