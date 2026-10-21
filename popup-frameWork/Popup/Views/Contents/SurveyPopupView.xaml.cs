using Popup.Dtos;
using Popup.Models;
using Popup.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Automation.Peers;
using System.Windows.Media;


namespace Popup.Views.Contents
{
    /// <summary>
    /// 설문 질문을 화면에 표시하는 사용자 컨트롤
    /// </summary>
    public partial class SurveyPopupView : UserControl, IBodyFontSizeAware
    {
        /// <summary>결합 화면은 부모 스크롤이 전체 문항과 제출 영역을 담당한다.</summary>
        internal void UseParentScrolling()
        {
            if (QuestionScrollViewer.Parent is not Grid host) return;
            // 내부 ScrollViewer를 실제 계층에서 빼야 휠 이벤트도 부모에 전달된다.
            QuestionScrollViewer.Content = null;
            host.Children.Remove(QuestionScrollViewer);
            Grid.SetRow(QuestionListPanel, 1);
            host.RowDefinitions[1].Height = GridLength.Auto;
            host.Children.Add(QuestionListPanel);
        }

        /// <summary>
        /// [설계 53-16·50-D3] 결합 화면에서 위쪽 영상 영역에 이미 보이는 제목·설명과 같은 값이면 퀴즈 머리말에서 숨긴다.
        /// 서버는 VIDEO+QUIZ 제목을 1개만 저장해 videoTitle·surveyTitle과 description을 같은 값으로 내려준다. 값이 다르면 그대로 둔다.
        /// </summary>
        internal void CollapseHeaderShownAbove(string? shownTitle, string? shownDescription)
        {
            // [TODO55-8] 숨기는 대상은 일반 문자열 TextBlock뿐이다. 서식 머리말(SurveyTitleRich·SurveyDescriptionRich)은
            // 영상 영역(일반 문자열)과 표시가 다르므로 문자열이 같아도 그대로 둔다.
            if (SameText(SurveyTitleText.Text, shownTitle)) SurveyTitleText.Visibility = Visibility.Collapsed;
            if (SameText(SurveyDescriptionText.Text, shownDescription)) SurveyDescriptionText.Visibility = Visibility.Collapsed;

            static bool SameText(string? text, string? shown)
                => !string.IsNullOrWhiteSpace(shown) && string.Equals(text?.Trim(), shown.Trim(), StringComparison.Ordinal);
        }

        internal FrameworkElement DetachSubmissionArea()
        {
            if (SubmissionArea.Parent is Panel host) host.Children.Remove(SubmissionArea);
            return SubmissionArea;
        }

        // 현재 화면에 표시된 질문 목록
        private readonly List<SurveyQuestion> _questions = new();

        /*
         * [설계 14 §5.6] 문항 카드의 제목·설명 TextBlock을 보관한다.
         * ApplyBodyFontSize()가 화면을 다시 만들지 않고 글자 크기만 바꾸기 위해 쓴다.
         */
        private readonly List<TextBlock> _questionTitleTexts = new();
        private readonly List<TextBlock> _questionDescriptionTexts = new();
        // [TODO55] 서식 선택지 문단. 크기는 선택지에서 상속하므로 본문 크기가 바뀌면 기울임 여유만 다시 맞춘다.
        private readonly List<TextBlock> _optionParagraphs = new();

        /*
         * 현재 화면이 일반 설문인지
         * 채점이 필요한 QuizMode인지 구분한다.
         *
         * false
         * → 일반 설문
         *
         * true
         * → 보기 IsCorrect·서술형 정답을 기준으로 점수를 계산하는 퀴즈
         */
        private readonly bool _isQuizMode;

        /*
         * [설계 12 §4] QUIZ 통과 점수. 서버 조회 응답의 최상위 passingScore에서 온다(content.passingScore는 C-15에서 삭제).
         * 기준 3 구현에서는 서버 채점으로 바뀌며 제거했으나, 설계 12로 로컬 채점이 다시 WPF 책임이 되어 복원했다.
         */
        private readonly double? _passingScore;

        /*
         * 질문별로 생성된 입력 컨트롤을 저장한다.
         *
         * Key
         * → QuestionId
         *
         * Value
         * → 해당 질문에 만들어진 입력 영역
         *
         * 제출 버튼을 눌렀을 때
         * 어떤 질문의 RadioButton, CheckBox, TextBox인지
         * 다시 찾기 위해 사용한다.
         */
        private readonly Dictionary<long, FrameworkElement>
        _answerControls = new();

        /*
         * [설계 12 §2·§4] 설문 제출이 정상적으로 완료됐을 때(필수 응답 검증 통과, QUIZ면 로컬 채점 완료)
         * 답안 목록과 점수·통과 여부(SurveySubmission)를 외부(PopupManager)로 전달하는 이벤트다.
         * 예전에는 답안 목록만 넘기고 점수는 서버 응답으로 받았다.
         */
        public event EventHandler<SurveySubmission>?
            SurveySubmitted;

