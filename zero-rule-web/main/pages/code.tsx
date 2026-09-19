import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const Index: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="공통 코드" />
    </MainLayout>
  );
};

export default Index;
