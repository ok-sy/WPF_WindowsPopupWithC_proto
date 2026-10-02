# 19. WPF 운영 조회 및 VIDEO UI 보완 TODO

- 작성일: 2026-09-30 (KST)
- 상태: **§1~3 기존 구현·자동 검증 완료 / §6~7 코드 반영(2026-10-02), 복구 자동 검증 완료 / §9 Overlay 구현·자동 검증 완료 / Windows 렌더링·동작 213건 및 HTML5 42건 검증 완료 / 실제 GUI·원격 DB 검증 대기**
- 범위: WPF 주기 조회 정책, VIDEO 로컬/URL 공통 컨트롤 UI, VIDEO+QUIZ 이중 스크롤 제거, 공통 외곽 Clip, polling 장애 복구
- 착수: 2026-09-30. 아래 체크는 코드 적용·자동 검증과 실제 GUI·DB 검증을 구분한다.

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

- [x] 로그인 성공 직후 팝업 목록 최초 조회(기존 자동 조회 경로 유지)
- [x] 30~60분 범위의 polling 주기 적용
- [x] 로그인/기동 시점 기준 반복 조회
- [x] 서버 응답 목록 즉시 표시
- [x] WPF의 노출 시작/종료 시간 판단 코드 제거 또는 미사용 처리(기존 미사용 확인)
- [x] 팝업별 예약/시간대기 로직이 남아 있는지 점검
- [x] 서버가 최종 표시 대상만 반환하도록 조회 SQL/Service 정합성 확인(SQL·서비스 코드 및 서비스 테스트)
- [x] polling 값의 소유 위치(서버 설정/관리자 설정/응답 필드) 최종 확정
- [x] 재로그인/401 처리 후 polling 흐름이 중복 실행되지 않는지 확인(단일 DispatcherTimer·조회 gate·인증 1회 재시도 경로 코드 점검)
- [ ] 여러 번 조회해도 이미 완료/숨김 처리된 팝업이 서버에서 다시 내려오지 않는지 검증

적용: 서버 `custom.wpf-popup.polling-interval-seconds`가 소유한다. 기본 1800초이며 서버 응답·WPF 로컬 설정 모두 1800~3600초로 제한한다. 응답의 선택 필드가 없거나 0 이하이면 제한된 로컬 설정을 유지한다. WPF는 `Stopwatch` 경과시간으로 기동 기준 조회 경계를 계산하므로 PC 벽시계 변경이나 응답 지연이 주기를 밀지 않는다. `AutoLoadOnStartup=false`는 기존 수동 조회 테스트 설정이며 기본값은 `true`다. 열린 팝업이 있어도 조회하며, 이번 실행에서 표시한 ID 중복을 제거한 뒤 새 목록을 기존 표시 큐에 합류시킨다. 426·종료 후 타이머 재시작과 늦게 도착한 목록 표시는 차단한다.

서버 목록 SQL은 DB의 KST 시각·활성 사용자·대상 조건·활성 문항 템플릿·숨김·완료를 이미 판단한다. SQL 변경은 필요 없었다. 완료/숨김 후 재조회는 기존 `WpfApiOracleHttpTest`에 시나리오가 있으나 이번 작업에서는 원격 DB 테스트를 실행하지 않았다.

### 1.7 완료 기준

- WPF PC의 로컬 시간이 달라도 표시 대상 판단 결과에 영향이 없다.
- WPF는 서버 응답에 포함된 팝업을 별도 시간 계산 없이 즉시 표시한다.
- 로그인 시간이 다른 사용자들의 조회 요청이 정각에 집중되지 않는다.
- 조회 주기는 30~60분 정책을 벗어나지 않는다.

---

## 2. VIDEO 로컬/URL 공통 WPF 컨트롤바

### 2.1 변경 전 구조

변경 전 영상 재생 UI는 소스 종류에 따라 달랐다.

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

- [x] URL 영상에서 Chromium 기본 `controls` 제거
- [x] 로컬/URL 공통 WPF 컨트롤바 사용
- [x] Play/Pause 공통 명령 추상화
- [x] Seek 공통 명령 추상화
- [x] Volume/Mute 공통 명령 추상화
- [x] PlaybackRate 공통 명령 추상화
- [x] Fullscreen 공통 명령 추상화
- [x] WebView2 ↔ WPF 상태 메시지 동기화
- [x] `allowPlaybackRateChange=false` 시 URL 영상도 강제로 1.0배 유지
- [x] `allowFullScreen=false` 시 URL 영상도 전체화면 진입 차단
- [x] buffering/waiting/stalled 상태 UI 처리
- [ ] VIDEO+QUIZ에서도 동일 컨트롤바 동작 확인
- [x] 가능하면 `IVideoPlayer` 계층으로 MediaElement/WebView2 재생 엔진 분리 검토(현재는 View의 공통 명령 메서드로 통합, 별도 엔진 계층은 추가하지 않음)