        public event EventHandler? ResponseProgressChanged;
        public bool CanSubmit { get; private set; }
        public string ResponseProgressText { get; private set; } = string.Empty;

        /// <summary>
        /// Visual Studio 미리보기와 기본 생성을 위한 생성자
        /// </summary>
        public SurveyPopupView()
        {
            Resources = SurveyDesign.CreateResources();
            InitializeComponent();

            /*
             * Visual Studio 미리보기 또는
             * 기본 생성 시에는 일반 설문으로 처리한다.
             */
            _isQuizMode = false;
            IsEnabledChanged += (_, _) => UpdateResponseProgress();
            UpdateResponseProgress();
        }

        /// <summary>
        /// 실제 설문 데이터를 받아 화면을 만드는 생성자
        /// </summary>
        public SurveyPopupView(
        string title,
        string description,
        List<SurveyQuestion> questions,
        bool isQuizMode = false,
        double? passingScore = null,
        IReadOnlyList<PopupTextBlockDto>? titleBlocks = null,
        IReadOnlyList<PopupTextBlockDto>? descriptionBlocks = null)
        {
            // 문항 디자인 버전(SurveyDesign.Current)의 스타일을 XAML의 StaticResource보다 먼저 넣는다.
            Resources = SurveyDesign.CreateResources();
            InitializeComponent();

            SurveyTitleText.Text = title;
            SurveyDescriptionText.Text = description;
            // [TODO55] 서식이 있으면 문단으로 표시하고, 일반 문자열 TextBlock은 숨긴 채 비교·접근성용으로 유지한다.
            ShowRichInstead(SurveyTitleText, SurveyTitleRich, titleBlocks);
            ShowRichInstead(SurveyDescriptionText, SurveyDescriptionRich, descriptionBlocks);

            _questions =
                questions ?? new List<SurveyQuestion>();

            /*
             * 일반 설문인지 QuizMode인지 저장한다.
             */
            _isQuizMode = isQuizMode;

            /*
             * [설계 12 §4] QUIZ 통과 점수. 로컬 채점(QuizGrader)의 통과 기준으로 쓴다. 없으면 0(항상 통과).
             */
            _passingScore = passingScore;

            /*
             * QuizMode도 제출 버튼 문구는 XAML 기본값과 같은 "제출"이다(채점은 제출 시 로컬에서 함께 한다).
             */
            if (_isQuizMode)
            {
                SubmitButton.Content = "제출";
            }

            BuildQuestions();
            IsEnabledChanged += (_, _) => UpdateResponseProgress();
        }

        /// <summary>
        /// 질문 목록을 화면에 순서대로 추가한다.
        /// </summary>
        private void BuildQuestions()
        {
            QuestionListPanel.Children.Clear();

            /*
             * 질문 화면을 다시 만들 때
             * 이전에 저장된 입력 컨트롤 정보도 함께 비운다.
             */
            _answerControls.Clear();
            _questionTitleTexts.Clear();
            _questionDescriptionTexts.Clear();

            for (int index = 0; index < _questions.Count; index++)
            {
                SurveyQuestion question = _questions[index];

                Border questionCard = CreateQuestionCard(
                    question,
                    index + 1);

                QuestionListPanel.Children.Add(questionCard);
            }
            // [TODO56-10] 문항 구분선(디자인 V2의 아래 테두리)은 문항 사이에만 둔다. V1 카드는 테두리가 없어 영향 없음.
            if (QuestionListPanel.Children.Count > 0 && QuestionListPanel.Children[^1] is Border lastCard)
                lastCard.BorderThickness = new Thickness(0);
            UpdateResponseProgress();
        }

