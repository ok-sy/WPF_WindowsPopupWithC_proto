import { Alert, Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Bullets, C, CodeBlock, Page, Section, TabLink, type GuideNavigate } from '../GuideUi';

const IMPORT_CODE = `import {
  PopupRichTextEditor, PopupQuestionEditor, PopupScheduleFields,   // 입력
  InlinePopupPreview, PopupPreviewDialog,                           // 미리보기
  pickPopupFields, withPreviewFallback,                             // 추출·미리보기 fallback
  type RichBlock, type PopupScheduleValue,
} from '@/features/PopupcommonComponent';`;

const MINIMAL_CODE = `// 1) 화면 state: 입력한 값만 둔다(미설정 = 키 생략). createDefaultPopup()은 쓰지 않는다.
const [state, setState] = useState({ popupType: 'TEXT', title: '', content: {}, questions: [] });

// 2) 입력: 공통 컴포넌트는 필요한 값만 받고 바뀐 값을 돌려준다.
<PopupRichTextEditor label="본문" initialBlocks={[]}
  onChange={(textBlocks, plainText) => setState((p) => ({ ...p, content: { ...p.content, textBlocks, plainText } }))} />

// 3) 미리보기: 넘길 때만 표시용 값을 채운다(state·저장 값은 그대로).
<InlinePopupPreview popup={withPreviewFallback(state)} />

// 4) 저장: 필요한 필드만 값 그대로 뽑고, 저장 형식(날짜·키 이름·API)은 이 화면이 정한다.
const picked = pickPopupFields(state, { topLevelKeys: ['popupType', 'title'], contentKeys: ['textBlocks', 'plainText'] });
await myApi.save(toMyRequest(picked)); // 각 업무 화면의 저장 경계`;

const BOUNDARY: { area: string; common: string; parent: string; server: string }[] = [
  { area: '입력', common: '입력 UI·즉시 안내 검사(validate*)', parent: 'state 보관, 에디터 key 갱신', server: '최종 타입·범위 검증' },
  { area: '기본값', common: '미리보기 표시용 fallback(withPreviewFallback)만', parent: '미설정은 키 생략', server: '업무 기본값 적용(창 크기·기간·옵션 등)' },
  { area: '저장', common: '선택 필드 추출(pickPopupFields, 값 그대로)', parent: '날짜 직렬화·키 이름·API 호출', server: '정규화·저장' },
  { area: '판정', common: '미리보기 시연(채점·시청 비율·일정 요약)', parent: '-', server: '노출·완료 판정(KST)' },
];

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 시작하기 탭(첫 진입)
 * - in : onNavigate(tab) 다른 탭으로 이동
 * - out: 화면: 가져오기 코드, 최소 사용 코드, 공통/부모/서버 경계, 미설정/명시값 규칙, proto 경로 안내, 탭 진입 링크
 * - 모든 Props 표는 컴포넌트 탭에 두고 여기서는 반복하지 않는다.
 */
export default function GuideStartTab({ onNavigate }: { onNavigate: GuideNavigate }) {
  return (
    <Page>
      <Alert severity="info" sx={{ fontSize: 14, lineHeight: 1.75 }}>
        PopupcommonComponent는 <b>입력 UI·미리보기·선택 필드 추출</b>을 제공하는 공통 모듈입니다. 특정 테이블(3111/3117 포함)·API·저장 요청 형식과
        업무 기본값의 권위는 제공하지 않습니다. 저장 형식은 각 업무 화면이, 업무 기본값·최종 검증은 서버가 맡습니다.
      </Alert>

      <Section title="1. 가져오기" description="공개 경계는 features/PopupcommonComponent/index.ts 하나입니다(sample·guide 폴더는 가져오지 않습니다).">
        <CodeBlock>{IMPORT_CODE}</CodeBlock>
      </Section>

      <Section title="2. 최소 사용 코드" description="화면 state → 입력 → 미리보기 → 선택 추출 → 화면별 저장 경계 순서입니다.">
        <CodeBlock>{MINIMAL_CODE}</CodeBlock>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <TabLink label="흐름 자세히(프로세스)" onClick={() => onNavigate('process')} />
          <TabLink label="샘플 4종(독립 재사용)" onClick={() => onNavigate('saveParts')} />
          <TabLink label="직접 해 보기(실습)" onClick={() => onNavigate('live')} />
        </Stack>
      </Section>

      <Section title="3. 공통 / 부모 화면 / 서버 경계" description="공통 UI의 검사는 즉시 안내이며 저장 성공을 보증하지 않습니다.">
        <Table size="small" sx={{ '& td, & th': { fontSize: 14, py: 1.25, verticalAlign: 'top', lineHeight: 1.65 }, '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
          <TableHead><TableRow><TableCell sx={{ width: 80 }}>구분</TableCell><TableCell>공통 모듈(WEB)</TableCell><TableCell>부모 화면</TableCell><TableCell>서버</TableCell></TableRow></TableHead>
          <TableBody>
            {BOUNDARY.map((row) => (
              <TableRow key={row.area}><TableCell sx={{ fontWeight: 700 }}>{row.area}</TableCell><TableCell>{row.common}</TableCell><TableCell>{row.parent}</TableCell><TableCell>{row.server}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="4. 미설정 / 명시값 규칙">
        <Bullets items={[
          '입력하지 않은 값은 키를 두지 않는다(미설정). 서버 기본값 적용 대상이다.',
          '`null`은 명시적 초기화 의미가 있지만 현재는 서버 기본값 적용 대상으로 본다.',
          '`false`·`0`·빈 문자열은 사용자가 고른 명시값으로 그대로 보낸다. 빈 문자열이 유효한지는 필드별로 서버가 판단한다(title 오류, description 설명 없음 등).',
          '`undefined` 값은 JSON 직렬화에서 빠진다(키 생략과 같아진다).',
          '`withPreviewFallback`이 채운 표시용 값은 미리보기에만 쓰이고 state·추출 결과·전송값에는 들어가지 않는다.',
        ]} />
      </Section>

      <Section title="5. proto 등록 화면(RgstPop) 경로" description="기존 proto는 자기 저장 API 형식에 맞춘 별도 흐름을 씁니다.">
        <Bullets items={[
          '`createDefaultPopup()`(전체 기본 편집값) → `changePopupType()`(기본값 채움) → `toSaveRequest()`(proto 저장 body).',
          '이 함수들은 proto 전용이며 독립 화면의 필수 사전 처리가 아니다. 새 화면은 위 2번 최소 코드를 따른다.',
        ]} />
        <Box sx={{ mt: 1 }}>
          <TabLink label="proto 흐름(프로세스 P1~P5)" onClick={() => onNavigate('process')} />
          <TabLink label="범용/proto 함수 목록(변환·유틸)" onClick={() => onNavigate('function')} />
        </Box>
      </Section>

      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}>
        정책 근거: <C>docs/design/20261030_PopupcommonComponent_독립재사용_필드추출_TODO.md</C>, <C>docs/design/20261030_PopupcommonComponent_WEB표시기본값_SERVER정책_책임분리_TODO.md</C>
      </Typography>
    </Page>
  );
}