초기 적용: WebView2 HWND 때문에 영상 아래 별도 행에 공통 WPF 컨트롤을 고정했다. 이후 §9에서 CompositionControl과 공통 Overlay로 전환했고, 컨트롤 숨김 여부가 영상 높이·스크롤 위치에 영향을 주지 않는다. HTML5 명령은 `PostWebMessageAsJson`으로 전달하고 메타데이터·위치·재생/일시정지·탐색·버퍼링·음량·배속·종료·오류를 WPF에 반영한다. 탐색 중 이동한 구간은 누적 시청시간에 넣지 않는다. URL의 쿼리 문자열은 HTML 속성 인코딩으로 보존한다. YouTube iframe은 기존 별도 플레이어/시청량 측정 미지원 정책을 유지하며 이번 HTML5 공통 컨트롤 적용 대상에 포함하지 않는다.

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

- [x] 현재 VIDEO+SURVEY/QUIZ 스크롤 계층 확인
- [x] 이중 `ScrollViewer` 발생 위치 특정
- [x] 결합 화면 세로 스크롤 소유자를 1개로 통일
- [x] 결합 모드에서는 Survey/Quiz 내부 세로 스크롤 제거 또는 비활성화
- [x] 단독 SURVEY/QUIZ 기존 스크롤 동작 유지
- [ ] 휠 스크롤/스크롤바 드래그/키보드 스크롤 확인
- [x] 긴 설문에서 마지막 문항 및 제출 영역 접근 가능 여부 확인(50문항·세 가지 viewport 크기 자동 레이아웃 검증)
- [ ] VIDEO 재생 중 스크롤해도 재생 상태 유지 확인
- [x] VIDEO+QUIZ completionRatio 잠금/해제 후 레이아웃 점프 여부 확인(자동 레이아웃 검증)

적용: 현재 계약은 `QUIZ + content.videoEnabled`만 영상 결합을 지원하며 VIDEO+SURVEY 모드는 없다. `PopupWindow` 본문에 외부 ScrollViewer는 없고, 이중 스크롤은 `VideoQuizPopupView`와 내부 `SurveyPopupView`에서 발생했다. 결합 모드에서는 내부 ScrollViewer를 실제 계층에서 제거해 문항 패널을 직접 배치하고 고정 400 높이를 Auto로 바꾼다. 부모의 단일 ScrollViewer가 영상·전체 문항·제출 영역을 담당하고, 공통 푸터는 PopupWindow에 고정한다. 단독 SURVEY/QUIZ는 기존 자체 스크롤을 유지한다.

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

## 5. 검증 결과와 남은 확인

- WPF 빌드 성공(경고·오류 0). `Popup.BehaviorTests` 97건 통과: 기존 검증에 조회 경계·50문항 레이아웃·WebView 상태 동기화·시청시간 검증을 추가.
- 생성된 실제 HTML5 플레이어 스크립트의 명령·이벤트·배속 제한·전체화면 차단은 `video-controls.test.cjs`에서 브리지/영상 테스트 더블로 실행해 42건 통과.
- 서버 `WpfPopupServiceTest` 5개 테스트 통과: 서버 조회 응답의 30~60분 경계와 최종 목록 조립 검증. `git diff --check` 통과.
- 실제 로컬/URL 디코딩, VIDEO+QUIZ GUI 조작, 휠·스크롤바 드래그·키보드, 전체화면 왕복 재생 유지는 수동 확인 대기.
- 실제 완료/숨김 후 반복 HTTP 조회는 원격 개발 DB 확인 대기. 관리자 UI·DDL·반입 패키지·배포용 dist 갱신은 이번 구현 범위에 포함하지 않는다.

자동 검증은 실제 브라우저·영상 디코더·DB 검증을 대신하지 않는다. 체크가 남은 항목은 위 수동/통합 검증에 해당한다.

---

## 6. 팝업 외곽 공통 Clip 및 IMAGE FILL CornerRadius 정합성 TODO

### 6.1 문제

IMAGE의 `FILL` 모드에서 이미지가 팝업의 외곽 라운드 영역을 넘어 보이는 경우가 있다.

현재 요구사항은 IMAGE에만 한정된 예외가 아니라,
**어떤 콘텐츠도 팝업의 실제 표시 영역을 벗어나서 보이면 안 된다**는 공통 UI 원칙으로 정리한다.

### 6.2 공통 원칙

```text
PopupWindow 외곽 영역
└─ Content
   ├─ TEXT
   ├─ IMAGE
   ├─ VIDEO
   ├─ SURVEY
   └─ QUIZ
```

모든 콘텐츠는 최종적으로 PopupWindow의 외곽 영역 안에서만 렌더링되어야 한다.

즉:

- 팝업 경계를 넘어가는 콘텐츠는 잘린다.
- 팝업에 CornerRadius가 적용되어 있으면 콘텐츠도 동일한 외곽 형상 안에서 잘린다.
- 각 Content View가 개별적으로 외곽 모양을 재현하기보다, 가능한 한 팝업 외곽 컨테이너가 최종 Clip 책임을 갖는다.
- IMAGE `FILL`은 영역을 채우기 위해 확대될 수 있지만 팝업 밖으로 노출되어서는 안 된다.

### 6.3 구현 TODO

체크 완료는 코드 반영·정적 확인을 뜻한다. Windows 렌더링 자동 검증은 2026-10-02 실행 완료했으며 실제 모니터·GUI 검증은 구분해 남긴다.

