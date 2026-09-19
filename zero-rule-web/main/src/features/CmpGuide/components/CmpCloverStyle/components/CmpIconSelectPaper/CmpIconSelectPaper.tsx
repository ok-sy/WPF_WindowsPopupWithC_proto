import { Box } from '@mui/material';
import { useState } from 'react';
import { rootSx } from './style';
import { IconSelectPaper } from '@/components/IconSelectPaper';

export default function CmpIconSelectPaper() {
  // CL 탭
  const [selectedIcon, setSelectedIcon] = useState<string>();
  return (
    <Box sx={rootSx} className="CmpIconSelectPaper-root">
      <Box className="CmpIconSelectPaper-container">
        <Box width="250px">
          <IconSelectPaper
            buttonTitle="그룹 아이콘"
            iconValue={selectedIcon}
            onSubmitIcon={(selectedIcon) => {
              setSelectedIcon(selectedIcon);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
