using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using Popup.Dtos;
using Popup.Services;

namespace Popup
{
    /*
     * POL-14-02 : Demo 모드
     * ■ DTIY3117 저장 JSON 옵션 샘플 — Demo JSON Validator '서버 저장 JSON (3117)' 모드 전용(API·파일·결과 큐 미사용)
     * - in : 없음
     * - out: Domains(유형) 옵션 영역 목록 · CombinationCount(유형) 이론 가짓수 · Samples() 샘플 전체 · ToPreviewDto(정규화 JSON) 미리보기 DTO
     *
     * 산정 기준(docs/interfaces/examples/DTIY3117-option-samples.md와 같은 숫자)
     * - 옵션 영역(Domain) 하나 = 서로 배타적인 값(Variant) 목록. 첫 값은 생략했을 때 3117 기본값(popup-full-json-defaults.yml)과 같다.
     * - 이론 가짓수 = 그 유형에 적용되는 옵션 영역의 값 수를 모두 곱한 값. 화면상 차이가 없는 조합(예: showFooter=false일 때 showLater)도 센 상한이다.
     * - 숫자 옵션(글자 크기·완료 비율·음량·통과 점수)은 범위 전체가 아니라 대표값 2개(기본/지정)로 센다.
     * - 서로 의존하는 값은 한 영역으로 묶는다: showDoNotShowAgain+hideDays, footerAction+footerLinkUrl, IMAGE imageSizeMode+창 크기(ORIGINAL은 크기 필수라 4가지가 아니라 5가지).
     * - 샘플 = 유형별 기본 1건 + 옵션 영역마다 기본이 아닌 값을 하나씩 바꾼 건(한 번에 옵션 하나만 변경) + 규칙 위반 예시(ERROR 기대).
     *   전수 조합은 수억 건이라 샘플로 만들지 않는다. 옵션 값 하나하나가 최소 한 번씩 등장하는 것을 보장한다.
     *
     * 옵션 추가·삭제: 해당 유형의 Domain을 추가하거나 Variant를 늘리면 가짓수·샘플이 함께 바뀐다.
     * BehaviorTests(CheckJsonSamples3117)의 가짓수·건수 상수와 문서 표를 같이 고친다.
     * 이미지·영상 URL은 토큰(LOCAL_DEMO_IMAGE / LOCAL_DEMO_VIDEO)으로 두고 미리보기 때만 Demo 미디어 경로로 바꾼다.
     */
    internal static class DemoJsonSamples3117
    {
        internal const string ImageToken = "LOCAL_DEMO_IMAGE";
        internal const string VideoToken = "LOCAL_DEMO_VIDEO";
        internal const string InvalidGroup = "규칙 위반";
        internal static readonly string[] SampleTypes = { "TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ", "VIDEO_QUIZ" };

        internal sealed record Variant(string Label, Action<JsonObject> Apply);
        internal sealed record Domain(string Scope, string Option, string Kind, Variant[] Variants);
        internal sealed record Sample(string Id, string Type, string Option, string Value, bool ExpectValid, string Json)
        {
            public override string ToString() => $"{Id}  {(ExpectValid ? "PASS " : "ERROR")}  {Option} = {Value}";
        }

        private static bool IsQuestionType(string type) => type is "SURVEY" or "QUIZ" or "VIDEO_QUIZ";
        private static bool IsQuiz(string type) => type is "QUIZ" or "VIDEO_QUIZ";
        private static JsonObject C(JsonObject p) => (JsonObject)p["content"]!;
        private static Variant Keep(string label) => new(label, _ => { });
        private static Variant Top(string label, string key, JsonNode? value) => new(label, p => p[key] = value?.DeepClone());
        private static Variant Body(string label, string key, JsonNode? value) => new(label, p => C(p)[key] = value?.DeepClone());
        private static Domain Bool(string scope, string key, bool defaultValue, bool content) => new(scope, key, "불리언", new[]
        {
            Keep(defaultValue.ToString().ToLowerInvariant() + "(기본)"),
            content ? Body((!defaultValue).ToString().ToLowerInvariant(), key, JsonValue.Create(!defaultValue))
                    : Top((!defaultValue).ToString().ToLowerInvariant(), key, JsonValue.Create(!defaultValue))
        });
        private static Domain EnumDomain(string key, params string[] values) => new("공통", key, "열거", values
            .Select((v, i) => i == 0 ? Keep(v + "(기본)") : Top(v, key, JsonValue.Create(v))).ToArray());

