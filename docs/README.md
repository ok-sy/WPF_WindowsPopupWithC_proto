# 개발자 문서

**개발자가 읽는 문서는 영역별 2개씩, 최대 3개 이내**로 관리한다. 에이전트용 TODO·정책·계약·검토 이력은 기존 위치에 유지하지만 사용자용 기본 목차에는 나열하지 않는다.

| 담당 영역 | ① 개발 가이드 | ② 검증 체크리스트 | ③ 통합 사양서 |
|---|---|---|---|
| **프론트 (Next.js)** | [개발 가이드](developers/frontend/01_개발가이드.md) | [검증 체크리스트](developers/frontend/02_검증체크리스트.md) | — |
| **백엔드 (Spring·Oracle)** | [개발 가이드](developers/backend/01_개발가이드.md) | [검증 체크리스트](developers/backend/02_검증체크리스트.md) | — |
| **CS (WPF .NET)** | [개발 가이드](developers/cs/01_개발가이드.md) | [검증 체크리스트](developers/cs/02_검증체크리스트.md) | [WPF 에이전트 사양서](interfaces/WPF/WPF_AGENT_SPEC.md) |

WPF 에이전트 사양서는 정책과 API를 기능별로 연결해 쉬운 설명·흐름도·화면 구성도·JSON 예제로 정리한 문서다. 에이전트의 전체 동작을 처음 확인할 때 사용한다.

## 문서 관리 원칙

1. **각 영역의 사용자용 문서는 2개**로 시작하고 3개를 넘기지 않는다. CS는 정책·인터페이스를 합친 에이전트 사양서를 세 번째 문서로 둔다. 이후 새로운 업무 내용은 해당 영역의 기존 문서에 **섹션으로 추가**한다.
2. API 상세 필드·기본값·ENUM은 [원본 인터페이스 v3.7](interfaces/WPF/POPUP_INTERFACE_SPEC.md), 확정 정책은 [POLICY](policies/POLICY.md), 실행 상태는 [ACTIVE_TASKS](policies/ACTIVE_TASKS.md)가 기준이다. **이들은 에이전트·근거용 참조이며 영역별 문서 수에 포함하지 않는다.**
3. 2026-11-03 수신 화면설계서 V0.5는 [recieve_plan0.5](design/recieve_plan0.5.md)에 보존한다. 각 영역 가이드에서 필요한 항목만 참조한다.
4. 과거 `design/`, `reviews/`, `policies/POL-*.md`, `interfaces/`의 원본 파일은 **삭제하지 않고 이력·계약·에이전트 자료로 보존**한다. 이전 문서 링크도 유지한다.
5. 기존 `POPUP_OPTION_GUIDE.md`, `POPUP_USER_OPTION_GUIDE.md` 등은 기존 링크를 위해 보존하되 **사용자용 기본 진입점에서는 제외**한다. 이후 실사용 대조를 거쳐 아카이브/삭제 여부를 별도 결정한다.
6. 코드·API 계약·정책 변경은 이번 문서 재구성에 포함되지 않는다.

[에이전트용 활성 작업](policies/ACTIVE_TASKS.md) · [검토 통합 근거](reviews/20261103_활성작업_통합검토.md) · [변경 이력](../version-history/CHANGELOG.md)
