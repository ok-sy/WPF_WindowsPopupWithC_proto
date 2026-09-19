import FolderClose from '@/icon/FolderCloseIcon';
import { flatSx } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Checkbox,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import React, { useState } from 'react';
import FolderOpenIcon from '../../icon/FolderOpenIcon';
import { rootSx, TreeMapLeftBorder } from './style';

export type rullIconType = {
  id: string;
  subject: string;
  icon?: React.ReactNode;
};

const mainMargin = 3.5;

type Props = {
  sx?: SxProps;
  className?: string;
  title?: string;
  section?: string;
  sectionList?: string[];
  doubleList?: boolean;
  children?: React.ReactNode;
  sectionListIconType?: rullIconType[];
};

const CLStyleTreeMapHandler = React.forwardRef<HTMLInputElement, Props>(
  (props: Props, ref): JSX.Element | null => {
    const {
      sx,
      className,
      title,
      children,
      doubleList = false,
      section,
      sectionList,
      sectionListIconType: sectionListIconType,
    } = props;
    const [open, setOpen] = useState(false);

    const handleClick = () => {
      setOpen(!open);
    };

    return (
      <List
        className={className}
        disablePadding
        sx={flatSx(rootSx, sx)}
        component="nav"
        subheader={
          title && (
            <ListSubheader component="div" id="nested-list-subheader">
              {title}
            </ListSubheader>
          )
        }
      >
        <ListItemButton
          sx={
            doubleList
              ? {}
              : {
                  ml: mainMargin,
                  borderLeft: TreeMapLeftBorder,
                }
          }
          className="CLStyleTreeMapHandler-section"
          onClick={handleClick}
        >
          <ListItemIcon className="CLStyleTreeMapHandler-folderIcon">
            {open ? <FolderOpenIcon /> : <FolderClose />}
          </ListItemIcon>
          <ListItemText primary={section} />
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {doubleList
              ? children
              : sectionListIconType
                ? sectionListIconType.map((sectionIcon) => (
                    <ListItemButton
                      key={sectionIcon.id}
                      sx={{ borderLeft: TreeMapLeftBorder, ml: mainMargin, pl: mainMargin }}
                    >
                      <ListItemIcon className="CLStyleTreeMapHandler-sectionList">
                        <Checkbox size="small" color="default" />
                      </ListItemIcon>
                      {sectionIcon.icon}
                      <ListItemText sx={{ ml: 0.5 }} primary={sectionIcon.subject} />
                    </ListItemButton>
                  ))
                : sectionList?.map((section) => (
                    <ListItemButton
                      key={section}
                      sx={{
                        borderLeft: TreeMapLeftBorder,
                        ml: mainMargin,
                        pl: mainMargin,
                      }}
                    >
                      <ListItemIcon className="CLStyleTreeMapHandler-sectionList">
                        <Checkbox size="small" color="default" />
                      </ListItemIcon>
                      <ListItemText sx={{ ml: 0.5 }} primary={section} />
                    </ListItemButton>
                  ))}
          </List>
        </Collapse>
      </List>
    );
  },
);
CLStyleTreeMapHandler.displayName = 'CLStyleTreeMapHandler';
export default CLStyleTreeMapHandler;
