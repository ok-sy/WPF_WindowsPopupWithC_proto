using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;

namespace Popup.Views.Contents
{
    /*
     * [설계 28] 문단·Run JSON을 WPF TextBlock Inlines로 만든다. HTML/XAML 문자열은 로드하지 않는다.
     * [설계 48] 서식 허용 정책(크기 목록·색 형식·글꼴 ID·정렬 값)은 서버 PopupRichText.java가 저장 시 검증한다.
     * 이 렌더러는 정책 목록을 복제하지 않고 WPF 변환과 표시 방어만 맡는다 — 서버 목록과 어긋나 정상 저장한 서식이
     * 조용히 무시되는 것을 막기 위해서다(설계 36의 화이트리스트 유지 결론은 설계 48이 대체).
     *   크기: 유한값이고 WPF·레이아웃 안전 범위(MinFontSize~MaxFontSize) 안이면 적용, 밖이면 본문 기본 크기.
     *   색: #RRGGBB(대소문자 무관)를 예외 없이 변환, 실패하면 그 구간만 기본 색.
     *   글꼴: ID → WPF 글꼴명 매핑(표현 의존성). 서버에 새 ID를 추가하면 매핑도 추가해야 하며, 없는 ID는 기본 글꼴.
     *   정렬: LEFT·CENTER·RIGHT 변환, 그 밖의 값은 왼쪽.
     */
    internal static class PopupRichText
    {
        /*
         * 크기 안전 범위. 0·음수·NaN·Infinity는 WPF FontSize 예외이고, 200 DIP를 넘으면 팝업 최대 폭에서 한 줄에
         * 몇 글자도 배치되지 않아 레이아웃이 무너진다. 서버 허용 크기(현재 12~32)를 복제한 값이 아니며,
         * 서버가 이 범위를 넘는 크기를 허용하도록 계약을 넓힐 때는 이 범위의 영향도 함께 확인한다.
         */
        internal const double MinFontSize = 1;
        internal const double MaxFontSize = 200;

        /*
         * [설계 49] 문단 들여쓰기. 웹 CSS px와 WPF DIP는 96 DPI 기준 같은 크기이므로 1단계 = 40 DIP로 표시한다.
         * [TODO63] 단계 수 제한은 없다(설계 48: 서버 정책을 복제하지 않음). 0 이상 정수이고 서버가 읽을 수 있는 숫자 범위
         * (int 이하)면 그대로 적용하고, 소수·음수·NaN·Infinity·범위 초과만 0이다. 여백이 본문 폭을 넘으면 TextBlock이
         * 남은 폭에서 줄바꿈하고 높이가 늘어나며, 본문 영역의 기존 세로 스크롤로 확인한다.
         */
        internal const double IndentStep = 40;

        internal static double SafeIndent(double level) =>
            double.IsFinite(level) && level >= 0 && level == Math.Floor(level) && level <= int.MaxValue ? level * IndentStep : 0;

        /* 글꼴 ID → WPF 글꼴. 사용자 PC에 없으면 WPF가 시스템 대체 글꼴로 표시한다(설계 28 §5). */
        internal static readonly Dictionary<string, string> Fonts = new()
        {
            ["MALGUN_GOTHIC"] = "Malgun Gothic",
            ["GULIM"] = "Gulim",
            ["DOTUM"] = "Dotum",
            ["BATANG"] = "Batang",
        };

        /// <summary>#RRGGBB(대소문자 무관)를 색으로 바꾼다. 다른 형식이면 false(예외 없음).</summary>
        internal static bool TryParseColor(string? value, out Color color)
        {
            color = default;
            if (value is not { Length: 7 } || value[0] != '#' || !uint.TryParse(value.AsSpan(1),
                    System.Globalization.NumberStyles.AllowHexSpecifier, System.Globalization.CultureInfo.InvariantCulture, out uint rgb))
                return false;
            color = Color.FromRgb((byte)(rgb >> 16), (byte)(rgb >> 8), (byte)rgb);
            return true;
        }

        /// <summary>표시에 쓸 크기. 안전 범위 밖이면 null(본문 기본 크기).</summary>
        internal static double? SafeFontSize(double? size) =>
            size is double value && double.IsFinite(value) && value >= MinFontSize && value <= MaxFontSize ? value : null;

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
                    // [설계 49] 왼쪽 여백은 줄바꿈된 모든 줄에 같게 적용된다(첫 줄 들여쓰기 아님). 오른쪽은 기울임 여유가 쓴다.
                    Padding = new Thickness(SafeIndent(block.Indent), 0, 0, 0),
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
                ReserveItalicOverhang(paragraph);
                paragraphs.Add(paragraph);
            }
            return paragraphs;
        }

        /*
         * [설계 38] 기울임 글자는 획이 글자 폭(advance)보다 오른쪽으로 기울어 나가는데, TextBlock은 글자 폭으로 줄을 배치한다.
         * 줄 끝(오른쪽 정렬·꽉 찬 줄)의 기울어진 획이 문단 경계 = ScrollViewer 표시 영역 밖으로 나가 잘리므로,
         * 기울임 구간이 있는 문단만 가장 큰 기울임 글자 크기에 비례한 오른쪽 여유를 둔다. 외곽 클리핑은 그대로 유지한다.
         * 본문 기본 크기가 바뀌면(ApplyBodyFontSize) 다시 호출해 여유 폭을 맞춘다.
         */
        private const double ItalicOverhangRatio = 0.35;

        internal static void ReserveItalicOverhang(TextBlock paragraph)
        {
            double size = paragraph.Inlines.OfType<Run>().Where(r => r.FontStyle == FontStyles.Italic)
                .Select(r => r.FontSize).DefaultIfEmpty(0).Max();
            // 문단 들여쓰기(왼쪽 여백)는 유지하고 오른쪽 여유만 바꾼다.
            paragraph.Padding = new Thickness(paragraph.Padding.Left, 0, size > 0 ? Math.Ceiling(size * ItalicOverhangRatio) : 0, 0);
        }

        private static Run CreateRun(string text, PopupTextRunDto format)
        {
            var run = new Run(text);
            if (format.Bold) run.FontWeight = FontWeights.Bold;
            if (format.Italic) run.FontStyle = FontStyles.Italic;
            if (format.Underline && format.Strikethrough)
            {
                // 정적 TextDecorations 컬렉션은 공유되므로 복제 후 합친다. 다른 Run의 밑줄에 영향을 주지 않는다.
                var decorations = TextDecorations.Underline.Clone();
                foreach (TextDecoration decoration in TextDecorations.Strikethrough) decorations.Add(decoration);
                run.TextDecorations = decorations;
            }
            else if (format.Underline) run.TextDecorations = TextDecorations.Underline;
            else if (format.Strikethrough) run.TextDecorations = TextDecorations.Strikethrough;
            if (TryParseColor(format.Color, out Color color)) run.Foreground = new SolidColorBrush(color);
            if (SafeFontSize(format.Size) is double size) run.FontSize = size;
            if (format.Font != null && Fonts.TryGetValue(format.Font, out string? family)) run.FontFamily = new FontFamily(family);
            return run;
        }
    }
}
