import { Portlet, PortletContent, useElementLeftTop } from '@local/ui';
import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';
import { useState } from 'react';
import MenuEdit from './components/MenuEdit';
import MenuList from './components/MenuList';
import NavList from './components/NavList';
const rootSx: SxProps<Theme> = {
  pt: 1,
  pl: 1,
  pr: 3,
  display: 'flex',
};

export default function NavMenusHome() {
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [selectedNavId, setSelectedNavId] = useState<number>(0);
  const [editMode, setEditMode] = useState(false);

  return (
    <Box sx={rootSx} className="NavMenusHome-root">
      <Portlet
        ref={setBodyElement}
        sx={{
          height: {
            xs: 'auto',
            md: `calc(100vh - ${bodyTop}px - 20px)`,
          },
          overflow: 'hidden',
          flexBasis: 360,
          mr: 1.5,
        }}
      >
        <NavList
          onSelectNav={(navId) => {
            setSelectedNavId(navId);
            setEditMode(false);
          }}
        />
      </Portlet>
      {!editMode ? (
        <MenuList onEditMode={() => setEditMode(true)} navId={selectedNavId} />
      ) : (
        <Portlet sx={{ flex: 1 }}>
          <PortletContent noPadding>
            <MenuEdit onEditMode={() => setEditMode(false)} navId={selectedNavId} />
          </PortletContent>
        </Portlet>
      )}
    </Box>
  );
}
