using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

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
            var preview = new Button { Content = "팝업 미리보기 (준비 중)", IsEnabled = false, Margin = new Thickness(0,0,0,8) };
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
    }
}
