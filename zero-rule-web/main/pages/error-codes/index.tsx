import MainLayout from '@/layouts/MainLayout';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const ErrorCodesHome = dynamic(() => import('@/features/ErrorCodesHome'));

const Index: NextPage = () => {
  return (
    <MainLayout title="에러 코드">
      <ErrorCodesHome />
    </MainLayout>
  );
};

export default Index;
