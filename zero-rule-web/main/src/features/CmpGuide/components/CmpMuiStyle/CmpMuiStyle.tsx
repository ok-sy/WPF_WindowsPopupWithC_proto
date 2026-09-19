import type { SxProps } from '@mui/material';
import { Box, Typography, Grid2 } from '@mui/material';
import CmpAtag from './components/CmpAtag';
import CmpMuiAccordion from './components/CmpMuiAccordion';
import CmpMuiBadge from './components/CmpMuiBadge';
import CmpMuiButton from './components/CmpMuiButton';
import CmpMuiCheckBox from './components/CmpMuiCheckBox';
import CmpMuiDatePicker from './components/CmpMuiDatePicker';
import CmpMuiDialog from './components/CmpMuiDialog';
import CmpMuiGrid from './components/CmpMuiGrid';
import CmpMuiIcon from './components/CmpMuiIcon';
import CmpMuiInput from './components/CmpMuiInput';
import CmpMuiList from './components/CmpMuiList';
import CmpMuiLoading from './components/CmpMuiLoading';
import CmpMuiNavigation from './components/CmpMuiNavigation';
import CmpMuiPopOver from './components/CmpMuiPopOver';
import CmpMuiRadio from './components/CmpMuiRadio';
import CmpMuiRaiting from './components/CmpMuiRaiting';
import CmpMuiSelect from './components/CmpMuiSelect';
import CmpMuiSnackBar from './components/CmpMuiSnackBar';
import CmpMuiTabs from './components/CmpMuiTabs';
import CmpMuiTextAutoSize from './components/CmpMuiTextAutoSize';
import CmpMuiTransferList from './components/CmpMuiTransferList';
import CmpMuiTreeView from './components/CmpMuiTreeView';
import CmpMuiTypography from './components/CmpMuiTypography';
import MuiBanner from './components/MuiBanner';

const rootSx: SxProps = {
  overflow: 'auto',
  '& .CmpMuiStyle-images': {
    width: 200,
    height: 200,
    my: 2,
    '& +.CmpMuiStyle-images': {
      mx: 1,
    },
  },
  '& .CmpMuiStyle-subHead': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

export default function CmpMuiStyle() {
  return (
    <Box sx={rootSx} className="CmpMuiStyle-root">
      <MuiBanner />
      <Box sx={{ p: 3 }}>
        <Grid2 container spacing={3}>
          {/* 버튼 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Button
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-button/" />
            </Box>
            <CmpMuiButton />
          </Grid2>
          {/* 타이포그래피 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Typography
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-typography/" />
            </Box>
            <CmpMuiTypography />
          </Grid2>
          {/* 인풋박스 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Input
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-text-field/" />
            </Box>
            <CmpMuiInput />
          </Grid2>
          {/* 체크박스 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                CheckBox
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-checkbox/" />
            </Box>
            <CmpMuiCheckBox />
          </Grid2>
          {/* 라디오 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Radio
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-radio-button/" />
            </Box>
            <CmpMuiRadio />
          </Grid2>
          {/* 아이콘 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Icon
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/material-icons/" />
            </Box>
            <CmpMuiIcon />
          </Grid2>
          {/* navigation */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Navigation
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-bottom-navigation/" />
            </Box>
            <CmpMuiNavigation />
          </Grid2>
          {/* Tabs */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Tabs
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-tabs/" />
            </Box>
            <CmpMuiTabs />
          </Grid2>
          {/* Accordion */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Accordion
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-accordion/" />
            </Box>
            <CmpMuiAccordion />
          </Grid2>
          {/* Dialog */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Dialog
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-dialog/" />
            </Box>
            <CmpMuiDialog />
          </Grid2>
          {/* List */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                List
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-list/" />
            </Box>
            <CmpMuiList />
          </Grid2>
          {/* Transfer List */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Transfer List
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-transfer-list/" />
            </Box>
            <CmpMuiTransferList />
          </Grid2>
          {/* Select */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Select
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-select/" />
            </Box>
            <CmpMuiSelect />
          </Grid2>
          {/* Badge */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Badge
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-badge/" />
            </Box>
            <CmpMuiBadge />
          </Grid2>
          {/* Raiting */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Raiting
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-rating/" />
            </Box>
            <CmpMuiRaiting />
          </Grid2>
          {/* Tree View */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Tree View
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-tree-view/" />
            </Box>
            <CmpMuiTreeView />
          </Grid2>
          {/* Date Picker */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Date Picker
              </Typography>
              <CmpAtag link="https://mui.com/x/react-date-pickers/getting-started/" />
            </Box>
            <CmpMuiDatePicker />
          </Grid2>
          {/* Snack Bar */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Snack Bar
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-snackbar/" />
            </Box>
            <CmpMuiSnackBar />
          </Grid2>
          {/* PopOver */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                PopOver
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-popover/" />
            </Box>
            <CmpMuiPopOver />
          </Grid2>
          {/* TextAreaAutoSize */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                TextAreaAutoSize
              </Typography>
              <CmpAtag link="https://mui.com/base/react-textarea-autosize/" />
            </Box>
            <CmpMuiTextAutoSize />
          </Grid2>
          {/* loading */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Loading
              </Typography>
              <CmpAtag link="https://mui.com/material-ui/react-progress/" />
            </Box>
            <CmpMuiLoading />
          </Grid2>
          {/* Grid */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box className="CmpMuiStyle-subHead">
              <Typography sx={{ mb: 1 }} variant="h4">
                Grid
              </Typography>
              <CmpAtag link="https://mui.com/x/react-data-grid/" />
            </Box>
            <CmpMuiGrid />
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
}
