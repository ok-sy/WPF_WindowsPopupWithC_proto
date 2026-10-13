# 36. TEXT 서식 변환·C# 화이트리스트 중복 검토 TODO

기준일: 2026-10-13 (KST).  
상태: **당시 검토·구현 완료 · 유지 결정은 TODO48에서 변경**(2026-10-14).

> 후속 확정: [TODO48](48_TEXT_서버정책_CSharp_표시방어_분리_TODO.md)에서 서버·C# 정책 화이트리스트 중복을 제거하고 표시 변환·최소 방어만 유지하기로 했다. 아래 유지 논증은 당시 이력이며 현재 구현 방향이 아니다. Demo는 운영 시점 제거 대상으로 유지 근거에서 제외한다. TODO48 구현 전까지 기존 코드는 유지된다.

Trello: [TEXT EDITOR 화이트리스트 CS쪽 제거 여부 체크](https://trello.com/c/e9oWww78).

## 목적과 확인한 사실

서버와 C#이 서식 허용 규칙을 중복 관리하는 범위를 확인하고, C#에 남겨야 하는 표시 변환·오류 방어와 제거 가능한 정책 검증을 구분한다. 과제 진행은 확정되었다. 다만 개별 검사를 어디까지 제거할지는 호출 경로와 표시 안전성을 확인하여 정하며, 진행 확정을 모든 방어 코드의 일괄 삭제로 해석하지 않는다.

최신 main에서 실제 파일 `popup-frameWork/Popup/Views/Contents/PopupRichText.cs`를 확인했다. 기존 작업본에서 파일을 찾지 못했다는 기록은 최신 원격 코드 기준으로 정정한다.

현재 코드에는 색상 형식 검사 `IsAllowedColor`, 크기 허용 목록 `Sizes.Contains`, 글꼴 ID 매핑 `Fonts.TryGetValue`가 있다. `format.Size is double size`는 nullable 값 확인이며, 이 파일은 popupType으로 TEXT 여부를 다시 분기하지 않는다. 따라서 검토의 중심은 팝업 유형 분기 제거가 아니라 **서식 정책 중복 및 렌더링 방어의 책임 구분**이다.

## TODO

- [x] 서버 `PopupRichText.java`, 웹 `popupRichText.ts`, C# `PopupRichText.cs`의 색상·크기·글꼴·문단 정렬 규칙을 대조한다. → §검토 결과 1
- [x] 서버 응답뿐 아니라 Demo 직접 입력·로컬 데이터 등 모든 호출 경로가 동일한 검증을 거치는지 확인한다. → §검토 결과 2
- [x] 색상 파싱 전 형식 확인, WPF FontSize 유효 범위, null 처리, 알 수 없는 글꼴 ID의 대체 처리를 정책 허용 목록과 분리한다. → §검토 결과 3
- [x] 글꼴 ID를 WPF 글꼴명으로 바꾸는 매핑은 검증과 다른 책임이므로, 허용 목록을 줄이더라도 필요한 변환을 유지한다. → 유지
- [x] 서버 검증을 신뢰할 수 있는 경계와 우회 입력의 동작을 정한 뒤, C# 유지·축소·제거 중 방향을 결정한다. → **유지**(§검토 결과 4)
- [x] 제거 효과와 잘못된 값 수신 시 예외·텍스트 누락 위험을 비교하고 결정 근거를 기록한다. 중복만으로 무조건 삭제하지 않는다.
- [x] 변경을 결정하면 정상 서식, 누락·null, 잘못된 색상·크기·글꼴 및 Demo 경로의 표시·fallback을 검증한다. → 검사 유지로 동작 변경 없음. 기존 BehaviorTests `CheckRichText28`(허용 밖 값 무시·Demo 검증·plainText fallback) 재실행 통과
- [x] 구현 시 TODO28과 관련 인터페이스·샘플 문서의 허용 규칙을 함께 맞춘다. → 허용 규칙 변경 없음

## 검토 결과 (2026-10-13)

### 1. 세 구현의 규칙 대조

| 규칙 | 서버 `PopupRichText.java` | 웹 `popupRichText.ts` | C# `PopupRichText.cs` |
|---|---|---|---|
| 색 | `^#[0-9A-F]{6}$`(대문자) | 같은 정규식. 팔레트 8색은 편집기 버튼용 | 길이 7·`#`·0-9/A-F |
| 크기 | 12·14·16·18·20·24·28·32(정수) | 같은 목록 | 같은 목록(`double`) |
| 글꼴 ID | MALGUN_GOTHIC·GULIM·DOTUM·BATANG | 같은 ID → CSS 글꼴 목록 | 같은 ID → WPF 글꼴명 |
| 정렬 | LEFT·CENTER·RIGHT, null 허용 | 같은 값, 그 밖은 LEFT | CENTER·RIGHT, 그 밖은 LEFT |
| 키·개수·길이 | 허용 외 키 거부, 문단 500·구간 2000·파생 20000자 | 허용 외 키 제거 | DTO에 없는 키 무시, 개수 제한 없음 |
| 위반 처리 | 저장 거부(예외) | 편집기에서 걸러냄 | 해당 서식만 무시하고 글자 표시 |

값 목록은 세 곳이 일치한다. 차이는 위반 처리 방식뿐이다(서버 거부 / 웹 정리 / WPF 무시).

### 2. 호출 경로와 검증 경계

- 서버 검증은 **관리자 저장 시에만** 실행된다(`PopupService.validateRichText`·`bodyText`). 조회 경로(`PopupContentAssembler` → `WpfPopupItem`)는 `CONTENT_OPTIONS`의 textBlocks를 재검증 없이 전달한다. DB 직접 수정·스크립트 적재 데이터는 검증 없이 WPF에 도달한다.
- Demo 내장 샘플(`DemoPopupDataService`)은 어떤 검증도 거치지 않는다.
- Demo 옵션 편집(`DemoOptionsWindow.ValidateTextBlocks`)은 서버 규칙의 C# 이식본이며 `PopupRichText.Sizes`·`Fonts`·`IsAllowedColor`를 그대로 사용한다.
- 문서 예제 JSON은 코드가 읽지 않는다.

### 3. 표시 변환 vs 정책 검사 구분

| C# 코드 | 성격 | 제거 시 영향 |
|---|---|---|
| `IsAllowedColor` | 파싱 전 형식 확인 | 잘못된 색 문자열에서 `ColorConverter` 예외 → TEXT 팝업 생성 실패 |
| `Sizes.Contains` | 허용 목록이자 FontSize 범위 방어 | 0·음수는 WPF 예외, 매우 큰 값은 레이아웃 파손 |
| `Fonts.TryGetValue` | ID → 글꼴명 변환(필수) | 제거 불가. 알 수 없는 ID는 기본 글꼴로 대체(현행) |
| 정렬 switch | 문자열 → enum 변환(필수) | 제거 불가 |

### 4. 결정: C# 검사 유지

- 서버가 조회 시 재검증하지 않고 Demo 샘플도 검증 경로가 없어, C# 검사는 중복 정책이 아니라 **표시 단계의 마지막 방어선**이다. 제거로 얻는 것은 코드 몇 줄이고, 잃는 것은 잘못된 값 하나로 팝업 전체가 뜨지 않는 위험이다.
- 같은 목록을 Demo 옵션 검증이 공유하므로, 목록을 없애면 Demo 검증도 다시 만들어야 한다.
- 정리한 것: 호출처가 없는 `PopupRichText.ToPlainText`(파생 plainText는 서버·웹·Demo 옵션이 각각 생성) 삭제, 클래스 주석에 유지 근거 기록.
- 세 곳의 목록이 바뀔 때는 기존 주석대로 서버·웹·C#을 함께 수정한다.

### 남은 위험(이번 범위 밖)

- 값이 아니라 **JSON 형식**이 틀린 경우(예: `"bold":"true"`, 숫자 `color`)는 `PopupFactory.CreateTextPopupView`의 형식 지정 역직렬화에서 예외가 나 TEXT 팝업 전체가 생성되지 않는다(코드 확인, 실행 재현은 안 함). 저장 시 서버가 형식을 거부하므로 DB 직접 수정 때만 발생한다. 서식만 버리고 본문을 표시하도록 보강할지는 별도 판단이 필요하다.

## 완료 기준

검증 경계, 표시 변환 책임, 남길 방어 코드와 제거할 중복 정책이 설명되어야 한다. 유지 결정도 유효한 검토 결과다. → 위 검토 결과로 충족. 검사는 유지하고 미사용 코드만 삭제했다.
