import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const MsgMngEnumHomePage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="메시지 코드 관리" />
    </MainLayout>
  );
};

export default MsgMngEnumHomePage;