- [x] IMAGE `FILL` 모드에서 이미지가 팝업 외곽을 벗어나는 현재 구조 확인
- [x] PopupWindow의 실제 외곽 Border/ContentPresenter/Content 영역 Clip 계층 확인
- [x] 팝업 외곽 CornerRadius와 동일한 형상으로 Content 영역을 Clip
- [x] IMAGE FILL 확대 시 팝업 밖 픽셀이 보이지 않도록 처리
- [x] IMAGE에만 특수 처리하지 않고 가능한 경우 공통 Content Clip으로 적용
- [ ] TEXT/VIDEO/SURVEY/QUIZ에 부작용이 없는지 확인
- [x] FIXED/RATIO/FULLSCREEN/AUTO의 공통 Clip·리사이즈 자동 렌더링 확인
- [ ] 지원 크기 모드별 실제 GUI·영상 확인
- [ ] DPI 배율(예: 100%/125%/150%/200%)에서 모서리 1px 틈/삐져나옴 여부 확인
- [x] 현행 동일 두께 Border 안쪽 Clip 반경 및 경계 밖 제외 자동 검증

### 6.4 완료 기준

- IMAGE FILL 이미지가 팝업 외곽을 벗어나 보이지 않는다.
- 이미지 모서리가 팝업 CornerRadius와 동일한 외곽 형상으로 잘린다.
- 어떤 Content 타입도 팝업 외곽을 넘어 렌더링되지 않는다.
- 기존 단독 TEXT/IMAGE/VIDEO/SURVEY/QUIZ 레이아웃에 회귀가 없다.

---

## 7. WPF polling 서버 연결 장애 복구 및 단계적 재시도 TODO

### 7.1 목적

정상 polling 주기는 서버가 내려주는 `pollingIntervalSeconds`를 사용한다.

다만 서버 연결 실패, 네트워크 단절, 일시적인 5xx 오류가 발생한 경우
정상 polling 주기까지 기다리지 않고 단계적인 장애 복구 절차로 서버 복구 여부를 확인한다.

### 7.2 오류별 처리 정책

HTTP 상태 및 통신 실패 원인에 따라 처리 경로를 명확히 분리한다.

#### 400 Bad Request

```text
요청 형식/값 오류
→ 장애 복구 재시도 대상 아님
```

동일 요청을 반복해도 해결될 가능성이 없으므로 10초 재시도/30분 복구 사이클에 넣지 않는다.

#### 401 Unauthorized

```text
토큰 만료 또는 인증 실패
→ 재로그인
→ 실패했던 원 요청 1회 재전송
```

401은 서버 장애로 취급하지 않는다.

재로그인 성공 후 원 요청이 정상 처리되면 기존 polling 흐름을 유지한다.
토큰 재로그인 시점 때문에 polling 기준 시간을 새로 시작하지 않는다.

#### 403 Forbidden

```text
권한/사용자 상태 문제
→ 장애 복구 재시도 대상 아님
```

반복 통신으로 해결되는 장애가 아니므로 장애 복구 루프에 넣지 않는다.

#### 426 Upgrade Required

```text
현재 WPF Client Version 사용 불가
→ polling 및 추가 업무 요청 중단
→ "프로그램 업데이트가 필요합니다." Alert 표시
→ 사용자가 Alert를 닫음
→ WPF Agent 정상 종료
```

426을 받은 상태에서 현재 버전으로 polling을 계속하지 않는다.

종료 전에 이미 로컬 큐에 저장된 결과 데이터가 유실되지 않는 현재 종료/큐 보존 정책과 충돌하지 않는지 확인한다.

#### 통신/서버 장애

다음은 장애 복구 재시도 대상으로 본다.

```text
Timeout
Connection refused
DNS/Network 오류
HTTP 500
HTTP 502
HTTP 503
HTTP 504
```

필요하면 실제 운영 환경에서 재시도 가능한 추가 5xx 상태를 같은 정책으로 확장한다.

### 7.3 장애 복구 흐름

정상 polling 요청이 통신/서버 장애로 실패하면 다음 순서로 복구를 시도한다.

```text
정상 polling 실패

[복구 Cycle 1]
→ 10초 후 재시도
→ 실패 시 10초 후 재시도
→ 실패 시 10초 후 재시도
→ 총 3회 실패

→ 30분 대기

[복구 Cycle 2]
→ 10초 간격 최대 3회

→ 모두 실패하면 30분 대기

...

[복구 Cycle 5]
→ 10초 간격 최대 3회
```

어느 시점에서든 서버 연결 및 팝업 목록 조회가 성공하면:

```text
장애 복구 상태 종료
→ 성공 응답의 pollingIntervalSeconds 적용
→ 정상 polling 흐름 복귀
```

### 7.4 5사이클 이후 정책

5개 장애 복구 사이클이 모두 실패해도 Agent가 영구적으로 서버 확인을 포기하지 않는다.

적극적인 복구 시도만 종료하고 저빈도 복구 확인 상태로 전환한다.

```text
5 Cycle 모두 실패
→ 장애 지속 상태
→ 이후 60분 간격으로 서버 연결 확인
→ 성공하면 즉시 정상 polling 복귀
```

60분은 초기 정책값이며 운영 요구에 따라 설정값으로 분리할 수 있다.

### 7.5 동시성/중복 실행 원칙