        /// <summary>
        /// 질문 하나의 카드 영역을 만든다.
        /// </summary>
        private Border CreateQuestionCard(
            SurveyQuestion question,
            int questionNumber)
        {
            Border cardBorder = new Border
            {
                Style = (Style)FindResource("SurveyQuestionCardStyle")
            };

            StackPanel cardPanel = new StackPanel();

            TextBlock titleText = new TextBlock
            {
                FontSize = 16,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("SurveySelectedText"),
                LineHeight = 24,
                TextWrapping = TextWrapping.Wrap
            };

            string requiredMark = question.IsRequired
                ? " *"
                : string.Empty;

            titleText.Text = $"{question.Title}{requiredMark}";
            // [TODO56-12] 선택 방식 안내는 제목 끝(필수 표시 뒤)에 작은 보조 글자로 이어 붙인다. 제목이 길거나 창이 좁으면
            // 글자 흐름대로 다음 줄로 넘어가 잘리지 않는다. 표시 전용이며 제목 데이터(Title·TitleBlocks)는 바꾸지 않는다.
            string? choiceHint = ChoiceHintOf(question);
            // [TODO55] 문항 제목 서식: 문단마다 같은 기본 글꼴로 표시하고 필수 표시는 마지막 문단 끝에 붙인다.
            FrameworkElement titleElement = titleText;
            List<TextBlock> titleParagraphs = CreateRichParagraphs(question.TitleBlocks, titleText);
            if (titleParagraphs.Count > 0)
            {
                if (requiredMark.Length > 0) titleParagraphs[^1].Inlines.Add(new System.Windows.Documents.Run(requiredMark));
                if (choiceHint != null) titleParagraphs[^1].Inlines.Add(ChoiceHintRun(choiceHint));
                titleElement = StackOf(titleParagraphs, question.Title);
                _questionTitleTexts.AddRange(titleParagraphs);
            }
            if (titleElement == titleText && choiceHint != null) titleText.Inlines.Add(ChoiceHintRun(choiceHint));
            Grid titleRow = new Grid();
            titleRow.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            titleRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            titleRow.Children.Add(new TextBlock
            {
                Margin = new Thickness(0, 0, 16, 0),
                VerticalAlignment = VerticalAlignment.Center,
                Text = questionNumber.ToString("D2"),
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("SurveyMutedText")
            });
            Grid.SetColumn(titleElement, 1);
            titleElement.VerticalAlignment = VerticalAlignment.Center;
            titleRow.Children.Add(titleElement);
            cardPanel.Children.Add(titleRow);
            if (titleElement == titleText) _questionTitleTexts.Add(titleText);

            var descriptionTemplate = new TextBlock { FontSize = 13, Foreground = (Brush)FindResource("SurveyMutedText") };
            List<TextBlock> descriptionParagraphs = CreateRichParagraphs(question.DescriptionBlocks, descriptionTemplate);
            if (descriptionParagraphs.Count > 0)
            {
                StackPanel descriptionPanel = StackOf(descriptionParagraphs, question.Description);
                descriptionPanel.Margin = new Thickness(0, 6, 0, 0);
                cardPanel.Children.Add(descriptionPanel);
                _questionDescriptionTexts.AddRange(descriptionParagraphs);
            }
            else if (!string.IsNullOrWhiteSpace(question.Description))
            {
                TextBlock descriptionText = new TextBlock
                {
                    Margin = new Thickness(0, 6, 0, 0),
                    FontSize = 13,
                    Foreground = (Brush)FindResource("SurveyMutedText"),
                    Text = question.Description,
                    TextWrapping = TextWrapping.Wrap
                };

                cardPanel.Children.Add(descriptionText);
                _questionDescriptionTexts.Add(descriptionText);
            }

            FrameworkElement answerControl =
            CreateAnswerControl(question);
            if (choiceHint != null) System.Windows.Automation.AutomationProperties.SetHelpText(answerControl, choiceHint);

            /*
             * 제출 시 응답을 읽을 수 있도록
             * 질문 번호와 입력 컨트롤을 연결해서 저장한다.
             */
            _answerControls[question.QuestionId] =
                answerControl;

            cardPanel.Children.Add(answerControl);

            cardBorder.Child = cardPanel;

            return cardBorder;
        }

        /// <summary>
        /// 질문 종류에 맞는 입력 화면을 만든다.
        /// </summary>
        private FrameworkElement CreateAnswerControl(
            SurveyQuestion question)
        {
            switch (question.QuestionType)
            {
                case SurveyQuestionType.SingleChoice:
                    return CreateSingleChoiceControl(question);

                case SurveyQuestionType.MultipleChoice:
                    return CreateMultipleChoiceControl(question);

                case SurveyQuestionType.Text:
                    return CreateTextControl(question);

                default:
                    return new TextBlock
                    {
                        Margin = new Thickness(0, 14, 0, 0),
                        Text = "지원하지 않는 질문 형식입니다.",
                        Foreground = (Brush)FindResource("SurveyMutedText")
                    };
            }
        }

        private Panel CreateOptionPanel(SurveyQuestion question)
        {
            Panel panel = question.HorizontalOptions ? new WrapPanel() : new StackPanel();
            panel.Margin = (Thickness)FindResource("SurveyAnswerSpacing");
            panel.SizeChanged += (_, _) =>
            {
                foreach (FrameworkElement child in panel.Children)
                {
                    child.MaxWidth = Math.Max(0, panel.ActualWidth - child.Margin.Left - child.Margin.Right);
                    // [TODO55-6] 서식 선택지(문단 패널)도 일반 문구와 같은 폭 제한으로 줄바꿈한다. 체크 표시 폭: 세로형 오른쪽 28, 가로형은 디자인 버전 값.
                    if (child is ContentControl control && control.Content is FrameworkElement label)
                        label.MaxWidth = Math.Max(0, child.MaxWidth - control.Padding.Left - control.Padding.Right
                            - control.BorderThickness.Left - control.BorderThickness.Right
                            - (question.HorizontalOptions ? (double)FindResource("SurveyChipCheckWidth") : 28));
                }
            };
            return panel;
        }

