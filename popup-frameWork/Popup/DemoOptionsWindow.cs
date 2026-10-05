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
    // Edits a private snapshot; cancelling never changes the running demo gateway.
    public sealed partial class DemoOptionsWindow : Window
    {
        internal static readonly JsonSerializerOptions JsonOptions = new()
        { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, PropertyNameCaseInsensitive = true };
        private readonly JsonObject _draft;
        private readonly List<Action> _readFields = new();
        private readonly Dictionary<(JsonObject Target, string Key), FrameworkElement> _fieldRows = new();
        private readonly Dictionary<(JsonObject Target, string Key), Control> _inputs = new();
        private readonly TextBlock _error = new() { Foreground = Brushes.Firebrick, TextWrapping = TextWrapping.Wrap };
        public PopupResponseDto? Result { get; private set; }

        public DemoOptionsWindow(PopupResponseDto popup)
        {
            _draft = JsonSerializer.SerializeToNode(popup, JsonOptions)!.AsObject();
            Title = "Demo 옵션 · " + popup.Title;
            Width = 740; Height = 760; MinWidth = 580; MinHeight = 500;
            WindowStartupLocation = WindowStartupLocation.CenterOwner;
            Background = new SolidColorBrush(Color.FromRgb(245, 246, 248));
            FontFamily = new FontFamily("Malgun Gothic"); FontSize = 13;
            var root = new DockPanel { Margin = new Thickness(20), Background = Background };
            Content = root;
            var heading = new StackPanel { Margin = new Thickness(0, 0, 0, 16) };
            heading.Children.Add(new TextBlock { Text = popup.Title, FontSize = 20, FontWeight = FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap });
            heading.Children.Add(new TextBlock { Text = "이 샘플의 다음 실행에 적용됩니다. 빈 선택 값은 기본값을 사용합니다.", TextWrapping = TextWrapping.Wrap, Foreground = Brushes.DimGray, Margin = new Thickness(0, 8, 0, 0) });
            DockPanel.SetDock(heading, Dock.Top); root.Children.Add(heading);
            var footer = new StackPanel { Margin = new Thickness(0, 12, 0, 0) };
            footer.Children.Add(_error);
            var buttons = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
            var cancel = new Button { Content = "취소", IsCancel = true, Padding = new Thickness(20, 8, 20, 8), Margin = new Thickness(0, 8, 8, 0) };
            var apply = new Button { Content = "설정 적용", Padding = new Thickness(20, 8, 20, 8), Margin = new Thickness(0, 8, 0, 0) };
            apply.Click += (_, _) => Apply();
            buttons.Children.Add(cancel); buttons.Children.Add(apply); footer.Children.Add(buttons);
            DockPanel.SetDock(footer, Dock.Bottom); root.Children.Add(footer);
            var tabs = new TabControl(); root.Children.Add(tabs);
            var common = AddTab(tabs, "공통 창"); BuildCommon(common, popup);
            var content = AddTab(tabs, "콘텐츠"); BuildContent(content, popup);
            if (popup.PopupType is "SURVEY" or "QUIZ") BuildQuestions(AddTab(tabs, "문항·선택지"), popup);
            UpdateFieldAvailability();
        }

        private static StackPanel AddTab(TabControl tabs, string title)
        {
            var panel = new StackPanel { Margin = new Thickness(16) };
            tabs.Items.Add(new TabItem { Header = title, Padding = new Thickness(16, 8, 16, 8),
                Content = new ScrollViewer { Content = panel, VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                    HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled } });
            return panel;
        }

        private void AddField(StackPanel panel, JsonObject target, string key, string label, Type type,
            string[]? choices = null, double? min = null, double? max = null, bool multiline = false)
        {
            var row = new StackPanel { Margin = new Thickness(0, 0, 0, 14) };
            panel.Children.Add(row);
            _fieldRows[(target, key)] = row;
            row.Children.Add(new TextBlock { Text = label, FontWeight = FontWeights.SemiBold, Margin = new Thickness(0, 0, 0, 6) });
            bool nullable = Nullable.GetUnderlyingType(type) != null;
            type = Nullable.GetUnderlyingType(type) ?? type;
            JsonNode? value = target[key];
            if (type == typeof(bool))
            {
                var check = new CheckBox { Content = "사용", IsThreeState = nullable, IsChecked = value?.GetValue<bool>() };
                row.Children.Add(check);
                _inputs[(target, key)] = check;
                check.Checked += (_, _) => UpdateFieldAvailability();
                check.Unchecked += (_, _) => UpdateFieldAvailability();
                _readFields.Add(() => { if (row.IsEnabled) target[key] = check.IsChecked.HasValue ? JsonValue.Create(check.IsChecked.Value) : null; });
            }
            else if (choices != null)
            {
                var combo = new ComboBox { ItemsSource = choices, MinHeight = 32, SelectedItem = value?.GetValue<string>() };
                row.Children.Add(combo);
                _inputs[(target, key)] = combo;
                combo.SelectionChanged += (_, _) => UpdateFieldAvailability();
                _readFields.Add(() => { if (row.IsEnabled) target[key] = combo.SelectedItem as string; });
            }
            else
            {
                bool numeric = type != typeof(string);
                var text = new TextBox { Text = value is null ? "" : numeric ? value.ToJsonString() : value.GetValue<string>(),
                    Padding = new Thickness(8), MinHeight = 32, AcceptsReturn = multiline,
                    TextWrapping = multiline ? TextWrapping.Wrap : TextWrapping.NoWrap,
                    VerticalScrollBarVisibility = ScrollBarVisibility.Auto, MaxHeight = multiline ? 160 : 40 };
                row.Children.Add(text);
                _inputs[(target, key)] = text;
                _readFields.Add(() =>
                {
                    if (!row.IsEnabled) return;
                    if (!numeric) { target[key] = text.Text; return; }
                    string input = text.Text.Trim();
                    if (input.Length == 0 && nullable) { target[key] = null; return; }
                    if (!double.TryParse(input, NumberStyles.Float, CultureInfo.InvariantCulture, out double number)
                        || !double.IsFinite(number) || (min.HasValue && number < min) || (max.HasValue && number > max))
                        throw new ArgumentException($"{label}: 유효한 숫자를 입력하세요" + (min.HasValue ? $" (최소 {min})" : "") + (max.HasValue ? $" (최대 {max})" : "") + ".");
                    if (type == typeof(int) || type == typeof(long))
                    {
                        if (number != Math.Truncate(number) || number < int.MinValue || number > int.MaxValue)
                            throw new ArgumentException(label + ": 정수를 입력하세요.");
                        target[key] = (int)number;
                    }
                    else target[key] = number;
                });
            }
        }

        private void Apply()
        {
            try
            {
                Result = ReadResult();
                DialogResult = true;
            }
            catch (Exception exception) when (exception is ArgumentException or JsonException or InvalidOperationException)
            { _error.Text = exception.Message; }
        }

        internal PopupResponseDto ReadResult()
        {
            foreach (Action read in _readFields) read();
            NormalizeAndValidate(_draft);
            return _draft.Deserialize<PopupResponseDto>(JsonOptions)!;
        }

        internal static void NormalizeAndValidate(JsonObject draft)
        {
            var content = draft["content"]!.AsObject();
            if (draft["popupType"]!.GetValue<string>() != "IMAGE" &&
                (draft["minimumWidth"]!.GetValue<double>() > draft["maximumWidth"]!.GetValue<double>()
                || draft["minimumHeight"]!.GetValue<double>() > draft["maximumHeight"]!.GetValue<double>()))
                throw new ArgumentException("최소 창 크기는 최대 창 크기 이하여야 합니다.");
            if (content["footerAction"]?.GetValue<string>() == "LINK_AND_CLOSE")
            {
                string link = content["footerLinkUrl"]?.GetValue<string>() ?? "";
                if (!Uri.TryCreate(link, UriKind.Absolute, out var url) || (url.Scheme != "http" && url.Scheme != "https") || string.IsNullOrWhiteSpace(url.Host))
                    throw new ArgumentException("푸터 바로가기에 http 또는 https URL을 입력하세요.");
            }
            if (draft["popupType"]!.GetValue<string>() == "IMAGE")
            {
                string mode = content["imageSizeMode"]!.GetValue<string>();
                if (mode == "ORIGINAL") { content.Remove("width"); content.Remove("height"); }
                else if (draft["sizeMode"]!.GetValue<string>() == "RATIO")
                    throw new ArgumentException("일반 이미지의 창 크기는 고정 또는 전체화면을 선택하세요. 이미지 탭의 너비·높이를 사용합니다.");
                if (mode != "FIT_TO_IMAGE") content.Remove("keepAspectRatio");
            }
            // Questions live at the top level in the current contract.
            content.Remove("questions"); content.Remove("passingScore");
        }

        private void AddObjectFields(StackPanel panel, JsonObject target, Type dtoType, bool quiz, bool videoSection = false)
        {
            foreach (PropertyInfo property in dtoType.GetProperties())
            {
                string key = JsonNamingPolicy.CamelCase.ConvertName(property.Name);
                if (videoSection && key == "description") continue; // Combined quiz and video share this description.
                if (key is "questionId" or "optionId" or "options") continue;
                if (!quiz && key is "isScored" or "questionScore" or "correctAnswer" or "answerMatchMode" or "isCorrect") continue;
                string[]? choices = key switch
                {
                    "imageSizeMode" => new[] { "ADAPTIVE", "FIT_TO_IMAGE", "ORIGINAL" },
                    "optionLayout" => new[] { "VERTICAL", "HORIZONTAL" },
                    "questionType" => new[] { "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT" },
                    "answerMatchMode" => new[] { "EXACT", "CONTAINS" }, _ => null
                };
                double? min = key is "width" or "height" ? .01 : key is "questionScore" or "defaultVolume" ? 0 : null;
                AddField(panel, target, key, Labels.GetValueOrDefault(key, property.Name), property.PropertyType,
                    choices, min, key == "defaultVolume" ? 1 : null, property.PropertyType == typeof(string) && choices == null);
            }
        }

        private void UpdateFieldAvailability()
        {
            var content = _draft["content"]!.AsObject();
            string Choice(JsonObject target, string key, string fallback) =>
                _inputs.TryGetValue((target, key), out var input) && input is ComboBox combo
                    ? combo.SelectedItem as string ?? fallback : target[key]?.GetValue<string>() ?? fallback;
            void Enable(JsonObject target, string key, bool enabled)
            {
                if (_fieldRows.TryGetValue((target, key), out var row)) row.IsEnabled = enabled;
            }
            string sizeMode = Choice(_draft, "sizeMode", "FIXED");
            string imageMode = Choice(content, "imageSizeMode", "ADAPTIVE");
            bool image = _draft["popupType"]!.GetValue<string>() == "IMAGE";
            Enable(_draft, "maximumWidth", !image);
            Enable(_draft, "maximumHeight", !image);
            bool ordinaryImage = image && imageMode != "ORIGINAL";
            Enable(_draft, "width", sizeMode == "FIXED" && !ordinaryImage);
            Enable(_draft, "height", sizeMode == "FIXED" && !ordinaryImage);
            Enable(_draft, "widthRatio", sizeMode == "RATIO" && !ordinaryImage);
            Enable(_draft, "heightRatio", sizeMode == "RATIO" && !ordinaryImage);
            if (image)
            {
                Enable(content, "width", ordinaryImage);
                Enable(content, "height", ordinaryImage);
                Enable(content, "keepAspectRatio", imageMode == "FIT_TO_IMAGE");
                Enable(content, "linkUrl", imageMode == "ORIGINAL");
                Enable(content, "imageTitle", ordinaryImage);
                Enable(content, "description", ordinaryImage);
                Enable(content, "showDescription", ordinaryImage);
            }
            Enable(content, "footerLinkUrl", Choice(content, "footerAction", "CLOSE") == "LINK_AND_CLOSE");
            if (_draft["questions"] is JsonArray questions)
                foreach (JsonNode? node in questions)
                {
                    var question = node!.AsObject();
                    bool scored = _inputs.TryGetValue((question, "isScored"), out var input) && input is CheckBox check && check.IsChecked == true;
                    bool text = Choice(question, "questionType", "TEXT") == "TEXT";
                    Enable(question, "optionLayout", !text);
                    Enable(question, "questionScore", scored);
                    Enable(question, "correctAnswer", scored && text);
                    Enable(question, "answerMatchMode", scored && text);
                    if (question["options"] is JsonArray options)
                        foreach (JsonNode? option in options)
                            Enable(option!.AsObject(), "isCorrect", scored && !text);
                }
        }
    }
}