- 정상 polling과 장애 복구 요청이 동시에 실행되지 않도록 단일 조회 gate를 사용한다.
- 장애 복구 중 정상 polling Timer가 별도 GET을 발생시키지 않도록 한다.
- 401 재로그인 경로와 장애 복구 재시도가 중복 로그인/중복 GET을 만들지 않도록 한다.
- 이미 팝업 목록 조회가 성공한 뒤 늦게 끝난 이전 실패 작업이 다시 장애 상태로 되돌리지 않도록 한다.
- Agent 종료/426 상태에서는 예약된 재시도 및 복구 Timer를 모두 취소한다.

### 7.6 구현 TODO

체크 완료는 코드 반영 및 아래 자동/정적 검증을 뜻한다. 실제 Agent·서버 재기동·물리 네트워크 검증은 마지막 항목에 남긴다.

- [x] polling 실패 원인을 HTTP 상태/네트워크 예외로 분류
- [x] 400은 장애 복구 재시도에서 제외
- [x] 401은 기존 재로그인 + 원 요청 1회 재전송 경로와 통합
- [x] 403은 장애 복구 재시도에서 제외
- [x] 426 수신 시 polling/복구 작업 중단
- [x] 426 Update Alert 닫기 후 Agent 정상 종료
- [x] 500/502/503/504 및 통신 예외를 장애 복구 대상으로 처리
- [x] 10초 간격 최대 3회 단기 재시도 구현
- [x] 단기 재시도 전부 실패 시 30분 대기 후 다음 Cycle 시작
- [x] 최대 5 Cycle 관리
- [x] 5 Cycle 실패 후 60분 간격 저빈도 복구 확인으로 전환
- [x] 어느 단계에서든 성공하면 장애 상태 초기화 및 정상 polling 복귀
- [x] 복구 성공 응답의 `pollingIntervalSeconds`를 다음 정상 조회에 적용
- [x] 정상 polling/장애복구/401 재로그인 간 중복 요청 방지
- [x] 앱 종료 시 모든 재시도 Timer/Task Cancellation 처리
- [x] 통신 예외·5xx 분류, 재시도 단계 및 성공 후 복귀 자동 검증(실제 복구/HTTP/인증/큐 코드 122건)
- [ ] 실제 네트워크 단절 → 복구, 서버 재기동 → 복구, 5xx → 복구 수동 통합 검증

### 7.7 완료 기준

- 네트워크 또는 서버의 일시 장애에서 Agent 재실행 없이 자동 복구한다.
- 400/403은 장애 복구 루프에 들어가지 않는다.
- 401은 재로그인 후 원 요청 1회 재전송으로 처리되고 polling 기준점은 불필요하게 재설정되지 않는다.
- 426은 업데이트 안내 후 사용자가 Alert를 닫으면 Agent가 종료된다.
- 장애 복구 중 서버에 중복 polling 요청이 발생하지 않는다.
- 5 Cycle 이후에도 장기 장애에서 서버 복구를 감지할 수 있다.
- 복구 성공 후 서버의 최신 `pollingIntervalSeconds`를 사용해 정상 polling으로 돌아간다.



### 7.8 2026-10-02 구현 및 검증 기록

