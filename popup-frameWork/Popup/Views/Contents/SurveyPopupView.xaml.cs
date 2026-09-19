using Popup.Models;
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;


namespace Popup.Views.Contents
{
    /// <summary>
    /// 설문 질문을 화면에 표시하는 사용자 컨트롤
    /// </summary>
    public partial class SurveyPopupView : UserControl
    {
        // 현재 화면에 표시된 질문 목록
        private readonly List<SurveyQuestion> _questions = new();

        /*
         * 현재 화면이 일반 설문인지
         * 채점이 필요한 QuizMode인지 구분한다.
         *
         * false
         * → 일반 설문
         *
         * true
         * → CorrectAnswers를 기준으로 점수를 계산하는 퀴즈
         */
        private readonly bool _isQuizMode;

        /*
         * [기준 3] 통과 점수(_passingScore)는 더 이상 보관하지 않는다. 서버가 passingScore를 내려주지 않으며
         * 채점·통과 판정은 결과 API 응답으로 받는다. 생성자 매개변수 passingScore는 호출부 호환용으로만 남긴다.
         */

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
         * 설문 제출이 정상적으로 완료됐을 때
         * 외부로 응답 목록을 전달하는 이벤트다.
         *
         * MainWindow 또는 PopupWindow에서
         * 이 이벤트를 구독하면
         * 사용자가 제출한 SurveyAnswer 목록을 받을 수 있다.
         */
        public event EventHandler<List<SurveyAnswer>>?
            SurveySubmitted;

        /// <summary>
        /// Visual Studio 미리보기와 기본 생성을 위한 생성자
        /// </summary>
        public SurveyPopupView()
        {
            InitializeComponent();

            /*
             * Visual Studio 미리보기 또는
             * 기본 생성 시에는 일반 설문으로 처리한다.
             */
            _isQuizMode = false;
        }

        /// <summary>
        /// 실제 설문 데이터를 받아 화면을 만드는 생성자
        /// </summary>
        public SurveyPopupView(
        string title,
        string description,
        List<SurveyQuestion> questions,
        bool isQuizMode = false,
        double passingScore = 0)
        {
            InitializeComponent();

            SurveyTitleText.Text = title;
            SurveyDescriptionText.Text = description;

            _questions =
                questions ?? new List<SurveyQuestion>();

            /*
             * 일반 설문인지 QuizMode인지 저장한다.
             */
            _isQuizMode = isQuizMode;

            /*
             * [기준 3] passingScore는 서버 채점으로 전환되어 사용하지 않는다(호출부 호환용 매개변수).
             */
            _ = passingScore;

            /*
             * QuizMode일 경우
             * 제출 버튼 문구를 채점 의미에 맞게 변경한다.
             */
            if (_isQuizMode)
            {
                SubmitButton.Content = "채점";
            }

            BuildQuestions();
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

            for (int index = 0; index < _questions.Count; index++)
            {
                SurveyQuestion question = _questions[index];

                Border questionCard = CreateQuestionCard(
                    question,
                    index + 1);

                QuestionListPanel.Children.Add(questionCard);
            }
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
                Margin = new Thickness(0, 0, 0, 16),
                Padding = new Thickness(18),
                Background = Brushes.White,
                BorderBrush = new SolidColorBrush(
                    Color.FromRgb(229, 231, 235)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8)
            };

            StackPanel cardPanel = new StackPanel();

            TextBlock titleText = new TextBlock
            {
                FontSize = 16,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush(
                    Color.FromRgb(17, 24, 39)),
                TextWrapping = TextWrapping.Wrap
            };

            string requiredMark = question.IsRequired
                ? " *"
                : string.Empty;

            titleText.Text =
                $"{questionNumber}. {question.Title}{requiredMark}";

            cardPanel.Children.Add(titleText);

            if (!string.IsNullOrWhiteSpace(question.Description))
            {
                TextBlock descriptionText = new TextBlock
                {
                    Margin = new Thickness(0, 6, 0, 0),
                    FontSize = 13,
                    Foreground = new SolidColorBrush(
                        Color.FromRgb(107, 114, 128)),
                    Text = question.Description,
                    TextWrapping = TextWrapping.Wrap
                };

                cardPanel.Children.Add(descriptionText);
            }

