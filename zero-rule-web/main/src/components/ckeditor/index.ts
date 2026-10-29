import dynamic from 'next/dynamic';

/**
 * CKEditor React 래퍼(@ckeditor/ckeditor5-react 12). 브라우저에서만 렌더링한다.
 * editor·config는 loadCkeditorEngine()으로 받은 값을 넘긴다(ckeditorEngine.ts 설명 참고).
 */
export const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then((m) => m.CKEditor), { ssr: false });

export type CkeditorEngine = typeof import('./ckeditorEngine');

/** 공통 엔진(ckeditor5·플러그인·CSS)을 클라이언트에서 불러온다. 같은 모듈이라 여러 에디터가 한 벌을 공유한다. */
export const loadCkeditorEngine = (): Promise<CkeditorEngine> => import('./ckeditorEngine');
