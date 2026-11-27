# TODO62-5 취소선 위치 실측 (웹 미리보기 ↔ WPF)

- 생성: 2026-11-27T23:04:14.882Z · 표본 글자 `가나다 Hxg 123` · 웹 headless Edge 100% · WPF RenderTargetBitmap 96 DPI
- offset = 취소선 중심 - 글자 잉크 위쪽(px), ratio = offset ÷ 잉크 높이, Δ = 웹 - WPF. 두께는 px 행 수.

| 케이스 | 글꼴(웹 계산값) | 크기 | 잉크 높이 웹/WPF | 취소선 offset 웹/WPF (Δ) | ratio 웹/WPF (Δ) | 두께 웹/WPF | 밑줄 중심 웹/WPF | 비고 |
|---|---|---|---|---|---|---|---|---|
| STR-01 | 유앤아이Modern | 32 | 34/35 | 17/17 (0) | 0.5/0.49 (0.01) | 2/2 | 29.5/33 | 이 PC 미설치 → 대체 글꼴 |
| STR-01N | "Noto Sans KR" | 32 | 34/34 | 16/16 (0) | 0.47/0.47 (0) | 2/2 | 29.5/30 | STR-01 대체 측정(설치 글꼴) |
| STR-02 | "Noto Sans KR" 기울임 | 32 | 34/34 | 16/16 (0) | 0.47/0.47 (0) | 2/2 | - |  |
| STR-03-12 | "Malgun Gothic" | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-03-16 | "Malgun Gothic" | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-03-32 | "Malgun Gothic" | 32 | 35/35 | 17/17 (0) | 0.49/0.49 (0) | 2/2 | - |  |
| STR-04 | "Noto Serif KR" | 32 | 35/35 | 17/17 (0) | 0.49/0.49 (0) | 2/2 | 30.5/30 |  |
| STR-05-12-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-12-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-12-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-12-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-12-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-12-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 12 | 13/13 | 6.5/6.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-16-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-16-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-16-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-16-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-16-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-16-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 16 | 17/17 | 8.5/8.5 (0) | 0.5/0.5 (0) | 1/1 | - |  |
| STR-05-28-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 28 | 33/33 | 17.5/18 (-0.5) | 0.53/0.55 (-0.02) | 1/2 | - |  |
| STR-05-28-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 28 | 33/33 | 17.5/18 (-0.5) | 0.53/0.55 (-0.02) | 1/2 | - |  |
| STR-05-28-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 28 | 33/33 | 17.5/18 (-0.5) | 0.53/0.55 (-0.02) | 1/2 | - |  |
| STR-05-28-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 28 | 31/31 | 15.5/16 (-0.5) | 0.5/0.52 (-0.02) | 1/2 | - |  |
| STR-05-28-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 28 | 31/31 | 15.5/16 (-0.5) | 0.5/0.52 (-0.02) | 1/2 | - |  |
| STR-05-28-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 28 | 31/31 | 15.5/16 (-0.5) | 0.5/0.52 (-0.02) | 1/2 | - |  |
| STR-05-32-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 32 | 36/36 | 18/18 (0) | 0.5/0.5 (0) | 2/2 | - |  |
| STR-05-32-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 32 | 36/36 | 18/18 (0) | 0.5/0.5 (0) | 2/2 | - |  |
| STR-05-32-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 32 | 36/36 | 18/18 (0) | 0.5/0.5 (0) | 2/2 | - |  |
| STR-05-32-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 32 | 35/35 | 17/17 (0) | 0.49/0.49 (0) | 2/2 | - |  |
| STR-05-32-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 32 | 35/35 | 17/17 (0) | 0.49/0.49 (0) | 2/2 | - |  |
| STR-05-32-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 32 | 35/35 | 17/17 (0) | 0.49/0.49 (0) | 2/2 | - |  |

- 최대 |Δratio|: STR-05-28-italic-LEFT -0.02 (offset Δ -0.5px, 크기 28)
