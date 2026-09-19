import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const MsgMngHomePage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="메시지 관리" />
    </MainLayout>
  );
};

export default MsgMngHomePage;
