import { useEffect, useRef, useState } from 'react';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Stack, Typography } from '@mui/material';

/*
 * 영상 결합(VIDEO+QUIZ) 미리보기의 재생 영역. WPF VideoPopupView.AspectSizing과 같은 원칙으로 높이를 정한다.
 *  - 비율: HTML video의 videoWidth/videoHeight(loadedmetadata·resize). 서버 API·파일 분석은 쓰지 않는다.
 *  - 메타데이터 전·읽기 실패·0 크기: 마지막 유효 크기, 없으면 16:9. URL이 바뀌면 이전 영상 비율을 버린다.
 *  - 높이 = 실제 영역 너비 × h / w, 상한 = 가장 가까운 세로 스크롤 영역 높이 × 0.7, 하한 180. 영상은 contain으로 비율 유지.
 * CSS px와 WPF DIP·DPI 물리 픽셀이 같다고 보지는 않는다(같은 계산 원칙만 맞춘다).
 */
/**
 * POL-05-03 : 결합 화면
 * ■ 영상 기본 비율
 * - in : 없음
 * - out: 16 / 9
 * - 영상 크기를 아직 모르거나 읽지 못했을 때 쓰는 가로/세로 비율을 제공한다.
 */
export const DEFAULT_ASPECT_RATIO = 16 / 9;
/**
 * POL-05-03 : 결합 화면
 * ■ 영상 높이 상한 비율
 * - in : 없음
 * - out: 0.7
 * - 가장 가까운 세로 스크롤 영역 높이에 곱해 영상 높이 상한을 정하는 비율을 제공한다.
 */
export const MAX_HEIGHT_RATIO = 0.7;
/**
 * POL-05-03 : 결합 화면
 * ■ 영상 최소 높이
 * - in : 없음
 * - out: 180(px)
 * - 영역이 좁거나 스크롤 영역이 작아도 영상 재생 영역이 이보다 작아지지 않게 하는 하한을 제공한다.
 */
export const MIN_VIDEO_HEIGHT = 180;

/**
 * POL-05-03 : 결합 화면
 * ■ 영상 원본 크기
 * - in : width(number) 원본 가로 픽셀 · height(number) 원본 세로 픽셀
 * - out: 없음(형식 정의)
 * - HTML video의 videoWidth/videoHeight를 담아 비율 계산에 넘긴다.
 */
export interface NaturalVideoSize {
  width: number;
  height: number;
}

/**
 * POL-05-03 : 결합 화면
 * ■ 영상 재생 영역 높이 계산
 * - in : width(number) 실제 영역 너비 · natural(NaturalVideoSize | null) 영상 원본 크기, 없으면 16:9 · availableHeight(number) 세로 스크롤 영역 높이, 0이면 상한 없음
 * - out: number 재생 영역 높이(px, 소수 둘째 자리 반올림, 최소 180)
 * - 영역 너비와 영상 비율을 받아 높이를 구하고, 스크롤 영역 높이 × 0.7 상한과 180 하한을 적용한다.
 */
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

/**
 * POL-05-03 : 결합 화면
 * ■ 영상 비율 재생 영역
 * - in : url(string) 영상 주소, 빈 문자열이면 자리 표시만 그림
 * - out: 화면: 영상 비율에 맞춘 높이의 재생 영역(음소거·메타데이터만 미리 읽음), 크기를 모르면 재생 아이콘·안내 문구
 * - 영상 주소를 받아 원본 비율을 읽고, 영역 너비·스크롤 영역 높이에 맞춰 재생 영역 높이를 정해 그린다.
 *   url이 바뀌면 이전 영상 비율과 실패 상태를 초기화한다.
 */
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
