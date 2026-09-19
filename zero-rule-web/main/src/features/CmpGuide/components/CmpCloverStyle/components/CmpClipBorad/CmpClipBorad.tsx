import { Box } from '@mui/material';
import { rootSx } from './style';
import BbsCKEditor from '@/components/BbsCKEditor';

export default function CmpClipBorad() {
  return (
    <Box sx={rootSx} className="CmpClipBorad-root">
      <Box className="CmpClipBorad-container">
        <BbsCKEditor sx={{ height: 251, flex: 1 }} onContentChange={() => {}} />
      </Box>
    </Box>
  );
}
