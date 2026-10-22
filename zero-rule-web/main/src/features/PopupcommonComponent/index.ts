/*
 * [TODO69] 팝업 공통 컴포넌트 진입점. 에디터·우클릭 서식 패널·RichText 표시·우측/모달 미리보기·공용 렌더러와 변환·계산 유틸.
 * 이 폴더는 관리자 API(@/provider)·등록 부모(RgstPop)·sample 폴더를 참조하지 않는다.
 * 실제 등록 화면은 features/RgstPop, 서버 없이 쓰는 예제는 ./sample 아래에 있다.
 */
export { default as PopupRichTextEditor } from './PopupRichTextEditor';
export { default as PopupRichTextMenu } from './PopupRichTextMenu';
export { default as PopupRichBlocks, richBlocksOrNull } from './PopupRichBlocks';
export { default as PopupQuestionEditor, validatePopupQuestions } from './PopupQuestionEditor';
export { default as PopupScheduleFields, validatePopupSchedule } from './PopupScheduleFields';
export { default as InlinePopupPreview } from './InlinePopupPreview';
export { default as PopupPreviewDialog } from './PopupPreviewDialog';
export { default as PopupPreview } from './PopupPreview';
export * from './popupEditorTransform';
export * from './popupCommon';
export * from './popupRichText';
export type { Size } from './imagePreviewLayout';
