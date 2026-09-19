import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const ColumnJusticeSearchPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="컬럼 매핑" />
    </MainLayout>
  );
};

export default ColumnJusticeSearchPage;