        /* ■ 공통 옵션 영역 — 문항 유형(SURVEY·QUIZ)은 footerAction이 SUBMIT 고정이라 footerAction 영역이 없다. */
        private static IEnumerable<Domain> Common(string type)
        {
            yield return EnumDomain("displayMode", "SEQUENTIAL", "SIMULTANEOUS");
            yield return EnumDomain("sizeMode", "FIXED", "RATIO", "FULLSCREEN");
            yield return EnumDomain("popupPosition", "CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER_RIGHT",
                "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT");
            yield return Bool("공통", "showHeader", true, false);
            yield return Bool("공통", "showFooter", true, false);
            yield return Bool("공통", "showFooterButton", true, false);
            yield return Bool("공통", "showLater", false, false);
            yield return new("공통", "showDoNotShowAgain·hideDays", "불리언+숫자", new[]
            {
                Keep("false(기본)"),
                new Variant("true · hideDays 생략(결과 30일)", p => p["showDoNotShowAgain"] = true),
                new Variant("true · hideDays 7", p => { p["showDoNotShowAgain"] = true; p["hideDays"] = 7; })
            });
            yield return Bool("공통", "useBackgroundOverlay", true, false);
            if (!IsQuestionType(type))
                yield return new("공통", "footerAction·footerLinkUrl", "열거+URL", new[]
                {
                    Keep("CLOSE(기본)"),
                    new Variant("LINK_AND_CLOSE · https://example.com/notice", p =>
                    { p["footerAction"] = "LINK_AND_CLOSE"; p["footerLinkUrl"] = "https://example.com/notice"; })
                });
            yield return new("공통", "header·body·footerFontSize", "숫자 대표값", new[]
            {
                Keep("null(WPF 기본)"),
                new Variant("20 / 16 / 15", p => { p["headerFontSize"] = 20; p["bodyFontSize"] = 16; p["footerFontSize"] = 15; })
            });
        }

        private static IEnumerable<Domain> Video(bool quiz)
        {
            yield return new("content", "showDescription", "불리언", new[]
            {
                Keep("false(기본)"),
                new Variant("true · description", p => { C(p)["showDescription"] = true; C(p)["description"] = "영상 설명 문구"; })
            });
            yield return Bool("content", "showControls", true, true);
            yield return Bool("content", "allowFullScreen", true, true);
            yield return Bool("content", "allowPlaybackRateChange", false, true);
            yield return Bool("content", "allowSeek", false, true);
            yield return Bool("content", "autoPlay", false, true);
            yield return Bool("content", "isLoop", false, true);
            yield return new("content", "defaultVolume", "숫자 대표값", new[] { Keep("0.7(기본)"), Body("0.3", "defaultVolume", 0.3) });
            yield return new("popup", "completionRatio", "숫자 대표값", new[] { Keep("기본(VIDEO 1.0·영상+퀴즈 0.8)"), Top("0.5", "completionRatio", 0.5) });
        }

