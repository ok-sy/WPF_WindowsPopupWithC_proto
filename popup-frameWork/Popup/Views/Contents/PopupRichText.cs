using Popup.Dtos;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;

namespace Popup.Views.Contents
{
    /*
     * [설계 28] 문단·Run JSON을 WPF TextBlock Inlines로 만든다.
     * HTML/XAML 문자열을 로드하지 않고, 허용 목록 밖의 서식 값은 무시하고 글자만 표시한다.
     * 허용 값은 서버 PopupRichText.java, 관리자 웹 popupRichText.ts와 같아야 한다.
     */
    internal static class PopupRichText
    {
        internal static readonly HashSet<string> Colors = new()
            { "#111827", "#6B7280", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#2563EB", "#7C3AED" };
        internal static readonly HashSet<double> Sizes = new() { 12, 14, 16, 18, 20, 24, 28, 32 };
        /* 글꼴 ID → WPF 글꼴. 사용자 PC에 없으면 WPF가 시스템 대체 글꼴로 표시한다(설계 28 §5). */
        internal static readonly Dictionary<string, string> Fonts = new()
        {
            ["MALGUN_GOTHIC"] = "Malgun Gothic",
            ["GULIM"] = "Gulim",
            ["DOTUM"] = "Dotum",
            ["BATANG"] = "Batang",
        };

        /// <summary>서식 본문이 있으면 문단마다 TextBlock을 만든다. 표시할 문단이 없으면 빈 목록이다.</summary>
        internal static List<TextBlock> CreateParagraphs(IReadOnlyList<PopupTextBlockDto>? blocks, Style? style)
        {
            var paragraphs = new List<TextBlock>();
            if (blocks == null) return paragraphs;
            foreach (PopupTextBlockDto block in blocks.Where(b => b != null))
            {
                var paragraph = new TextBlock
                {
                    Style = style,
                    TextWrapping = TextWrapping.Wrap,
                    TextAlignment = block.Alignment switch { "CENTER" => TextAlignment.Center, "RIGHT" => TextAlignment.Right, _ => TextAlignment.Left },
                    // 구간 크기가 기본 줄 높이보다 커도 줄이 겹치지 않도록 가장 큰 글자에 맞춰 줄 높이를 늘린다.
                    LineStackingStrategy = LineStackingStrategy.MaxHeight,
                };
                foreach (PopupTextRunDto run in (block.Runs ?? new()).Where(r => r != null && !string.IsNullOrEmpty(r.Text)))
                {
                    string[] lines = run.Text.Replace("\r\n", "\n").Split('\n');
                    for (int i = 0; i < lines.Length; i++)
                    {
                        if (i > 0) paragraph.Inlines.Add(new LineBreak());
                        if (lines[i].Length > 0) paragraph.Inlines.Add(CreateRun(lines[i], run));
                    }
                }
                // 빈 문단도 한 줄 높이를 차지해야 저장된 문단 간격이 유지된다.
                if (paragraph.Inlines.Count == 0) paragraph.Inlines.Add(new Run(" "));
                paragraphs.Add(paragraph);
            }
            return paragraphs;
        }

        private static Run CreateRun(string text, PopupTextRunDto format)
        {
            var run = new Run(text);
            if (format.Bold) run.FontWeight = FontWeights.Bold;
            if (format.Italic) run.FontStyle = FontStyles.Italic;
            if (format.Underline) run.TextDecorations = TextDecorations.Underline;
            if (format.Color != null && Colors.Contains(format.Color))
                run.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(format.Color));
            if (format.Size is double size && Sizes.Contains(size)) run.FontSize = size;
            if (format.Font != null && Fonts.TryGetValue(format.Font, out string? family)) run.FontFamily = new FontFamily(family);
            return run;
        }

        /// <summary>서식 본문의 일반 문자열(서버 파생 규칙과 동일).</summary>
        internal static string ToPlainText(IReadOnlyList<PopupTextBlockDto> blocks) =>
            string.Join("\n", blocks.Where(b => b != null)
                .Select(b => string.Concat((b.Runs ?? new()).Where(r => r != null).Select(r => r.Text))));
    }
}
