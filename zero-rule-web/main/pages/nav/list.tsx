import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const Index: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="Nav 관리" />
    </MainLayout>
  );
};

export default Index;
