// 언디파인인지 비어있는지 체크
export function isUndefinedOrEmpty(value?: string): boolean {
  return value === undefined || value.trim() === '';
}

// trim  후 글자 수 리턴
export function trimAndStringLenght(inputString?: string): number {
  if (!inputString) return 0;
  const stringWithoutWhitespace = inputString.replace(/\s+/g, '');

  return stringWithoutWhitespace.length;
}

/**
 * 단락 표현식 확인, 3어절 확인
 * props : totalSentence 전체 단락 수 -> 기본값 1
 * TODO. 문제가 약간 있음 아직 totalSentence는 쓰지말자
 */
export function checkPatternAnd3Sentence(inputString?: string, totalSentence?: number): boolean {
  if (!inputString) return false;
  if (!totalSentence) totalSentence = 1;

  const reg = /[?.`!”'"'~]/gi;
  const hasMatch = reg.test(inputString);

  let wordLenght = 0;
  let sentenceLength = 0;

  if (hasMatch) {
    // 생성 기준 O
    inputString.split(reg).map((sen) => {
      if (sen.trim().length < 1) {
        // empty
      } else {
        wordLenght = wordLenght + sen.split(' ').length;
        if (sen.split(' ').length > 2) sentenceLength = sentenceLength + 1;
      }
    });

    // TODO. 단락수를 props로 받아서 작업
    if (inputString.length > 0) {
      // 1문장 이상이 되지 않으면
      if (sentenceLength < totalSentence) return false;
      return true;
    }
  } else {
    // 생성 기준 X
    return false;
  }
  return false;
}

/**
 * 단락 표현 및 단락이 딱 하나인지 확인
 */
export function checkPatternAnd1Paragraph(inputString?: string): boolean {
  if (!inputString) return false;

  const reg = /[?.`!”'"'~]/gi;
  const hasMatch = reg.test(inputString);

  let sentenceLength = 0;

  if (hasMatch) {
    // 생성 기준 O
    inputString.split(reg).map((sen) => {
      if (sen.trim().length < 1) {
        // empty
      } else {
        if (sen.split(' ').length > 2) {
          if (sentenceLength === 0) {
            sentenceLength = sentenceLength + 1;
          } else {
            sentenceLength = -1;
          }
        } else {
          sentenceLength = -1;
        }
      }
    });

    // TODO. 단락수를 props로 받아서 작업
    if (inputString.length > 0) {
      // 1문장 이상이 되지 않으면
      if (sentenceLength === 1) return true;
      return false;
    }
  } else {
    // 생성 기준 X
    return false;
  }
  return false;
}

// 다섯개의 답이 있는데 앞에게 비어있으면 true를 뱉는 로직
export const answer5Validation = (
  answer1: string,
  answer2: string,
  answer3: string,
  answer4: string,
  answer5: string,
  question: string,
) => {
  if (trimAndStringLenght(answer1) > 0 && trimAndStringLenght(question) < 1) {
    return true;
  }
  if (trimAndStringLenght(answer2) > 0) {
    if (trimAndStringLenght(answer1) < 1) {
      return true;
    }
  }
  if (trimAndStringLenght(answer3) > 0) {
    if (trimAndStringLenght(answer1) < 1) {
      return true;
    } else if (trimAndStringLenght(answer2) < 1) {
      return true;
    }
  }
  if (trimAndStringLenght(answer4) > 0) {
    if (trimAndStringLenght(answer1) < 1) {
      return true;
    } else if (trimAndStringLenght(answer2) < 1) {
      return true;
    } else if (trimAndStringLenght(answer3) < 1) {
      return true;
    }
  }
  if (trimAndStringLenght(answer5) > 0) {
    if (trimAndStringLenght(answer1) < 1) {
      return true;
    } else if (trimAndStringLenght(answer2) < 1) {
      return true;
    } else if (trimAndStringLenght(answer3) < 1) {
      return true;
    } else if (trimAndStringLenght(answer4) < 1) {
      return true;
    }
  }
  return false;
};

export function numberWithCommas(value?: number) {
  if (value === undefined) return '';
  const formattedNumber = value.toLocaleString('en-US');
  return formattedNumber;
}

export function isNumberLengthOverFive(num: number, length: number) {
  // 숫자를 문자열로 변환하여 길이를 확인
  const numStr = String(num);
  return numStr.length >= length;
}