- 단일 `DispatcherTimer`를 조회 직전 멈추고 조회 종료 후 한 번만 예약한다. `_isLoadingPopups` gate를 유지한다. 복구 중에는 정상 30~60분 타이머를 별도로 실행하지 않는다.
- 복구 요청은 10초 간격 3회씩 5 Cycle(총 15회)이다. Cycle 사이에는 30분 휴식 + 다음 Cycle 첫 10초를 합쳐 1810초 대기한다. 15회 실패 이후에는 계속 3600초 간격으로 조회한다. 수동 재조회도 같은 gate·복구 상태를 사용한다.
- 400/403 및 1회 인증 갱신 후에도 실패한 401은 복구를 초기화하고 정상 기동 기준 조회로 돌아간다. 정상 로그인/401 재전송은 polling 기준 `Stopwatch`를 재시작하지 않는다.
- 성공 응답은 복구 횟수를 초기화하고 최신 서버 주기를 적용한다. 정상 주기 기준점은 기존 기동 시점이다. 따라서 복구 성공 시점으로부터 무조건 30~60분을 기다리는 방식이 아니다.
- 로그인 API의 통신/500·502·503·504 실패도 원인을 유지해 polling에 전파한다. 정기 로그인에서는 이를 기록하고 다음 주기를 유지한다.
- 목록/결과/최초·401·정기·진단 로그인에서 발생한 426은 조회·결과 전송·정기 인증을 중단한다. 안내는 한 번 표시하고 닫으면 기존 정상 종료 경로로 Agent·트레이·Mutex를 정리한다. HTTP와 인증에는 취소 토큰을 전달한다. 결과 큐 전송은 멈추지만 로컬 저장은 계속 허용한다.
- 공통 `PopupBodyContent` Grid를 WPF Border의 안쪽 크기·반경으로 Clip한다. 현재 동일 모서리/동일 두께 구조(일반 radius=12, thickness=1 → 안쪽 11.5 / 전체화면 0)에 맞춘다. 테두리와 그림자는 Clip 밖에 유지한다. IMAGE ORIGINAL의 Canvas 측정 정책은 그대로 유지한다.
- `Popup.RecoveryTests`: 실제 복구/HTTP/인증/큐 소스를 연결해 **122건 통과**. 15회 예약·모든 단계 초기화·HTTP 상태 분류·401 1회 재전송·426 파일 보존·이후 GET/POST 차단·진행 중 요청 취소·로그인 503 전파·정기 로그인 복구/426 알림 검증.
- WPF 및 `Popup.BehaviorTests`: Linux cross-target 빌드 경고 0·오류 0. 추가 Clip 테스트는 4종 크기 모드·리사이즈·4종 렌더 DPI·6종 콘텐츠를 검사하도록 작성했으나 **Windows 실행 미완료**. 실제 모니터 DPI 검증도 별도로 필요하다. WebView2는 HWND 기반이므로 WPF Clip만으로 네이티브 영상의 모든 경계 동작을 보장한다고 판단하지 않는다. 현행 VIDEO는 외곽에서 여백을 두지만 실제 URL/전체화면 왕복 검증은 남긴다.
- 검증 SDK는 임시 .NET 10.0.100이다. 저장소 `global.json`의 10.0.400 고정은 변경하지 않았다. 체크아웃 cwd 밖에서 프로젝트 절대경로로 빌드해 임시 SDK를 사용했다. 폐쇄망 NuGet 설정도 유지했고 이번 검증만 온라인 restore source를 지정했다.
- `video-controls.test.cjs`는 WPF 테스트가 생성하는 HTML이 없어 실행되지 않았다(ENOENT). 이전 42건 통과 기록을 이번 실행 결과로 재사용하지 않는다.
- 실제 서버/DB/사내 SSO/네트워크 재연결/GUI 클릭·업데이트 종료 검증 및 dist·반입 패키지 재생성은 미실행.
- 변경 소스 줄별 설명: [20261002_WPF_TODO_변경_라인별_설명](../reviews/20261002_WPF_TODO_변경_라인별_설명.md).

### 7.9 2026-10-02 Windows 후속 검증

- VIDEO 제목 TextBlock의 중복 Margin 속성을 제거해 WPF XAML 컴파일 오류 MC3000을 수정.
- 현행 PopupBodyBorder는 CornerRadius=16, BorderThickness=1이다. Clip 반경은 15.5이며 오래된 테스트 기대값 11.5와 소스 주석을 정정.
- Windows .NET SDK 10.0.401로 임시 프로젝트·별도 artifacts 경로에서 WPF 빌드 및 동작 검증 **213건 통과**. 4종 크기 모드·리사이즈·100/125/150/200% RenderTargetBitmap·6종 콘텐츠 공통 Clip 존재·결합 스크롤·영상 상태·제출 경로 포함.
- 생성된 HTML로 Node HTML5 브리지 **42건 통과**. 실제 복구/HTTP/인증/큐 소스 검증 **122건 통과**. git diff --check 통과.
- 저장소 global.json(10.0.400)·NuGet.Config는 유지. 오프라인 NuGet 소스가 없어 이번 검증은 공식 NuGet 소스를 지정. 기존 중간 생성 파일 불일치는 임시 artifacts 경로로 분리해 해결.
- 검증 중 데모 미디어가 삭제된 상태여서 HEAD의 이미지·영상을 임시 테스트 출력에만 복사했다. 저장소 미디어 삭제 상태는 유지. 검증 프로젝트는 처음 조사 시 삭제 상태였으므로 HEAD를 임시 경로에 복사해 실행했으며, 이후 작업 폴더에 다시 존재하는 테스트의 반경 기대값도 정정했다.
- RenderTargetBitmap의 DPI 검증은 실제 모니터 배율 및 WebView2 HWND 경계 검증을 대신하지 않는다. VIDEO+QUIZ 실재생·휠/드래그/키보드·전체화면 왕복·네트워크 재연결·서버 재기동은 미실행.
- POPUP_TEST_DB_PASSWORD 환경변수가 없어 원격 개발 DB HTTP 완료/숨김 재조회는 미실행. 커밋·푸시·배포·반입 패키지 재생성 없음.
## 8. 2026-10-02 URL 영상 자동 재생 및 로딩 안내 보완