        // Reserve the semibold text size before selection so wrapping cannot move subsequent rows.
        private sealed class StableChoiceText : TextBlock
        {
            private readonly TextBlock _selectedMeasure = new TextBlock();

            static StableChoiceText()
            {
                foreach (DependencyProperty property in new[] { TextProperty, MaxWidthProperty, FontFamilyProperty,
                    FontSizeProperty, FontStyleProperty, FontStretchProperty, FlowDirectionProperty,
                    LanguageProperty, TextWrappingProperty, LineHeightProperty, LineStackingStrategyProperty })
                    property.OverrideMetadata(typeof(StableChoiceText), new FrameworkPropertyMetadata(
                        (d, _) => ((StableChoiceText)d).ReserveHeight()));
            }

            private void ReserveHeight()
            {
                if (_selectedMeasure == null) return;
                _selectedMeasure.Text = Text;
                _selectedMeasure.FontFamily = FontFamily;
                _selectedMeasure.FontSize = FontSize;
                _selectedMeasure.FontStyle = FontStyle;
                _selectedMeasure.FontStretch = FontStretch;
                _selectedMeasure.FlowDirection = FlowDirection;
                _selectedMeasure.Language = Language;
                _selectedMeasure.TextWrapping = TextWrapping;
                _selectedMeasure.LineHeight = LineHeight;
                _selectedMeasure.LineStackingStrategy = LineStackingStrategy;
                Size constraint = new Size(MaxWidth, double.PositiveInfinity);
                _selectedMeasure.FontWeight = FontWeights.Normal;
                _selectedMeasure.Measure(constraint);
                double normalHeight = _selectedMeasure.DesiredSize.Height;
                _selectedMeasure.FontWeight = FontWeights.SemiBold;
                _selectedMeasure.Measure(constraint);
                MinHeight = Math.Max(normalHeight, _selectedMeasure.DesiredSize.Height);
            }
        }

        /*
         * [TODO55] 서식 문단 공통 처리. 일반 문자열 TextBlock(template)의 기본 글꼴·크기·굵기·색·줄 높이를 문단에 옮기고,
         * 구간(Run)에 지정된 서식은 그대로 우선한다. 표시할 글자가 없으면 빈 목록(일반 문자열 사용).
         * inheritFont=true(선택지)는 글꼴·크기·굵기·색을 고정하지 않는다. 일반 선택지처럼 본문 크기(ApplyBodyFontSize)와
         * 선택 강조(굵기·색 트리거)를 선택지 컨트롤에서 상속해야 하기 때문이다.
         * 상속 크기는 화면에 붙은 뒤 정해지므로 기울임 여유는 Loaded에서 다시 맞춘다.
         */
        private static List<TextBlock> CreateRichParagraphs(IReadOnlyList<PopupTextBlockDto>? blocks, TextBlock template, bool inheritFont = false)
        {
            List<TextBlock> paragraphs = PopupRichText.CreateParagraphs(blocks, null);
            if (paragraphs.All(p => p.Inlines.OfType<System.Windows.Documents.Run>().All(r => string.IsNullOrWhiteSpace(r.Text))))
                return new List<TextBlock>();
            foreach (TextBlock paragraph in paragraphs)
            {
                if (!inheritFont)
                {
                    paragraph.FontFamily = template.FontFamily;
                    paragraph.FontSize = template.FontSize;
                    paragraph.FontWeight = template.FontWeight;
                    paragraph.Foreground = template.Foreground;
                }
                if (!double.IsNaN(template.LineHeight)) paragraph.LineHeight = template.LineHeight;
                PopupRichText.ReserveItalicOverhang(paragraph);
                paragraph.Loaded += (_, _) => PopupRichText.ReserveItalicOverhang(paragraph);
            }
            return paragraphs;
        }

        private static StackPanel StackOf(IEnumerable<TextBlock> paragraphs, string plainText)
        {
            var panel = new StackPanel();
            foreach (TextBlock paragraph in paragraphs) panel.Children.Add(paragraph);
            System.Windows.Automation.AutomationProperties.SetName(panel, plainText);
            return panel;
        }

        private static void ShowRichInstead(TextBlock plain, StackPanel host, IReadOnlyList<PopupTextBlockDto>? blocks)
        {
            List<TextBlock> paragraphs = CreateRichParagraphs(blocks, plain);
            if (paragraphs.Count == 0) return;
            foreach (TextBlock paragraph in paragraphs) host.Children.Add(paragraph);
            System.Windows.Automation.AutomationProperties.SetName(host, plain.Text);
            host.Visibility = Visibility.Visible;
            plain.Visibility = Visibility.Collapsed;
        }

