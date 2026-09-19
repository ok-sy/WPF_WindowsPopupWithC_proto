import { flatSx, Link } from '@local/ui';
import { HomeOutlined, NavigateNext } from '@mui/icons-material';
import type { SxProps } from '@mui/material';
import { Box, Breadcrumbs, IconButton, Typography } from '@mui/material';
import clsx from 'clsx';

export type LinkPart = {
  href: string;
  title: string;
};

export type CustomBreadcrumbsProps = {
  className?: string;
  sx?: SxProps;
  section?: string;
  linkParts?: LinkPart[];
  currentTitle: string;
};

export default function CustomBreadcrumbs(props: CustomBreadcrumbsProps) {
  const { className, sx, section, linkParts = [], currentTitle } = props;

  return (
    <Box
      className={clsx('CustomBreadcrumbs-root', className)}
      sx={flatSx(
        {
          py: 0,
          px: 1,
          '& .MuiTypography-colorInherit': {
            color: '#999999',
          },

          '& .MuiTypography-colorPrimary': {
            color: '#242424',
          },
        },
        sx,
      )}
    >
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
        <Link href="/" color="inherit">
          <IconButton color="default" size="medium">
            <HomeOutlined />
          </IconButton>
        </Link>
        {section && <Typography color="inherit">{section}</Typography>}

        {linkParts.map(({ href, title }, idx) => (
          <Link href={href} key={idx} color="inherit">
            {title}
          </Link>
        ))}

        <Typography color="textPrimary">{currentTitle}</Typography>
      </Breadcrumbs>
    </Box>
  );
}