        /* ■ 유형별 옵션 영역(공통 + 유형 고유). 순서가 샘플 번호 순서다. */
        internal static List<Domain> Domains(string type)
        {
            var list = Common(type).ToList();
            switch (type)
            {
                case "TEXT":
                    list.Add(new("content", "본문 형식", "열거", new[]
                    {
                        Keep("plainText(기본)"),
                        new Variant("textBlocks 서식", p => C(p)["textBlocks"] = new JsonArray(
                            new JsonObject { ["runs"] = new JsonArray(new JsonObject { ["text"] = "서식 제목", ["bold"] = true }) },
                            new JsonObject { ["indent"] = 1, ["runs"] = new JsonArray(new JsonObject { ["text"] = "들여쓴 서식 본문", ["italic"] = true }) }))
                    }));
                    list.Add(Bool("content", "showPlainText", true, true));
                    list.Add(new("content", "showBottomDescription", "불리언", new[]
                    {
                        Keep("false(기본)"),
                        new Variant("true · bottomDescription·Url", p =>
                        {
                            C(p)["showBottomDescription"] = true; C(p)["bottomDescription"] = "하단 설명 문구";
                            C(p)["bottomDescriptionUrl"] = "https://example.com/more";
                        })
                    }));
                    break;
                case "IMAGE":
                    Variant Size(string label, string? mode, bool sized) => new(label, p =>
                    {
                        if (mode != null) C(p)["imageSizeMode"] = mode;
                        if (sized) { p["width"] = mode == "ORIGINAL" ? 800 : 640; p["height"] = mode == "ORIGINAL" ? 600 : 480; }
                    });
                    list.Add(new("content+popup", "imageSizeMode·width/height", "열거+숫자", new[]
                    {
                        Keep("ADAPTIVE · 크기 미지정(기본)"),
                        Size("ADAPTIVE · 640×480", null, true),
                        Size("FIT_TO_IMAGE · 크기 미지정", "FIT_TO_IMAGE", false),
                        Size("FIT_TO_IMAGE · 640×480", "FIT_TO_IMAGE", true),
                        Size("ORIGINAL · 800×600(크기 필수)", "ORIGINAL", true)
                    }));
                    list.Add(new("content", "showDescription", "불리언", new[]
                    {
                        Keep("false(기본)"),
                        new Variant("true · imageTitle·description", p =>
                        { C(p)["showDescription"] = true; C(p)["imageTitle"] = "이미지 제목"; C(p)["description"] = "이미지 설명 문구"; })
                    }));
                    list.Add(new("content", "keepAspectRatio", "불리언", new[]
                    {
                        Keep("true(기본)"),
                        new Variant("false · FIT_TO_IMAGE 640×480(이 모드에서만 의미)", p =>
                        { C(p)["keepAspectRatio"] = false; C(p)["imageSizeMode"] = "FIT_TO_IMAGE"; p["width"] = 640; p["height"] = 480; })
                    }));
                    break;
                case "VIDEO":
                    list.AddRange(Video(false));
                    break;
                case "SURVEY":
                    list.Add(new("문항", "문항 구성(questions[0])", "조합", QuestionVariants(quiz: false)));
                    break;
                case "QUIZ":
                case "VIDEO_QUIZ":
                    if (type == "VIDEO_QUIZ") list.AddRange(Video(true));
                    list.Add(new("문항", "문항 구성(questions[0])", "조합", QuestionVariants(quiz: true)));
                    list.Add(new("popup", "passingScore", "숫자 대표값", new[] { Keep("생략(기본, 통과 점수 없음)"), Top("1(만점 통과)", "passingScore", 1) }));
                    break;
            }
            return list;
        }

        /*
         * ■ 문항 구성 — 문항 1개 기준의 유효 조합
         * - SURVEY 22 = SINGLE(배치 2 × 필수 2) 4 + MULTIPLE(배치 2 × 필수 2 × 선택 수 제한 4) 16 + TEXT(필수 2) 2
         * - QUIZ  24 = SINGLE(배치 2 × 필수 2 × 채점 2) 8 + MULTIPLE(같음) 8 + TEXT(필수 2 × 채점 2 × 정답 비교 2) 8
         * 선택 수 제한(minSelections·maxSelections)은 SURVEY 복수 선택에만, 정답 비교(answerMatchMode)는 QUIZ 주관식에만 있다.
         */
        private static Variant[] QuestionVariants(bool quiz)
        {
            var list = new List<Variant>();
            foreach (string qt in new[] { "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT" })
            foreach (string layout in qt == "TEXT" ? new[] { "" } : new[] { "VERTICAL", "HORIZONTAL" })
            foreach (bool required in new[] { true, false })
            foreach (bool scored in quiz ? new[] { true, false } : new[] { true })
            foreach (string limit in !quiz && qt == "MULTIPLE_CHOICE" ? new[] { "제한 없음", "최소 2", "최대 2", "2~3개" } : new[] { "" })
            foreach (string match in quiz && qt == "TEXT" ? new[] { "EXACT", "CONTAINS" } : new[] { "" })
            {
                var parts = new List<string> { qt };
                if (layout.Length > 0) parts.Add(layout);
                parts.Add(required ? "필수" : "선택");
                if (quiz) parts.Add(scored ? "채점" : "비채점");
                if (limit.Length > 0) parts.Add(limit);
                if (match.Length > 0) parts.Add(match);
                string label = string.Join(" · ", parts) + (list.Count == 0 ? "(기본)" : "");
                JsonObject question = Question(qt, layout, required, quiz, scored, limit, match);
                list.Add(new Variant(label, p => p["questions"] = new JsonArray(question.DeepClone())));
            }
            return list.ToArray();
        }