        /*
         * [TODO56-5] 선택 방식 안내. 주관식은 안내하지 않는다. [TODO52-5] 정답 수로 선택 수가 제한된 복수 선택은 최대 개수를 안내한다.
         * 디자인 버전에 SurveyShowChoiceHint=true가 있을 때만 표시한다(V1은 키가 없어 표시하지 않음).
         */
        private string? ChoiceHintOf(SurveyQuestion question)
        {
            if (TryFindResource("SurveyShowChoiceHint") is not true) return null;
            return question.QuestionType switch
            {
                SurveyQuestionType.SingleChoice => "하나 선택",
                SurveyQuestionType.MultipleChoice => question.MaxSelections is int max ? $"최대 {max}개 선택" : "여러 개 선택 가능",
                _ => null
            };
        }

        // 제목 글자 크기(본문 크기 +4)와 관계없이 문항 번호와 같은 12 크기·보통 굵기·보조색으로 둔다(우선순위를 제목보다 낮게).
        private System.Windows.Documents.Run ChoiceHintRun(string hint) => new("   " + hint)
        {
            FontSize = 12,
            FontWeight = FontWeights.Normal,
            FontStyle = FontStyles.Normal,
            TextDecorations = null,
            Foreground = (Brush)FindResource("SurveyMutedText")
        };

        /* [TODO55] 선택지 표시: 서식이 있으면 문단 패널, 없으면 기존 일반 문구. 접근성 이름은 호출부에서 일반 문구(Text)로 둔다. */
        private FrameworkElement CreateOptionContent(SurveyOption option, bool horizontal)
        {
            TextBlock plain = CreateOptionText(option.Text, horizontal);
            List<TextBlock> paragraphs = CreateRichParagraphs(option.TextBlocks, plain, inheritFont: true);
            _optionParagraphs.AddRange(paragraphs);
            return paragraphs.Count == 0 ? plain : StackOf(paragraphs, option.Text);
        }

        private TextBlock CreateOptionText(string text, bool horizontal)
        {
            // 선택 시 굵게 바뀌는 디자인(V1)만 굵은 글자 높이를 미리 확보한다. TODO56 이후 V2는 선택해도 굵기가 그대로다.
            bool reserveSelectedBold = TryFindResource("SurveyReserveSelectedBold") is not false;
            TextBlock label = horizontal || !reserveSelectedBold ? new TextBlock() : new StableChoiceText();
            label.Text = text;
            label.LineHeight = 22;
            label.TextWrapping = TextWrapping.Wrap;
            return label;
        }

        /// <summary>
        /// 일반 단일 선택 문항을 만든다.
        /// </summary>
        private FrameworkElement CreateSingleChoiceControl(
            SurveyQuestion question)
        {
            Panel optionPanel = CreateOptionPanel(question);

            foreach (SurveyOption option in question.Options)
            {
                bool isLast = option == question.Options.Last();
                RadioButton radioButton = new RadioButton
                {
                    Style = (Style)FindResource(question.HorizontalOptions ? "SurveyChoiceChipStyle" : "SurveyRadioButtonStyle"),
                    Margin = GetOptionMargin(question.HorizontalOptions, isLast),
                    Content = CreateOptionContent(option, question.HorizontalOptions),
                    Tag = option,
                    GroupName = $"Question_{question.QuestionId}"
                };

                radioButton.Checked += AnswerSelectionChanged;
                radioButton.Unchecked += AnswerSelectionChanged;
                System.Windows.Automation.AutomationProperties.SetName(radioButton, option.Text);
                radioButton.PreviewKeyDown += (_, e) =>
                {
                    if (e.Key == System.Windows.Input.Key.Enter)
                    {
                        radioButton.IsChecked = true;
                        e.Handled = true;
                    }
                };

                optionPanel.Children.Add(radioButton);
            }

            return optionPanel;
        }

        /// <summary>
        /// 복수 선택 문항을 만든다.
        /// </summary>
        private FrameworkElement CreateMultipleChoiceControl(
            SurveyQuestion question)
        {
            Panel optionPanel = CreateOptionPanel(question);
            var checkBoxes = new List<CheckBox>();

            foreach (SurveyOption option in question.Options)
            {
                bool isLast = option == question.Options.Last();
                CheckBox checkBox = new CheckBox
                {
                    Style = (Style)FindResource(
                        question.HorizontalOptions
                            ? "SurveyCheckBoxChipStyle"
                            : "SurveyCheckBoxRowStyle"),
                    HorizontalAlignment = question.HorizontalOptions ? HorizontalAlignment.Left : HorizontalAlignment.Stretch,
                    Margin = GetOptionMargin(question.HorizontalOptions, isLast),
                    Content = CreateOptionContent(option, question.HorizontalOptions),
                    Tag = option
                };

                // [TODO52-5] 한도 확인을 응답 갱신보다 먼저 연결해 초과 선택이 응답·진행률에 남지 않게 한다.
                checkBox.Checked += (_, _) => ApplySelectionLimit(question.MaxSelections, checkBoxes, checkBox);
                checkBox.Unchecked += (_, _) => ApplySelectionLimit(question.MaxSelections, checkBoxes, null);
                checkBox.Checked += AnswerSelectionChanged;
                checkBox.Unchecked += AnswerSelectionChanged;
                System.Windows.Automation.AutomationProperties.SetName(checkBox, option.Text);
                checkBox.PreviewKeyDown += (_, e) =>
                {
                    if (e.Key == System.Windows.Input.Key.Enter)
                    {
                        if (checkBox.IsEnabled) checkBox.IsChecked = checkBox.IsChecked != true;
                        e.Handled = true;
                    }
                };

                checkBoxes.Add(checkBox);
                optionPanel.Children.Add(checkBox);
            }

            return optionPanel;
        }

