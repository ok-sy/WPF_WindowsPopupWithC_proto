import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import type { CLNavSection } from '@local/domain';
import { Stack, TableCell, TableRow, Typography } from '@mui/material';

type Props = {
  seq: number;
  data: CLNavSection;
};
export default function NavSectionRow(props: Props) {
  const { data, seq } = props;
  const { sectionNm, subitems, icon } = data;
  return (
    <>
      <TableRow
        sx={{
          '& .MuiTableCell-root': {
            border: 0,
          },
        }}
      >
        <TableCell>
          <StringToMuiIcon iconColor="GrayText" iconName={icon ?? ''} />
        </TableCell>
        <TableCell colSpan={3}>{sectionNm}</TableCell>
      </TableRow>
      {subitems.map((el, idx) => (
        <TableRow
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: subitems.length !== idx + 1 ? 0 : '1px solid #e0e0e0',
            },
          }}
          key={el.pageId}
        >
          <TableCell sx={{ pr: 1, py: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="flex-end">
              <StringToMuiIcon iconColor="GrayText" iconName={el.icon ?? ''} />
            </Stack>
          </TableCell>
          <TableCell>
            <Typography variant="body2">{el.pageNm}</Typography>
          </TableCell>
          <TableCell>{el.url}</TableCell>
          <TableCell>{el.pageKey}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
