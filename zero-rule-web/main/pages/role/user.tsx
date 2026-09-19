import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const RoleUserPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="사용자 권한 관리" />
    </MainLayout>
  );
};

export default RoleUserPage;
