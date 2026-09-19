import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import type { SxProps, Theme } from '@mui/material';
import { Box, Checkbox, Stack, Typography } from '@mui/material';

const rootSx: SxProps<Theme> = {
  display: 'flex',
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 395,
  '& .CmpMuiCheckBox-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiCheckBox() {
  return (
    <Box sx={rootSx} className="CmpMuiCheckBox-root">
      <Box className="CmpMuiCheckBox-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            basic
          </Typography>
          <Checkbox defaultChecked />
          <Checkbox />
          <Checkbox disabled />
          <Checkbox disabled checked />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Size
          </Typography>
          <Checkbox size="small" />
          <Checkbox />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            color
          </Typography>
          <Checkbox checked color="default" />
          <Checkbox checked color="error" />
          <Checkbox checked color="info" />
          <Checkbox checked color="primary" />
          <Checkbox checked color="secondary" />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Icon
          </Typography>
          <Checkbox
            icon={<BookmarkBorderIcon />}
            checkedIcon={<BookmarkIcon />}
            checked
            color="default"
          />
          <Checkbox icon={<FavoriteBorder />} checkedIcon={<Favorite />} checked color="error" />
        </Stack>
      </Box>
    </Box>
  );
}
