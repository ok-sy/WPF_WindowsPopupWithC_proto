import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

const AlertDeveloping: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="HELP" />
    </MainLayout>
  );
};

export default AlertDeveloping;