- 원인 후보: 기존 HTML5는 autoplay 속성에만 의존해 소리 있는 자동 재생 정책에 대응하지 못했고, NavigationCompleted 성공 시 영상 준비 전에도 로딩 안내를 숨겼다. 실제 사용 서버 URL 증상은 별도 재현하지 않았다.
- 변경: 영상 전용 WebView2 프로필(`LocalApplicationData/Popup/VideoWebView2`)에 `--autoplay-policy=no-user-gesture-required` 적용. HTML5 preload 및 canplay 시 1회 명시적 재생 요청 추가. autoPlay=false·수동 일시정지 후 canplay 재발생 시 자동 재생하지 않음.
- 표시: 초기 로딩은 페이지 탐색 완료·메타데이터·음량 변경으로 숨기지 않고 canplay/playing 시 해제. waiting/stalled는 버퍼링 안내 및 불확정 ProgressBar 표시. 재생 정책 거절은 재생 버튼/영상 클릭 안내, 디코딩·HTTP 오류는 오류 안내로 구분. AbortError는 수동 pause에 따른 취소로 처리. 정책 거절은 시청 완료·재생 실패 상태로 간주하지 않는다.
- 검증: Windows WPF 동작 223건 및 HTML5 브리지 60건 통과. 임시 WPF/HTTP 통합 테스트에서 실제 WebView2 Runtime 154.0.4258.48로 20건 통과: 1.2초 HTTP 지연 중 로딩, 소리 유지·클릭 없는 자동 재생, 자동 재생 끔, WPF 재생 명령, 수동 pause 유지, 브라우저 이벤트를 주입한 버퍼링/음량/재개 표시, 실제 HTTP 404 오류·로딩 종료. 실제 네트워크 대역폭 저하 버퍼링·사용 서버 URL·Runtime 134·YouTube 검증은 미실행.
- 제약: 브라우저 플래그는 Microsoft가 개발용으로 안내하는 방식이므로 현재 프로토타입에 적용했다. 정식 배포 전 대상 Runtime에서 정책·지원 여부를 재검토한다([Microsoft WebView2 browser flags](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/webview-features-flags)).
- 상태: URL 영상 자동 재생·로딩 안내 및 검증 기록을 main 커밋·origin/main 푸시 대상으로 정리. 실행 중인 기존 앱 교체, dist·반입 패키지·배포 갱신 없음.

---

## 9. VIDEO 플레이어 Overlay UI/UX 개선 TODO

### 9.1 목적

현재 영상과 공통 컨트롤바가 별도 행으로 분리되어 있어 기능적으로는 안정적이지만,
일반적인 동영상 플레이어와 비교하면 영상 영역과 조작 영역이 분리되어 보인다.

VIDEO 플레이어를 **영상 위에 컨트롤이 겹치는 Overlay 구조**로 변경하고,
재생 중에는 일정 시간 사용자 입력이 없으면 컨트롤을 숨겨 영상 자체에 집중할 수 있도록 한다.

### 9.2 목표 구조

```text
VideoContainer
├─ MediaElement / WebView2 video
├─ Interaction Layer
│  └─ 영상 영역 클릭 → Play / Pause
├─ Playback State Overlay
│  └─ 중앙 Play / Pause 피드백
├─ Loading Overlay
│  └─ Loading / Buffering 표시
└─ Control Overlay (Bottom)
   ├─ Progress / Seek
   ├─ CurrentTime / Duration
   ├─ Play / Pause
   ├─ Volume / Mute
   ├─ PlaybackRate
   └─ Fullscreen
```

기존처럼 컨트롤바 전용 높이를 별도로 차지하지 않고
영상 영역 하단에 반투명 컨트롤바를 Overlay한다.

### 9.3 컨트롤 자동 표시/숨김

기본 동작은 다음과 같이 한다.

```text
재생 중
→ 마우스 이동/클릭
→ 컨트롤 표시
→ 일정 시간 입력 없음(초기안 3초)
→ 컨트롤 숨김

일시정지
→ 컨트롤 계속 표시

Seek/Volume/PlaybackRate 등 조작 중
→ 컨트롤 표시 유지
→ 조작 종료 후 자동 숨김 타이머 재시작
```

전체화면에서도 별도 컨트롤 UI를 만들지 않고 동일한 Overlay 컨트롤을 사용한다.

### 9.4 영상 화면 클릭 Play/Pause

영상 표시 영역 자체를 클릭하여 재생/일시정지를 전환할 수 있게 한다.

```text
재생 중 영상 클릭
→ Pause
→ 화면 중앙에 Pause 상태 피드백
→ 짧은 시간 후 자동 숨김

일시정지 중 영상 클릭
→ Play
→ 화면 중앙에 Play 상태 피드백
→ 짧은 시간 후 자동 숨김
```

하단 컨트롤의 버튼/Slider 조작은 영상 클릭 이벤트로 전달되지 않도록 처리한다.

### 9.5 Loading / Buffering UI

초기 영상 로딩뿐 아니라 재생 중 데이터 대기로 멈춘 상태도 사용자가 구분할 수 있도록 한다.

- 초기 Loading 표시
- HTML5 `waiting` / `stalled` 시 Buffering 표시
- 재생 가능/재개 시 자동 제거
- 로컬 MediaElement에서도 가능한 범위에서 동일한 상태 표현 검토
- 오류 메시지와 Buffering 상태는 명확히 구분
- 기존 진행률/시청시간 계산에는 영향을 주지 않음

현재 막대형 ProgressBar만 사용하는 방식보다 영상 중앙 Spinner 등 플레이어에 자연스러운 표현을 검토한다.

### 9.6 진행바 보완 검토

현재 재생 위치뿐 아니라 URL 영상에서 브라우저가 확보한 buffered 범위를 표시할 수 있는지 검토한다.

```text
재생 완료 영역
현재 위치
buffered 영역
아직 로드되지 않은 영역
```

특히 URL 영상 Seek 시 서버 Range Request/다운로드 상태를 사용자가 구분하는 데 도움이 되는지 확인한다.

### 9.7 구현 TODO

