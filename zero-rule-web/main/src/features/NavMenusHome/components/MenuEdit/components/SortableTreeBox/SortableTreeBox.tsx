import { flatSx, useTimeoutData } from '@local/ui';
import { Box } from '@mui/material';
import type {
  NodeData,
  OnDragPreviousAndNextLocation,
  OnMovePreviousAndNextLocation,
  TreeIndex,
  TreeItem,
  TreeNode,
} from 'react-sortable-tree';
import SortableTree from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import { useObservable } from 'react-use';
import type { MenuEditManager } from '../../MenuEditManager';
import type { MyTreeItem, TreeKey } from '../../types';
import { rootSx } from './style';
import { useTreeTheme } from './useTreeTheme';

type Props = {
  menuEditManager: MenuEditManager;
};

export default function SortableTreeBox(props: Props) {
  const { menuEditManager } = props;
  const [highlightMenuId, setHighlightMenuId] = useTimeoutData<number>(1000);
  const treeTheme = useTreeTheme();
  const treeData = useObservable(menuEditManager.treeItems$.observe(), []);

  const handleChangeTreeData = (treeData: MyTreeItem[]) => {
    menuEditManager.replaceTreeItems(treeData);
  };

  // 트리 유효성 검사
  const canDrop = (data: OnDragPreviousAndNextLocation & NodeData) => {
    const { node, nextParent } = data;

    // 놓아질 위치
    const droppingTarget = nextParent as TreeItem<TreeKey> | null;
    if (!droppingTarget) {
      // 트리의 최상위 위치에는 섹션이나 메뉴, 아무거나 놓을 수 있다
      return true;
    }
    // 드래깅 중인 노드
    const draggingNode = node as TreeItem<TreeKey>;

    // 섹션이 아닌 곳에 놓을 수 없다
    if (droppingTarget.type !== 'SECTION') {
      return false;
    }
    // 섹션을 다른 섹션에 둘 수 없다
    if (draggingNode.type === 'SECTION' && droppingTarget.type === 'SECTION') {
      return false;
    }

    return true;
  };
  //움직였던 노드의 스타일을 적용시킨다
  const onMoveNode = (data: NodeData & OnMovePreviousAndNextLocation) => {
    const { node, nextParentNode } = data;

    const movedNode = node as TreeItem<TreeKey>;

    setHighlightMenuId(movedNode.id);
  };

  return (
    <Box sx={rootSx} className="SortableTreeBox-root">
      <Box
        sx={flatSx(
          { flex: 1, height: '100%', overflow: 'auto' },
          !!highlightMenuId && {
            [`[data-menu-id='${highlightMenuId}']`]: {
              color: 'warning.main',
            },
          },
        )}
      >
        {treeTheme && (
          <SortableTree
            theme={treeTheme}
            treeData={treeData}
            onMoveNode={onMoveNode}
            onChange={handleChangeTreeData}
            getNodeKey={getNodeKey}
            maxDepth={2}
            canDrop={canDrop}
            isVirtualized={false}
          />
        )}
      </Box>
    </Box>
  );
}

// 트리에 들어갈 키값
function getNodeKey(data: TreeNode & TreeIndex): string {
  const { node } = data;
  if ('id' in node) {
    return node.id as string;
  }
  console.warn('엥: item에 키가 없다', data);
  return 'unknownId';
}
