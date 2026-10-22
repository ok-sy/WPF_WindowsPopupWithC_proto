public enum SurveyQuestionType
{
    // ■ 문항 입력 방식(SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT).
    // Rating5 유형은 없다. 기존 RATING5 문항은 08 스크립트로 SingleChoice + 가로 배치로 이관했다.

    /// <summary>
    /// 일반 단일 선택
    /// </summary>
    SingleChoice,

    /// <summary>
    /// 복수 선택
    /// </summary>
    MultipleChoice,

    /// <summary>
    /// 주관식
    /// </summary>
    Text
}