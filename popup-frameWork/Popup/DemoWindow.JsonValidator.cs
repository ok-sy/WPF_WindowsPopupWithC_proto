using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Popup.Dtos;
using Popup.Models;

namespace Popup
{
    public partial class DemoWindow
    {
        private void JsonValidatorButton_Click(object sender, RoutedEventArgs e)
        {
            var window = new Window
            {
                Title = "JSON Validator — 로컬 검증 (API 미호출)",
                Owner = this, Width = 1070, Height = 790, MinWidth = 740, MinHeight = 560,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                Background = Brushes.White
            };
            var main = new Grid { Margin = new Thickness(16) };
            main.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            main.RowDefinitions.Add(new RowDefinition { Height = new GridLength(2, GridUnitType.Star) });
            main.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            main.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            main.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

            var header = new StackPanel { Orientation = Orientation.Horizontal };
            var mode = new ComboBox { Width = 205, Margin = new Thickness(0,0,12,8) };
            mode.Items.Add("WPF 수신 JSON");
            mode.Items.Add("서버 저장 JSON (3117)");
            mode.SelectedIndex = 0;
            header.Children.Add(mode);
            var examples = new Button { Content = "유형별 JSON 예시", Padding = new Thickness(14,6,14,6), Margin = new Thickness(0,0,10,8) };
            header.Children.Add(examples);
            var submit = new Button { Content = "Submit · 검증", Padding = new Thickness(16,6,16,6), Margin = new Thickness(0,0,10,8) };
            header.Children.Add(submit);
            var samples3117 = new Button { Content = "3117 옵션 샘플", Padding = new Thickness(14,6,14,6), Margin = new Thickness(0,0,10,8),
                ToolTip = "DTIY3117 저장 JSON — 유형별·옵션별 가짓수와 샘플(기본 1건 + 옵션 1개씩 변경 + 규칙 위반)" };
            header.Children.Add(samples3117);
            var preview = new Button { Content = "팝업 띄우기", Padding = new Thickness(14,6,14,6), Margin = new Thickness(0,0,0,8),
                ToolTip = "검증 통과한 정규화 JSON으로 실제 팝업을 띄웁니다. 결과는 저장·전송하지 않습니다." };
            header.Children.Add(preview);
            Grid.SetRow(header,0); main.Children.Add(header);

            var input = new TextBox
            {
                AcceptsReturn = true, AcceptsTab = true, FontFamily = new FontFamily("Consolas"),
                FontSize = 12, VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
                Text = DemoJsonValidator.Example("TEXT", true)
            };
            Grid.SetRow(input,1); main.Children.Add(input);
            var filters = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0,10,0,6) };
            var summary = new TextBlock { Text = "JSON을 붙여넣고 Submit을 누르세요.", VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0,0,20,0) };
            filters.Children.Add(summary);
            var filter = new ComboBox { Width = 125 };
            foreach (var name in new[] { "전체", "ERROR", "WARNING", "PASS" }) filter.Items.Add(name);
            filter.SelectedIndex = 0;
            filters.Children.Add(filter);
            Grid.SetRow(filters,2); main.Children.Add(filters);

            var issueList = new ListBox { FontFamily = new FontFamily("Consolas"), FontSize = 12 };
            Grid.SetRow(issueList,3); main.Children.Add(issueList);
            var normalizedPanel = new DockPanel { Margin = new Thickness(0,8,0,0) };
            var normalizedCopy = new Button { Content = "보정 결과 복사", IsEnabled = false, HorizontalAlignment = HorizontalAlignment.Right };
            DockPanel.SetDock(normalizedCopy, Dock.Top);
            normalizedPanel.Children.Add(normalizedCopy);
            var normalized = new TextBox
            {
                IsReadOnly = true, AcceptsReturn = true, FontFamily = new FontFamily("Consolas"), FontSize = 12,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto
            };
            normalizedPanel.Children.Add(normalized);
            Grid.SetRow(normalizedPanel,4); main.Children.Add(normalizedPanel);

            DemoJsonValidator.Outcome? last = null;
            void Render()
            {
                if (last == null) return;
                issueList.Items.Clear();
                string selected = filter.SelectedItem?.ToString() ?? "전체";
                foreach (var i in last.Issues.Where(i => selected == "전체" || i.Severity == selected))
                    issueList.Items.Add($"{i.Severity,-7} {i.Path} — {i.Description}");
                summary.Text = $"ERROR {last.Issues.Count(i => i.Severity == "ERROR")} / WARNING {last.Issues.Count(i => i.Severity == "WARNING")} / PASS {last.Issues.Count(i => i.Severity == "PASS")}";
                normalized.Text = last.Normalized;
                normalizedCopy.IsEnabled = last.Normalized.Length > 0;
            }
            submit.Click += (_, _) => { last = DemoJsonValidator.Validate(input.Text, mode.SelectedIndex == 0); Render(); };
            preview.Click += (_, _) =>
            {
                last = DemoJsonValidator.Validate(input.Text, mode.SelectedIndex == 0);
                Render();
                PreviewValidatedJson(last, window);
            };
            samples3117.Click += (_, _) => ShowSamples3117Dialog(window, json =>
            {
                mode.SelectedIndex = 1;
                input.Text = json; last = null; issueList.Items.Clear(); normalized.Clear();
                summary.Text = "3117 샘플이 입력됐습니다. Submit으로 검증하거나 '팝업 띄우기'를 누르세요.";
            });
            filter.SelectionChanged += (_, _) => Render();
            normalizedCopy.Click += (_, _) => { if (last?.Normalized.Length > 0) Clipboard.SetText(last.Normalized); };
            issueList.SelectionChanged += (_, _) =>
            {
                if (issueList.SelectedItem is not string selected) return;
                var issue = last?.Issues.FirstOrDefault(i => selected.StartsWith(i.Severity.PadRight(7) + " " + i.Path + " —", StringComparison.Ordinal));
                if (issue == null) return;
                string key = issue.Path.Split('.').Last().Split('[')[0];
                int pos = input.Text.IndexOf("\"" + key + "\"", StringComparison.Ordinal);
                if (pos >= 0) { input.Focus(); input.Select(pos, key.Length + 2); input.ScrollToLine(input.GetLineIndexFromCharacterIndex(pos)); }
            };
            examples.Click += (_, _) =>
            {
                var dialog = new Window
                {
                    Title = "유형별 JSON 예시", Owner = window, Width = 740, Height = 650,
                    WindowStartupLocation = WindowStartupLocation.CenterOwner
                };
                var panel = new DockPanel { Margin = new Thickness(12) };
                var toolbar = new StackPanel { Orientation = Orientation.Horizontal };
                DockPanel.SetDock(toolbar, Dock.Top);
                var types = new ComboBox { Width = 130, Margin = new Thickness(0,0,8,8) };
                foreach (var t in DemoJsonValidator.Types) types.Items.Add(t);
                types.SelectedIndex = 0;
                toolbar.Children.Add(types);
                var size = new ComboBox { Width = 100, Margin = new Thickness(0,0,8,8) };
                size.Items.Add("최소 JSON"); size.Items.Add("전체 JSON"); size.SelectedIndex = 1;
                toolbar.Children.Add(size);
                var copy = new Button { Content = "복사", Margin = new Thickness(0,0,8,8) };
                var apply = new Button { Content = "입력창에 적용", Margin = new Thickness(0,0,8,8) };
                toolbar.Children.Add(copy); toolbar.Children.Add(apply);
                panel.Children.Add(toolbar);
                var exampleText = new TextBox
                {
                    IsReadOnly = true, AcceptsReturn = true, FontFamily = new FontFamily("Consolas"), FontSize = 12,
                    VerticalScrollBarVisibility = ScrollBarVisibility.Auto, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto
                };
                void Refresh() => exampleText.Text = DemoJsonValidator.Example(
                    types.SelectedItem?.ToString() ?? "TEXT", size.SelectedIndex == 0);
                types.SelectionChanged += (_, _) => Refresh();
                size.SelectionChanged += (_, _) => Refresh();
                copy.Click += (_, _) => Clipboard.SetText(exampleText.Text);
                apply.Click += (_, _) => { input.Text = exampleText.Text; last = null; issueList.Items.Clear(); normalized.Clear(); summary.Text = "예시가 입력됐습니다. Submit으로 검증하세요."; dialog.Close(); };
                panel.Children.Add(exampleText);
                dialog.Content = panel;
                Refresh();
                dialog.ShowDialog();
            };
            window.Content = main;
            window.ShowDialog();
        }

        /*
         * ■ 검증 결과로 팝업 띄우기 — in : 검증 결과 · 소유 창 · out: 없음(팝업 표시 또는 안내)
         * - ERROR가 있으면 띄우지 않는다. 정규화 JSON(기본값 적용 후)을 PopupResponseDto로 바꿔 실제 PopupFactory·PopupManager로 표시한다.
         * - 결과 훅(EnqueueResult)을 연결하지 않아 닫기·제출 결과를 저장·전송하지 않고 Demo 서버 상태도 바꾸지 않는다.
         */
        private void PreviewValidatedJson(DemoJsonValidator.Outcome outcome, Window owner)
        {
            var errors = outcome.Issues.Where(i => i.Severity == "ERROR").ToList();
            if (errors.Count > 0 || outcome.Normalized.Length == 0)
            {
                MessageBox.Show(owner, "ERROR가 있어 팝업을 띄우지 않습니다.\n\n" + string.Join("\n", errors.Take(6).Select(i => i.Path + " — " + i.Description)),
                    "팝업 띄우기", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            if (_popupManager.HasOpenPopups)
            {
                MessageBox.Show(owner, "표시 중인 팝업이 있습니다. 먼저 닫아 주세요.", "팝업 띄우기", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }
            try
            {
                PopupResponseDto dto = DemoJsonSamples3117.ToPreviewDto(outcome.Normalized);
                PopupOptions options = _popupService.CreatePopupOptions(new List<PopupResponseDto> { dto }).Single();
                options.FlushResultsInBackground = () => SetRunState("대기 · JSON 미리보기 닫힘(결과 미전송)");
                _popupManager.Show(options);
                SetRunState($"JSON 미리보기 표시 중 · {dto.PopupId} — 결과는 저장·전송하지 않습니다");
            }
            catch (Exception exception)
            {
                MessageBox.Show(owner, "팝업을 만드는 중 오류가 발생했습니다.\n\n" + exception.Message, "팝업 띄우기",
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /* ■ 3117 옵션 샘플 창 — 유형 필터·가짓수 산정 표시·샘플 JSON 보기·입력창 적용·바로 띄우기 */
        private void ShowSamples3117Dialog(Window owner, Action<string> applyToInput)
        {
            var all = DemoJsonSamples3117.Samples();
            var dialog = new Window
            {
                Title = "DTIY3117 옵션 샘플 — 유형별·옵션별 가짓수", Owner = owner, Width = 1100, Height = 760,
                MinWidth = 760, MinHeight = 520, WindowStartupLocation = WindowStartupLocation.CenterOwner, Background = Brushes.White
            };
            var root = new DockPanel { Margin = new Thickness(12) };
            var toolbar = new StackPanel { Orientation = Orientation.Horizontal };
            DockPanel.SetDock(toolbar, Dock.Top);
            var filter = new ComboBox { Width = 150, Margin = new Thickness(0,0,8,8) };
            filter.Items.Add("전체");
            foreach (string t in DemoJsonSamples3117.SampleTypes) filter.Items.Add(t);
            filter.Items.Add(DemoJsonSamples3117.InvalidGroup);
            var apply = new Button { Content = "입력창에 적용(3117 모드)", Margin = new Thickness(0,0,8,8) };
            var show = new Button { Content = "검증 후 팝업 띄우기", Margin = new Thickness(0,0,8,8) };
            var copy = new Button { Content = "JSON 복사", Margin = new Thickness(0,0,8,8) };
            toolbar.Children.Add(filter); toolbar.Children.Add(apply); toolbar.Children.Add(show); toolbar.Children.Add(copy);
            root.Children.Add(toolbar);
            var count = new TextBox
            {
                IsReadOnly = true, TextWrapping = TextWrapping.Wrap, FontFamily = new FontFamily("Consolas"), FontSize = 12,
                Height = 110, VerticalScrollBarVisibility = ScrollBarVisibility.Auto, Margin = new Thickness(0,0,0,8)
            };
            DockPanel.SetDock(count, Dock.Top);
            root.Children.Add(count);
            var body = new Grid();
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            var list = new ListBox { FontFamily = new FontFamily("Consolas"), FontSize = 12, Margin = new Thickness(0,0,8,0) };
            var json = new TextBox
            {
                IsReadOnly = true, AcceptsReturn = true, FontFamily = new FontFamily("Consolas"), FontSize = 12,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto
            };
            Grid.SetColumn(json, 1);
            body.Children.Add(list); body.Children.Add(json);
            root.Children.Add(body);

            string CountText(string selected)
            {
                if (selected == DemoJsonSamples3117.InvalidGroup)
                    return $"규칙 위반 예시 {all.Count(s => !s.ExpectValid)}건 — 3117 모드 검증에서 ERROR가 나와야 정상입니다(저장 전 거절 대상).";
                var types = selected == "전체" ? DemoJsonSamples3117.SampleTypes : new[] { selected };
                var lines = types.Select(t =>
                {
                    int n = all.Count(s => s.Type == t && s.ExpectValid);
                    return $"{t,-10} 이론 {DemoJsonSamples3117.CombinationCount(t),13:N0}가지 · 옵션 영역 {DemoJsonSamples3117.Domains(t).Count}개 · 샘플 {n}건(기본 1 + 옵션 변경 {n - 1})"
                        + (selected == "전체" ? "" : "\n  = " + DemoJsonSamples3117.Breakdown(t));
                }).ToList();
                if (selected == "전체")
                    lines.Add($"{"합계",-10} 이론 {DemoJsonSamples3117.SampleTypes.Sum(DemoJsonSamples3117.CombinationCount),13:N0}가지 · 샘플 {all.Count(s => s.ExpectValid)}건 + 규칙 위반 {all.Count(s => !s.ExpectValid)}건");
                return string.Join("\n", lines) + "\n※ 이론 = 옵션 영역 값 수의 곱(숫자 옵션은 기본/지정 대표값 2개). 샘플은 옵션 값을 하나씩만 바꿔 모든 값이 한 번 이상 나옵니다.";
            }
            void Refresh()
            {
                string selected = filter.SelectedItem?.ToString() ?? "전체";
                list.Items.Clear();
                foreach (var s in all.Where(s => selected == "전체"
                             || (selected == DemoJsonSamples3117.InvalidGroup ? !s.ExpectValid : s.Type == selected && s.ExpectValid)))
                    list.Items.Add(s);
                count.Text = CountText(selected);
                if (list.Items.Count > 0) list.SelectedIndex = 0;
            }
            DemoJsonSamples3117.Sample? Current() => list.SelectedItem as DemoJsonSamples3117.Sample;
            void ShowSelected() { if (Current() is { } s) PreviewValidatedJson(DemoJsonValidator.Validate(s.Json, false), dialog); }
            list.SelectionChanged += (_, _) => json.Text = Current()?.Json ?? "";
            filter.SelectionChanged += (_, _) => Refresh();
            copy.Click += (_, _) => { if (Current() is { } s) Clipboard.SetText(s.Json); };
            apply.Click += (_, _) => { if (Current() is { } s) { applyToInput(s.Json); dialog.Close(); } };
            show.Click += (_, _) => ShowSelected();
            list.MouseDoubleClick += (_, _) => ShowSelected();
            dialog.Content = root;
            filter.SelectedIndex = 1;
            Refresh();
            dialog.ShowDialog();
        }
    }
}
