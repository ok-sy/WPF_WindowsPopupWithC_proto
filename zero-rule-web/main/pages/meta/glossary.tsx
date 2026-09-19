import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const MetaGlossarySearchPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="FDS META 용어 검색" />
    </MainLayout>
  );
};

export default MetaGlossarySearchPage;
