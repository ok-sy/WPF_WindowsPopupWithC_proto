# 19. WPF 운영 조회 및 VIDEO UI 보완 TODO

- 작성일: 2026-09-30 (KST)
- 상태: **TODO / 정책 정리 완료 / 구현 미착수**
- 범위: WPF 주기 조회 정책, VIDEO 로컬/URL 공통 컨트롤 UI, VIDEO+SURVEY/QUIZ 이중 스크롤 제거
- 원칙: 이번 문서는 구현 TODO를 정리하는 문서이며, 실제 코드 변경은 별도 착수 시 진행한다.

---

## 1. 서버 기준 표시대상 판단 + WPF 주기 조회

### 1.1 목적

WPF 클라이언트는 팝업의 노출 시작/종료 시각을 직접 판단하지 않는다.

WPF는 서버에 현재 표시할 팝업 목록을 요청하고,
서버가 반환한 팝업을 즉시 표시한다.

### 1.2 기본 동작

```text
WPF 기동
→ 로그인
→ 표시 대상 팝업 목록 조회
→ 서버 응답 수신
→ 응답받은 팝업 즉시 표시

이후 30~60분 주기
→ 표시 대상 팝업 목록 재조회
→ 서버 응답 수신
→ 응답받은 팝업 즉시 표시
```

### 1.3 서버 책임

서버는 요청 시점의 **서버 시간**을 기준으로 다음을 모두 판단한다.

- 팝업 활성 여부
- 노출 시작/종료 시간
- 대상 사용자/부서/직급 등 대상 조건
- 숨김 여부
- 완료 여부
- 기타 표시 제외 조건
- 현재 사용자에게 지금 표시해야 할 최종 팝업 목록

WPF에는 이미 판단이 끝난 **최종 표시 대상 목록만 반환**한다.

### 1.4 WPF 책임

WPF는 다음만 담당한다.

- 로그인 직후 최초 조회
- 조회 주기 타이머 실행
- 서버에 팝업 목록 요청
- 반환된 팝업 즉시 표시
- 순차/동시 표시 등 클라이언트 렌더링
- 닫기/숨김/설문/퀴즈/영상 결과 생성 및 전송

WPF는 다음 판단을 하지 않는다.

- `displayStartAt` 기준 표시 여부 판단
- `displayEndAt` 기준 표시 여부 판단
- 현재 시간과 팝업 시간을 비교
- 특정 팝업 시작 시각까지 대기
- 팝업별 예약 타이머 생성

즉 WPF가 가지는 시간 개념은 업무상 노출 시간이 아니라
**다음 서버 조회까지의 대기시간**뿐이다.

### 1.5 조회 주기 및 부하 분산

관리자/서버 정책상 조회 주기는 다음 범위로 제한한다.

```text
최소 30분
최대 60분
```

정각 기준이 아니라 **WPF 로그인/기동 시점 기준**으로 반복한다.

예:

```text
사용자 A 09:03 로그인
→ 09:03 최초 조회
→ 10:03 재조회
→ 11:03 재조회

사용자 B 09:27 로그인
→ 09:27 최초 조회
→ 10:27 재조회
→ 11:27 재조회
```

이 방식으로 사용자별 로그인 시점에 따라 요청 시점을 자연스럽게 분산한다.

조회 주기가 60분이면 서버에서 노출 가능 상태가 된 시점부터
실제 WPF 표시까지 최대 약 60분의 지연이 발생할 수 있으며,
이는 현재 운영 정책상 허용하는 것으로 본다.

### 1.6 구현 TODO

- [ ] 로그인 성공 직후 팝업 목록 최초 조회
- [ ] 30~60분 범위의 polling 주기 적용
- [ ] 로그인/기동 시점 기준 반복 조회
- [ ] 서버 응답 목록 즉시 표시
- [ ] WPF의 노출 시작/종료 시간 판단 코드 제거 또는 미사용 처리
- [ ] 팝업별 예약/시간대기 로직이 남아 있는지 점검
- [ ] 서버가 최종 표시 대상만 반환하도록 조회 SQL/Service 정합성 확인
- [ ] polling 값의 소유 위치(서버 설정/관리자 설정/응답 필드) 최종 확정
- [ ] 재로그인/401 처리 후 polling 흐름이 중복 실행되지 않는지 확인
- [ ] 여러 번 조회해도 이미 완료/숨김 처리된 팝업이 서버에서 다시 내려오지 않는지 검증

