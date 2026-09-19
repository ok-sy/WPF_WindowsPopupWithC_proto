import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import { useElementOffset } from '@local/ui';

type Position = { x: number; y: number };

/**
 * 메인 레이아웃에서 위치가 변경되면, 변경된 위치 알림
 * @returns document offset(x,y)
 */
export default function useElementOffsetInMainLayout(
  element: HTMLElement | null | undefined,
  deps?: any[],
): Position {
  const dependencies = deps ?? [];
  const { layoutBodyPosition } = useMainLayoutContext();
  const position = useElementOffset(element, [
    layoutBodyPosition.x,
    layoutBodyPosition.y,
    ...dependencies,
  ]);

  return position;
}
