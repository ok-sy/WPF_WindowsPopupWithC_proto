import type { AdminPopupDetail, PopupQuestion } from "@local/domain";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";
import InlinePopupPreview from "../InlinePopupPreview";
import PopupQuestionEditor from "../PopupQuestionEditor";
import PopupRichTextEditor from "../PopupRichTextEditor";
import PopupScheduleFields, {
  type PopupScheduleValue,
} from "../PopupScheduleFields";
import { pickPopupFields } from "../popupEditorTransform";
import { withPreviewFallback } from "../popupPreviewFallback";
import type { RichBlock } from "../popupRichText";

/*
 * POL-14-01 : 공통 프론트 경계
 * ■ 독립 재사용 샘플(서버·DB·관리자 API 없음)
 * - 공통 컴포넌트를 AdminPopupDetail 전체 없이 필요한 값만으로 붙이고, pickPopupFields로 필요한 필드만 꺼내는 예시 4가지.
 *   ① 일정만 ② RichText + content 일부 ③ 문항 일부 ④ 세 영역 조합(+ 미리보기).
 * - 각 화면이 자기 state를 갖고, 저장 형식(날짜 직렬화·키 이름·JSON 모양)은 각 업무 화면이 정한다. 여기서는 추출 결과만 보여 준다.
 */

const CODE_FONT =
  'Consolas, "D2Coding", "Cascadia Mono", "Courier New", monospace';
function Json({ value }: { value: unknown }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        bgcolor: "#0f172a",
        color: "#e2e8f0",
        borderRadius: 1.5,
        fontFamily: CODE_FONT,
        fontSize: 12,
        lineHeight: 1.55,
        maxHeight: 280,
        overflow: "auto",
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}
function Sample({
  title,
  code,
  input,
  output,
}: {
  title: string;
  code: string;
  input: ReactNode;
  output: unknown;
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1fr) minmax(0, 1fr)",
          },
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "text.secondary",
              mb: 0.75,
            }}
          >
            INPUT (공통 컴포넌트)
          </Typography>
          {input}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "text.secondary",
              mb: 0.75,
            }}
          >
            OUTPUT (pickPopupFields 결과)
          </Typography>
          <Json value={output} />
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "text.secondary",
              mt: 1.5,
              mb: 0.75,
            }}
          >
            외부 화면에서 붙이는 코드
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 1.5,
              fontFamily: CODE_FONT,
              fontSize: 12,
              lineHeight: 1.55,
              overflow: "auto",
            }}
          >
            {code}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

const INITIAL_BLOCKS: RichBlock[] = [
  {
    alignment: "LEFT",
    runs: [{ text: "안내 ", bold: true }, { text: "본문입니다." }],
  },
];
const INITIAL_QUESTIONS: PopupQuestion[] = [
  {
    questionId: -1,
    title: "만족도를 골라 주세요.",
    questionType: "SINGLE_CHOICE",
    isRequired: true,
    isScored: false,
    sortOrder: 1,
    optionLayout: "VERTICAL",
    options: [
      { optionId: -11, value: "1", text: "만족", sortOrder: 1 },
      { optionId: -12, value: "2", text: "보통", sortOrder: 2 },
    ],
  },
];

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 독립 재사용 샘플 4종
 * - in : 없음(각 샘플이 자기 state를 가짐)
 * - out: 화면: 샘플별 입력 컴포넌트 · pickPopupFields 결과 JSON · 붙이는 코드
 * - 일정(PopupScheduleFields value)·서식 본문(PopupRichTextEditor)·문항(PopupQuestionEditor)을 각각 단독으로 쓰고,
 *   ④에서 세 state를 합쳐 한 번에 추출하고 미리보기에 넘긴다. 서버 API를 호출하지 않는다.
 */
