import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import { mainLayoutConstants } from '@/lib/main-layout-constants';
// import { menuManager } from '@/lib/side-menu-list'
import type { navigation } from '@local/ui';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Box,
  Collapse,
  Divider,
  Icon,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import clsx from 'clsx';
import React from 'react';
import SideMenuItem from './SideMenuItem';

const { sidemenu } = mainLayoutConstants;

type Props = {
  section: navigation.ISection;
  expanded: boolean;
  currentHref?: string;
  menuManager: navigation.MenuManager;
  onClickSection: (e: React.MouseEvent) => void;
  onClickMenu: (menu: navigation.IMenu) => (e: React.MouseEvent) => void;
};

export default function SectionMenu(props: Props) {
  const {
    section,
    menuManager,
    onClickSection,
    expanded = false,
    currentHref,
    onClickMenu,
  } = props;

  const sectionActive = menuManager.isSectionPathMatched(section, currentHref);
  return (
    <>
      <ListItemButton
        onClick={onClickSection} //
        className={clsx('SectionMenu-root', {
          'SectionMenu-expanded': expanded,
          x_active: sectionActive,
        })}
        sx={[
          {
            color: sidemenu.fgColor,

            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
            },

            // 섹션 메뉴 제목
            '& .SectionMenu-title': {
              fontWeight: 400,
              fontSize: sidemenu.fontSize,
              color: sidemenu.fgColor,
            },
            // 아이콘 부분
            '& .MuiListItemIcon-root': {
              color: sidemenu.fgColor,
            },

            // 섹션 펼쳐진 상태
            '&.SectionMenu-expanded, &.x_active ': {
              color: (theme) => '#00f3e4',
              '& .SectionMenu-title': {
                color: (theme) => '#00f3e4',
              },
              '& .MuiListItemIcon-root': {
                color: (theme) => '#00f3e4',
              },
            },
          },
        ]}
      >
        {section.icon && (
          <ListItemIcon className="icon">
            <StringToMuiIcon iconName={section.icon + ''} />
          </ListItemIcon>
        )}

        <ListItemText primary={section.title} classes={{ primary: 'SectionMenu-title' }} />
        <Icon className="sectionIndicator">{expanded ? <ExpandLess /> : <ExpandMore />}</Icon>
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List disablePadding>
          {section.submenus?.map((menu) => {
            if (menu.type === 'divider') {
              return <Divider key={menu.id} />;
            }

            return (
              <Box sx={{ ml: 3.5, borderLeft: '1px solid #E0E0E0' }} key={menu.id}>
                <SideMenuItem
                  title={menu.title}
                  active={menuManager.isMenuPathMatched(menu, currentHref)}
                  onClick={onClickMenu(menu)}
                />
              </Box>
            );
          })}
        </List>
      </Collapse>
    </>
  );
}
