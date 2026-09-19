import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const CmpGuidePage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="Component 가이드" />
    </MainLayout>
  );
};

export default CmpGuidePage;
