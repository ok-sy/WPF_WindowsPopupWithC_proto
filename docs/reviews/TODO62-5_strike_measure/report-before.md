# TODO62-5 취소선 위치 실측 (웹 미리보기 ↔ WPF)

- 생성: 2026-11-27T20:08:15.085Z · 표본 글자 `가나다 Hxg 123` · 웹 headless Edge 100% · WPF RenderTargetBitmap 96 DPI
- offset = 취소선 중심 - 글자 잉크 위쪽(px), ratio = offset ÷ 잉크 높이, Δ = 웹 - WPF. 두께는 px 행 수.

| 케이스 | 글꼴(웹 계산값) | 크기 | 잉크 높이 웹/WPF | 취소선 offset 웹/WPF (Δ) | ratio 웹/WPF (Δ) | 두께 웹/WPF | 밑줄 중심 웹/WPF | 비고 |
|---|---|---|---|---|---|---|---|---|
| STR-01 | 유앤아이Modern | 32 | 34/35 | 13.5/17 (-3.5) | 0.4/0.49 (-0.09) | 3/2 | 29.5/33 | 이 PC 미설치 → 대체 글꼴 |
| STR-01N | "Noto Sans KR" | 32 | 34/34 | 13.5/16 (-2.5) | 0.4/0.47 (-0.07) | 3/2 | 29.5/30 | STR-01 대체 측정(설치 글꼴) |
| STR-02 | "Noto Sans KR" 기울임 | 32 | 34/34 | 13.5/16 (-2.5) | 0.4/0.47 (-0.07) | 3/2 | - |  |
| STR-03-12 | "Malgun Gothic" | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-03-16 | "Malgun Gothic" | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-03-32 | "Malgun Gothic" | 32 | 35/35 | 15.5/17 (-1.5) | 0.44/0.49 (-0.04) | 3/2 | - |  |
| STR-04 | "Noto Serif KR" | 32 | 35/35 | 14.5/17 (-2.5) | 0.41/0.49 (-0.07) | 3/2 | 30.5/30 |  |
| STR-05-12-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-05-12-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-05-12-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-05-12-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-05-12-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-05-12-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 12 | 13/13 | 5.5/6.5 (-1) | 0.42/0.5 (-0.08) | 1/1 | - |  |
| STR-05-16-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-05-16-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-05-16-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-05-16-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-05-16-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-05-16-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 16 | 17/17 | 7.5/8.5 (-1) | 0.44/0.5 (-0.06) | 1/1 | - |  |
| STR-05-28-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 28 | 33/33 | 16/18 (-2) | 0.48/0.55 (-0.06) | 2/2 | - |  |
| STR-05-28-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 28 | 33/33 | 16/18 (-2) | 0.48/0.55 (-0.06) | 2/2 | - |  |
| STR-05-28-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 28 | 33/33 | 16/18 (-2) | 0.48/0.55 (-0.06) | 2/2 | - |  |
| STR-05-28-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 28 | 31/31 | 14/16 (-2) | 0.45/0.52 (-0.06) | 2/2 | - |  |
| STR-05-28-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 28 | 31/31 | 14/16 (-2) | 0.45/0.52 (-0.06) | 2/2 | - |  |
| STR-05-28-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 28 | 31/31 | 14/16 (-2) | 0.45/0.52 (-0.06) | 2/2 | - |  |
| STR-05-32-bold-LEFT | "Malgun Gothic" 굵게 LEFT | 32 | 36/36 | 16.5/18 (-1.5) | 0.46/0.5 (-0.04) | 3/2 | - |  |
| STR-05-32-bold-CENTER | "Malgun Gothic" 굵게 CENTER | 32 | 36/36 | 16.5/18 (-1.5) | 0.46/0.5 (-0.04) | 3/2 | - |  |
| STR-05-32-bold-RIGHT | "Malgun Gothic" 굵게 RIGHT | 32 | 36/36 | 16.5/18 (-1.5) | 0.46/0.5 (-0.04) | 3/2 | - |  |
| STR-05-32-italic-LEFT | "Malgun Gothic" 기울임 LEFT | 32 | 35/35 | 15.5/17 (-1.5) | 0.44/0.49 (-0.04) | 3/2 | - |  |
| STR-05-32-italic-CENTER | "Malgun Gothic" 기울임 CENTER | 32 | 35/35 | 15.5/17 (-1.5) | 0.44/0.49 (-0.04) | 3/2 | - |  |
| STR-05-32-italic-RIGHT | "Malgun Gothic" 기울임 RIGHT | 32 | 35/35 | 15.5/17 (-1.5) | 0.44/0.49 (-0.04) | 3/2 | - |  |

- 최대 |Δratio|: STR-01 -0.09 (offset Δ -3.5px, 크기 32)
