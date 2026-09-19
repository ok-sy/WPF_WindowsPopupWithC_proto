import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { LIST_DATAS } from '../sample-data';

const rootSx: SxProps<Theme> = {
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  background: 'rgb(255, 255, 255)',
  borderRadius: '20px',
  boxShadow: 'rgba(0,0,0,0.04) 0px 5px 22px ,rgba(0,0,0,0.03) 0px 0px 0px 0.5px',
};

export default function LatestList() {
  const text = 'View all';
  return (
    <Card sx={rootSx} className="LatestList-root">
      <CardHeader title="Latest Products" sx={{ mt: 2, maxHeight: 50, minHeight: 50 }} />
      <List sx={{ flex: 1 }}>
        {LIST_DATAS.map((el, idx) => {
          const hasDivider = idx < idx - 1;
          const ago = formatDistanceToNow(el.updateAt);
          return (
            <ListItem key={idx} divider>
              <ListItemAvatar>
                {el.img ? (
                  <Box
                    component="img"
                    src={el.img}
                    sx={{
                      borderRadius: 1,
                      height: 48,
                      width: 48,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      borderRadius: 1,
                      backgroundColor: 'neutral.200',
                      height: 48,
                      width: 48,
                    }}
                  />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={el.name}
                primaryTypographyProps={{ variant: 'subtitle1' }}
                secondary={`Updated ${ago} ago`}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
              <IconButton edge="end">
                <MoreVertIcon />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
      <CardActions sx={{ justifyContent: 'flex-end', maxHeight: 50, minHeight: 50 }}>
        <Button
          color="inherit"
          variant="text"
          size="small"
          endIcon={<ArrowRightAltIcon fontSize="small" />}
          sx={{ p: 1 }}
        >
          <Typography sx={{ fontSize: '0.7rem' }} variant="h6">
            View all
          </Typography>
        </Button>
      </CardActions>
    </Card>
  );
}
