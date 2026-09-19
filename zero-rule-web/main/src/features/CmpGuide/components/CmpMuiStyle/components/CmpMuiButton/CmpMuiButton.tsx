import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AlarmIcon from '@mui/icons-material/Alarm';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, Stack, Typography } from '@mui/material';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 608,
  '& .CmpMuiButton-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiButton() {
  return (
    <Box sx={rootSx} className="CmpMuiButton-root">
      <Box className="CmpMuiButton-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            text
          </Typography>
          <Button>SMALL</Button>
          <Button color="success">SMALL</Button>
          <Button color="error">SMALL</Button>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            contained
          </Typography>
          <Button variant="contained">SMALL</Button>
          <Button variant="contained" color="success">
            SMALL
          </Button>
          <Button variant="contained" color="error">
            SMALL
          </Button>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            outlined
          </Typography>
          <Button variant="outlined">SMALL</Button>
          <Button variant="outlined" color="success">
            SMALL
          </Button>
          <Button variant="outlined" color="error">
            SMALL
          </Button>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Icon Button
          </Typography>
          <IconButton aria-label="delete">
            <DeleteIcon />
          </IconButton>
          <IconButton aria-label="delete" disabled color="primary">
            <DeleteIcon />
          </IconButton>
          <IconButton color="secondary" aria-label="add an alarm">
            <AlarmIcon />
          </IconButton>
          <IconButton color="primary" aria-label="add to shopping cart">
            <AddShoppingCartIcon />
          </IconButton>
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            ButtonGroup
          </Typography>
          <Stack spacing={2}>
            <ButtonGroup variant="outlined" aria-label="outlined button group">
              <Button>One</Button>
              <Button>Two</Button>
              <Button>Three</Button>
            </ButtonGroup>
            <ButtonGroup variant="text" aria-label="text button group">
              <Button>One</Button>
              <Button>Two</Button>
              <Button>Three</Button>
            </ButtonGroup>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
