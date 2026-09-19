import { flatSx } from '@local/ui';
import type { AccordionProps, SxProps, Theme } from '@mui/material';
import { Accordion } from '@mui/material';

type Props = {} & AccordionProps;
const rootSx: SxProps<Theme> = {
  boxShadow: 'none',
};

export default function CLStyledAccordion(props: Props) {
  const { sx, children, ...rest } = props;

  return (
    <Accordion sx={flatSx(rootSx, sx)} {...rest} disableGutters>
      {children}
    </Accordion>
  );
}
