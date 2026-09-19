import { flatSx } from '@local/ui';
import type { AccordionDetailsProps, SxProps, Theme } from '@mui/material';
import { AccordionDetails } from '@mui/material';
type Props = {} & AccordionDetailsProps;

const rootSx: SxProps<Theme> = {
  p: 0,
};

export default function CLStyledAccordionDetails(props: Props) {
  const { sx, children, ...rest } = props;

  return (
    <AccordionDetails sx={flatSx(rootSx, sx)} {...rest}>
      {children}
    </AccordionDetails>
  );
}
