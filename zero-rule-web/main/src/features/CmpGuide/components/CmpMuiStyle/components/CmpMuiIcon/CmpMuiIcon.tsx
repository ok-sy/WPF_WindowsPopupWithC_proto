import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import MonitorIcon from '@mui/icons-material/Monitor';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';

import AddCardIcon from '@mui/icons-material/AddCard';
import CloudIcon from '@mui/icons-material/Cloud';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import FaceIcon from '@mui/icons-material/Face';
import FavoriteIcon from '@mui/icons-material/Favorite';

import ArticleIcon from '@mui/icons-material/Article';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import FolderIcon from '@mui/icons-material/Folder';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import HomeIcon from '@mui/icons-material/Home';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

const rootSx: SxProps<Theme> = {
  alignContent: 'center',
  border: '1px solid #E0E0E0',
  borderRadius: 2,
  p: 2,
  overflow: 'auto',
  minHeight: 350,
  '& .CmpMuiIcon-container': {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
};

export default function CmpMuiIcon() {
  return (
    <Box sx={rootSx} className="CmpMuiIcon-root">
      <Box className="CmpMuiIcon-container">
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            basic
          </Typography>
          <CheckIcon />
          <RefreshIcon />
          <DeleteIcon />
          <EmailIcon />
          <MonitorIcon />
          <PaidOutlinedIcon />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Arrow
          </Typography>
          <ArrowBackIosIcon />
          <ArrowForwardIosIcon />
          <KeyboardArrowDownIcon />
          <KeyboardArrowUpIcon />
          <CallMadeIcon />
          <CallReceivedIcon />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            Object
          </Typography>
          <CloudIcon />
          <DirectionsCarFilledIcon />
          <PointOfSaleOutlinedIcon />
          <FaceIcon />
          <FavoriteIcon />
          <AddCardIcon />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            useful
          </Typography>
          <HomeIcon />
          <FolderIcon />
          <FolderCopyIcon />
          <FolderDeleteIcon />
          <ArticleIcon />
          <ContentPasteSearchIcon />
        </Stack>
        <Stack spacing={3} direction="row" alignItems="center" sx={{ ml: 3, my: 4 }}>
          <Typography sx={{ mr: 3, minWidth: 80 }} variant="h5">
            variant
          </Typography>
          <MailOutlineIcon />
          <HelpOutlineOutlinedIcon />
          <DateRangeOutlinedIcon />
          <CheckCircleOutlinedIcon />
          <VerifiedUserOutlinedIcon />
          <AttachMoneyOutlinedIcon />
        </Stack>
      </Box>
    </Box>
  );
}
