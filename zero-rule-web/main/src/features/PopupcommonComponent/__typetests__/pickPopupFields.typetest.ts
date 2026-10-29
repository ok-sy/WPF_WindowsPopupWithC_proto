/*
 * POL-07-02 : 변환 책임 분리
 * ■ pickPopupFields 타입 검사(실행하지 않는 파일)
 * - 웹 type-check(tsc --noEmit)가 이 파일을 함께 검사한다. @ts-expect-error 줄에 오류가 나지 않으면(= 타입이 느슨해지면) tsc가 실패한다.
 * - 고른 키는 실제로 없으면 생략되므로 결과 값 타입은 `값 | undefined`(Partial)다.
 * - 런타임 동작 검사는 scripts/verify-popup-pick-fields.cjs.
 */
import type { AdminPopupDetail } from '@local/domain';
import { pickPopupFields } from '../popupEditorTransform';

declare const popup: AdminPopupDetail;

// 최상위만: 고른 키만 있고 content·questions 속성은 없다.
const topOnly = pickPopupFields(popup, { topLevelKeys: ['popupId', 'displayStartAt', 'periodMode'] });
const popupId: string | undefined = topOnly.popupId;
void topOnly.displayStartAt;
// @ts-expect-error 고르지 않은 최상위 키
void topOnly.title;
// @ts-expect-error contentKeys를 주지 않으면 content가 없다
void topOnly.content;
// @ts-expect-error content·questions는 topLevelKeys로 고를 수 없다
pickPopupFields(popup, { topLevelKeys: ['content'] });
// @ts-expect-error AdminPopupDetail에 없는 최상위 키
pickPopupFields(popup, { topLevelKeys: ['startAt'] });

// content만: content는 고른 키만 가진 객체, questions 속성은 없다.
const contentOnly = pickPopupFields(popup, { contentKeys: ['plainText', 'textBlocks'] });
const plainText: unknown = contentOnly.content.plainText;
// @ts-expect-error 고르지 않은 content 키
void contentOnly.content.surveyTitle;
// @ts-expect-error questionKeys를 주지 않으면 questions가 없다
void contentOnly.questions;

// questions만: 각 문항은 Partial<Pick<PopupQuestion, 'questionId' | 'title'>>.
const questionsOnly = pickPopupFields(popup, { questionKeys: ['questionId', 'title'] });
const questionId: number | undefined = questionsOnly.questions[0].questionId;
const title: string | undefined = questionsOnly.questions[0].title;
// @ts-expect-error 고르지 않은 문항 필드
void questionsOnly.questions[0].options;
// @ts-expect-error contentKeys를 주지 않으면 content가 없다
void questionsOnly.content;
// @ts-expect-error PopupQuestion에 없는 키(keyof 검사)
pickPopupFields(popup, { questionKeys: ['questionText'] });

// 세 영역 함께
const all = pickPopupFields(popup, { topLevelKeys: ['popupId'], contentKeys: ['plainText'], questionKeys: ['questionId'] });
void all.popupId;
void all.content.plainText;
void all.questions[0].questionId;

// 부분 객체(일정 화면 값 등)도 넘길 수 있다.
pickPopupFields({ periodMode: 'FIXED', displayTimes: [] }, { topLevelKeys: ['periodMode', 'displayTimes'] });

export const typeTestValues = [popupId, plainText, questionId, title];
