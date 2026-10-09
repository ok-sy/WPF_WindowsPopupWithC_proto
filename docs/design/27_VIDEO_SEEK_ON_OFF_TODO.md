# 27. VIDEO 진행바 SEEK ON/OFF TODO

기준일: 2026-10-08 (KST). 소스 확인: main 4a90327. 상태: 2026-10-09 구현 반영·자동 검증 완료, 실제 Windows 화면 검증 미실행.

## 1. 목적과 계약

영상 진행바를 통한 재생 위치 변경(Seek)을 설정으로 허용하거나 차단한다.
대상은 VIDEO와 영상 포함 QUIZ(VIDEO+QUIZ)의 로컬 MP4 및 HTTP 영상이다.
팝업 창의 헤더 드래그 이동은 변경 대상이 아니다.

옵션: content.allowSeek (boolean). 생략 기본값은 true로 하여 기존 탐색 가능 동작을 유지한다.

| 값 | 동작 |
| --- | --- |
| true | 진행바 클릭·드래그 및 지원하는 키보드 탐색 허용 |
| false | 앞/뒤 재생 위치 변경 모두 금지. 진행률·현재 시간·전체 시간 표시는 유지 |

```json
{
  "content": {
    "allowSeek": false
  }
}
```

위 예시는 추가 필드만 발췌한 것으로 영상 필수 필드는 기존 계약을 따른다.
- allowSeek는 탐색 UI/명령 정책이다. 재생·일시정지·볼륨·음소거·배속·전체화면과 독립적이다.
- 배속 허용은 기존 allowPlaybackRateChange로 별도 제어한다. allowSeek=false만으로 강제 시청 정책 전체를 보장한다고 설명하지 않는다.
- 시청률은 기존 실제 시청 누적 규칙을 유지한다. 정상 재생에 따른 위치 증가를 탐색으로 오인하지 않는다.
- 루프·재생 종료 후 재시작 등 내부의 정상 위치 초기화는 사용자 탐색 금지와 구분해 유지한다.
- 전체화면에서도 같은 allowSeek를 적용하고 복귀 후 유지한다.

## 2. 구현 TODO

- [x] VideoPopupContentDto에 allowSeek 수신 속성 및 기본 true 추가. 명시적 false가 기본값으로 덮이지 않도록 검증한다.
- [x] PopupFactory → VideoPopupView 생성 경로로 옵션 전달. VIDEO 및 VIDEO+QUIZ가 같은 정책을 사용하도록 한다.
- [x] 진행바 클릭·드래그의 시작/이동/종료와 키보드 등 위치 변경 진입점을 조사해 OFF일 때 차단한다. 실제 위치 변경 명령에서도 방어한다.
- [x] 단순히 Slider의 HitTest만 끄는 것으로 끝내지 않는다. 키보드·접근성 명령 및 웹 메시지 경로도 확인한다.
- [x] OFF에서는 마우스 캡처·재생 일시정지·isSeeking 설정이 발생하지 않도록 탐색 시작 전에 반환한다. 창 닫기/포커스 이탈 시 캡처 해제도 보존한다.
- [ ] OFF여도 재생 위치에 따른 ProgressSlider.Value 및 시간 표시 갱신은 계속한다. 변경 불가 상태가 시각·접근성 정보에 드러나도록 한다.
- [x] MediaElement.Position 변경과 HTML5 seek 명령 전송/처리에 동일 정책 적용. HTML5 currentTime 초기화·루프·재시작은 별도 처리한다.
- [ ] 웹 플레이어가 자체 탐색 UI를 노출하는지 확인한다. YouTube 등 외부 임베드는 동일한 제어가 가능한지 확인하고 미지원 조합은 등록 제한/명시적 안내로 처리한다. 막지 못하는 탐색을 막는다고 표시하지 않는다.
- [x] 관리자 등록·Demo 옵션에 '재생 위치 변경 허용' 체크박스 추가. 기본 체크, VIDEO/영상 포함 QUIZ에서 표시.
- [x] 서버 저장·조회에서 content.allowSeek를 유지하고 boolean 검증을 적용한다. 기존 content 경로를 우선 사용하며 별도 DB 컬럼 추가를 전제하지 않는다.
- [x] docs/interfaces/WPF_POPUP_ALL_SPEC.md와 관련 API/JSON 예제 갱신. WPF_POPUP_MINIMAL_SPEC.md도 검토하되 최초 제공 범위를 임의 확장하지 않는다.

