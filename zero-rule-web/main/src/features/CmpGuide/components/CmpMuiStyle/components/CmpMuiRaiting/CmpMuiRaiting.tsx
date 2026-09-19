import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import type { SxProps, Theme } from '@mui/material';
import { Box, Rating, Stack, styled, Typography } from '@mui/material';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 132,
  '& .CmpMuiRaiting-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#ff6d75',
  },
  '& .MuiRating-iconHover': {
    color: '#ff3d47',
  },
});

export default function CmpMuiRaiting() {
  return (
    <Box sx={rootSx} className="CmpMuiRaiting-root">
      <Box className="CmpMuiRaiting-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Raiting
          </Typography>
          <Stack spacing={2}>
            <Rating value={null} />
            <Rating value={null} size="large" />
            <StyledRating
              defaultValue={3}
              getLabelText={(value: number) => `${value} Heart${value !== 1 ? 's' : ''}`}
              precision={0.5}
              icon={<FavoriteIcon fontSize="inherit" />}
              emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
            />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
