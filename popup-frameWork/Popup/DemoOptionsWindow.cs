using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace Popup
{
    /*
     * POL-14-02 : Demo 모드
     * ■ Demo 샘플 상세옵션 편집 창(모달)
     * - in : popup(PopupResponseDto) 편집할 현재 샘플 · defaults(PopupResponseDto?) 기본값 기준(샘플 원본)
     * - out: Result(PopupResponseDto?) "설정 적용" 시 검증된 복사본, 취소 시 null
     * - 샘플의 복사본(_draft)만 편집하고 "설정 적용"에서 검증 후 Result로 돌려준다. 취소하면 원본·실행 중 Demo 게이트웨이는 그대로다.
     * - 옵션을 그룹 탭(창·배치 / 헤더·푸터 / 콘텐츠 / 완료·동작 / 문항·선택지 / 고급)으로 나눈다.
     * - 같은 탭의 상위 옵션이 꺼지면 하위 입력을 숨기고, 다른 탭 설정이나 모드 때문에 쓰지 않는 입력은 비활성 + 사유로 표시한다.
     *   숨김·비활성 입력은 적용 시 읽지 않아 기존 값이 유지되고, 입력 중이던 값도 컨트롤에 남는다.
     * - 범위·기본값 안내, 입력 즉시 검증, 기본값과 다른 항목 표시, 탭(그룹)별 기본값 복원.
     * - API Demo의 수신 원문은 이 창으로 편집하지 않는다(인메모리 샘플 전용).
     */
    public sealed partial class DemoOptionsWindow : Window
    {
        internal static readonly JsonSerializerOptions JsonOptions = new()
        { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, PropertyNameCaseInsensitive = true };
        private static readonly Brush HintBrush = new SolidColorBrush(Color.FromRgb(0x68, 0x70, 0x7C));
        private static readonly Brush ChangedBrush = new SolidColorBrush(Color.FromRgb(0x1F, 0x4E, 0x8C));

        private readonly JsonObject _draft;
        // 편집 대상 객체(_draft·content·문항·선택지) → 같은 위치의 기본값 객체(샘플 원본)
        private readonly Dictionary<JsonObject, JsonObject> _defaultsOf = new(ReferenceEqualityComparer.Instance);
        private readonly List<Field> _fields = new();
        private readonly Dictionary<(JsonObject Target, string Key), Field> _byKey = new();
        private readonly Dictionary<(JsonObject Target, string Key), Control> _inputs = new();
        private readonly TabControl _tabs = new();
        private readonly TextBlock _error = new() { Foreground = Brushes.Firebrick, TextWrapping = TextWrapping.Wrap };
        private readonly TextBlock _changeSummary = new() { Foreground = HintBrush, TextWrapping = TextWrapping.Wrap };
        private TabItem? _currentTab;
        private bool _suspendRefresh;
        public PopupResponseDto? Result { get; private set; }

        private sealed class Field
        {
            public required JsonObject Target { get; init; }
            public required string Key { get; init; }
            public required string Label { get; init; }
            public required TabItem Tab { get; init; }
            public required StackPanel Row { get; init; }
            public required Control Input { get; init; }
            public required TextBlock Changed { get; init; }
            public required TextBlock Note { get; init; }
            public required Func<JsonNode?> Parse { get; init; }
            public required Action<JsonNode?> Set { get; init; }
            public string? DisabledReason { get; set; }
            public string? InputError { get; set; }
            public bool Applicable => Row.Visibility == Visibility.Visible && Row.IsEnabled;
        }

        /// <param name="popup">편집할 현재 샘플(복사해서 편집)</param>
        /// <param name="defaults">기본값 기준(샘플 원본). 없으면 popup을 기준으로 한다.</param>
        public DemoOptionsWindow(PopupResponseDto popup, PopupResponseDto? defaults = null)
        {
            _draft = JsonSerializer.SerializeToNode(popup, JsonOptions)!.AsObject();
            MapDefaults(_draft, JsonSerializer.SerializeToNode(defaults ?? popup, JsonOptions)!.AsObject());
            Title = "Demo 옵션 · " + popup.Title;
            Width = 760; Height = 780; MinWidth = 600; MinHeight = 520;
            WindowStartupLocation = WindowStartupLocation.CenterOwner;
            Background = new SolidColorBrush(Color.FromRgb(245, 246, 248));
            FontFamily = new FontFamily("Malgun Gothic"); FontSize = 13;
            var root = new DockPanel { Margin = new Thickness(20), Background = Background };
            Content = root;
            var heading = new StackPanel { Margin = new Thickness(0, 0, 0, 16) };
            heading.Children.Add(new TextBlock { Text = popup.Title, FontSize = 20, FontWeight = FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap });
            heading.Children.Add(new TextBlock { Text = "복사본을 편집합니다. 설정 적용 시 이 샘플의 다음 실행부터 반영되고, 취소하면 바뀌지 않습니다.",
                TextWrapping = TextWrapping.Wrap, Foreground = HintBrush, Margin = new Thickness(0, 8, 0, 0) });
            DockPanel.SetDock(heading, Dock.Top); root.Children.Add(heading);

            // 하단 고정: 변경 요약·오류·취소/적용
            var footer = new StackPanel { Margin = new Thickness(0, 12, 0, 0) };
            footer.Children.Add(_changeSummary);
            footer.Children.Add(_error);
            var buttons = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
            var cancel = new Button { Content = "취소", IsCancel = true, Padding = new Thickness(20, 8, 20, 8), Margin = new Thickness(0, 8, 8, 0) };
            var apply = new Button { Content = "설정 적용", IsDefault = false, Padding = new Thickness(20, 8, 20, 8), Margin = new Thickness(0, 8, 0, 0) };
            apply.Click += (_, _) => Apply();
            buttons.Children.Add(cancel); buttons.Children.Add(apply); footer.Children.Add(buttons);
            DockPanel.SetDock(footer, Dock.Bottom); root.Children.Add(footer);
            root.Children.Add(_tabs);

            _suspendRefresh = true;
            BuildTabs(popup);
            _suspendRefresh = false;
            Refresh();
        }

        /* 편집 객체와 기본값 객체를 같은 구조로 짝짓는다. 문항·선택지는 Demo에서 추가·삭제하지 않으므로 순서로 대응한다. */
        private void MapDefaults(JsonObject draft, JsonObject defaults)
        {
            _defaultsOf[draft] = defaults;
            if (draft["content"] is JsonObject content)
                _defaultsOf[content] = defaults["content"] as JsonObject ?? new JsonObject();
            if (draft["questions"] is JsonArray questions)
            {
                var defaultQuestions = defaults["questions"] as JsonArray;
                for (int i = 0; i < questions.Count; i++)
                {
                    var question = questions[i]!.AsObject();
                    var defaultQuestion = defaultQuestions?.ElementAtOrDefault(i) as JsonObject ?? new JsonObject();
                    _defaultsOf[question] = defaultQuestion;
                    if (question["options"] is JsonArray options)
                        for (int j = 0; j < options.Count; j++)
                            _defaultsOf[options[j]!.AsObject()] = (defaultQuestion["options"] as JsonArray)?.ElementAtOrDefault(j) as JsonObject ?? new JsonObject();
                }
            }
        }

        private JsonNode? DefaultValue(JsonObject target, string key) =>
            _defaultsOf.TryGetValue(target, out var defaults) ? defaults[key] : null;

        /* 탭 하나: 상단에 "이 탭 기본값 복원", 아래 스크롤 영역. 이후 AddField는 이 탭에 등록된다. */
        private StackPanel AddTab(string title, string? description = null)
        {
            var panel = new StackPanel { Margin = new Thickness(16) };
            var tab = new TabItem { Header = title, Padding = new Thickness(14, 8, 14, 8) };
            var top = new DockPanel { Margin = new Thickness(16, 12, 16, 0) };
            var reset = new Button { Content = "이 탭 기본값 복원", Padding = new Thickness(12, 4, 12, 4), Tag = tab,
                ToolTip = "이 탭의 항목만 샘플 처음 값으로 되돌립니다(숨겨진 하위 항목 포함). 다른 탭과 실행 중 상태는 바뀌지 않습니다." };
            reset.Click += (_, _) => ResetTab(tab);
            DockPanel.SetDock(reset, Dock.Right); top.Children.Add(reset);
            top.Children.Add(new TextBlock { Text = description ?? string.Empty, Foreground = HintBrush, TextWrapping = TextWrapping.Wrap,
                VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 12, 0) });
            var body = new DockPanel();
            DockPanel.SetDock(top, Dock.Top); body.Children.Add(top);
            body.Children.Add(new ScrollViewer { Content = panel, VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled });
            tab.Content = body;
            _tabs.Items.Add(tab);
            _currentTab = tab;
            return panel;
        }

        private static void AddNote(StackPanel panel, string text) =>
            panel.Children.Add(new TextBlock { Text = text, TextWrapping = TextWrapping.Wrap, Foreground = HintBrush, Margin = new Thickness(0, 0, 0, 16) });

        /// <param name="indent">같은 탭 상위 옵션의 하위 입력이면 true(들여쓰기)</param>
        private void AddField(StackPanel panel, JsonObject target, string key, string label, Type type,
            string[]? choices = null, double? min = null, double? max = null, bool multiline = false, bool indent = false)
        {
            var row = new StackPanel { Margin = new Thickness(indent ? 24 : 0, 0, 0, 14) };
            panel.Children.Add(row);
            var header = new DockPanel { Margin = new Thickness(0, 0, 0, 6) };
            var changed = new TextBlock { Text = "변경됨", Foreground = ChangedBrush, FontSize = 12, Visibility = Visibility.Collapsed, Margin = new Thickness(8, 0, 0, 0) };
            DockPanel.SetDock(changed, Dock.Right); header.Children.Add(changed);
            header.Children.Add(new TextBlock { Text = label, FontWeight = FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap });
            row.Children.Add(header);
            bool nullable = Nullable.GetUnderlyingType(type) != null;
            type = Nullable.GetUnderlyingType(type) ?? type;
            JsonNode? value = target[key];
            Control input;
            Func<JsonNode?> parse;
            Action<JsonNode?> set;
            if (type == typeof(bool))
            {
                var check = new CheckBox { Content = "사용", IsThreeState = nullable, IsChecked = value?.GetValue<bool>() };
                check.Checked += (_, _) => Refresh(); check.Unchecked += (_, _) => Refresh(); check.Indeterminate += (_, _) => Refresh();
                input = check;
                parse = () => check.IsChecked.HasValue ? JsonValue.Create(check.IsChecked.Value) : null;
                set = node => check.IsChecked = node?.GetValue<bool>() ?? (nullable ? null : false);
            }
            else if (choices != null)
            {
                var combo = new ComboBox { ItemsSource = choices, MinHeight = 32, SelectedItem = value?.GetValue<string>() };
                combo.SelectionChanged += (_, _) => Refresh();
                input = combo;
                parse = () => combo.SelectedItem is string selected ? JsonValue.Create(selected) : null;
                set = node => combo.SelectedItem = node?.GetValue<string>();
            }
            else
            {
                bool numeric = type != typeof(string);
                var text = new TextBox { Text = FormatValue(value, numeric), Padding = new Thickness(8), MinHeight = 32, AcceptsReturn = multiline,
                    TextWrapping = multiline ? TextWrapping.Wrap : TextWrapping.NoWrap,
                    VerticalScrollBarVisibility = ScrollBarVisibility.Auto, MaxHeight = multiline ? 160 : 40 };
                text.TextChanged += (_, _) => Refresh();
                input = text;
                set = node => text.Text = FormatValue(node, numeric);
                parse = () =>
                {
                    if (!numeric) return JsonValue.Create(text.Text);
                    string raw = text.Text.Trim();
                    if (raw.Length == 0)
                    {
                        if (nullable) return null;
                        throw new ArgumentException($"{label}: 값을 입력하세요.");
                    }
                    if (!double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double number)
                        || !double.IsFinite(number) || (min.HasValue && number < min) || (max.HasValue && number > max))
                        throw new ArgumentException($"{label}: 유효한 숫자를 입력하세요" + RangeText(min, max, " (", ")") + ".");
                    if (type == typeof(int) || type == typeof(long))
                    {
                        if (number != Math.Truncate(number) || number < int.MinValue || number > int.MaxValue)
                            throw new ArgumentException(label + ": 정수를 입력하세요.");
                        return JsonValue.Create((int)number);
                    }
                    return JsonValue.Create(number);
                };
            }
            row.Children.Add(input);
            var note = new TextBlock { TextWrapping = TextWrapping.Wrap, FontSize = 12, Margin = new Thickness(0, 4, 0, 0), Visibility = Visibility.Collapsed };
            row.Children.Add(note);
            string hint = HintText(target, key, type, min, max, nullable);
            if (hint.Length > 0)
                row.Children.Insert(2, new TextBlock { Text = hint, Foreground = HintBrush, FontSize = 12, Margin = new Thickness(0, 4, 0, 0), TextWrapping = TextWrapping.Wrap });
            Register(target, key, label, row, input, changed, note, parse, set);
        }

        private void Register(JsonObject target, string key, string label, StackPanel row, Control input, TextBlock changed, TextBlock note,
            Func<JsonNode?> parse, Action<JsonNode?> set)
        {
            var field = new Field { Target = target, Key = key, Label = label, Tab = _currentTab!, Row = row, Input = input,
                Changed = changed, Note = note, Parse = parse, Set = set };
            _fields.Add(field);
            _byKey[(target, key)] = field;
            _inputs[(target, key)] = input;
        }

        private static string FormatValue(JsonNode? node, bool numeric) =>
            node is null ? "" : numeric ? node.ToJsonString() : node.GetValueKind() == JsonValueKind.String ? node.GetValue<string>() : node.ToJsonString();

        private static string RangeText(double? min, double? max, string prefix = "", string suffix = "") =>
            min.HasValue && max.HasValue ? $"{prefix}범위 {min:0.##}~{max:0.##}{suffix}"
            : min.HasValue ? $"{prefix}최소 {min:0.##}{suffix}" : max.HasValue ? $"{prefix}최대 {max:0.##}{suffix}" : "";

        /* 범위·기본값 안내. 기본값은 샘플 원본 값이며 null이면 "비우면 기본" 의미를 함께 적는다. */
        private string HintText(JsonObject target, string key, Type type, double? min, double? max, bool nullable)
        {
            var parts = new List<string>();
            string range = RangeText(min, max);
            if (range.Length > 0) parts.Add(range);
            if (key != "textBlocks" && type != typeof(string) || key is "imageSizeMode" or "sizeMode" or "footerAction" or "popupPosition")
            {
                JsonNode? defaultValue = DefaultValue(target, key);
                parts.Add(defaultValue is null ? (nullable ? "샘플 기본: 비움" : "")
                    : defaultValue.GetValueKind() is JsonValueKind.True or JsonValueKind.False ? "샘플 기본: " + (defaultValue.GetValue<bool>() ? "사용" : "사용 안 함")
                    : "샘플 기본: " + FormatValue(defaultValue, true).Trim('"'));
            }
            return string.Join(" · ", parts.Where(p => p.Length > 0));
        }

        /* 입력 변경 시: 즉시 검증, 변경 표시, 조건부 표시를 한 번에 갱신한다. */
        private void Refresh()
        {
            if (_suspendRefresh) return;
            UpdateFieldAvailability();
            int changed = 0;
            foreach (Field field in _fields)
            {
                JsonNode? current = null;
                field.InputError = null;
                try { current = field.Parse(); }
                catch (ArgumentException exception) { field.InputError = exception.Message; }
                bool differs = field.InputError != null || !SameValue(current, DefaultValue(field.Target, field.Key));
                field.Changed.Visibility = differs ? Visibility.Visible : Visibility.Collapsed;
                if (differs) changed++;
                string? message = field.Row.IsEnabled ? field.InputError : field.DisabledReason;
                field.Note.Text = message ?? string.Empty;
                field.Note.Foreground = field.Row.IsEnabled ? Brushes.Firebrick : HintBrush;
                field.Note.Visibility = string.IsNullOrEmpty(message) ? Visibility.Collapsed : Visibility.Visible;
            }
            _changeSummary.Text = changed == 0 ? "모든 항목이 샘플 기본값과 같습니다." : $"샘플 기본값과 다른 항목 {changed}개";
            if (_error.Text.Length > 0 && !_fields.Any(f => f.Applicable && f.InputError != null)) _error.Text = string.Empty;
        }

        private static bool SameValue(JsonNode? a, JsonNode? b)
        {
            if (a is null || b is null) return a is null && b is null;
            if (a.GetValueKind() == JsonValueKind.Number && b.GetValueKind() == JsonValueKind.Number)
                // int·double로 만든 JsonValue가 섞이므로 JSON 숫자 텍스트로 비교한다(GetValue<double>은 int 값에서 예외).
                return double.Parse(a.ToJsonString(), CultureInfo.InvariantCulture) == double.Parse(b.ToJsonString(), CultureInfo.InvariantCulture);
            return JsonNode.DeepEquals(a, b);
        }

        private void ResetTab(TabItem tab)
        {
            _suspendRefresh = true;
            foreach (Field field in _fields.Where(f => f.Tab == tab))
                field.Set(DefaultValue(field.Target, field.Key)?.DeepClone());
            _suspendRefresh = false;
            Refresh();
        }

        private void Apply()
        {
            try
            {
                Result = ReadResult();
                DialogResult = true;
            }
            catch (Exception exception) when (exception is ArgumentException or JsonException or InvalidOperationException)
            {
                _error.Text = exception.Message;
                Field? invalid = _fields.FirstOrDefault(f => f.Applicable && f.InputError != null);
                if (invalid != null)
                {
                    _tabs.SelectedItem = invalid.Tab;
                    invalid.Input.Focus();
                }
            }
        }

        /* 적용 가능한(보이고 활성인) 입력만 복사본에 쓰고 검증한다. 숨김·비활성 입력은 기존 값을 유지한다. */
        internal PopupResponseDto ReadResult()
        {
            foreach (Field field in _fields.Where(f => f.Applicable))
            {
                JsonNode? node = field.Parse();
                if (node is null && field.Key.EndsWith("Blocks", StringComparison.Ordinal)) field.Target.Remove(field.Key);
                else field.Target[field.Key] = node;
            }
            NormalizeAndValidate(_draft);
            return _draft.Deserialize<PopupResponseDto>(JsonOptions)!;
        }

        /*
         * ■ 편집 결과 정규화·검증
         * - in : draft(JsonObject) 편집 중인 팝업 JSON
         * - out: 없음(draft를 제자리에서 정규화) · 예외: ArgumentException(검증 실패 사유)
         * - 크기·서식 본문·설문/퀴즈 서식을 서버 저장 규칙과 같이 검증하고 일반 문자열을 서식에서 다시 만든다.
         */
        internal static void NormalizeAndValidate(JsonObject draft)
        {
            var content = draft["content"]!.AsObject();
            if (draft["popupType"]!.GetValue<string>() != "IMAGE" &&
                (draft["minimumWidth"]!.GetValue<double>() > draft["maximumWidth"]!.GetValue<double>()
                || draft["minimumHeight"]!.GetValue<double>() > draft["maximumHeight"]!.GetValue<double>()))
                throw new ArgumentException("최소 창 크기는 최대 창 크기 이하여야 합니다.");
            if (draft["footerAction"]?.GetValue<string>() == "LINK_AND_CLOSE")
            {
                string link = draft["footerLinkUrl"]?.GetValue<string>() ?? "";
                if (!Uri.TryCreate(link, UriKind.Absolute, out var url) || (url.Scheme != "http" && url.Scheme != "https") || string.IsNullOrWhiteSpace(url.Host))
                    throw new ArgumentException("푸터 바로가기에 http 또는 https URL을 입력하세요.");
            }
            if (draft["popupType"]!.GetValue<string>() == "IMAGE")
            {
                // POL-04-01 : 공통 크기 입력 — IMAGE 크기는 모든 모드에서 창·배치 탭의 너비·높이(최상위) 한 쌍이다. content 쪽 크기는 쓰지 않는다.
                string mode = content["imageSizeMode"]!.GetValue<string>();
                content.Remove("width"); content.Remove("height");
                if (mode != "ORIGINAL" && draft["sizeMode"]!.GetValue<string>() == "RATIO")
                    throw new ArgumentException("일반 이미지의 창 크기는 고정 또는 전체화면을 선택하세요. 창·배치 탭의 너비·높이를 사용합니다.");
                if (mode != "FIT_TO_IMAGE") content.Remove("keepAspectRatio");
            }
            // POL-03-01 : 저장·표시 경계 — 서버와 같이 서식 본문을 검증하고 plainText를 서식 본문에서 다시 만든다.
            if (draft["popupType"]!.GetValue<string>() == "TEXT" && content["textBlocks"] is JsonArray textBlocks)
                content["plainText"] = ValidateTextBlocks(textBlocks);
            // POL-06-01 : 문항·서식 — 설문·퀴즈 서식도 서버와 같이 검증하고 일반 문자열을 서식에서 다시 만든다(독립 편집 금지). 상한은 저장소 컬럼 길이.
            if (draft["popupType"]!.GetValue<string>() is "SURVEY" or "QUIZ")
            {
                DeriveFromBlocks(content, "surveyTitleBlocks", "surveyTitle", "콘텐츠 제목", 200);
                DeriveFromBlocks(content, "descriptionBlocks", "description", "콘텐츠 설명", 2000);
                if (draft["questions"] is JsonArray questions)
                    for (int i = 0; i < questions.Count; i++)
                    {
                        var question = questions[i]!.AsObject();
                        DeriveFromBlocks(question, "titleBlocks", "title", $"{i + 1}번 문항 제목", 1000);
                        DeriveFromBlocks(question, "descriptionBlocks", "description", $"{i + 1}번 문항 설명", 2000);
                        if (question["options"] is JsonArray options)
                            for (int j = 0; j < options.Count; j++)
                                DeriveFromBlocks(options[j]!.AsObject(), "textBlocks", "text", $"{i + 1}번 문항 {j + 1}번 선택지", 1000);
                    }
            }
        }

        /* POL-06-01 : 문항·서식 — 서식이 있고 글자가 있으면 일반 문자열을 파생한다. 빈 서식([] 또는 글자 없는 문단만)은 서식 없음으로 지운다. */
        private static void DeriveFromBlocks(JsonObject target, string blocksKey, string plainKey, string label, int maxLength)
        {
            if (target[blocksKey] is not JsonArray blocks) return;
            string plain;
            try { plain = ValidateTextBlocks(blocks); }
            catch (ArgumentException exception) { throw new ArgumentException(label + " " + exception.Message); }
            if (plain.Trim().Length == 0)
            {
                target.Remove(blocksKey);
                return;
            }
            if (plain.Length > maxLength) throw new ArgumentException($"{label} 서식: 글자는 {maxLength}자 이하여야 합니다.");
            target[plainKey] = plain;
        }

        private void AddObjectFields(StackPanel panel, JsonObject target, Type dtoType, bool quiz, bool videoSection = false)
        {
            foreach (PropertyInfo property in dtoType.GetProperties())
            {
                string key = JsonNamingPolicy.CamelCase.ConvertName(property.Name);
                if (videoSection && key == "description") continue; // Combined quiz and video share this description.
                if (key is "questionId" or "optionId" or "options") continue;
                if (!quiz && key is "isScored" or "questionScore" or "correctAnswer" or "answerMatchMode" or "isCorrect") continue;
                // POL-06-01 : 문항·서식 — *Blocks(서식 JSON)는 모두 같은 편집기로 다룬다. 선택지의 textBlocks는 TEXT 본문과 뜻이 달라 라벨을 따로 둔다.
                if (key.EndsWith("Blocks", StringComparison.Ordinal))
                {
                    string blocksLabel = dtoType == typeof(SurveyOptionDto) && key == "textBlocks"
                        ? "선택지 문구 서식 (textBlocks JSON) · 있으면 선택지 문구 대신 표시" : Labels.GetValueOrDefault(key, property.Name);
                    AddTextBlocksField(panel, target, blocksLabel, key);
                    continue;
                }
                string[]? choices = key switch
                {
                    "imageSizeMode" => new[] { "ADAPTIVE", "FIT_TO_IMAGE", "ORIGINAL" },
                    "optionLayout" => new[] { "VERTICAL", "HORIZONTAL" },
                    "questionType" => new[] { "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT" },
                    "answerMatchMode" => new[] { "EXACT", "CONTAINS" }, _ => null
                };
                double? min = key is "width" or "height" ? .01 : key is "questionScore" or "defaultVolume" ? 0 : null;
                AddField(panel, target, key, Labels.GetValueOrDefault(key, property.Name), property.PropertyType,
                    choices, min, key == "defaultVolume" ? 1 : null, property.PropertyType == typeof(string) && choices == null,
                    indent: key is "bottomDescriptionUrl" or "keepAspectRatio");
            }
        }

        /*
         * POL-03-01 : 저장·표시 경계
         * Demo는 서식 편집기 대신 textBlocks JSON을 직접 편집한다. 빈 값이면 서식 본문을 쓰지 않는다.
         */
        private void AddTextBlocksField(StackPanel panel, JsonObject target, string label, string key = "textBlocks")
        {
            var row = new StackPanel { Margin = new Thickness(0, 0, 0, 14) };
            panel.Children.Add(row);
            var header = new DockPanel { Margin = new Thickness(0, 0, 0, 6) };
            var changed = new TextBlock { Text = "변경됨", Foreground = ChangedBrush, FontSize = 12, Visibility = Visibility.Collapsed, Margin = new Thickness(8, 0, 0, 0) };
            DockPanel.SetDock(changed, Dock.Right); header.Children.Add(changed);
            header.Children.Add(new TextBlock { Text = label, FontWeight = FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap });
            row.Children.Add(header);
            row.Children.Add(new TextBlock
            {
                Text = "문단: { alignment: LEFT|CENTER|RIGHT, indent: 0 이상 정수(1단계 40, 단계 수 제한 없음), runs: [...] }, 구간: { text, bold, italic, underline, strikethrough, color, size, font }. "
                    + "색 #RRGGBB(대문자) · 크기 "
                    + string.Join(" ", ServerRichSizes) + " · 글꼴 " + string.Join(" ", ServerRichFonts),
                TextWrapping = TextWrapping.Wrap, Foreground = HintBrush, Margin = new Thickness(0, 0, 0, 6),
            });
            var pretty = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
            var text = new TextBox
            {
                Text = target[key] is JsonArray array ? array.ToJsonString(pretty) : "",
                Padding = new Thickness(8), AcceptsReturn = true, TextWrapping = TextWrapping.Wrap, FontFamily = new FontFamily("Consolas, Malgun Gothic"),
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto, MinHeight = 120, MaxHeight = 280,
            };
            text.TextChanged += (_, _) => Refresh();
            row.Children.Add(text);
            var note = new TextBlock { TextWrapping = TextWrapping.Wrap, FontSize = 12, Margin = new Thickness(0, 4, 0, 0), Visibility = Visibility.Collapsed };
            row.Children.Add(note);
            Register(target, key, label, row, text, changed, note,
                () =>
                {
                    string input = text.Text.Trim();
                    if (input.Length == 0) return null;
                    JsonNode? node;
                    try { node = JsonNode.Parse(input); }
                    catch (JsonException) { throw new ArgumentException("서식 본문: JSON 형식이 올바르지 않습니다."); }
                    if (node is not JsonArray blocks) throw new ArgumentException("서식 본문: 문단 배열이어야 합니다.");
                    ValidateTextBlocks(blocks);
                    return node;
                },
                node => text.Text = node is JsonArray blocks ? blocks.ToJsonString(pretty) : "");
        }

        /*
         * POL-03-02 : 문단·글자 서식
         * 서버 PopupRichText.java의 저장 허용 값. Demo는 서버 없이 저장 검증을 흉내 내므로 이 사본을 Demo 안에만 둔다
         * (WPF 렌더러는 정책 목록을 갖지 않는다). 운영 시점에 Demo와 함께 제거한다.
         */
        private static readonly double[] ServerRichSizes = { 12, 14, 16, 18, 20, 24, 28, 32 };
        private static readonly string[] ServerRichFonts = { "MALGUN_GOTHIC", "GULIM", "DOTUM", "BATANG" };
        private static bool IsServerRichColor(string value) =>
            value.Length == 7 && value[0] == '#' && value.Skip(1).All(c => c is >= '0' and <= '9' or >= 'A' and <= 'F');

        /*
         * POL-03-01 : 저장·표시 경계
         * ■ 서식 본문 검증 — in : blocks(JsonArray) textBlocks · out: string 파생 plainText · 예외: ArgumentException(허용 밖 값)
         * 서버 PopupRichText.validateAndDerivePlainText와 같은 규칙. 통과하면 파생 plainText를 돌려준다.
         */
        internal static string ValidateTextBlocks(JsonArray blocks)
        {
            var plain = new System.Text.StringBuilder();
            int runs = 0;
            if (blocks.Count > 500) throw new ArgumentException("서식 본문: 문단은 500개 이하여야 합니다.");
            for (int i = 0; i < blocks.Count; i++)
            {
                if (blocks[i] is not JsonObject block || block.Any(p => p.Key is not ("alignment" or "indent" or "runs")))
                    throw new ArgumentException("서식 본문: 문단에는 alignment, indent, runs만 사용할 수 있습니다.");
                if (block["indent"] is JsonNode indent && !(indent.GetValueKind() == JsonValueKind.Number && indent.GetValue<double>() is double level
                        && level == Math.Floor(level) && level >= 0 && level <= int.MaxValue))
                    throw new ArgumentException("서식 본문: 들여쓰기는 0 이상의 정수여야 합니다.");
                if (block["alignment"] is JsonNode alignment && alignment.GetValueKind() != JsonValueKind.Null
                    && !(alignment.GetValueKind() == JsonValueKind.String && alignment.GetValue<string>() is "LEFT" or "CENTER" or "RIGHT"))
                    throw new ArgumentException("서식 본문: 정렬은 LEFT, CENTER, RIGHT 중 하나여야 합니다.");
                if (block["runs"] is not JsonArray runArray) throw new ArgumentException("서식 본문: runs는 배열이어야 합니다.");
                if (i > 0) plain.Append('\n');
                foreach (JsonNode? runNode in runArray)
                {
                    if (++runs > 2000) throw new ArgumentException("서식 본문: 구간은 2000개 이하여야 합니다.");
                    if (runNode is not JsonObject run || run.Any(p => p.Key is not ("text" or "bold" or "italic" or "underline" or "strikethrough" or "color" or "size" or "font")))
                        throw new ArgumentException("서식 본문: 구간에 허용되지 않은 항목이 있습니다.");
                    if (run["text"] is not JsonValue textValue || textValue.GetValueKind() != JsonValueKind.String || textValue.GetValue<string>().Length == 0)
                        throw new ArgumentException("서식 본문: 구간 text는 빈 값이 아닌 문자열이어야 합니다.");
                    string text = textValue.GetValue<string>();
                    if (text.Any(c => c < 0x20 && c != '\n' && c != '\t')) throw new ArgumentException("서식 본문: 사용할 수 없는 제어 문자가 있습니다.");
                    foreach (string flag in new[] { "bold", "italic", "underline", "strikethrough" })
                        if (run[flag] is JsonNode f && f.GetValueKind() is not (JsonValueKind.True or JsonValueKind.False))
                            throw new ArgumentException($"서식 본문: {flag}는 true/false여야 합니다.");
                    if (run["color"] is JsonNode color && !(color.GetValueKind() == JsonValueKind.String && IsServerRichColor(color.GetValue<string>())))
                        throw new ArgumentException("서식 본문: 글자 색은 #RRGGBB(대문자) 형식이어야 합니다.");
                    if (run["size"] is JsonNode size && !(size.GetValueKind() == JsonValueKind.Number && ServerRichSizes.Contains(size.GetValue<double>())))
                        throw new ArgumentException("서식 본문: 허용되지 않은 글자 크기입니다.");
                    if (run["font"] is JsonNode font && !(font.GetValueKind() == JsonValueKind.String && ServerRichFonts.Contains(font.GetValue<string>())))
                        throw new ArgumentException("서식 본문: 허용되지 않은 글꼴입니다.");
                    plain.Append(text);
                }
            }
            if (plain.Length > 20000) throw new ArgumentException("서식 본문: 본문은 20000자 이하여야 합니다.");
            return plain.ToString();
        }

        /*
         * POL-14-02 : Demo 모드
         * 조건부 표시. 같은 탭의 상위 옵션이 꺼지면 하위 입력을 숨기고(Show),
         * 다른 탭 설정·창 크기 방식·문항 유형 때문에 쓰지 않는 입력은 비활성 + 사유(Enable)로 둔다.
         */
        private void UpdateFieldAvailability()
        {
            var content = _draft["content"]!.AsObject();
            JsonNode? Current(JsonObject target, string key)
            {
                if (!_byKey.TryGetValue((target, key), out var field)) return target[key];
                try { return field.Parse(); } catch (ArgumentException) { return target[key]; }
            }
            bool On(JsonObject target, string key, bool fallback = false) => Current(target, key) is JsonNode node
                && node.GetValueKind() is JsonValueKind.True or JsonValueKind.False ? node.GetValue<bool>() : fallback;
            string Choice(JsonObject target, string key, string fallback) =>
                Current(target, key) is JsonNode node && node.GetValueKind() == JsonValueKind.String ? node.GetValue<string>() : fallback;
            void Show(JsonObject target, string key, bool visible)
            {
                if (_byKey.TryGetValue((target, key), out var field)) field.Row.Visibility = visible ? Visibility.Visible : Visibility.Collapsed;
            }
            void Enable(JsonObject target, string key, bool enabled, string reason)
            {
                if (!_byKey.TryGetValue((target, key), out var field)) return;
                field.Row.IsEnabled = enabled;
                field.DisabledReason = enabled ? null : reason;
            }

            // 창·배치
            string sizeMode = Choice(_draft, "sizeMode", "FIXED");
            string imageMode = Choice(content, "imageSizeMode", "ADAPTIVE");
            bool image = _draft["popupType"]!.GetValue<string>() == "IMAGE";
            bool ordinaryImage = image && imageMode != "ORIGINAL";
            string? sizeReason = ordinaryImage ? "일반 이미지는 비율 창 크기를 쓰지 않습니다. 너비·높이를 사용합니다." : null;
            // POL-04-01 : 공통 크기 입력 — IMAGE는 모든 모드에서 같은 너비·높이를 쓴다(ADAPTIVE·ORIGINAL 창 전체, FIT_TO_IMAGE 이미지 콘텐츠 영역).
            Enable(_draft, "width", sizeMode == "FIXED", "창 크기 방식이 FIXED일 때 사용합니다.");
            Enable(_draft, "height", sizeMode == "FIXED", "창 크기 방식이 FIXED일 때 사용합니다.");
            Enable(_draft, "widthRatio", sizeMode == "RATIO" && !ordinaryImage, sizeReason ?? "창 크기 방식이 RATIO일 때 사용합니다.");
            Enable(_draft, "heightRatio", sizeMode == "RATIO" && !ordinaryImage, sizeReason ?? "창 크기 방식이 RATIO일 때 사용합니다.");
            Show(_draft, "backgroundOverlayOpacity", On(_draft, "useBackgroundOverlay", true));

            // 헤더·푸터
            bool footer = On(_draft, "showFooter", true);
            Show(_draft, "headerFontSize", On(_draft, "showHeader", true));
            foreach (string key in new[] { "showFooterButton", "footerAction", "footerFontSize" }) Show(_draft, key, footer);
            Show(_draft, "footerLinkUrl", footer && Choice(_draft, "footerAction", "CLOSE") == "LINK_AND_CLOSE");

            // 완료·동작 — 푸터 버튼·체크박스라 헤더·푸터 탭의 푸터 표시에 따른다(다른 탭 → 비활성 + 사유)
            const string noFooter = "헤더·푸터 탭에서 푸터 표시가 꺼져 있어 화면에 나오지 않습니다.";
            Enable(_draft, "showDoNotShowAgain", footer, noFooter);
            Enable(_draft, "showLater", footer, noFooter);
            Enable(_draft, "hideDays", footer, noFooter);
            Show(_draft, "hideDays", On(_draft, "showDoNotShowAgain"));

            // 콘텐츠
            Show(content, "bottomDescriptionUrl", !_byKey.ContainsKey((content, "showBottomDescription")) || On(content, "showBottomDescription"));
            if (image)
            {
                const string originalReason = "이미지 표시 방식이 ORIGINAL이면 제목·설명 없이 원본 크기로 표시합니다.";
                Show(content, "keepAspectRatio", imageMode == "FIT_TO_IMAGE");
                Enable(content, "imageTitle", ordinaryImage, originalReason);
                Enable(content, "description", ordinaryImage, originalReason);
                Enable(content, "showDescription", ordinaryImage, originalReason);
            }

            // 문항·선택지
            if (_draft["questions"] is JsonArray questions)
                foreach (JsonNode? node in questions)
                {
                    var question = node!.AsObject();
                    bool scored = On(question, "isScored");
                    bool text = Choice(question, "questionType", "TEXT") == "TEXT";
                    Enable(question, "optionLayout", !text, "주관식(TEXT) 문항에는 선택지가 없습니다.");
                    Enable(question, "questionScore", scored, "채점 대상일 때 사용합니다.");
                    Enable(question, "correctAnswer", scored && text, text ? "채점 대상일 때 사용합니다." : "주관식(TEXT) 채점 문항에서만 사용합니다.");
                    Enable(question, "answerMatchMode", scored && text, text ? "채점 대상일 때 사용합니다." : "주관식(TEXT) 채점 문항에서만 사용합니다.");
                    if (question["options"] is JsonArray options)
                        foreach (JsonNode? option in options)
                            Enable(option!.AsObject(), "isCorrect", scored && !text, text ? "주관식(TEXT) 문항입니다." : "채점 대상일 때 사용합니다.");
                }
        }
    }
}
