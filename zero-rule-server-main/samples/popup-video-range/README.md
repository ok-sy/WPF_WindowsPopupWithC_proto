# 팝업 동영상 파일 Range 스트리밍 샘플

zero-rule-server-main의 Spring Boot 3.4.1 / 내장 Tomcat에서 실행하는 API입니다.
서버 파일을 HTTP로 전달하므로 WPF 클라이언트에 영상 파일이 없어도 됩니다.

## 1. 서버 설정

서버에 영상 폴더와 실제 MP4 파일을 준비합니다. 예: D:/popup-videos/education/demo.mp4.
실행하는 프로필의 application-*.yml에 다음을 추가하고 기존 방식으로 서버를 실행합니다.

```yaml
popup:
  video:
    enabled: true
    root: D:/popup-videos
```

이미 popup 항목이 있으면 video만 그 아래 병합합니다.
환경 변수 POPUP_VIDEO_ENABLED=true, POPUP_VIDEO_ROOT=D:/popup-videos로도 설정할 수 있습니다.
기본은 비활성화이며, 활성화 시 폴더가 없으면 시작 단계에서 오류가 납니다.
기존 zero 서버의 DB 및 기타 실행 설정은 그대로 필요합니다.

## 2. 요청 예시

```text
GET http://localhost:8080/zero-rule-server/p/api/popups/video/education/demo.mp4
GET http://localhost:8080/zero-rule-server/p/api/popups/video?path=D%3A%2Fpopup-videos%2Feducation%2Fdemo.mp4
Range: bytes=0-1023
```

포트와 context-path는 실제 서버 설정에 맞춥니다.
path는 **서버 파일 경로**입니다. 설정한 root 내부의 상대 경로 또는 절대 경로를 받습니다.
한글, 공백, &, # 등은 쿼리 값 전체를 URL 인코딩해서 전달합니다.
root 밖 경로 및 외부로 연결된 심볼릭 링크는 403, 없는 파일은 404,
지원하지 않는 확장자는 415입니다. mp4/m4v/webm/ogv를 제공합니다.
기존 /p/** 공개 API 규칙을 사용하므로 이 폴더에는 공개 가능한 팝업 영상만 둡니다.
배포 중인 파일은 덮어쓰지 말고 새 이름으로 추가해 재생 중 구간 내용이 바뀌지 않게 합니다.

## 3. WPF 팝업 연결

VIDEO 팝업 content의 videoUrl에 아래처럼 서버 URL을 저장합니다.

```json
{
  "videoTitle": "교육 영상",
  "videoUrl": "http://localhost:8080/zero-rule-server/p/api/popups/video/education/demo.mp4",
  "description": "Tomcat 파일 스트리밍 예제"
}
```

다른 PC의 팝업에서는 localhost 대신 서버의 실제 호스트명을 사용합니다.
C#에서 조립할 때:

```csharp
string videoUrl = serverBaseUrl.TrimEnd('/') +
    "/p/api/popups/video/" +
    "education/" + Uri.EscapeDataString("demo.mp4");
```

기존 VideoPopupView가 HTTP URL을 WebView2의 video 태그로 재생합니다.
재생 및 탐색 시 브라우저가 Range 요청을 보냅니다. 프런트에서 직접 바이트를 나눌 필요는 없습니다.
일반 HTML에서도 아래처럼 재생할 수 있습니다.

```html
<video controls preload="metadata"
       src="http://localhost:8080/zero-rule-server/p/api/popups/video/education/demo.mp4"></video>
```

## 4. 구간 응답 확인

1KB보다 큰 실제 영상으로 다음 명령을 실행합니다.

```powershell
$url = 'http://localhost:8080/zero-rule-server/p/api/popups/video/education/demo.mp4'
curl.exe -sS -D - -o NUL -H 'Range: bytes=0-1023' $url
curl.exe -sS -D - -o NUL -H 'Range: bytes=-1024' $url
curl.exe -sS -D - -o NUL -H 'Range: bytes=999999999999999-' $url
curl.exe -sS -I $url
```

첫 요청은 206, Content-Range: bytes 0-1023/전체크기, Content-Length: 1024가 예상됩니다.
두 번째는 마지막 1024바이트를 206으로 반환합니다.
세 번째는 파일 크기 밖의 요청이므로 416, Content-Range: bytes */전체크기가 예상됩니다.
HEAD는 본문 없이 헤더를 확인합니다. Range 없는 GET은 200으로 전체 파일을 스트리밍합니다.
실제 팝업에서도 재생 시작, 중간 탐색, 끝부분 재생을 확인합니다.

## 구현 방식과 범위

PopupVideoController는 FileSystemResource를 200 응답으로 반환합니다.
Spring MVC가 Range를 해석하여 단일/복수 구간의 206 응답과 범위 오류 416을 처리합니다.
전체 파일을 byte[]로 읽지 않습니다. 전송은 MVC/Tomcat의 블로킹 I/O를 사용합니다.
이는 파일 기반 HTTP 스트리밍 샘플이며 HLS 변환이나 화질 자동 전환 기능은 없습니다.
확장자에 맞는 실제 영상/코덱을 준비해야 합니다.

공식 문서: [Spring MVC Range Requests](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-range.html)
## 파일 URL로 호출

D:/popup-videos/education/demo.mp4 파일은 /zero-rule-server/p/api/popups/video/education/demo.mp4 로 호출합니다.
서버 시작 후 root 아래에 추가한 파일도 재시작이나 DB 등록 없이 호출할 수 있습니다.
Range 헤더가 있으면 206 또는 416, 없으면 200으로 전체 파일을 스트리밍합니다.
기존 ?path= 방식도 유지됩니다. serverBaseUrl에는 context-path까지 포함하세요.
