# Popup

## WPF Demo Mode

`Popup/appsettings.json`에서 `PopupApi.DemoMode`를 `true`로 설정하면
Java API와 PostgreSQL 없이 WPF 화면만 시연할 수 있다.

```json
{
  "PopupApi": {
    "DemoMode": true
  }
}
```

Demo Mode에서는 프로그램 시작 시 팝업 선택 화면이 표시된다. TEXT, IMAGE,
VIDEO, SURVEY, QUIZ 버튼으로 원하는 화면을 하나씩 열거나, `전체 팝업 순차 실행`
버튼으로 5종을 순서대로 확인할 수 있다. 팝업 조회, 이벤트 기록, 숨김, 설문 저장,
영상 진행률 저장을 포함한 Java API 통신과 주기 조회는 실행하지 않는다.

실제 API 연동 모드로 돌아가려면 `DemoMode`를 `false`로 변경한다.

### 폐쇄망 Demo 미디어

다음 파일명으로 미디어를 추가하면 빌드 시 내장 리소스로 포함된다.
단일 EXE 배포에서는 별도 `Media` 폴더 없이 이미지·영상 데모를 실행할 수 있다.

```text
Popup/Media/demo-image.jpg
Popup/Media/demo-video.mp4
```

실행 시 `%LOCALAPPDATA%/Popup/DemoMedia/<콘텐츠 해시>/`에 내장 미디어를 추출한다.
캐시 파일의 해시가 일치하면 재사용하며, EXE 옆 `Media/demo-image.jpg` 또는
`Media/demo-video.mp4`가 있으면 해당 외부 파일을 우선 사용한다.