### 1.7 완료 기준

- WPF PC의 로컬 시간이 달라도 표시 대상 판단 결과에 영향이 없다.
- WPF는 서버 응답에 포함된 팝업을 별도 시간 계산 없이 즉시 표시한다.
- 로그인 시간이 다른 사용자들의 조회 요청이 정각에 집중되지 않는다.
- 조회 주기는 30~60분 정책을 벗어나지 않는다.

---

## 2. VIDEO 로컬/URL 공통 WPF 컨트롤바

### 2.1 현재 구조

현재 영상 재생 UI는 소스 종류에 따라 다르다.

```text
로컬 영상
→ WPF MediaElement
→ WPF 커스텀 컨트롤바

HTTP/HTTPS 영상
→ WebView2
→ HTML5 <video>
→ Chromium 기본 controls
```

따라서 같은 VIDEO 팝업인데도
로컬 파일과 URL 영상의 컨트롤 UI/동작이 다르다.

### 2.2 목표 구조

브라우저 기본 `<video controls>` UI를 사용하지 않고
로컬/URL 영상 모두 동일한 WPF 컨트롤바를 사용한다.

```text
                    ┌─ MediaElement (로컬)
공통 WPF 컨트롤바 ─┤
                    └─ WebView2 <video> (HTTP/HTTPS)
```

### 2.3 공통 제공 기능

- Play / Pause
- 진행률 표시
- Seek
- 현재시간 / 전체시간
- Volume
- Mute
- PlaybackRate
- Fullscreen
- 완료율/시청시간 연동

### 2.4 기존 옵션 연동

현재 옵션 의미를 유지한다.

```text
showControls
allowFullScreen
allowPlaybackRateChange
autoPlay
isLoop
defaultVolume
```

예:

```text
showControls = false
→ 공통 WPF 컨트롤바 숨김

allowFullScreen = false
→ 전체화면 버튼 숨김/사용 금지

allowPlaybackRateChange = false
→ 배속 버튼 숨김/사용 금지
→ URL 영상 playbackRate도 1.0으로 제한

defaultVolume = 0.7
→ MediaElement / HTML5 video 모두 동일 초기값 적용
```

### 2.5 URL 영상 제어

URL 영상의 실제 재생 주체는 WebView2 내부 HTML5 `video`이므로
WPF 컨트롤에서 JavaScript 명령을 전달한다.

예:

```text
WPF Play
→ video.play()

WPF Pause
→ video.pause()

WPF Seek
→ video.currentTime = ...

WPF Volume
→ video.volume = ...

WPF PlaybackRate
→ video.playbackRate = ...
```

WebView2에서는 재생 상태를 다시 WPF에 전달한다.

대상 이벤트:

```text
loadedmetadata
timeupdate
play
pause
seeking
seeked
waiting
stalled
ended
error
ratechange
```

### 2.6 구현 TODO

- [ ] URL 영상에서 Chromium 기본 `controls` 제거
- [ ] 로컬/URL 공통 WPF 컨트롤바 사용
- [ ] Play/Pause 공통 명령 추상화
- [ ] Seek 공통 명령 추상화
- [ ] Volume/Mute 공통 명령 추상화
- [ ] PlaybackRate 공통 명령 추상화
- [ ] Fullscreen 공통 명령 추상화
- [ ] WebView2 ↔ WPF 상태 메시지 동기화
- [ ] `allowPlaybackRateChange=false` 시 URL 영상도 강제로 1.0배 유지
- [ ] `allowFullScreen=false` 시 URL 영상도 전체화면 진입 차단
- [ ] buffering/waiting/stalled 상태 UI 처리
- [ ] VIDEO+QUIZ에서도 동일 컨트롤바 동작 확인
- [ ] 가능하면 `IVideoPlayer` 계층으로 MediaElement/WebView2 재생 엔진 분리 검토

### 2.7 완료 기준

- 같은 VIDEO 설정이면 로컬 파일과 URL 영상의 UI가 동일하다.
- 옵션에 따른 버튼 표시/금지 동작이 두 재생 방식에서 동일하다.
- Seek/재생/일시정지 후 WPF UI와 실제 재생 위치가 어긋나지 않는다.
- URL 영상에 Chromium 기본 컨트롤바가 노출되지 않는다.