        /*
         * [TODO52-5] 복수 선택 한도(정답 수). 한도만큼 고르면 남은 선택지를 비활성화하고, 하나를 해제하면 다시 활성화한다.
         * 코드로 한도를 넘겨 체크된 경우에는 방금 체크한 선택지를 해제한다. 한도가 없으면(null) 아무것도 하지 않는다.
         * 문항 전체 잠금(VIDEO+QUIZ 시청 전 등)은 부모 IsEnabled로 걸리므로 여기서 활성화해도 잠금이 풀리지 않는다.
         */
        internal static void ApplySelectionLimit(int? maxSelections, IReadOnlyList<CheckBox> checkBoxes, CheckBox? justChecked)
        {
            if (maxSelections is not int max) return;
            int selected = checkBoxes.Count(box => box.IsChecked == true);
            if (selected > max && justChecked != null)
            {
                justChecked.IsChecked = false;
                return;
            }
            bool full = selected >= max;
            foreach (CheckBox box in checkBoxes)
                box.IsEnabled = !full || box.IsChecked == true;
        }

        private static Thickness GetOptionMargin(bool horizontal, bool isLast)
        {
            return horizontal
                ? new Thickness(0, 0, isLast ? 0 : 8, 0)
                : new Thickness(0, 0, 0, isLast ? 0 : 8);
        }

        /// <summary>
        /// 주관식 입력 문항을 만든다.
        /// </summary>
        private FrameworkElement CreateTextControl(
            SurveyQuestion question)
        {
            TextBox textBox = new TextBox
            {
                Margin = (Thickness)FindResource("SurveyAnswerSpacing"),
                MinHeight = 96,
                Style = (Style)FindResource("SurveyTextBoxStyle"),
                AcceptsReturn = true,
                TextWrapping = TextWrapping.Wrap,
                VerticalScrollBarVisibility =
                    ScrollBarVisibility.Auto,

                // 어떤 질문의 TextBox인지 구분하기 위한 값
                Tag = question.QuestionId
            };

            textBox.TextChanged += (_, _) => UpdateResponseProgress();
            System.Windows.Automation.AutomationProperties.SetHelpText(textBox,
                "추가 의견이 있다면 자유롭게 작성해주세요.");

            return textBox;
        }

        /// <summary>
        /// 현재 화면에 입력된 모든 설문 응답을 수집한다.
        /// </summary>
        private List<SurveyAnswer> CollectAnswers()
        {
            List<SurveyAnswer> answers = new();

            foreach (SurveyQuestion question in _questions)
            {
                SurveyAnswer answer = new SurveyAnswer
                {
                    QuestionId = question.QuestionId
                };

                if (!_answerControls.TryGetValue(
                    question.QuestionId,
                    out FrameworkElement? answerControl))
                {
                    answers.Add(answer);
                    continue;
                }

                switch (question.QuestionType)
                {
                    case SurveyQuestionType.SingleChoice:
                        CollectSingleChoiceAnswer(
                            answerControl,
                            answer);
                        break;

                    case SurveyQuestionType.MultipleChoice:
                        CollectMultipleChoiceAnswer(
                            answerControl,
                            answer);
                        break;

                    case SurveyQuestionType.Text:
                        CollectTextAnswer(
                            answerControl,
                            answer);
                        break;
                }

                answers.Add(answer);
            }

            return answers;
        }

        /// <summary>
        /// 단일 선택 문항의
        /// 선택값 하나를 수집한다.
        /// </summary>
        private void CollectSingleChoiceAnswer(
            FrameworkElement answerControl,
            SurveyAnswer answer)
        {
            if (answerControl is not Panel panel)
            {
                return;
            }

            foreach (UIElement child in panel.Children)
            {
                if (child is RadioButton radioButton &&
                    radioButton.IsChecked == true)
                {
                    AddSelectedOption(
                        answer,
                        radioButton.Tag);

                    break;
                }
            }
        }

        /// <summary>
        /// 복수 선택 문항에서
        /// 체크된 모든 값을 수집한다.
        /// </summary>
        private void CollectMultipleChoiceAnswer(
            FrameworkElement answerControl,
            SurveyAnswer answer)
        {
            if (answerControl is not Panel panel)
            {
                return;
            }

            foreach (UIElement child in panel.Children)
            {
                if (child is CheckBox checkBox &&
                    checkBox.IsChecked == true)
                {
                    AddSelectedOption(
                        answer,
                        checkBox.Tag);
                }
            }
        }

