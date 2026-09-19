import { Portlet, PortletContent, PortletHeader } from '@local/ui';
import CloseIcon from '@mui/icons-material/Close';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { IconButton, Stack, Switch, Typography } from '@mui/material';
import {
  DragDropContext,
  Draggable,
  DraggingStyle,
  DropResult,
  Droppable,
  NotDraggingStyle,
} from 'react-beautiful-dnd';
import { CustomGridColumnFilter } from '../grid-type';

type Props = {
  onClose: () => void;
  children: React.ReactNode;
};
/**
 * table head 의 filter icon button 클릭시 보이는 popover
 * 드래그 순서 정렬, visable, unvisable 처리
 * @param props
 * @author sim jin woo
 */
export default function RightClickEventPopover(props: Props) {
  const { onClose, children } = props;

  return (
    <Portlet sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>
      <PortletHeader sx={{ minHeight: 40, height: 40, px: 1 }} noPadding>
        <Typography variant="h5">Menu</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </PortletHeader>
      <PortletContent noPadding sx={{ maxHeight: 200, overflow: 'auto' }}>
        {children}
      </PortletContent>
    </Portlet>
  );
}