---

## 3. VIDEO + SURVEY/QUIZ 이중 스크롤 제거

### 3.1 문제

VIDEO와 SURVEY/QUIZ를 함께 표시하는 결합 화면에서
부모 영역과 내부 설문 영역이 각각 스크롤을 가지면서
**세로 스크롤바가 2개 생기는 문제**가 있다.

예상 구조:

```text
PopupWindow ScrollViewer
└─ VideoQuizPopupView
   ├─ Video
   └─ Survey/Quiz ScrollViewer
```

이 경우 사용자가 마우스 휠을 움직일 때
어느 스크롤 영역이 움직이는지 직관적이지 않고,
작은 팝업에서는 조작성이 크게 떨어진다.

### 3.2 목표

VIDEO + SURVEY/QUIZ 결합 화면에서는
세로 스크롤을 **한 곳에서만 담당**하도록 정리한다.

권장 방향:

```text
PopupWindow 또는 결합 View
└─ 단일 ScrollViewer
   ├─ Video
   └─ Survey/Quiz 전체 문항
```

내부 Survey/Quiz View는 결합 모드일 때 자체 세로 스크롤을 사용하지 않도록 한다.

단독 SURVEY/QUIZ에서는 기존 스크롤 동작을 유지할 수 있다.

### 3.3 구현 시 확인사항

- VIDEO+QUIZ뿐 아니라 VIDEO+SURVEY 구성 가능 여부 확인
- 결합 View의 부모 `ScrollViewer` 존재 여부 확인
- `SurveyPopupView` 내부 `ScrollViewer` 구조 확인
- 결합 모드에서만 내부 VerticalScrollBar 비활성화 가능한지 확인
- 문항 수가 많을 때 전체 콘텐츠 높이 계산 문제 확인
- VIDEO 영역이 스크롤 시 불필요하게 리로드/재생 초기화되지 않는지 확인
- 푸터 고정 여부와 스크롤 영역 경계 확인
- FULLSCREEN / FIXED / RATIO 등 크기 모드별 동작 확인

### 3.4 구현 TODO

- [ ] 현재 VIDEO+SURVEY/QUIZ 스크롤 계층 확인
- [ ] 이중 `ScrollViewer` 발생 위치 특정
- [ ] 결합 화면 세로 스크롤 소유자를 1개로 통일
- [ ] 결합 모드에서는 Survey/Quiz 내부 세로 스크롤 제거 또는 비활성화
- [ ] 단독 SURVEY/QUIZ 기존 스크롤 동작 유지
- [ ] 휠 스크롤/스크롤바 드래그/키보드 스크롤 확인
- [ ] 긴 설문에서 마지막 문항 및 제출 영역 접근 가능 여부 확인
- [ ] VIDEO 재생 중 스크롤해도 재생 상태 유지 확인
- [ ] VIDEO+QUIZ completionRatio 잠금/해제 후 레이아웃 점프 여부 확인

### 3.5 완료 기준

- VIDEO+SURVEY/QUIZ 화면에 세로 스크롤바가 하나만 표시된다.
- 영상과 모든 문항을 하나의 자연스러운 스크롤 흐름으로 이동할 수 있다.
- 단독 SURVEY/QUIZ의 기존 동작에는 영향이 없다.
- 긴 문항 구성에서도 제출/푸터까지 정상 접근 가능하다.

---

## 4. 작업 순서 권장

서로 독립적인 항목이지만 다음 순서를 권장한다.

```text
1. 서버 기준 표시대상 판단 + WPF polling
2. VIDEO+SURVEY/QUIZ 이중 스크롤 제거
3. VIDEO 로컬/URL 공통 WPF 컨트롤바
```

공통 VIDEO 컨트롤바는 UI/상태 동기화 변경 범위가 크므로
스크롤 구조를 먼저 단순화한 뒤 적용하는 편이 영향 범위를 확인하기 쉽다.

---

## 5. 이번 TODO에서 하지 않는 것

- 실제 polling 코드 구현
- 서버 SQL/Service 변경
- VIDEO 컨트롤바 구현
- WebView2 JavaScript 구현
- 이중 ScrollViewer 제거 코드 구현
- 관리자 화면 변경

위 항목은 별도 착수 요청 시 구현한다.
