import { createContext, useContext } from 'react';
import type { SceneManager } from '../../scene/SceneManager';

export interface IMainLayoutContext {
  layoutBodyPosition: { x: number; y: number };
  sceneManager: SceneManager;
}

export const MainLayoutContext = createContext<IMainLayoutContext>(null!);

export function useMainLayoutContext(): IMainLayoutContext {
  return useContext(MainLayoutContext);
}
