import { flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import { Box, Tabs } from '@mui/material';
import React from 'react';
import { useObservable } from 'react-use';
import { useMainLayoutContext } from '../MainLayoutContext';
import SceneTab from './SceneTab';

type Props = {
  sx?: SxProps;
};

/**
 * 메인 레이아웃의 장면 탭
 */
export default function SceneTabs(props: Props) {
  const { sx } = props;
  const { sceneManager } = useMainLayoutContext();
  const scenes = useObservable(sceneManager.observeScenes(), []);
  const currentPage = useObservable(sceneManager.observeCurrentSceneOrNull(), null);

  const handleTabChange = (event: React.SyntheticEvent, sceneId: number | string | boolean) => {
    sceneManager.selectBySceneId(sceneId as number);
  };

  const handleClickDeleteBtn = (sceneId: number) => (event: React.MouseEvent) => {
    sceneManager.deleteBySceneId(sceneId);
  };

  if (currentPage == null) {
    return null;
  }

  return (
    <Box
      sx={flatSx(
        {
          height: '100%',
          width: 600,
          '& .MuiSvgIcon-root': {
            fill: '#000',
          },
          flex: 1,
        },
        sx,
      )}
    >
      <Tabs
        sx={{
          pt: 0.5,
          minHeight: '100%',
          maxHeight: '100%',
          '& .MuiTabs-indicator': { border: '1px solid #fafafe' },
        }}
        onChange={handleTabChange}
        variant="scrollable"
        value={currentPage.sceneId}
      >
        {scenes.map((scene) => (
          <SceneTab
            key={scene.sceneId}
            scene={scene}
            value={scene.sceneId}
            selected={scene.sceneId === currentPage.sceneId}
            onClickDeleteBtn={handleClickDeleteBtn(scene.sceneId)}
          />
        ))}
      </Tabs>
    </Box>
  );
}