        private static JsonObject Question(string qt, string layout, bool required, bool quiz, bool scored, string limit, string match)
        {
            var q = new JsonObject
            {
                ["questionId"] = 1001,
                ["title"] = qt == "TEXT" ? (quiz ? "'정답'이라고 입력하세요." : "의견을 자유롭게 입력하세요.") : "가장 가까운 항목을 고르세요.",
                ["questionType"] = qt,
                ["isRequired"] = required
            };
            var options = new JsonArray();
            if (qt != "TEXT")
            {
                q["optionLayout"] = layout;
                string[] texts = { "매우 그렇다", "그렇다", "보통이다", "아니다" };
                for (int i = 0; i < texts.Length; i++)
                {
                    var option = new JsonObject { ["optionId"] = 1011 + i, ["value"] = "V" + (i + 1), ["text"] = texts[i] };
                    if (quiz) option["isCorrect"] = qt == "SINGLE_CHOICE" ? i == 0 : i < 2;
                    options.Add(option);
                }
            }
            q["options"] = options;
            if (quiz)
            {
                q["isScored"] = scored;
                q["questionScore"] = 1;
                if (qt == "TEXT") { q["correctAnswer"] = "정답"; q["answerMatchMode"] = match; }
            }
            if (limit == "최소 2" || limit == "2~3개") q["minSelections"] = 2;
            if (limit == "최대 2") q["maxSelections"] = 2;
            if (limit == "2~3개") q["maxSelections"] = 3;
            return q;
        }

        /* ■ 기본 샘플 — 필수 입력값만 넣는다. 나머지는 검증기가 3117 기본값으로 채운다. */
        private static JsonObject Base(string type, string id)
        {
            string popupType = type == "VIDEO_QUIZ" ? "QUIZ" : type;
            var content = new JsonObject();
            var p = new JsonObject { ["popupId"] = id, ["popupType"] = popupType, ["title"] = type + " 3117 샘플", ["content"] = content };
            switch (type)
            {
                case "TEXT": content["plainText"] = "3117 옵션 샘플 본문입니다.\n옵션 하나만 기본값과 다릅니다."; break;
                case "IMAGE": content["imageUrl"] = ImageToken; break;
                case "VIDEO": content["videoUrl"] = VideoToken; content["videoTitle"] = "샘플 영상"; break;
                case "SURVEY": content["surveyTitle"] = "3117 설문 샘플"; break;
                case "QUIZ": content["surveyTitle"] = "3117 퀴즈 샘플"; break;
                case "VIDEO_QUIZ":
                    content["videoEnabled"] = true; content["videoUrl"] = VideoToken; content["surveyTitle"] = "3117 영상 퀴즈 샘플";
                    break;
            }
            if (IsQuestionType(type)) p["questions"] = new JsonArray(Question("SINGLE_CHOICE", "VERTICAL", true, IsQuiz(type), true, "", "").DeepClone());
            return p;
        }

        /* ■ 이론 가짓수 = 옵션 영역 값 수의 곱 */
        internal static long CombinationCount(string type) => Domains(type).Aggregate(1L, (n, d) => n * d.Variants.Length);

        internal static string Breakdown(string type) => string.Join(" × ", Domains(type).Select(d => $"{d.Option} {d.Variants.Length}"));

