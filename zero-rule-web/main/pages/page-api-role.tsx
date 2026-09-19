import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const PageApiRole: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="Page 권한" />
    </MainLayout>
  );
};

export default PageApiRole;
