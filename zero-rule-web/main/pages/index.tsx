import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const TodayFdsPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene url="/clover-main" title="대시보드" />
    </MainLayout>
  );
};

export default TodayFdsPage;
