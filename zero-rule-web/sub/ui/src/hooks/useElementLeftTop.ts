import { useEffect, useState } from 'react';
import { getScreenLeftTop } from '../lib/misc-utils';

type Position = { x: number; y: number };

/**
 * 주어진 디펜던시가 변경되면 요소의 좌측,상단 위치를 리턴한다.
 * @param element 위치를 체크할 요소
 * @param deps 디펜던시
 * @returns document offset(x,y)
 */
export function useElementLeftTop(element: HTMLElement | null | undefined, deps: any[]): Position {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (!element) return;
    setPosition(getScreenLeftTop(element));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element, ...deps]);

  return position;
}
