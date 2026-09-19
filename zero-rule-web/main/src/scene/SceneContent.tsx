import { Box, SxProps } from '@mui/material';
import { useEffect, useState } from 'react';
import type { SceneManager } from './SceneManager';
import type { IScene } from './types';

type Props = {
  sceneId: number;
  selected: boolean;
  sceneManager: SceneManager;
};

export default function SceneContent(props: Props) {
  const { sceneManager, sceneId, selected } = props;
  const [scene, setScene] = useState<IScene>();

  useEffect(() => {
    const s1 = sceneManager.observeSceneById(sceneId).subscribe((scene) => {
      setScene(scene ?? undefined);
    });
    return () => {
      s1.unsubscribe();
    };
  }, [sceneId, sceneManager]);

  const { revision = 0, component } = scene ?? {};

  return (
    <Box
      key={revision}
      sx={{
        display: selected ? 'block' : 'none',
      }}
    >
      {component}
    </Box>
  );
}
