import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const UserMgmtPage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="사용자관리" />
    </MainLayout>
  );
};

export default UserMgmtPage;