        /// <summary>
        /// 선택한 보기의 서버 OptionId를 SurveyAnswer에 추가한다.
        /// [설계 18 L-0 — C-19] 보기 컨트롤(RadioButton·CheckBox)의 Tag는 항상 SurveyOption으로 만들므로
        /// "구 커스텀 컨트롤" 호환용 문자열 Tag 분기는 도달할 수 없어 삭제했다. SurveyOption이 아니면 무시한다.
        /// </summary>
        private static void AddSelectedOption(
            SurveyAnswer answer,
            object? optionTag)
        {
            if (optionTag is not SurveyOption option)
            {
                return;
            }

            /*
             * 서버 문항 보기는 항상 양수 OptionId를 가진다.
             * 0 이하(값 누락 등 비정상 데이터)는 서버가 거부할 값이므로 전송 목록에 넣지 않는 방어 조건이다.
             */
            if (option.OptionId > 0)
            {
                answer.SelectedOptionIds.Add(
                    option.OptionId);
            }
        }

        /// <summary>
        /// 주관식 문항의 입력 내용을 수집한다.
        /// </summary>
        private void CollectTextAnswer(
            FrameworkElement answerControl,
            SurveyAnswer answer)
        {
            if (answerControl is TextBox textBox)
            {
                answer.TextAnswer =
                    textBox.Text.Trim();
            }
        }

        /// <summary>
        /// 필수 문항이 모두 입력됐는지 확인한다.
        /// </summary>
        private bool ValidateRequiredQuestions(
            List<SurveyAnswer> answers,
            out string message)
        {
            foreach (SurveyQuestion question in _questions)
            {
                if (!question.IsRequired)
                {
                    continue;
                }

                SurveyAnswer? answer = answers.Find(
                    item => item.QuestionId ==
                            question.QuestionId);

                bool hasAnswer = answer != null &&
                (
                    answer.SelectedOptionIds.Count > 0 ||
                    !string.IsNullOrWhiteSpace(
                        answer.TextAnswer)
                );

                if (!hasAnswer)
                {
                    message =
                        $"필수 문항을 입력해주세요.\n\n" +
                        $"{question.Title}";

                    return false;
                }
            }

            message = string.Empty;
            return true;
        }

        /*
         * [설계 14 §5.6] 관리자 본문 폰트 크기 적용.
         * SURVEY/QUIZ의 본문 = 선택지(RadioButton/CheckBox)·주관식 TextBox. 이들은 FontSize를 직접 지정하지 않아
         * UserControl의 FontSize를 상속하므로 this.FontSize를 바꾸면 함께 바뀐다(기본 14).
         * 문항 제목(기본 16)·문항 설명(기본 13)은 기존 상대 계층을 유지하도록 각각 +4, +1 로 맞춘다.
         * 설문 제목(25)·설명(14)·제출 버튼(14)은 본문이 아니므로 그대로 둔다.
         */
        public void ApplyBodyFontSize(double fontSize)
        {
            FontSize = fontSize;
            foreach (TextBlock titleText in _questionTitleTexts)
            {
                titleText.FontSize = fontSize + 4;
            }
            foreach (TextBlock descriptionText in _questionDescriptionTexts)
            {
                descriptionText.FontSize = fontSize + 1;
            }
            // [TODO55] 크기가 바뀐 서식 문단의 기울임 여유를 다시 맞춘다(TextPopupView와 같음). 일반 문자열 TextBlock은 영향 없음.
            foreach (TextBlock paragraph in _questionTitleTexts.Concat(_questionDescriptionTexts).Concat(_optionParagraphs))
                PopupRichText.ReserveItalicOverhang(paragraph);
        }

        /*
         * [설계 12 §3·§4] 제출 처리 — 서버를 기다리지 않는다.
         *   1. 화면 답안 수집
         *   2. 필수 문항 검증(WPF 즉시, 누락 시 안내 후 중단)
         *   3. QUIZ면 QuizGrader로 즉시 채점(점수·통과 여부)
         *   4. SurveySubmitted 이벤트로 PopupManager에 전달 → 로컬 큐 저장 → 결과 안내 → 창 닫기 → 백그라운드 전송
         * 기준 3 구현(서버 채점·응답 대기)에서 설계 12로 되돌린 지점이다.
         */
        private void SubmitButton_Click(
    object sender,
    RoutedEventArgs e)
        {
            Submit();
        }

        public void UseFooterSubmission()
        {
            SubmitButton.Visibility = Visibility.Collapsed;
            SubmissionArea.Visibility = Visibility.Collapsed;
        }

        private void AnswerSelectionChanged(object sender, RoutedEventArgs e) => UpdateResponseProgress();

