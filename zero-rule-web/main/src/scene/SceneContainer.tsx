import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import { useObservable } from 'react-use';
import SceneContent from './SceneContent';

export default function SceneContainer() {
  const { sceneManager } = useMainLayoutContext();
  const scenes = useObservable(sceneManager.observeScenes(), []);
  const currentSceneId = useObservable(sceneManager.observeCurrentIdOrNull(), null);

  return (
    <>
      {scenes.map(({ url, sceneId, component }) => (
        <SceneContent
          key={sceneId}
          sceneId={sceneId}
          sceneManager={sceneManager}
          selected={sceneId === currentSceneId}
        />
      ))}
    </>
  );
}