체크 완료는 코드 반영·자동 검증 범위다. 실제 재생 및 렌더링 확인은 §9.9에 기록하며 물리 입력·전체화면 왕복은 별도로 남긴다.

- [x] VIDEO 컨트롤바를 별도 Row에서 영상 하단 Overlay 구조로 변경
- [x] 로컬 MediaElement에서 Overlay 컨트롤 정상 표시 확인
- [x] WebView2 HWND 위에 WPF Overlay가 실제 표시 가능한지 구조/제약 재검증
- [x] WebView2 제약으로 직접 Overlay가 불가능한 경우 HTML 내부 Overlay 또는 대체 구조 결정
- [x] 영상 영역 클릭 Play/Pause 구현
- [x] 컨트롤 버튼/Slider 클릭 시 영상 클릭 이벤트 전파 방지
- [x] Play/Pause 전환 시 화면 중앙 상태 아이콘 표시 후 자동 숨김
- [x] 초기 Loading UI를 영상 중앙 Overlay 형태로 정리
- [x] waiting/stalled Buffering UI를 영상 중앙 Overlay 형태로 정리
- [x] 재생 중 일정 시간 입력이 없으면 컨트롤 자동 숨김
- [x] 마우스 진입/이동/클릭 시 컨트롤 즉시 재표시
- [x] 재생 중 마우스 이탈 시 즉시 숨김(정지·조작 중 유지)
- [x] Pause 상태에서는 컨트롤 표시 유지
- [x] Seek/Volume/PlaybackRate 조작 중 자동 숨김 방지
- [x] 전체화면에서 동일 Overlay 컨트롤 재사용
- [ ] Fullscreen 진입/복귀 후 실제 재생 상태 유지 검증(동일 컨테이너 재사용·타이머 재예약은 코드 반영)
- [x] `showControls=false` 정책과 자동 표시 로직 충돌 여부 확인
- [x] `allowFullScreen` / `allowPlaybackRateChange` 기존 정책 유지
- [x] URL 영상 buffered 범위 표시 가능 여부 검토
- [x] VIDEO+QUIZ 결합 화면에서 Overlay가 스크롤/레이아웃에 미치는 영향 확인
- [ ] 로컬/URL/전체화면/VIDEO+QUIZ 물리 입력·전체화면 왕복 수동 검증

### 9.8 Windows Master Volume/Mute 양방향 Sync

BackgroundOverlay가 활성화된 상태에서는 사용자가 Windows 작업표시줄의 시스템 볼륨 UI에 접근하기 어려울 수 있다.
특히 Windows Master Volume이 0이거나 Mute 상태이면 플레이어 내부 Volume만 올려서는 실제 소리를 들을 수 없다.

따라서 VIDEO 플레이어의 Volume/Mute UI를 Windows Master Volume/Mute와 양방향 동기화하는 방향으로 구현한다.

```text
VIDEO 팝업 시작
→ Windows Master Volume/Mute 조회
→ Player Volume/Mute UI에 현재 상태 반영

Player Volume 변경
→ Windows Master Volume 변경

Player Mute 변경
→ Windows Master Mute 변경

Windows Master Volume/Mute가 외부에서 변경됨
→ Player UI에도 변경 상태 반영
```

동일한 값을 Player 내부 볼륨과 Windows Master Volume 양쪽에서 중복 적용하면 출력이 이중으로 감쇠될 수 있으므로,
Sync 모드에서는 MediaElement/HTML5 video의 내부 볼륨 처리와 Windows Master Volume 적용 책임을 분리하여 중복 감쇠가 발생하지 않도록 한다.

구현 원칙:

- Windows 기본 Core Audio API를 사용한다.
- 외부 NuGet 패키지(예: NAudio)는 추가하지 않고 Core Audio COM API 직접 연동을 우선한다.
- Player Volume Slider는 Windows Master Volume의 현재 값을 표시하고 변경한다.
- Player Mute는 Windows Master Mute 상태와 동기화한다.
- Windows 측 볼륨/Mute 변경 이벤트를 수신하여 Player UI에도 반영하는 양방향 Sync를 적용한다.
- 로컬 MediaElement와 URL WebView2 영상 모두 같은 Player Volume/Mute UI 정책을 사용한다.
- Windows Master Volume을 변경하므로 다른 프로그램의 출력에도 영향을 준다는 점을 전제로 한다.
- 사용자가 Player에서 직접 변경한 Windows 볼륨은 팝업 종료 시 임의로 이전 값으로 복원하지 않고 사용자의 최종 설정으로 유지한다.
- 기본 출력 장치 없음/출력 장치 변경/Core Audio 접근 실패 시 영상 재생 자체가 실패하지 않도록 예외 처리한다.

추가 TODO:

- [ ] Core Audio COM interop 계층 구현(외부 NuGet 없음)
- [ ] 기본 출력 장치 Master Volume/Mute 초기값 조회
- [ ] Player Volume Slider 초기값을 Windows Master Volume과 동기화
- [ ] Player Volume 변경 → Windows Master Volume 반영
- [ ] Player Mute 변경 → Windows Master Mute 반영
- [ ] Windows Master Volume/Mute 변경 이벤트 → Player UI 반영
- [ ] 내부 MediaElement/HTML5 volume과 Master Volume의 중복 감쇠 방지
- [ ] 로컬 MediaElement/URL WebView2 동일 동작 확인
- [ ] Windows Master Volume=0 및 Mute=true 상태에서 BackgroundOverlay VIDEO 진입 검증
- [ ] 출력 장치 변경/장치 없음/Core Audio 실패 시 예외 처리 검증
- [ ] 팝업 종료 후 사용자가 변경한 Windows 최종 볼륨 상태 유지 확인

