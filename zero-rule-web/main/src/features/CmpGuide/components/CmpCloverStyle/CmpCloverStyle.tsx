import { Box, Stack, Typography, Grid2 } from '@mui/material';
import CmpAdressCopy from './components/CmpAdressCopy';
import CmpButton from './components/CmpButton';
import CmpClipBorad from './components/CmpClipBorad';
import CmpDocAny from './components/CmpDocAny';
import CmpDocInput from './components/CmpDocInput';
import CmpDocSelect from './components/CmpDocSelect';
import CmpDocTable from './components/CmpDocTable';
import CmpCLStyledButton from './components/CmpCLStyledButton';
import CmpCLStyleTabsByTab from './components/CmpCLStyleTabsByTab';
import CmpPaging from './components/CmpPaging';
import CmpPortlet from './components/CmpPortlet';
import CmpTopLink from './components/CmpTopLink';
import CloverBanner from './components/CloverBanner';
import { rootSx } from './style';
import CmpDragDialog from './components/CmpDragDialog/CmpDragDialog';
import CmpIconSelectPaper from './components/CmpIconSelectPaper/CmpIconSelectPaper';
import CmpFileDropzone from './components/CmpFileDropzone/CmpFileDropzone';
import CmpDocSortTable from './components/CmpSortableTable/CmpSortableTable';

export default function CmpCloverStyle() {
  return (
    <Box sx={rootSx} className="CmpCloverStyle-root">
      <CloverBanner />

      <Stack p={3} spacing={5}>
        <Grid2 container spacing={3}>
          {/* 둥근 타원형 모형의 버튼 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              BbsButton
            </Typography>
            <CmpButton />
          </Grid2>
          {/* CL 스타일 버튼 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              CL 스타일 버튼
            </Typography>
            <CmpCLStyledButton />
          </Grid2>
          {/* 클립보드 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              클립보드
            </Typography>
            <CmpClipBorad />
          </Grid2>
          {/* 주소 복사버튼*/}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Stack direction="row" alignItems="baseline">
              <Typography variant="h4">주소 복사버튼</Typography>
              <Typography className="CmpCloverStyle-title" variant="h6">
                (클릭후 위에 클립보드에 붙여넣기 해보세요)
              </Typography>
            </Stack>
            <CmpAdressCopy />
          </Grid2>
          {/* 페이징*/}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              페이징
            </Typography>
            <CmpPaging />
          </Grid2>
          {/* 상단 현재페이지 표시*/}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              상단 현재 경로
            </Typography>
            <CmpTopLink />
          </Grid2>
          {/* CL 탭 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              CL Style 탭
            </Typography>
            <CmpCLStyleTabsByTab />
          </Grid2>
          {/* CL 다이얼로그 드래그버전 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              CL Style Dialog (Drag & Drop)
            </Typography>
            <CmpDragDialog />
          </Grid2>
          {/* CL 이모티콘 모음 Select 박스 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              CL 아이콘 Selct Box
            </Typography>

            <CmpIconSelectPaper />
          </Grid2>
          {/* CL 파일 업로드 드래그버전 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography className="CmpCloverStyle-title" variant="h4">
              CL Style FileUpload Box
            </Typography>
            <CmpFileDropzone />
          </Grid2>
        </Grid2>
        {/* 업무문서용 inputBox*/}

        <Grid2 size={{ xs: 12 }}>
          <Typography className="CmpCloverStyle-title" variant="h4">
            업무문서용 inputBox
          </Typography>
          <CmpDocInput />
        </Grid2>

        {/* 업무문서용 selectBox*/}
        <Grid2 size={{ xs: 12 }}>
          <Typography className="CmpCloverStyle-title" variant="h4">
            업무문서용 selectBox
          </Typography>
          <CmpDocSelect />
        </Grid2>

        {/* 업무문서용 Any(여러개 및 여러 타입 사용 가능)*/}
        <Grid2 size={{ xs: 12 }}>
          <Typography className="CmpCloverStyle-title" variant="h4">
            업무문서용 Any(다른 컴포넌트 모두 삽입 가능)
          </Typography>
          <CmpDocAny />
        </Grid2>

        {/* 업무문서용 Table */}
        <Grid2 size={{ xs: 12 }}>
          <Typography className="CmpCloverStyle-title" variant="h4">
            업무문서용 Table
          </Typography>
          <CmpDocTable />
        </Grid2>

        {/* 업무문서용 Table 정렬순서 , 넓이 드래그 버전 */}
        <Grid2 size={{ xs: 12 }}>
          <Typography className="CmpCloverStyle-title" variant="h4">
            업무문서용 Table (Drag & Sortable)
          </Typography>
          <CmpDocSortTable />
        </Grid2>

        {/* Portlet */}
        <Grid2 size={{ xs: 12 }}>
          <Typography className="CmpCloverStyle-title" variant="h4">
            Portlet
          </Typography>
          <CmpPortlet />
        </Grid2>
      </Stack>
    </Box>
  );
}
