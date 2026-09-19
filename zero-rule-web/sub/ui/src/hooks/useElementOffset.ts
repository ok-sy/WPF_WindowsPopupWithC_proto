import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { delay, NEVER, of, switchMap, tap } from 'rxjs';
import { getScreenLeftTop } from '../lib/misc-utils';
import { ObservableField } from '../lib/ObservableField';

type Position = {
  x: number;
  y: number;
};

type Options = {
  /**
   * 값의 변경을 리턴하는 방식, 기본값은 settled
   * eager: 위치가 변경되면 즉시 리턴
   * settled: 위치의 변경이 없을때 리턴
   * tick: tick별로 무조건 리턴(eager+settled 방식)
   */
  notifyType: 'eager' | 'settled' | 'every_tick';

  /**
   * 체크시간 간격, 기본값 30ms
   */
  tick?: number;

  /**
   * 윈도우 변경할때 체크할 시간, 기본값 100ms
   */
  checkAmountByWindowSize?: number;

  /**
   * 디펜던시 변경할때 체크할 시간, 기본값 300+100ms
   */
  checkAmountByDeps?: number;
};

/**
 * 주어진 디펜던시가 변경되면 요소의 좌측,상단 위치를 리턴한다.
 * useElementLeftTop()과 유사하지만 몇 가지 차이점이 있다.
 * useElementOffset()은 추가적인 체크가 있다.
 * 윈도우의 크기 변화를 감지하여 체크한다.
 * 일정 간격으로 추가적인 체크를 하는데,
 * 이 체크는 보통 애니메이션이 끝나는 시간을 알 수 없을때 유용하다.
 *
 * 윈도우의 크기가 변경되면 추가 100ms동안 체크하고
 * 디펜던시가 변경되면, 400ms동안 체크한다.
 * 이 시간은 checkAmountByWindowSize과 checkAmountByDeps 옵션으로 조정할 수 있다.
 *
 * @param element 체크할 요소
 * @param deps 디펜던시
 * @param options 옵션들
 * @returns document offset(x,y)
 */
export function useElementOffset(
  element: HTMLElement | null | undefined,
  deps: any[],
  options?: Options,
): Position {
  const {
    notifyType = 'settled',
    tick = 30,
    checkAmountByWindowSize = 100,
    checkAmountByDeps = 300 + 100,
  } = options ?? {};
  const { width: winW, height: winH } = useWindowSize();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const remain$ = useMemo(() => new ObservableField(0), []);
  const lastPosRef = useRef<{ x: number; y: number }>({
    x: -1,
    y: -1,
  });

  const updatePosition = useCallback(
    (pos: { x: number; y: number }) => {
      if (lastPosRef.current.x !== pos.x || lastPosRef.current.y !== pos.y) {
        lastPosRef.current = pos;
        if (notifyType === 'eager' || notifyType === 'every_tick') {
          setPosition(pos);
        }
      } else {
        if (notifyType === 'settled' || notifyType === 'every_tick') {
          setPosition(lastPosRef.current);
        }
      }
    },
    [notifyType],
  );

  useEffect(() => {
    if (remain$.value < checkAmountByDeps) {
      remain$.setValue(checkAmountByDeps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remain$, checkAmountByDeps, ...deps]);

  useEffect(() => {
    if (remain$.value < checkAmountByWindowSize) {
      remain$.setValue(checkAmountByWindowSize);
    }
  }, [remain$, checkAmountByWindowSize, winH, winW]);

  useEffect(() => {
    if (!element) {
      return;
    }

    const s1 = remain$
      .observe()
      .pipe(
        switchMap((remain) => {
          if (remain <= 0) {
            return NEVER;
          }
          return of(getScreenLeftTop(element)).pipe(
            tap(updatePosition),
            delay(tick),
            tap(() => {
              remain$.setValue(Math.max(0, remain$.value - tick));
            }),
          );
        }),
      )
      .subscribe();

    return () => {
      s1.unsubscribe();
    };
  }, [element, remain$, tick, updatePosition]);

  return position;
}
