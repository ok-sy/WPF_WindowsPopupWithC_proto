# popup_notice DISPLAY_ORDER ERD 반영 메모

`popup.popup_notice`에 팝업 표시 우선순위/순서를 관리하는 컬럼을 추가한다.

| 논리명 | 물리명 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|---|
| 팝업 표시 순서 | `display_order` | `INTEGER` | NOT NULL | `100` | 값이 작을수록 먼저 표시한다. 동일한 순서의 `SIMULTANEOUS` 팝업은 같은 표시 그룹으로 처리할 수 있다. |

제약조건:

```sql
CHECK (display_order >= 1)
```

.erwin 파일은 바이너리 형식이므로 이 메모를 기준으로 `팝업시스템_ERD_물리논리_v0.2_한글논리명.erwin`의 `popup_notice` 엔터티에 동일 컬럼을 수동 반영한다.
