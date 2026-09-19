import type { CustomBreadcrumbsProps } from '@/components/CustomBreadcrumbs';
import RedirectOnLogout from '@/components/RedirectOnLogout';
import NavProvider from '@/provider/NavProvider';
import React from 'react';
import MainLayoutInternal from './MainLayoutInternal';

type Props = {
  title?: React.ReactNode;
  children?: React.ReactElement;
  breadcrumbProps?: CustomBreadcrumbsProps;
  contentPaddingBottom?: number;
  noTopMargin?: boolean;
};

export default function MainLayout(props: Props) {
  return (
    <RedirectOnLogout>
      <NavProvider>
        <MainLayoutInternal {...props} />
      </NavProvider>
    </RedirectOnLogout>
  );
}
