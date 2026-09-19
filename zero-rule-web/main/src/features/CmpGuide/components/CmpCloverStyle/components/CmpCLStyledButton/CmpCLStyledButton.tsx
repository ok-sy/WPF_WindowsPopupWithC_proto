import ExcelIcon from '@/icon/ExcelIcon';
import FolderCloseIcon from '@/icon/FolderCloseIcon';
import FolderOpenIcon from '@/icon/FolderOpenIcon';
import { Check } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { rootSx } from './style';
import CLStyledButton from '@/components/CLStyledButton';
export default function CmpCLStyledButton() {
  return (
    <Box sx={rootSx} className="CmpCLStyledButton-root">
      <Box className="CmpCLStyledButton-container">
        <Stack spacing={1} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Box>
            <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
              Project Style Button :
            </Typography>
          </Box>
          <Stack spacing={2} direction="row">
            <CLStyledButton startIcon={<Check />}>CLOVER</CLStyledButton>
            <CLStyledButton endIcon={<Check />}>CLOVER</CLStyledButton>
            <CLStyledButton
              sx={{
                backgroundColor: '#ffc0cb',
                '&:hover': { backgroundColor: 'yellow', color: '#ddd' },
              }}
            >
              CLOVER
            </CLStyledButton>
          </Stack>
        </Stack>
        <Stack spacing={1} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Icon Button :
          </Typography>
          <Stack spacing={2} direction="row">
            <Button
              variant="outlined"
              color="success"
              startIcon={<ExcelIcon width={20} height={20} />}
            >
              엑셀 다운로드
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FolderCloseIcon width={20} height={20} />}
            >
              다운로드
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<FolderOpenIcon width={20} height={20} />}
            >
              비활성화
            </Button>
          </Stack>
        </Stack>
        <Stack spacing={1} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            contained :
          </Typography>
          <Stack spacing={2} direction="row">
            <CLStyledButton
              sx={{
                backgroundColor: '#556cd6',
                color: '#fff',
                '&:hover': {
                  border: '1px solid #556cd6',
                  backgroundColor: '#fff',
                  color: '#000',
                },
              }}
              endIcon={<Check />}
            >
              CLOVER
            </CLStyledButton>
            <CLStyledButton
              sx={{
                backgroundColor: '#2e7d32',
                color: '#fff',
                '&:hover': {
                  border: '1px solid #2e7d32',
                  backgroundColor: '#fff',
                  color: '#000',
                },
              }}
              endIcon={<Check />}
            >
              CLOVER
            </CLStyledButton>
            <CLStyledButton
              sx={{
                backgroundColor: '#fda085',
                color: '#fff',

                '&:hover': {
                  border: '1px solid #fda085',
                  backgroundColor: '#fff',
                  color: '#000',
                },
              }}
              endIcon={<Check />}
            >
              CLOVER
            </CLStyledButton>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