### 9.9 완료 기준

- 컨트롤바가 영상 영역의 높이를 별도로 차지하지 않고 하단 Overlay로 표시된다.
- 재생 중 일정 시간 입력이 없으면 컨트롤이 숨겨지고 사용자 입력 시 다시 나타난다.
- 일시정지 상태에서는 컨트롤을 바로 사용할 수 있다.
- 영상 영역 클릭만으로 Play/Pause가 가능하며 중앙 상태 피드백이 표시된다.
- Loading/Buffering/재생/일시정지 상태를 사용자가 시각적으로 구분할 수 있다.
- Overlay UI 변경 후에도 기존 Seek/배속/전체화면/완료율 계산 기능이 기존과 동일하게 동작하며, Volume/Mute는 Windows Master Volume/Mute 양방향 Sync 정책에 따라 정상 동작한다.
- 로컬 영상과 URL 영상에서 가능한 한 동일한 플레이어 경험을 제공한다.

### 9.9 2026-10-02 Overlay 구현 및 검증

- 로컬/URL 컨트롤·클릭 입력·중앙 재생 피드백·Loading/Buffering Spinner를 동일 VideoSurface의 WPF Overlay로 통합. 별도 컨트롤 행 제거. URL은 HWND 기반 WebView2 대신 현행 SDK 1.0.3124.44의 WebView2CompositionControl 사용([Microsoft WPF WebView2 문서](https://learn.microsoft.com/en-us/microsoft-edge/webview2/platforms/wpf)). HTML 내부 별도 UI는 추가하지 않음. YouTube는 기존 자체 플레이어 정책 유지.
- 마우스 진입 시 즉시 표시, 재생 중 이탈 시 즉시 숨김. 영상 안에서 3초 무입력 시 컨트롤 숨김, 이동·클릭 시 재표시. Pause·Seek·마우스 조작·키보드 조작 동안 표시 유지. 조작 종료 후 재예약. 입력은 영상 전용 형제 Border에서 처리해 컨트롤 버튼/Slider 입력이 재생 토글로 전달되지 않음. 중앙 Play/Pause 피드백은 700ms 후 제거. 종료 시 두 타이머 정리.
- HTML5 progress 메시지에 buffered 구간 배열 추가. 끊어진 다운로드 구간도 진행바의 해당 시간 위치에 회색으로 표시. 범위 표시로 시청시간을 변경하지 않음. MediaElement는 초기 로딩 및 BufferingProgress가 제공하는 0~1 사이 대기 상태를 공통 Spinner로 표현.
- 전체화면은 기존 VideoContainer를 이동해 동일 Overlay를 재사용하고 진입·복귀 시 숨김 타이머 재예약. showControls=false·전체화면/배속 금지 정책 유지. 결합 VIDEO+QUIZ의 단일 ScrollViewer·문항 잠금·높이 유지 레이아웃 검증 통과.
- CompositionControl 실제 Loaded에는 Microsoft.Windows.SDK.NET·WinRT.Runtime이 필요하다. Popup 및 동작 검증 프로젝트 TargetFramework를 net10.0-windows10.0.17763.0으로 명시해 Windows SDK 런타임을 포함. WebView2 버전 유지. 폐쇄망에는 Windows SDK NuGet 의존성 재수집이 필요하며 이번 작업에서 반입 묶음·dist는 재생성하지 않음.
- Windows SDK 10.0.401 환경에서 WPF 동작 **245건**, 생성 HTML5 브리지 **64건** 통과. WPF Overlay 계층, 클릭 전파 분리, Pause/조작 중 숨김 방지, showControls=false, buffered 구간 좌표, 종료 타이머 정리 포함. 기존 결합 스크롤·완료율·시청시간·제출 경로 검증 유지.
- 임시 실제 MediaElement/WebView2 Runtime 154.0.4258.48 + 로컬 HTTP 테스트 **37건 통과**: 자동 재생·로딩·HTTP 오류·브리지 Buffering·WPF 영상 클릭·3초 숨김·피드백 자동 제거·Pause 컨트롤 유지·영역 안 Overlay 배치. 로컬/URL 렌더링 PNG를 생성·시각 확인해 실제 영상 위 WPF 컨트롤 표시 확인. 클릭·버퍼링 입력은 이벤트 주입이며 물리 입력·실제 네트워크 단절 테스트는 아님.
- 전체화면 왕복·물리 마우스/키보드·실제 모니터 DPI·폐쇄망 Runtime 134·YouTube·사용 서버 URL 검증은 미실행. 해당 항목을 완료로 처리하지 않음. 미커밋·미푸시.
- hover 후속: 진입 즉시 표시·재생 중 이탈 즉시 숨김 및 정지/드래그 유지 검증 추가 후 Windows WPF 동작 253건 통과. 실제 물리 마우스 검증은 미실행.