            FrameworkElement answerControl =
            CreateAnswerControl(question);

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
                case SurveyQuestionType.Rating5:
                    return CreateRating5Control(question);

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
                        Foreground = Brushes.Red
                    };
            }
        }

        /// <summary>
        /// 5점 평가 문항을 만든다.
        /// </summary>
        private FrameworkElement CreateRating5Control(
    SurveyQuestion question)
        {
            /*
             * 5점 척도는 항상 항목이 5개이므로
             * 사용 가능한 너비를 5개의 동일한 열로 나눈다.
             */
            UniformGrid ratingPanel = new UniformGrid
            {
                Margin = new Thickness(0, 16, 0, 0),
                Columns = 5,
                HorizontalAlignment = HorizontalAlignment.Stretch
            };

            List<SurveyOption> ratingOptions =
                GetRating5Options(question);

            foreach (SurveyOption option in ratingOptions)
            {
                RadioButton radioButton = new RadioButton
                {
                    Margin = new Thickness(4, 4, 4, 4),

                    HorizontalAlignment =
                        HorizontalAlignment.Center,

                    VerticalAlignment =
                        VerticalAlignment.Center,

                    HorizontalContentAlignment =
                        HorizontalAlignment.Center,

                    VerticalContentAlignment =
                        VerticalAlignment.Center,

                    Content =
                        option.Text,

                    /*
                     * 화면 표시용 Value와 서버 저장용 OptionId를
                     * 제출 시 모두 읽을 수 있도록 보기 객체를 보관한다.
                     */
                    Tag =
                        option,

                    GroupName =
                        $"Question_{question.QuestionId}"
                };

                ratingPanel.Children.Add(radioButton);
            }

            return ratingPanel;
        }

        /// <summary>
        /// 일반 단일 선택 문항을 만든다.
        /// </summary>
        private FrameworkElement CreateSingleChoiceControl(
            SurveyQuestion question)
        {
            StackPanel optionPanel = new StackPanel
            {
                Margin = new Thickness(0, 14, 0, 0)
            };

            foreach (SurveyOption option in question.Options)
            {
                RadioButton radioButton = new RadioButton
                {
                    Margin = new Thickness(0, 0, 0, 10),
                    Content = option.Text,
                    Tag = option,
                    GroupName = $"Question_{question.QuestionId}"
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
            StackPanel optionPanel = new StackPanel
            {
                Margin = new Thickness(0, 14, 0, 0)
            };

            foreach (SurveyOption option in question.Options)
            {
                CheckBox checkBox = new CheckBox
                {
                    Margin = new Thickness(0, 0, 0, 10),
                    Content = option.Text,
                    Tag = option
                };

                optionPanel.Children.Add(checkBox);
            }

            return optionPanel;
        }

        /// <summary>
        /// 주관식 입력 문항을 만든다.
        /// </summary>
        private FrameworkElement CreateTextControl(
            SurveyQuestion question)
        {
            TextBox textBox = new TextBox
            {
                Margin = new Thickness(0, 14, 0, 0),
                MinHeight = 90,
                Padding = new Thickness(10),
                AcceptsReturn = true,
                TextWrapping = TextWrapping.Wrap,
                VerticalScrollBarVisibility =
                    ScrollBarVisibility.Auto,

                // 어떤 질문의 TextBox인지 구분하기 위한 값
                Tag = question.QuestionId
            };

            return textBox;
        }

        /// <summary>
        /// Rating5의 기본 보기 다섯 개를 반환한다.
        ///
        /// 질문에 직접 Options가 들어 있다면
        /// 직접 전달받은 Options를 우선 사용한다.
        /// </summary>
        private List<SurveyOption> GetRating5Options(
            SurveyQuestion question)
        {
            if (question.Options != null &&
                question.Options.Count > 0)
            {
                return question.Options;
            }

            return new List<SurveyOption>
            {
                new SurveyOption
                {
                    Value = "1",
                    Text = "매우 좋지 않음"
                },
                new SurveyOption
                {
                    Value = "2",
                    Text = "좋지 않음"
                },
                new SurveyOption
                {
                    Value = "3",
                    Text = "보통"
                },
                new SurveyOption
                {
                    Value = "4",
                    Text = "좋음"
                },
                new SurveyOption
                {
                    Value = "5",
                    Text = "매우 좋음"
                }
            };
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
                    case SurveyQuestionType.Rating5:
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
        /// 단일 선택 또는 5점 평가 문항의
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
        /// 선택한 보기의 비교용 Value와 서버 저장용 OptionId를
        /// SurveyAnswer에 함께 추가한다.
        /// </summary>
        private static void AddSelectedOption(
            SurveyAnswer answer,
            object? optionTag)
        {
            if (optionTag is SurveyOption option)
            {
                answer.SelectedValues.Add(
                    option.Value);

                /*
                 * 서버에서 받은 보기에만 실제 OptionId가 있다.
                 * 로컬 미리보기용 자동 생성 보기의 0은 전송하지 않는다.
                 */
                if (option.OptionId > 0)
                {
                    answer.SelectedOptionIds.Add(
                        option.OptionId);
                }

                return;
            }

            /*
             * 이전 방식으로 만든 사용자 정의 컨트롤과의
             * 호환을 위해 문자열 Tag도 계속 읽는다.
             */
            answer.SelectedValues.Add(
                optionTag?.ToString()
                ?? string.Empty);
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
                    answer.SelectedValues.Count > 0 ||
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
         * [기준 3] 로컬 채점 메서드(CalculateScore, AreAnswersEqual)를 제거했다. 서버가 정답을 내려주지 않으며
         * 채점·통과 판정은 결과 API(서버)가 담당한다. _passingScore·IsScored·CorrectAnswers 필드는 구 JSON 호환을 위해 남긴다.
         */

        private void SubmitButton_Click(
    object sender,
    RoutedEventArgs e)
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
                MessageBox.Show(Window.GetWindow(this)!,
                    validationMessage,
                    "필수 문항 확인",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                return;
            }

            /*
             * [기준 3] 채점은 서버가 한다.
             * 예전에는 QuizMode에서 CorrectAnswers로 로컬 채점해 통과한 경우에만 제출했지만,
             * 서버는 정답을 내려주지 않으므로(정답 비노출) 로컬 채점이 불가능하다.
             * 설문·퀴즈 모두 필수 문항 검증만 하고 답안을 그대로 외부(PopupManager)로 전달한다.
             * 통과 여부·점수는 결과 API 응답으로 받아 PopupManager가 안내한다.
             */
            SurveySubmitted?.Invoke(
                this,
                answers);
        }
    }
}
