import { Alert, Paper, Stack } from '@mui/material';
import IS063M02Sample from '../../sample/IS063M02Sample';
import { Bullets, C, Section } from '../GuideUi';

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 예시 탭
 * - in : 없음
 * - out: 화면: 기존 퍼블리싱(IS063M02)에 공통 컴포넌트를 붙인 방법 요약과 실제 샘플 화면
 * - 정책 전체는 반복하지 않고 연결 지점만 요약한다(상세: docs/interfaces/POPUP_FRONT_SAMPLE_HANDOVER.md).
 */
export default function GuideExampleTab() {
  return (
    <Stack spacing={2}>
      <Section title="기존 화면에 붙이는 예 — IS063M02(컨텐츠 등록)" description={<>소스: <C>sample/IS063M02Sample.tsx</C> (원본 <C>sample/IS063M02.tsx</C>와 비교해 보세요)</>}>
        <Bullets items={[
          '화면 배치는 그대로 두고 편집기·미리보기 자리에 공통 컴포넌트를 넣었습니다.',
          '편집기는 `PopupRichTextEditor`, 옆 미리보기는 `InlinePopupPreview`, 미리보기 버튼은 `PopupPreviewDialog`입니다.',
          '문항은 `PopupQuestionEditor`, 퀴즈 유형은 `PopupQuizRuleFields`와 `usePopupQuizRule`로 입력받습니다.',
          '입력한 값만 state에 담고, 미리보기에 넘길 때만 `withPreviewFallback`을 씁니다.',
          "'pickPopupFields로 가져오기' 버튼을 누르면 호출 코드와 가져온 결과를 볼 수 있습니다.",
          "'컨텐츠 명'은 아직 저장할 항목이 없어 화면에서만 씁니다.",
        ]} />
      </Section>
      <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.7 }}>
        서버 없이 동작합니다. 저장 버튼은 결과만 보여 주고 서버에 보내지 않습니다.
      </Alert>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'auto' }}><IS063M02Sample /></Paper>
    </Stack>
  );
}
