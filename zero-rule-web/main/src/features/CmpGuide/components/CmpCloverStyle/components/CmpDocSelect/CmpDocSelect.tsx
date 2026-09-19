import { Box } from '@mui/material';
import { rootSx } from './style';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';

export default function CmpDocSelect() {
  return (
    <Box sx={rootSx} className="CmpDocSelect-root">
      <Box className="CmpDocSelect-container">
        <Box>
          <CLDocLabelSelect title="CLDocLabelSelect" arr={['1', '2', '3']} />
          <CLDocLabelSelect
            title="CLDocLabelSelect"
            sx={{
              '& .CLDocLabelSelect-titleBox': { backgroundColor: 'pink' },
            }}
            arr={['1', '2', '3']}
          />
        </Box>
        <Box>
          <CLDocLabelSelect title="CLDocLabelSelect" arr={['1', '2', '3']} />
          <CLDocLabelSelect
            title="CLDocLabelSelect"
            sx={{
              '& .CLDocLabelSelect-titleBox': { backgroundColor: 'pink' },
            }}
            arr={['1', '2', '3']}
          />
        </Box>
      </Box>
    </Box>
  );
}
