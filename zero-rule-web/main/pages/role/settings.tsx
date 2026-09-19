import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const RoleSettingsPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="권한 설정" />
    </MainLayout>
  );
};

export default RoleSettingsPage;
