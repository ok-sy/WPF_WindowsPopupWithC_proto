import { Portlet, PortletContent, PortletHeader } from '@local/ui';
import CloseIcon from '@mui/icons-material/Close';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { IconButton, Stack, Switch, Typography } from '@mui/material';
import type { DraggingStyle, DropResult, NotDraggingStyle } from 'react-beautiful-dnd';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import type { CustomGridColumnFilter } from '../grid-type';

type Props = {
  columeFilter: CustomGridColumnFilter[];
  onColumeFilter: (value: CustomGridColumnFilter[]) => void;
  onClose: () => void;
};
/**
 * table head 의 filter icon button 클릭시 보이는 popover
 * 드래그 순서 정렬, visable, unvisable 처리
 * @param props
 * @author sim jin woo
 */
export default function ColumeFilterPopover(props: Props) {
  const { columeFilter, onColumeFilter, onClose } = props;

  // 드래그 아이템 함수
  const getItemStyle = (
    isDragging: boolean,
    draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
  ): React.CSSProperties => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  // 정렬 함수
  const dataResort = (fields: CustomGridColumnFilter[], startIndex: number, endIndex: number) => {
    const result = Array.from(fields);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // 드래그 끝날 시 실행되는 함수
  const onDragEnd = (result: DropResult): void => {
    if (!result.destination) {
      return;
    }
    const changeDataSeq = dataResort(columeFilter, result.source.index, result.destination.index);
    onColumeFilter(changeDataSeq);
  };

  return (
    <Portlet sx={{ whiteSpace: 'nowrap', minWidth: 300 }}>
      <PortletHeader>
        <Typography variant="h5">colume filter</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </PortletHeader>
      <PortletContent sx={{ maxHeight: 300, overflow: 'auto' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(provided) => (
              <Stack
                sx={{}}
                spacing={0.5}
                className="GroupTableForm-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {columeFilter.map((el, idx) => (
                  <Draggable key={el.columeId} draggableId={String(el.columeId)} index={idx}>
                    {(provided, snapshot) => (
                      <Stack
                        p={1}
                        sx={{
                          '&:active': {
                            boxShadow: '6px 6px 5px #bdbdbd',
                          },
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                        }}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        key={el.columeId}
                      >
                        <Switch
                          size="small"
                          checked={
                            columeFilter?.find((colume) => el.columeId === colume.columeId)
                              ?.isVisiable
                          }
                          onChange={(e) => {
                            if (!columeFilter) return;
                            const changeIdx = columeFilter.findIndex(
                              (colume) => el.columeId === colume.columeId,
                            );
                            const tmpArr = [...columeFilter];
                            tmpArr.splice(changeIdx, 1, {
                              columeId: el.columeId,
                              columeName: el.columeName,
                              columeType: el.columeType,
                              isVisiable: e.target.checked,
                            });
                            onColumeFilter(tmpArr);
                          }}
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
                        <Typography variant="subtitle2">{el.columeName}</Typography>
                        <IconButton
                          {...provided.dragHandleProps}
                          style={{ cursor: 'grab' }}
                          size="small"
                          onClick={onClose}
                        >
                          <DragHandleIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </Draggable>
                ))}
              </Stack>
            )}
          </Droppable>
        </DragDropContext>
      </PortletContent>
    </Portlet>
  );
}
