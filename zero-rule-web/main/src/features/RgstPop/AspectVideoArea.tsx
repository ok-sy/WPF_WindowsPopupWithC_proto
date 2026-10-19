import { useEffect, useRef, useState } from 'react';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Stack, Typography } from '@mui/material';

/*
 * [TODO60] 영상 결합(VIDEO+QUIZ) 미리보기의 재생 영역. WPF VideoPopupView.AspectSizing과 같은 원칙으로 높이를 정한다.
 *  - 비율: HTML video의 videoWidth/videoHeight(loadedmetadata·resize). 서버 API·파일 분석은 쓰지 않는다.
 *  - 메타데이터 전·읽기 실패·0 크기: 마지막 유효 크기, 없으면 16:9. URL이 바뀌면 이전 영상 비율을 버린다.
 *  - 높이 = 실제 영역 너비 × h / w, 상한 = 가장 가까운 세로 스크롤 영역 높이 × 0.7, 하한 180. 영상은 contain으로 비율 유지.
 * CSS px와 WPF DIP·DPI 물리 픽셀이 같다고 보지는 않는다(같은 계산 원칙만 맞춘다).
 */
export const DEFAULT_ASPECT_RATIO = 16 / 9;
export const MAX_HEIGHT_RATIO = 0.7;
export const MIN_VIDEO_HEIGHT = 180;

export interface NaturalVideoSize {
  width: number;
  height: number;
}

export function aspectVideoHeight(width: number, natural: NaturalVideoSize | null, availableHeight: number): number {
  const ratio = natural ? natural.width / natural.height : DEFAULT_ASPECT_RATIO;
  let height = Math.max(0, width) / ratio;
  if (availableHeight > 0) height = Math.min(height, Math.max(MIN_VIDEO_HEIGHT, availableHeight * MAX_HEIGHT_RATIO));
  return Math.max(MIN_VIDEO_HEIGHT, Math.round(height * 100) / 100);
}

function validSize(width: number, height: number): NaturalVideoSize | null {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? { width, height } : null;
}

function scrollParent(element: HTMLElement | null): HTMLElement | null {
  for (let node = element?.parentElement ?? null; node; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
  }
  return null;
}

export default function AspectVideoArea({ url }: { url: string }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<NaturalVideoSize | null>(null);
  const [failed, setFailed] = useState(false);
  const [box, setBox] = useState({ width: 0, available: 0 });

  // 다른 영상으로 바뀌면 이전 영상의 비율을 재사용하지 않는다.
  useEffect(() => {
    setNatural(null);
    setFailed(false);
  }, [url]);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const scroller = scrollParent(area);
    const measure = () =>
      setBox((current) => {
        const next = { width: area.clientWidth, available: scroller?.clientHeight ?? 0 };
        return Math.abs(next.width - current.width) < 0.5 && Math.abs(next.available - current.available) < 0.5 ? current : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    if (scroller) observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  const readSize = (video: HTMLVideoElement) => {
    const size = validSize(video.videoWidth, video.videoHeight);
    if (size) setNatural((current) => (current && current.width === size.width && current.height === size.height ? current : size));
  };

  const height = aspectVideoHeight(box.width, natural, box.available);
  return (
    <Box
      ref={areaRef}
      data-testid="aspect-video-area"
      data-natural={natural ? `${natural.width}x${natural.height}` : ''}
      sx={{ position: 'relative', width: '100%', height, borderRadius: 1, overflow: 'hidden', bgcolor: '#101521', color: 'white', flexShrink: 0 }}
    >
      {url && !failed && (
        <video
          key={url}
          src={url}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={(event) => readSize(event.currentTarget)}
          onResize={(event) => readSize(event.currentTarget)}
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#101521' }}
        />
      )}
      {!natural && (
        <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <PlayCircleOutlineIcon sx={{ fontSize: 58 }} />
          <Typography variant="caption">{failed ? '영상 정보를 읽지 못해 기본 비율(16:9)로 표시합니다' : '영상 재생 영역'}</Typography>
        </Stack>
      )}
    </Box>
  );
}