export default function PopupIndependentSamples() {
  // ① 일정만: AdminPopupDetail 없이 일정 값만
  const [schedule, setSchedule] = useState<PopupScheduleValue>({
    periodMode: "SCHEDULE",
    repeatDayOfWeek: "1,3,5",
    displayTimes: [{ startTime: "09:00", endTime: "12:00" }],
    displayStartAt: "2026-11-02T09:00",
    displayEndAt: "2026-11-30T18:00",
  });
  // ② 서식 본문: RichBlock[]·plainText만
  const [body, setBody] = useState<{
    textBlocks: RichBlock[];
    plainText: string;
  }>({ textBlocks: INITIAL_BLOCKS, plainText: "안내 본문입니다." });
  // ③ 문항만
  const [questions, setQuestions] =
    useState<PopupQuestion[]>(INITIAL_QUESTIONS);

  const scheduleOut = pickPopupFields(schedule, {
    topLevelKeys: [
      "displayStartAt",
      "displayEndAt",
      "periodMode",
      "repeatDayOfWeek",
      "displayTimes",
    ],
  });
  const bodyOut = pickPopupFields(
    { content: body },
    { contentKeys: ["textBlocks", "plainText"] },
  );
  const questionOut = pickPopupFields(
    { questions },
    { questionKeys: ["questionId", "title", "questionType", "isRequired"] },
  );
  // ④ 세 영역 조합: 화면 state는 입력한 값만(미설정 = 키 생략). 미리보기에 넘길 때만 withPreviewFallback으로 표시용 값을 채운다.
  const combined = useMemo<Partial<AdminPopupDetail>>(() => {
    return {
      popupId: "SAMPLE-IND",
      popupType: "SURVEY",
      title: "독립 재사용 샘플",
      ...schedule,
      content: {
        surveyTitle: body.plainText.split("\n")[0],
        surveyTitleBlocks: body.textBlocks,
      },
      questions,
    };
  }, [schedule, body, questions]);
  const combinedOut = pickPopupFields(combined, {
    topLevelKeys: ["popupId", "title", "displayStartAt", "periodMode"],
    contentKeys: ["surveyTitle", "surveyTitleBlocks"],
    questionKeys: ["questionId", "title"],
  });

  return (
    <Stack spacing={2.5}>
      <Sample
        title="① 일정만 — PopupScheduleFields(value)"
        output={scheduleOut}
        input={
          <PopupScheduleFields
            value={schedule}
            showPeriod
            onChange={(patch) =>
              setSchedule((previous) => ({ ...previous, ...patch }))
            }
          />
        }
        code={`const [schedule, setSchedule] = useState<PopupScheduleValue>({ periodMode: 'FIXED' });
<PopupScheduleFields value={schedule} showPeriod
  onChange={(patch) => setSchedule((p) => ({ ...p, ...patch }))} />
// 게시 기간은 입력란 문자열 그대로. 날짜 직렬화는 이 화면의 저장 경계에서 한다.
const out = pickPopupFields(schedule, { topLevelKeys: ['displayStartAt', 'periodMode', 'displayTimes'] });`}
      />
      <Sample
        title="② RichText + content 일부 — PopupRichTextEditor"
        output={bodyOut}
        input={
          <PopupRichTextEditor
            label="본문"
            initialBlocks={INITIAL_BLOCKS}
            onChange={(textBlocks, plainText) =>
              setBody({ textBlocks, plainText })
            }
          />
        }
        code={`const [body, setBody] = useState({ textBlocks: [], plainText: '' });
<PopupRichTextEditor label="본문" initialBlocks={body.textBlocks}
  onChange={(textBlocks, plainText) => setBody({ textBlocks, plainText })} />
const out = pickPopupFields({ content: body }, { contentKeys: ['textBlocks', 'plainText'] });`}
      />
      <Sample
        title="③ 문항 일부 — PopupQuestionEditor"
        output={questionOut}
        input={
          <PopupQuestionEditor
            questions={questions}
            quiz={false}
            onChange={setQuestions}
            onPassingScoreChange={() => undefined}
          />
        }
        code={`const [questions, setQuestions] = useState<PopupQuestion[]>([]);
<PopupQuestionEditor questions={questions} quiz={false}
  onChange={setQuestions} onPassingScoreChange={() => {}} />
const out = pickPopupFields({ questions }, { questionKeys: ['questionId', 'title', 'questionType'] });`}
      />
      <Sample
        title="④ 세 영역 조합 + 미리보기"
        output={combinedOut}
        input={
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              minHeight: 360,
            }}
          >
            <InlinePopupPreview
              popup={withPreviewFallback(combined)}
              title="위 ①~③ 값으로 그린 미리보기"
            />
          </Box>
        }
        code={`// 화면 state는 입력한 값만(미설정 = 키 생략). 업무 기본값을 state에 넣지 않는다.
const popup = { popupType: 'SURVEY', ...schedule, content: { surveyTitleBlocks: body.textBlocks }, questions };
// 미리보기에 넘길 때만 표시용 값(창 크기·Header/Footer 등)을 채운다.
<InlinePopupPreview popup={withPreviewFallback(popup)} />
const out = pickPopupFields(popup, {
  topLevelKeys: ['popupId', 'title', 'displayStartAt'],
  contentKeys: ['surveyTitle', 'surveyTitleBlocks'], questionKeys: ['questionId', 'title'] });`}
      />
    </Stack>
  );
}