        private void UpdateResponseProgress()
        {
            var answers = CollectAnswers();
            int required = _questions.Count(question => question.IsRequired);
            int completed = _questions.Count(question => question.IsRequired && answers.Any(answer =>
                answer.QuestionId == question.QuestionId && (answer.SelectedOptionIds.Count > 0 || !string.IsNullOrWhiteSpace(answer.TextAnswer))));
            CanSubmit = IsEnabled && completed == required;
            // [TODO56-6] 필수 문항 단위로 센다(복수선택 선택지 수·선택 문항 응답은 세지 않음). 필수 0개면 수치를 표시하지 않는다.
            ResponseProgressText = required == 0 ? "선택 문항은 자유롭게 응답해주세요."
                : completed == required ? $"필수 응답 {completed}/{required} 완료"
                : $"필수 응답 {completed}/{required} · {required - completed}문항 남음";
            bool changed = ShowProgressText();
            RequiredProgressText.Foreground = (Brush)FindResource("SurveyMutedText");
            SubmitButton.IsEnabled = CanSubmit;
            System.Windows.Automation.AutomationProperties.SetLiveSetting(RequiredProgressText, System.Windows.Automation.AutomationLiveSetting.Polite);
            if (changed && SubmissionArea.Visibility == Visibility.Visible)
                UIElementAutomationPeer.FromElement(RequiredProgressText)?.RaiseAutomationEvent(System.Windows.Automation.Peers.AutomationEvents.LiveRegionChanged);
            ResponseProgressChanged?.Invoke(this, EventArgs.Empty);
        }

        /*
         * [TODO59-5] 영상 결합 QUIZ가 잠긴 동안 본문 제출 영역에 보일 잠금 사유. null이면 필수 응답 진행 문구를 쓴다.
         * 영상과 퀴즈 사이 안내(_notice)를 없앴으므로, 공통 푸터를 숨긴 조합(showFooter=false)에서는 이 영역이 잠금 사유를 보여 준다.
         * 푸터를 쓰는 조합은 제출 영역이 접혀 있고 사유는 PopupWindow 푸터가 표시한다.
         */
        private string? _lockedReason;

        internal void SetLockedReason(string? reason)
        {
            _lockedReason = reason;
            ShowProgressText();
        }

        private bool ShowProgressText()
        {
            string text = !IsEnabled && _lockedReason != null ? _lockedReason : ResponseProgressText;
            bool changed = RequiredProgressText.Text != text;
            if (changed) RequiredProgressText.Text = text;
            // [설계 43] 제출 비활성 사유(필수 미응답·영상 잠금)를 스크린리더에도 알린다. 통과 점수는 제출 조건이 아니다(채점 전 교착 방지).
            System.Windows.Automation.AutomationProperties.SetHelpText(SubmitButton, CanSubmit ? string.Empty : text);
            return changed;
        }

        /// <summary>[설계 44] 초기 포커스: 첫 문항의 첫 입력 컨트롤. 잠긴 상태(비활성)면 옮기지 않는다.</summary>
        internal bool FocusFirstAnswer()
        {
            if (!IsEnabled) return false;
            foreach (SurveyQuestion question in _questions)
            {
                if (!_answerControls.TryGetValue(question.QuestionId, out FrameworkElement? control)) continue;
                Control? target = control is Panel panel ? panel.Children.OfType<Control>().FirstOrDefault() : control as Control;
                if (target != null && target.IsEnabled && target.Focusable) return target.Focus();
            }
            return false;
        }

        public void Submit()
        {
            /*
             * 화면에 입력된 모든 응답을
             * SurveyAnswer 목록으로 만든다.
             */
            List<SurveyAnswer> answers =
                CollectAnswers();

            /*
             * 필수 문항 중 비어 있는 항목이 있으면
             * 제출 또는 채점을 중단한다.
             */
            if (!ValidateRequiredQuestions(
                answers,
                out string validationMessage))
            {
                Popup.Views.Windows.PopupAlert.Show(Window.GetWindow(this),
                    validationMessage,
                    "답안을 확인해 주세요");

                return;
            }

            /*
             * [설계 12 §4] QUIZ는 여기서 즉시 채점한다. 서버가 QUIZ 팝업에 한해 정답 정보
             * (options[].isCorrect / correctAnswer / answerMatchMode / questionScore)를 내려준다.
             * SURVEY는 채점하지 않으므로 점수·통과 여부가 null이다.
             * 미통과면 PopupManager가 안내만 하고 창을 유지한다(제출 없음, 답안 수정 후 재채점). 통과 시에만 SUBMITTED가 만들어진다.
             */
            SurveySubmission submission;
            if (_isQuizMode)
            {
                QuizGrader.Result graded = QuizGrader.Grade(_questions, answers, _passingScore);
                submission = new SurveySubmission
                {
                    Answers = answers,
                    Score = graded.Score,
                    Passed = graded.Passed,
                    PassingScore = graded.PassingScore,
                    IncorrectQuestionNumbers = graded.IncorrectQuestionNumbers
                };
            }
            else
            {
                submission = new SurveySubmission { Answers = answers };
            }

            SurveySubmitted?.Invoke(
                this,
                submission);
        }
    }
}
