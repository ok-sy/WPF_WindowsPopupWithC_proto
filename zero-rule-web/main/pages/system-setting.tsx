import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const SystemSettingPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="시스템 설정" />
    </MainLayout>
  );
};

export default SystemSettingPage;