        private static string Format(JsonObject p) => p.ToJsonString(new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        /* ■ 샘플 전체 — 유형 순서대로 기본 1건 + 옵션 변경 건, 마지막에 규칙 위반 예시 */
        internal static List<Sample> Samples()
        {
            var samples = new List<Sample>();
            foreach (string type in SampleTypes)
            {
                int n = 0;
                string NextId() => $"S3117-{type}-{n++:000}";
                string baseId = NextId();
                samples.Add(new(baseId, type, "기본", "필수 입력값만(나머지 기본값)", true, Format(Base(type, baseId))));
                foreach (Domain domain in Domains(type))
                    foreach (Variant variant in domain.Variants.Skip(1))
                    {
                        string id = NextId();
                        JsonObject p = Base(type, id);
                        variant.Apply(p);
                        samples.Add(new(id, type, domain.Option, variant.Label, true, Format(p)));
                    }
            }
            samples.AddRange(Invalid());
            return samples;
        }

        /* ■ 규칙 위반 예시 — 3117 모드 검증에서 ERROR가 나와야 한다(저장 전 거절 대상). */
        private static IEnumerable<Sample> Invalid()
        {
            int n = 1;
            Sample Bad(string type, string rule, Action<JsonObject> change)
            {
                string id = $"S3117-ERR-{n++:00}";
                JsonObject p = Base(type, id);
                change(p);
                return new(id, type, InvalidGroup, rule, false, Format(p));
            }
            yield return Bad("TEXT", "본문 없음(plainText·textBlocks 모두 없음)", p => C(p).Remove("plainText"));
            yield return Bad("TEXT", "LINK_AND_CLOSE인데 footerLinkUrl 없음", p => p["footerAction"] = "LINK_AND_CLOSE");
            yield return Bad("TEXT", "sizeMode AUTO(WPF 전용, 서버 저장 불가)", p => p["sizeMode"] = "AUTO");
            yield return Bad("TEXT", "showHeader 문자열 \"true\"(타입 불일치)", p => p["showHeader"] = "true");
            yield return Bad("IMAGE", "ORIGINAL인데 width/height 없음", p => C(p)["imageSizeMode"] = "ORIGINAL");
            yield return Bad("IMAGE", "imageUrl 없음", p => C(p).Remove("imageUrl"));
            yield return Bad("VIDEO", "videoUrl 없음", p => C(p).Remove("videoUrl"));
            yield return Bad("SURVEY", "footerAction CLOSE(SUBMIT 고정)", p => p["footerAction"] = "CLOSE");
            yield return Bad("SURVEY", "선택형 문항에 선택지 없음", p => ((JsonObject)p["questions"]![0]!)["options"] = new JsonArray());
            yield return Bad("QUIZ", "문항 0개", p => p["questions"] = new JsonArray());
            yield return Bad("VIDEO_QUIZ", "popupType VIDEO_QUIZ(독립 유형 아님)", p => p["popupType"] = "VIDEO_QUIZ");
            yield return Bad("VIDEO_QUIZ", "videoEnabled 문자열 \"true\"(타입 불일치)", p => C(p)["videoEnabled"] = "true");
            yield return Bad("TEXT", "응답 envelope {popup:{...}}로 저장", p =>
            {
                var inner = (JsonObject)p.DeepClone();
                foreach (string key in p.Select(kv => kv.Key).ToList()) p.Remove(key);
                p["popup"] = inner;
            });
        }

        /*
         * ■ 미리보기 DTO — in : 검증기 정규화 JSON(popup 본체) · out: PopupResponseDto
         * - deliveryId·popupId가 비면 미리보기용 값을 넣는다(3117 저장 JSON에는 deliveryId가 없다).
         * - LOCAL_DEMO_IMAGE / LOCAL_DEMO_VIDEO 토큰을 Demo 미디어 경로로 바꾼다. 실제 URL은 그대로 둔다.
         */
        internal static PopupResponseDto ToPreviewDto(string normalizedJson)
        {
            JsonObject p = JsonNode.Parse(normalizedJson)?.AsObject() ?? throw new InvalidOperationException("정규화 JSON이 비었습니다.");
            if (string.IsNullOrWhiteSpace(p["popupId"]?.GetValue<string>())) p["popupId"] = "PREVIEW-3117";
            if (string.IsNullOrWhiteSpace(p["deliveryId"]?.GetValue<string>())) p["deliveryId"] = "PREVIEW-" + Guid.NewGuid();
            if (p["content"] is JsonObject content)
            {
                if (content["imageUrl"]?.GetValue<string>() == ImageToken) content["imageUrl"] = DemoMediaPathService.GetImagePath().Replace('\\', '/');
                if (content["videoUrl"]?.GetValue<string>() == VideoToken) content["videoUrl"] = DemoMediaPathService.GetVideoPath().Replace('\\', '/');
            }
            return JsonSerializer.Deserialize<PopupResponseDto>(p.ToJsonString(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                   ?? throw new InvalidOperationException("미리보기 DTO 변환에 실패했습니다.");
        }
    }
}
