import MainLayout from '@/layouts/MainLayout';
import dynamic from 'next/dynamic';

const AppLogHome = dynamic(() => import('@/features/AppLogHome'));

export default function AppLog() {
  return (
    <MainLayout
      title="시스템 로그"
      breadcrumbProps={{
        section: '로그 관리',
        currentTitle: '시스템 로그',
      }}
    >
      <AppLogHome />
    </MainLayout>
  );
}
