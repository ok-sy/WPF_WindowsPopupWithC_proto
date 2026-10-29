import { Alert, Paper, Stack } from '@mui/material';
import IS063M02Sample from '../../sample/IS063M02Sample';
import { Bullets, C, Section } from '../GuideUi';

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 예시 탭
 * - in : 없음
 * - out: 화면: 기존 퍼블리싱(IS063M02)에 공통 컴포넌트를 연결한 단계·달라진 값 요약과 실제 샘플 화면
 * - 정책 전체는 반복하지 않고 연결 지점만 요약한다(상세: docs/interfaces/POPUP_FRONT_SAMPLE_HANDOVER.md).
 */
export default function GuideExampleTab() {
  return (
    <Stack spacing={2}>
      <Section title="기존 업무 화면에 붙이는 방법 — IS063M02(컨텐츠 등록)" description={<>소스: <C>sample/IS063M02Sample.tsx</C> (원본 퍼블리싱 <C>sample/IS063M02.tsx</C>와 나란히 비교)</>}>
        <Bullets items={[
          '퍼블리싱 구조(n* 클래스·좌/중/우 3단·버튼 위치)는 그대로 두고, 편집기 자리에 `PopupRichTextEditor`, 우측 미리보기에 `InlinePopupPreview`, 미리보기 버튼에 `PopupPreviewDialog`를 연결했다.',
          '화면 state는 입력한 값만 갖는다(`newSamplePopup`·`changeSampleType`, 미설정 = 키 생략). 미리보기에만 `withPreviewFallback`을 쓴다.',
          '문항은 `PopupQuestionEditor`, 퀴즈 유형은 `PopupQuizRuleFields` + `usePopupQuizRule`(문항 1점 고정·통과 점수 계산).',
          '저장은 화면이 입력하는 필드만 `pickPopupFields`로 뽑아 보여 준다(서버 미전송). 실제 연결 시 이 값을 그 화면의 저장 API 형식으로 바꾼다.',
          "'컨텐츠 명'처럼 현재 저장 계약에 없는 값은 화면 state로만 두고 계약에 지어 넣지 않는다.",
        ]} />
      </Section>
      <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
        서버 없이 동작합니다. 폐쇄망 전역 n* 스타일은 이 환경에 없어 배치만 맞춥니다.
      </Alert>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'auto' }}><IS063M02Sample /></Paper>
    </Stack>
  );
}
