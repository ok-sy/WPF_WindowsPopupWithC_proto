import { flatSx } from '@local/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { AccordionSummaryProps, SxProps, Theme } from '@mui/material';
import { AccordionSummary } from '@mui/material';
type Props = {} & AccordionSummaryProps;

const rootSx: SxProps<Theme> = {
  borderBottom: '1px solid #d5d5d5',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
  '&.Mui-expanded': {
    minHeight: 29,
    borderBottom: 0,
  },

  '& .MuiAccordionSummary-content': {
    my: 0,
  },
};

export default function CLStyledAccordionSummary(props: Props) {
  const { sx, children, ...rest } = props;

  return (
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={flatSx(rootSx, sx)} {...rest}>
      {children}
    </AccordionSummary>
  );
}
