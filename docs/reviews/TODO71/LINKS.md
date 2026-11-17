# TODO71 파일 링크 검증

조사 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. 실행: `python3 scripts/audit-policy-docs-71.py`.

- 신규 정책/보고서/TODO71 파일 링크 오류: 0개.
- docs/README 추가 내비게이션에서 신규 오류 없음.
- 기존 docs Markdown에서 발견한 파일 링크 오류: 17개. 아래는 조사 커밋 원문 기준이며 이번 수정으로 발생한 오류가 아니다.
- 파일/디렉터리 존재만 검사. 앵커·외부 URL 가용성·코드 블록·Word/PDF/Excel 내부는 제외.

| 기존 파일 | 줄 | 원문 대상 | 처리 |
|---|---|---|---|
| `docs\POPUP_OPTION_GUIDE.md` | 10 | `interfaces/WPF_POPUP_MINIMAL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\POPUP_OPTION_GUIDE.md` | 10 | `interfaces/WPF_POPUP_ALL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\POPUP_OPTION_GUIDE.md` | 224 | `interfaces/POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\POPUP_OPTION_GUIDE.md` | 244 | `interfaces/POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\README.md` | 9 | `interfaces/POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\README.md` | 21 | `interfaces/POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\README.md` | 23 | `interfaces/WPF_POPUP_MINIMAL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\README.md` | 24 | `interfaces/WPF_POPUP_ALL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\POPUP_INTERFACE_SPEC.md` | 30 | `WPF_POPUP_MINIMAL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\POPUP_INTERFACE_SPEC.md` | 30 | `WPF_POPUP_ALL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\POPUP_INTERFACE_SPEC.md` | 375 | `WPF_POPUP_MINIMAL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\POPUP_INTERFACE_SPEC.md` | 375 | `WPF_POPUP_ALL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\WPF_POPUP_ALL_SPEC.md` | 6 | `WPF_POPUP_MINIMAL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\WPF_POPUP_ALL_SPEC.md` | 13 | `POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\WPF_POPUP_MINIMAL_SPEC.md` | 11 | `WPF_POPUP_ALL_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\WPF_POPUP_MINIMAL_SPEC.md` | 13 | `POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |
| `docs\interfaces\WPF_POPUP_MINIMAL_SPEC.md` | 169 | `POPUP_INTERFACE_SPEC.md` | 과거 경로/링크 원문 보존; 별도 정정 대상 |

원본 이동은 수행하지 않았다. 기존 실패를 새 정책 링크 통과 결과에 합산해 숨기지 않는다.
