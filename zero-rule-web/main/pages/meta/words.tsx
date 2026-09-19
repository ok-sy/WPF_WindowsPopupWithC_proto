import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const MetaWordSearchPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="META 단어 검색" />
    </MainLayout>
  );
};

export default MetaWordSearchPage;
