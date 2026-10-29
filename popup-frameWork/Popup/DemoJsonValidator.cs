using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Popup
{
    // Demo-only static validation: no API calls, files, queue writes or popup execution.
    internal static class DemoJsonValidator
    {
        internal record Issue(string Severity, string Path, string Description);
        internal record Outcome(List<Issue> Issues, string Normalized);
        internal static readonly string[] Types = { "TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ", "VIDEO_QUIZ" };
        private static readonly Dictionary<string, JsonNode?> CommonDefaults = new()
        {
            ["displayMode"] = JsonValue.Create("SEQUENTIAL"), ["sizeMode"] = JsonValue.Create("FIXED"),
            ["widthRatio"] = JsonValue.Create(0.7), ["heightRatio"] = JsonValue.Create(0.75),
            ["minimumWidth"] = JsonValue.Create(300), ["minimumHeight"] = JsonValue.Create(300),
            ["maximumWidth"] = JsonValue.Create(1200), ["maximumHeight"] = JsonValue.Create(900),
            ["showHeader"] = JsonValue.Create(true), ["showFooter"] = JsonValue.Create(true),
            ["showFooterButton"] = JsonValue.Create(true), ["showLater"] = JsonValue.Create(false),
            ["showDoNotShowAgain"] = JsonValue.Create(false), ["useBackgroundOverlay"] = JsonValue.Create(true),
            ["backgroundOverlayOpacity"] = JsonValue.Create(0.45), ["popupPosition"] = JsonValue.Create("CENTER")
        };
        // VIDEO/IMAGE defaults differ by mode: WPF mode = WPF DTO (ALL_SPEC), 3117 mode = popup-full-json-defaults.yml.
        private static Dictionary<string, JsonNode?> VideoDefaults(bool responseMode) => new()
        {
            ["showDescription"] = JsonValue.Create(responseMode), ["showControls"] = JsonValue.Create(true),
            ["allowFullScreen"] = JsonValue.Create(true), ["allowPlaybackRateChange"] = JsonValue.Create(responseMode),
            ["allowSeek"] = JsonValue.Create(responseMode), ["autoPlay"] = JsonValue.Create(false),
            ["isLoop"] = JsonValue.Create(false), ["defaultVolume"] = JsonValue.Create(0.7)
        };
        private static readonly string[] ServerOwnedKeys = { "deliveryId", "pollingIntervalSeconds" };
        private static readonly HashSet<string> KnownTop = new(CommonDefaults.Keys.Concat(new[]
        {
            "popupId","deliveryId","popupType","title","width","height","footerAction","footerLinkUrl",
            "completionRatio","passingScore","hideDays","headerFontSize","bodyFontSize","footerFontSize",
            "content","questions","pollingIntervalSeconds"
        }), StringComparer.Ordinal);

        private static bool Has(JsonObject o, string key) => o[key] != null;
        private static bool IsString(JsonNode? n) => n is JsonValue v && v.TryGetValue<string>(out _);
        private static bool IsBool(JsonNode? n) => n is JsonValue v && v.TryGetValue<bool>(out _);
        private static bool IsNum(JsonNode? n) => n is JsonValue v && v.TryGetValue<double>(out _);
        private static string Text(JsonNode? n) => IsString(n) ? n!.GetValue<string>() : "";
        private static void CheckType(JsonObject o, string key, string path, Func<JsonNode?,bool> check, string expected, List<Issue> issues)
        {
            if (o[key] != null && !check(o[key]))
                issues.Add(new("ERROR", path + "." + key, "타입 불일치 — 예상: " + expected + ", 실제: " + o[key]!.ToJsonString()));
        }
        private static void Default(JsonObject o, string key, JsonNode? value, string path, List<Issue> issues)
        {
            if (o[key] != null) return;
            o[key] = value?.DeepClone();
            issues.Add(new("WARNING", path + "." + key, "누락/null → 기본값 " + (value?.ToJsonString() ?? "null") + " 적용 예정"));
        }
        internal static Outcome Validate(string raw, bool responseMode)
        {
            var issues = new List<Issue>();
            JsonNode? parsed;
            try { parsed = JsonNode.Parse(raw); }
            catch (JsonException ex) { return new(new() { new("ERROR", "$", "JSON 구문 오류: " + ex.Message) }, ""); }
            if (parsed is not JsonObject original)
                return new(new() { new("ERROR", "$", "최상위는 JSON 객체여야 합니다.") }, "");
            var root = (JsonObject)original.DeepClone();
            JsonObject? popup = root;
            if (responseMode && root.ContainsKey("popup"))
            {
                popup = root["popup"] as JsonObject;
                if (popup == null) return new(new() { new("ERROR", "$.popup", "popup 객체가 필요합니다.") }, "");
            }
            else if (!responseMode && root.ContainsKey("popup"))
                issues.Add(new("ERROR", "$.popup", "서버 저장 JSON은 응답 envelope가 아니라 popup 객체 본체입니다."));
            if (popup == null) return new(issues, "");
            string prefix = ReferenceEquals(popup, root) ? "$" : "$.popup";
            CheckType(popup, "popupType", prefix, IsString, "string", issues);
            string type = Text(popup["popupType"]);
            if (type == "VIDEO_QUIZ")
                issues.Add(new("ERROR", prefix + ".popupType", "VIDEO_QUIZ는 독립 타입이 아닙니다. QUIZ + content.videoEnabled=true를 사용하세요."));
            else if (!Types.Contains(type))
                issues.Add(new("ERROR", prefix + ".popupType", "필수 또는 지원되지 않는 유형: " + type));
            if (responseMode)
            {
                foreach (string id in new[] { "popupId", "deliveryId" })
                    if (string.IsNullOrWhiteSpace(Text(popup[id])))
                        issues.Add(new("ERROR", prefix + "." + id, "WPF 수신 계약상 비어 있으면 안 되는 ID입니다."));
            }
            else
            {
                foreach (string id in ServerOwnedKeys)
                    if (popup.Remove(id))
                        issues.Add(new("WARNING", prefix + "." + id, "서버 소유 값이라 3117 저장 JSON에서 제거되고 조회 시 서버가 설정합니다."));
            }
            if (type.Length > 0 && Types.Contains(type))
            {
                // AUTO is WPF-only; server/admin web accepts FIXED / RATIO / FULLSCREEN.
                string[] sizeModes = responseMode ? new[] { "FIXED", "RATIO", "FULLSCREEN", "AUTO" } : new[] { "FIXED", "RATIO", "FULLSCREEN" };
                string sizeMode = Text(popup["sizeMode"]);
                if (sizeMode.Length > 0 && !sizeModes.Contains(sizeMode))
                    issues.Add(new("ERROR", prefix + ".sizeMode", "허용값: " + string.Join(" / ", sizeModes)));
            }
            CheckType(popup, "title", prefix, IsString, "string", issues);
            foreach (string k in new[] { "popupId", "deliveryId", "footerAction", "footerLinkUrl", "sizeMode", "displayMode", "popupPosition" })
                CheckType(popup, k, prefix, IsString, "string", issues);
            foreach (string k in new[] { "width", "height", "widthRatio", "heightRatio", "minimumWidth", "minimumHeight",
                "maximumWidth", "maximumHeight", "backgroundOverlayOpacity", "completionRatio", "passingScore",
                "headerFontSize", "bodyFontSize", "footerFontSize", "hideDays" })
                CheckType(popup, k, prefix, IsNum, "number", issues);
            foreach (string k in new[] { "showHeader", "showFooter", "showFooterButton", "showLater", "showDoNotShowAgain", "useBackgroundOverlay" })
                CheckType(popup, k, prefix, IsBool, "boolean", issues);
            foreach (var kv in CommonDefaults) Default(popup, kv.Key, kv.Value, prefix, issues);
            if (type != "IMAGE")
            {
                Default(popup, "width", JsonValue.Create(900), prefix, issues);
                Default(popup, "height", JsonValue.Create(620), prefix, issues);
            }
            Default(popup, "title", JsonValue.Create(""), prefix, issues);
            Default(popup, "footerAction", JsonValue.Create(type == "SURVEY" || type == "QUIZ" ? "SUBMIT" : "CLOSE"), prefix, issues);
            string action = Text(popup["footerAction"]);
            if (action != "CLOSE" && action != "SUBMIT" && action != "LINK_AND_CLOSE")
                issues.Add(new("ERROR", prefix + ".footerAction", "허용값: CLOSE / SUBMIT / LINK_AND_CLOSE"));
            if ((type == "SURVEY" || type == "QUIZ") && action != "SUBMIT")
                issues.Add(new("ERROR", prefix + ".footerAction", "설문·퀴즈는 SUBMIT만 허용합니다."));
            if (action == "LINK_AND_CLOSE" && (!Uri.TryCreate(Text(popup["footerLinkUrl"]), UriKind.Absolute, out var link) ||
                (link.Scheme != "http" && link.Scheme != "https")))
                issues.Add(new("ERROR", prefix + ".footerLinkUrl", "절대 http/https URL이 필요합니다."));
            if (popup["content"] is not JsonObject content)
            {
                issues.Add(new("ERROR", prefix + ".content", "content 객체가 필요합니다."));
                content = new JsonObject();
                popup["content"] = content;
            }
            string cp = prefix + ".content";
            // Explicit wrong types (e.g. videoEnabled="videoEnabled") are errors, never hidden by defaults.
            foreach (string k in new[] { "videoEnabled", "showPlainText", "showHighlight", "showBottomDescription", "showDescription",
                "keepAspectRatio", "showControls", "allowFullScreen", "allowPlaybackRateChange", "allowSeek", "autoPlay", "isLoop" })
                CheckType(content, k, cp, IsBool, "boolean", issues);
            CheckType(content, "defaultVolume", cp, IsNum, "number", issues);
            if (type == "TEXT")
            {
                if (string.IsNullOrWhiteSpace(Text(content["plainText"])) &&
                    (content["textBlocks"] is not JsonArray blocks || blocks.Count == 0))
                    issues.Add(new("ERROR", cp, "plainText 또는 textBlocks 본문이 필요합니다."));
                Default(content, "showPlainText", JsonValue.Create(true), cp, issues);
                Default(content, "showHighlight", JsonValue.Create(false), cp, issues);
                Default(content, "showBottomDescription", JsonValue.Create(false), cp, issues);
            }
            if (type == "IMAGE")
            {
                CheckType(content, "imageUrl", cp, IsString, "string", issues);
                if (string.IsNullOrWhiteSpace(Text(content["imageUrl"])))
                    issues.Add(new("ERROR", cp + ".imageUrl", "이미지 URL이 필요합니다."));
                Default(content, "imageSizeMode", JsonValue.Create("ADAPTIVE"), cp, issues);
                Default(content, "showDescription", JsonValue.Create(responseMode), cp, issues);
                Default(content, "keepAspectRatio", JsonValue.Create(true), cp, issues);
                if (Text(content["imageSizeMode"]) == "ORIGINAL" && (!Has(popup,"width") || !Has(popup,"height")))
                    issues.Add(new("ERROR", prefix, "IMAGE ORIGINAL에는 width와 height가 필요합니다."));
            }
            bool videoQuiz = type == "QUIZ" && content["videoEnabled"] is JsonValue vb && vb.TryGetValue<bool>(out bool enabled) && enabled;
            if (type == "QUIZ") Default(content, "videoEnabled", JsonValue.Create(false), cp, issues);
            if (type == "VIDEO" || videoQuiz)
            {
                CheckType(content, "videoUrl", cp, IsString, "string", issues);
                if (string.IsNullOrWhiteSpace(Text(content["videoUrl"])))
                    issues.Add(new("ERROR", cp + ".videoUrl", "동영상 URL이 필요합니다."));
                foreach (var kv in VideoDefaults(responseMode)) Default(content, kv.Key, kv.Value, cp, issues);
                Default(popup, "completionRatio", JsonValue.Create(1.0), prefix, issues);
            }
            if (type == "SURVEY" || type == "QUIZ")
            {
                if (popup["questions"] is not JsonArray questions || questions.Count == 0)
                    issues.Add(new("ERROR", prefix + ".questions", "문항 배열에 1개 이상 필요합니다."));
                else
                    for (int i = 0; i < questions.Count; i++)
                    {
                        string qp = prefix + ".questions[" + i + "]";
                        if (questions[i] is not JsonObject q) { issues.Add(new("ERROR", qp, "문항은 객체여야 합니다.")); continue; }
                        string qt = Text(q["questionType"]);
                        if (!new[] { "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT" }.Contains(qt))
                            issues.Add(new("ERROR", qp + ".questionType", "허용값: SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT"));
                        if (qt != "TEXT" && (q["options"] is not JsonArray opts || opts.Count == 0))
                            issues.Add(new("ERROR", qp + ".options", "선택형 문항은 선택지 1개 이상 필요합니다."));
                    }
            }
            foreach (var kv in popup.ToList())
                if (!KnownTop.Contains(kv.Key)) issues.Add(new("WARNING", prefix + "." + kv.Key, "계약 외 최상위 필드입니다."));
            if (!issues.Any(i => i.Severity == "ERROR"))
                issues.Add(new("PASS", prefix, "필수 콘텐츠 및 검사 대상 타입 검증 통과 (실제 WPF 표시 보증 아님)"));
            return new(issues, popup.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        }
        internal static string Example(string selected, bool minimal)
        {
            bool videoQuiz = selected == "VIDEO_QUIZ";
            string type = videoQuiz ? "QUIZ" : selected;
            var content = new JsonObject();
            var q = new JsonArray();
            if (type == "TEXT") content["plainText"] = "예시 안내 본문";
            if (type == "IMAGE") content["imageUrl"] = "https://example.com/image.png";
            if (type == "VIDEO" || videoQuiz) content["videoUrl"] = "https://example.com/video.mp4";
            if (type == "QUIZ") content["videoEnabled"] = videoQuiz;
            if (type == "SURVEY" || type == "QUIZ")
                q.Add(new JsonObject { ["questionType"] = "TEXT", ["questionText"] = "의견을 입력하세요" });
            var p = new JsonObject { ["popupId"] = "DEMO-001", ["deliveryId"] = "11111111-1111-4111-8111-111111111111", ["popupType"] = type, ["title"] = selected + " 예시", ["content"] = content, ["questions"] = q };
            if (!minimal)
            {
                // Full examples follow the WPF receive contract (keeps popupId/deliveryId, WPF DTO defaults).
                var normalized = Validate(p.ToJsonString(), true);
                p = JsonNode.Parse(normalized.Normalized)!.AsObject();
            }
            return p.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
        }
    }
}
