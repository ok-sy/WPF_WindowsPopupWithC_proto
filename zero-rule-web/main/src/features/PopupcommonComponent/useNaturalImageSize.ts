import { useEffect, useState } from 'react';
import type { Size } from './imagePreviewLayout';

/**
 * POL-04-02 : 모드별 기준
 * ■ 이미지 원본 크기 읽기
 * - in : url(string | null | undefined) 이미지 주소(object URL·서버 URL)
 * - out: Size | null 원본 가로·세로(px). 주소가 없거나 읽기 실패·로딩 중이면 null
 * - 등록 화면에서 ADAPTIVE 창 크기를 이미지에 맞출 때(adaptiveWindowForImage) 쓴다. 주소가 바뀌면 이전 값은 버린다.
 */
export function useNaturalImageSize(url: string | null | undefined): Size | null {
  const [loaded, setLoaded] = useState<{ url: string; size: Size } | null>(null);
  const source = (url ?? '').trim();
  useEffect(() => {
    if (!source || typeof Image === 'undefined') return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled && image.naturalWidth > 0 && image.naturalHeight > 0)
        setLoaded({ url: source, size: { width: image.naturalWidth, height: image.naturalHeight } });
    };
    image.src = source;
    return () => { cancelled = true; image.onload = null; };
  }, [source]);
  return loaded && loaded.url === source ? loaded.size : null;
}

export default useNaturalImageSize;
