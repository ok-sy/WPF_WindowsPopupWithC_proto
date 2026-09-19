import { useEffect, useState } from 'react';
import type { ThemeProps } from 'react-sortable-tree';
import 'react-sortable-tree/style.css';

// 트리 테마 변경
export function useTreeTheme(): ThemeProps | null {
  const [theme, setTheme] = useState<ThemeProps | null>(null);
  useEffect(() => {
    import('react-sortable-tree-theme-file-explorer').then((m) => {
      setTheme(m.default);
    });
  }, []);
  return theme;
}
