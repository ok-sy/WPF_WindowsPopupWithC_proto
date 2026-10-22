import type { AdminPopupDetail } from '@local/domain';
import popupDemoQuestions from '../popupDemoQuestions';
import { createDefaultPopup } from '../popupEditorTransform';
import { plainTextToBlocks } from '../popupRichText';

/*
 * [TODO69] 서버 없이 샘플 페이지를 확인하기 위한 편집값(AdminPopupDetail) 목록.
 * 관리자 API 조회 응답이 아니라 공통 컴포넌트에 바로 넣는 편집값이다. 실제 연결 시 api.popupAdmin.info → toEditorPopup으로 교체한다.
 */
const IMAGE_DATA = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#2563EB"/>'
  + '<text x="320" y="190" font-size="36" text-anchor="middle" fill="#fff">SAMPLE IMAGE</text></svg>');

function sample(popupId: string, title: string, patch: Partial<AdminPopupDetail>, content: Record<string, unknown> = {}): AdminPopupDetail {
  const base = createDefaultPopup(new Date('2026-10-22T00:00:00+09:00'));
  return { ...base, popupId, title, ...patch, content: { ...base.content, ...content } };
}

export function createSamplePopups(): AdminPopupDetail[] {
  const text = '서비스 점검 안내\n10월 25일(토) 02:00~06:00 점검 예정입니다.';
  return [
    sample('SAMPLE-TEXT', '시스템 점검 안내', { popupType: 'TEXT', showLater: true },
      { plainText: text, textBlocks: plainTextToBlocks(text) }),
    sample('SAMPLE-IMAGE', '이미지 공지', { popupType: 'IMAGE', width: 640, height: 480 },
      { imageUrl: IMAGE_DATA, imageSizeMode: 'ADAPTIVE', imageTitle: '이미지 공지', description: '' }),
    sample('SAMPLE-VIDEO', '교육 영상', { popupType: 'VIDEO', width: 760, height: 560, completionRatio: 0.9 },
      { videoUrl: '', videoTitle: '교육 영상' }),
    sample('SAMPLE-SURVEY', '만족도 조사', { popupType: 'SURVEY', width: 640, height: 640, questions: popupDemoQuestions(false) },
      { surveyTitle: '만족도 조사', description: '' }),
    sample('SAMPLE-QUIZ', '보안 퀴즈', { popupType: 'QUIZ', width: 640, height: 640, passingScore: 2, questions: popupDemoQuestions(true) },
      { surveyTitle: '보안 퀴즈', description: '' }),
    sample('SAMPLE-VIDEO-QUIZ', '영상 + 퀴즈', { popupType: 'QUIZ', width: 760, height: 860, completionRatio: 0.8,
      passingScore: 1, questions: popupDemoQuestions(true).slice(0, 1) },
    { videoEnabled: true, videoUrl: '', videoTitle: '영상 + 퀴즈', surveyTitle: '영상 확인 퀴즈' }),
  ];
}
