/*
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드 시작하기 탭 최소 예제 타입 검사(웹 type-check에 포함, 실행하지 않음)
 * - guide/tabs/GuideStartTab.tsx MINIMAL_CODE와 같은 흐름이 실제 타입으로 컴파일되는지 확인한다.
 *   초기 state는 popupType만(미설정 키 생략), 입력할 때 title·content가 생기고, 미리보기는 withPreviewFallback, 저장은 pickPopupFields.
 */
import type { AdminPopupDetail } from '@local/domain';
import { pickPopupFields, withPreviewFallback, type RichBlock } from '..';

let state: Partial<AdminPopupDetail> = { popupType: 'TEXT' };
state = { ...state, title: '점검 안내' };
const textBlocks: RichBlock[] = [];
state = { ...state, content: { ...state.content, textBlocks, plainText: '' } };
export const preview: AdminPopupDetail = withPreviewFallback(state);
export const picked = pickPopupFields(state, { topLevelKeys: ['popupType', 'title'], contentKeys: ['textBlocks', 'plainText'] });