### 2.1 구현 결과 (2026-10-09)

- WPF: `VideoPopupContentDto.AllowSeek`(기본 true) → `PopupFactory.CreateVideoPopupView` → `VideoPopupView(allowSeek)`. VIDEO와 VIDEO+QUIZ가 같은 생성 경로를 사용한다.
- OFF 진입점 차단: `ProgressSlider.IsEnabled=false`·`IsTabStop=false`로 마우스·키보드·UI Automation(RangeValue) 입력을 막는다. 비활성 요소는 hit test 대상이 아니라 마우스 이동은 컨트롤바로 전달되어 자동 숨김 동작이 유지된다. `ProgressSlider_PreviewMouseLeftButtonDown`은 캡처·일시정지·`_isSeeking` 설정 전에 반환하고 `FinishSeeking`도 위치 변경 전에 반환한다.
- HTML5: 생성 HTML의 `allowSeek` 상수로 `seek` 명령을 무시한다. 종료 후 재시작(`play` 명령의 `currentTime=0`)과 `loop` 속성은 별도 경로라 유지된다. 기본 controls가 없어 브라우저 자체 탐색 UI는 없다.
- YouTube: allowSeek 관련 처리를 두지 않는다(임베드 파라미터·관리자 안내 없음). 위 웹 플레이어 항목의 외부 임베드 부분은 미처리로 남긴다. VIDEO+QUIZ는 기존 정책상 YouTube 등록이 거부된다.
- 표시: 진행률·현재/전체 시간 갱신은 그대로이며 접근성 HelpText로 탐색 불가 상태를 노출한다. 진행바 외형은 바꾸지 않았다(비활성 시각 표시 방식 미결정 — 위 항목 미완료로 유지).
- 관리자 웹: '재생 위치 변경 허용' 스위치(기본 켜짐, VIDEO·동영상+퀴즈), 미리보기에 '탐색 제한' 표시. Demo 옵션 창은 DTO 속성에서 자동 생성되어 같은 항목이 표시된다.
- 서버: 기존 `CONTENT_OPTIONS` JSON 경로로 저장·조회되며 DB 컬럼은 추가하지 않았다. `validateActionOptions`에서 boolean 이외 값을 거부한다.

## 3. 검증 TODO

- [ ] true/false/누락 조합에서 로컬 및 HTTP 영상 확인.
- [ ] OFF에서 진행바 클릭·드래그·지원 키보드 입력·접근성 명령으로 앞/뒤 이동 불가 확인.
- [ ] OFF에서도 진행률·현재/전체 시간과 완료율이 정상 갱신되는지 확인.
- [ ] ON에서 기존 탐색, 탐색 전 재생/일시정지 상태 복귀, 마우스 캡처 해제 회귀 확인.
- [ ] 재생·일시정지·음량·음소거·배속·화면 클릭·컨트롤 자동 숨김 동작 유지 확인.
- [ ] 전체화면 진입/복귀·루프·영상 종료 후 재시작·재오픈 확인.
- [ ] VIDEO+QUIZ 시청 조건 해제·완료 전 닫기 제한·결과 전송 회귀 확인.
- [ ] allowPlaybackRateChange와 독립적인 ON/OFF 조합 확인.
- [ ] 창 헤더 드래그 및 저사양 CPU 개선 동작이 유지되는지 확인.

자동 검증(2026-10-09): WPF 행동 검증에 factory 전달(VIDEO·VIDEO_QUIZ × true/false/누락), OFF 진행률·시간 표시, 마우스 누름 시 캡처·`_isSeeking` 미발생, UI Automation SetValue 거부, HelpText를 추가해 816건 통과. HTML5 브리지 검증에 seek 명령 차단·종료 후 재시작 유지를 추가해 95건 통과. 서버 `PopupActionOptionsTest`에 boolean 검증·CONTENT_OPTIONS 유지 추가, popup 패키지 테스트 통과. 관리자 웹 `tsc --noEmit` 통과.
위 3절 항목은 실제 Windows 화면·로컬/HTTP 영상 재생 확인이 필요해 아직 체크하지 않았다.
